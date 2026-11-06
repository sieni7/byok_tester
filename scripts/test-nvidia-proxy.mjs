import assert from 'node:assert/strict'
import test from 'node:test'
import nvidiaProxy from '../netlify/functions/nvidia-proxy.js'

const validInput = {
  apiKey: 'test-nvidia-key',
  model: 'meta/llama-3.3-70b-instruct',
  prompt: 'Bonjour NVIDIA',
}

function request(body, { method = 'POST', headers = {} } = {}) {
  return new Request('http://localhost/.netlify/functions/nvidia-proxy', {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  })
}

test('rejects methods other than POST', async () => {
  const response = await nvidiaProxy(request(undefined, { method: 'GET' }))
  assert.equal(response.status, 405)
})

test('rejects non-JSON requests', async () => {
  const response = await nvidiaProxy(request('hello', { headers: { 'Content-Type': 'text/plain' } }))
  assert.equal(response.status, 415)
})

test('rejects malformed JSON and invalid input fields', async (t) => {
  for (const [name, body, expectedStatus] of [
    ['malformed JSON', '{', 400],
    ['missing key', JSON.stringify({ ...validInput, apiKey: '' }), 400],
    ['missing prompt', JSON.stringify({ ...validInput, prompt: '  ' }), 400],
    ['unknown model', JSON.stringify({ ...validInput, model: 'unknown/model' }), 400],
    ['oversized prompt', JSON.stringify({ ...validInput, prompt: 'x'.repeat(25 * 1024) }), 413],
    ['oversized request body', JSON.stringify({ ...validInput, extra: 'x'.repeat(33 * 1024) }), 413],
  ]) {
    await t.test(name, async () => {
      const response = await nvidiaProxy(request(body))
      assert.equal(response.status, expectedStatus)
    })
  }
})

test('forwards a valid request to the fixed NVIDIA endpoint and preserves the response', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  let captured
  globalThis.fetch = async (url, init) => {
    captured = { url, init, body: JSON.parse(init.body) }
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Bonjour !' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const response = await nvidiaProxy(request(JSON.stringify(validInput)))
  assert.equal(response.status, 200)
  assert.equal(captured.url, 'https://integrate.api.nvidia.com/v1/chat/completions')
  assert.equal(captured.init.headers.Authorization, 'Bearer test-nvidia-key')
  assert.deepEqual(captured.body.messages, [{ role: 'user', content: 'Bonjour NVIDIA' }])
  assert.equal((await response.json()).choices[0].message.content, 'Bonjour !')
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('preserves NVIDIA error statuses and response bodies', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => new Response('{"error":"quota"}', {
    status: 429,
    headers: { 'Content-Type': 'application/json' },
  })
  const response = await nvidiaProxy(request(JSON.stringify(validInput)))
  assert.equal(response.status, 429)
  assert.deepEqual(await response.json(), { error: 'quota' })
})

test('returns 502 when NVIDIA cannot be reached', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => { throw new Error('network failure') }
  const response = await nvidiaProxy(request(JSON.stringify(validInput)))
  assert.equal(response.status, 502)
})
