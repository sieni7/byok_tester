import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'

const tempDir = mkdtempSync(join(tmpdir(), 'keydock-credential-tests-'))
writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ type: 'module' }))

// Use the TypeScript CLI instead of compiler runtime APIs, which differ across TS releases.
// The browser-side credential service does not need Node ambient types.
execFileSync(process.execPath, [
  'node_modules/typescript/bin/tsc',
  'src/services/credential-service.ts',
  '--target', 'ES2022',
  '--module', 'ESNext',
  '--moduleResolution', 'Bundler',
  '--rootDir', 'src',
  '--outDir', tempDir,
  '--skipLibCheck',
  '--ignoreConfig',
], { stdio: 'inherit' })

const compiledUrl = pathToFileURL(join(tempDir, 'services', 'credential-service.js')).href
const { loadCredentials, saveCredentials, emptyCredentials, CREDENTIAL_STORAGE_KEY } = await import(compiledUrl)
const source = readFileSync('src/services/credential-service.ts', 'utf8')
assert.match(source, /mode === 'session'/, 'credential service must explicitly handle session mode')

test.after(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

function instrumentedStorage(initial = '{}', shouldThrow = false) {
  const calls = []
  return {
    calls,
    getItem(key) {
      calls.push(['getItem', key])
      if (shouldThrow) throw new Error('storage blocked')
      return initial
    },
    setItem(key, value) {
      calls.push(['setItem', key, value])
      if (shouldThrow) throw new Error('storage blocked')
    },
    removeItem(key) {
      calls.push(['removeItem', key])
      if (shouldThrow) throw new Error('storage blocked')
    },
  }
}

test('session load performs no storage reads or writes', () => {
  const storage = instrumentedStorage(JSON.stringify({ openrouter: 'must-not-load' }))
  assert.deepEqual(loadCredentials('session', storage), emptyCredentials())
  assert.deepEqual(storage.calls, [])
})

test('session save performs no storage reads or writes', () => {
  const storage = instrumentedStorage()
  assert.equal(saveCredentials({ ...emptyCredentials(), openrouter: 'volatile' }, 'session', storage), false)
  assert.deepEqual(storage.calls, [])
})

test('local mode loads credentials from the expected key', () => {
  const credentials = { ...emptyCredentials(), openrouter: 'local-test-key' }
  const storage = instrumentedStorage(JSON.stringify(credentials))
  assert.deepEqual(loadCredentials('local', storage), credentials)
  assert.deepEqual(storage.calls, [['getItem', CREDENTIAL_STORAGE_KEY]])
})

test('local mode saves credentials', () => {
  const storage = instrumentedStorage()
  const credentials = { ...emptyCredentials(), groq: 'local-test-key' }
  assert.equal(saveCredentials(credentials, 'local', storage), true)
  assert.deepEqual(storage.calls[0], ['setItem', CREDENTIAL_STORAGE_KEY, JSON.stringify(credentials)])
})

test('unavailable storage falls back to empty credentials without throwing', () => {
  const storage = instrumentedStorage('{}', true)
  assert.deepEqual(loadCredentials('local', storage), emptyCredentials())
  assert.equal(saveCredentials(emptyCredentials(), 'local', storage), false)
})
