import assert from 'node:assert/strict'

const { emptyCredentials, loadCredentials, saveCredentials } = await import('../src/services/credential-service.ts')

class InstrumentedStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial))
    this.calls = []
  }
  getItem(key) {
    this.calls.push(['getItem', key])
    return this.values.get(key) ?? null
  }
  setItem(key, value) {
    this.calls.push(['setItem', key, value])
    this.values.set(key, value)
  }
  removeItem(key) {
    this.calls.push(['removeItem', key])
    this.values.delete(key)
  }
}

class BrokenStorage {
  getItem() { throw new Error('blocked') }
  setItem() { throw new Error('blocked') }
  removeItem() { throw new Error('blocked') }
}

const empty = emptyCredentials()
const sessionStorage = new InstrumentedStorage({ 'keydock-api-keys-v1': JSON.stringify({ openrouter: 'should-not-load' }) })
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: sessionStorage })
assert.deepEqual(loadCredentials('session'), empty)
assert.deepEqual(sessionStorage.calls, [], 'session startup must not even resolve localStorage')
assert.equal(saveCredentials({ ...empty, github: 'session-secret' }, 'session'), false)
assert.deepEqual(sessionStorage.calls, [], 'session save must not even resolve localStorage')
assert.deepEqual(loadCredentials('session', sessionStorage), empty)
assert.deepEqual(sessionStorage.calls, [], 'session mode must not read storage')
assert.equal(saveCredentials({ ...empty, groq: 'session-secret' }, 'session', sessionStorage), false)
assert.deepEqual(sessionStorage.calls, [], 'session mode must not write storage')

const localStorage = new InstrumentedStorage({ 'keydock-api-keys-v1': JSON.stringify({ openrouter: 'local-value' }) })
assert.equal(loadCredentials('local', localStorage).openrouter, 'local-value')
assert.equal(saveCredentials({ ...empty, github: 'saved-value' }, 'local', localStorage), true)
assert.equal(JSON.parse(localStorage.values.get('keydock-api-keys-v1')).github, 'saved-value')

const brokenStorage = new BrokenStorage()
assert.deepEqual(loadCredentials('local', brokenStorage), empty)
assert.equal(saveCredentials({ ...empty, nvidia: 'ignored-value' }, 'local', brokenStorage), false)

console.log('credential behavioral tests passed')
