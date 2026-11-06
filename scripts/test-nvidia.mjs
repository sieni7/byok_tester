import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
const tempDir = mkdtempSync(join(tmpdir(), 'keydock-nvidia-tests-'))
writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ type: 'module' }))
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc','src/services/nvidia-chat-service.ts','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--rootDir','src','--outDir',tempDir,'--skipLibCheck','--ignoreConfig'], { stdio: 'inherit' })
const { sendNvidiaChatCompletion, NvidiaChatError } = await import(pathToFileURL(join(tempDir,'services','nvidia-chat-service.js')).href)
test.after(() => rmSync(tempDir,{recursive:true,force:true}))
test('sends key, model and prompt to same-origin Netlify proxy and extracts answer', async () => {
 let request
 const answer=await sendNvidiaChatCompletion({apiKey:'test-token',model:'meta/llama-3.1-8b-instruct',prompt:'Bonjour',fetchImpl:async(url,init)=>{request={url,init,body:JSON.parse(init.body)};return new Response(JSON.stringify({choices:[{message:{content:'Bonjour !'}}]}),{status:200})}})
 assert.equal(answer,'Bonjour !'); assert.equal(request.url,'/.netlify/functions/nvidia-proxy'); assert.equal(request.init.method,'POST')
 assert.equal(request.init.headers['Content-Type'],'application/json'); assert.equal(request.init.headers.Authorization,undefined)
 assert.equal(request.init.credentials,'omit'); assert.equal(request.init.cache,'no-store')
 assert.deepEqual(request.body,{apiKey:'test-token',model:'meta/llama-3.1-8b-instruct',prompt:'Bonjour'})
})
test('maps authentication, permission, quota and upstream errors',async t=>{
 for(const [status,code] of [[400,'request_failed'],[401,'unauthorized'],[403,'forbidden'],[429,'rate_limit'],[502,'network'],[503,'server'],[504,'timeout']]) await t.test(String(status),async()=>{
  await assert.rejects(sendNvidiaChatCompletion({apiKey:'test-token',model:'meta/llama-3.1-8b-instruct',prompt:'test',fetchImpl:async()=>new Response('{}',{status})}),e=>e instanceof NvidiaChatError&&e.code===code&&e.status===status)
 })
})
test('reports network failures without exposing credentials',async()=>{
 await assert.rejects(sendNvidiaChatCompletion({apiKey:'do-not-leak-this-token',model:'meta/llama-3.1-8b-instruct',prompt:'test',fetchImpl:async()=>{throw new Error('network details')}}),e=>e instanceof NvidiaChatError&&e.code==='network'&&!e.message.includes('do-not-leak'))
})
test('rejects malformed or empty successful responses',async t=>{
 await t.test('invalid JSON',async()=>assert.rejects(sendNvidiaChatCompletion({apiKey:'test',model:'m',prompt:'p',fetchImpl:async()=>new Response('not-json')}),e=>e instanceof NvidiaChatError&&e.code==='invalid_response'))
 await t.test('empty content',async()=>assert.rejects(sendNvidiaChatCompletion({apiKey:'test',model:'m',prompt:'p',fetchImpl:async()=>Response.json({choices:[]})}),e=>e instanceof NvidiaChatError&&e.code==='invalid_response'))
})
test('aborts request when timeout is reached',async()=>{
 await assert.rejects(sendNvidiaChatCompletion({apiKey:'test-token',model:'meta/llama-3.1-8b-instruct',prompt:'test',timeoutMs:1,fetchImpl:async(_url,init)=>new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}))}),e=>e instanceof NvidiaChatError&&e.code==='timeout'&&e.message.includes('1 seconde'))
})
test('rejects empty key or prompt before request',async()=>{
 let called=false; const fetchImpl=async()=>{called=true;return Response.json({})}
 await assert.rejects(sendNvidiaChatCompletion({apiKey:' ',model:'m',prompt:'p',fetchImpl}),{code:'unauthorized'})
 await assert.rejects(sendNvidiaChatCompletion({apiKey:'key',model:'m',prompt:' ',fetchImpl}),{code:'request_failed'})
 assert.equal(called,false)
})
