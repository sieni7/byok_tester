import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import * as ts from 'typescript'

const source = readFileSync('src/services/credential-service.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
const { loadCredentials, saveCredentials, emptyCredentials, CREDENTIAL_STORAGE_KEY } = await import(moduleUrl)

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
