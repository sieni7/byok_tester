import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'

const tempDir = mkdtempSync(join(tmpdir(), 'keydock-nvidia-tests-'))
writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ type: 'module' }))
execFileSync(process.execPath, [
  'node_modules/typescript/bin/tsc',
  'src/services/nvidia-chat-service.ts',
  '--target', 'ES2022',
  '--module', 'ESNext',
  '--moduleResolution', 'Bundler',
  '--rootDir', 'src',
  '--outDir', tempDir,
  '--skipLibCheck',
  '--ignoreConfig',
], { stdio: 'inherit' })
const { sendNvidiaChatCompletion, NvidiaChatError } = await import(pathToFileURL(join(tempDir, 'services', 'nvidia-chat-service.js')).href)
test.after(() => rmSync(tempDir, { recursive: true, force: true }))

test('sends an authenticated OpenAI-compatible request and extracts the answer', async () => {
  let request
  const answer = await sendNvidiaChatCompletion({
    apiKey: 'test-token',
    model: 'meta/llama-3.1-8b-instruct',
    prompt: 'Bonjour',
    fetchImpl: async (url, init) => {
      request = { url, init, body: JSON.parse(init.body) }
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Bonjour !' } }] }), { status: 200 })
    },
  })
  assert.equal(answer, 'Bonjour !')
  assert.equal(request.url, 'https://integrate.api.nvidia.com/v1/chat/completions')
  assert.equal(request.init.headers.Authorization, 'Bearer test-token')
  assert.equal(request.body.model, 'meta/llama-3.1-8b-instruct')
  assert.deepEqual(request.body.messages, [{ role: 'user', content: 'Bonjour' }])
  assert.equal(request.body.stream, false)
})

test('maps authentication, permission, quota and server errors', async (t) => {
  for (const [status, code] of [[401, 'unauthorized'], [403, 'forbidden'], [429, 'rate_limit'], [503, 'server']]) {
    await t.test(String(status), async () => {
      await assert.rejects(
        sendNvidiaChatCompletion({
          apiKey: 'test-token',
          model: 'meta/llama-3.1-8b-instruct',
          prompt: 'test',
          fetchImpl: async () => new Response('{}', { status }),
        }),
        (error) => error instanceof NvidiaChatError && error.code === code && error.status === status,
      )
    })
  }
})

test('reports network failures without exposing request credentials', async () => {
  await assert.rejects(
    sendNvidiaChatCompletion({
      apiKey: 'do-not-leak-this-token',
      model: 'meta/llama-3.1-8b-instruct',
      prompt: 'test',
      fetchImpl: async () => { throw new Error('network details') },
    }),
    (error) => error instanceof NvidiaChatError && error.code === 'network' && !error.message.includes('do-not-leak'),
  )
})

test('rejects malformed or empty successful responses', async (t) => {
  await t.test('invalid JSON', async () => {
    await assert.rejects(
      sendNvidiaChatCompletion({ apiKey: 'test', model: 'm', prompt: 'p', fetchImpl: async () => new Response('not-json') }),
      (error) => error instanceof NvidiaChatError && error.code === 'invalid_response',
    )
  })
  await t.test('empty content', async () => {
    await assert.rejects(
      sendNvidiaChatCompletion({ apiKey: 'test', model: 'm', prompt: 'p', fetchImpl: async () => Response.json({ choices: [] }) }),
      (error) => error instanceof NvidiaChatError && error.code === 'invalid_response',
    )
  })
})

test('aborts a request when the timeout is reached', async () => {
  await assert.rejects(
    sendNvidiaChatCompletion({
      apiKey: 'test-token',
      model: 'meta/llama-3.1-8b-instruct',
      prompt: 'test',
      timeoutMs: 1,
      fetchImpl: async (_url, init) => new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      }),
    }),
    (error) => error instanceof NvidiaChatError && error.code === 'timeout' && error.message.includes('0 secondes'),
  )
})

test('rejects an empty key or prompt before making a request', async () => {
  let called = false
  const fetchImpl = async () => { called = true; return Response.json({}) }
  await assert.rejects(sendNvidiaChatCompletion({ apiKey: ' ', model: 'm', prompt: 'p', fetchImpl }), { code: 'unauthorized' })
  await assert.rejects(sendNvidiaChatCompletion({ apiKey: 'key', model: 'm', prompt: ' ', fetchImpl }), { code: 'request_failed' })
  assert.equal(called, false)
})
