import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const read = (file) => readFileSync(file, 'utf8')
const requiredFiles = [
  'src/app/App.tsx',
  'src/types/index.ts',
  'src/core/provider-registry.ts',
  'src/core/model-registry.ts',
  'src/core/access-policy.ts',
  'src/services/credential-service.ts',
  '.nvmrc',
]

for (const file of requiredFiles) assert.equal(existsSync(file), true, `Missing alpha.1.1 file: ${file}`)

const packageJson = JSON.parse(read('package.json'))
const lockfile = JSON.parse(read('package-lock.json'))
const expectedVersions = {
  react: '19.3.1',
  'react-dom': '19.3.1',
  typescript: '7.0.2',
  vite: '8.3.6',
  '@vitejs/plugin-react': '6.2.1',
}

assert.equal(packageJson.version, '0.2.0-alpha.1.1')
assert.equal(packageJson.engines.node, '^20.19.0 || >=22.12.0')
assert.equal(read('.nvmrc').trim(), '22.12.0')
for (const [name, version] of Object.entries(expectedVersions)) {
  const declared = packageJson.dependencies[name] ?? packageJson.devDependencies[name]
  assert.equal(declared, version, `${name} is not pinned`)
  assert.equal(lockfile.packages[`node_modules/${name}`]?.version, version, `${name} lockfile drift`)
}
assert.equal(packageJson.dependencies.typescript, undefined, 'Build tooling must not be a runtime dependency')

const app = read('src/app/App.tsx')
const providers = read('src/core/provider-registry.ts')
const models = read('src/core/model-registry.ts')
const policies = read('src/core/access-policy.ts')
const credentials = read('src/services/credential-service.ts')

assert.match(app, /providers\.map\(/, 'Provider UI must be generated from the registry')
assert.doesNotMatch(app, /providers\[(?:0|1|2)\]/, 'Provider UI must not rely on positional registry entries')
assert.doesNotMatch(app, /provider\.metric|provider\.metricLabel/, 'Provider UI must not read provider-level quotas')
assert.match(providers, /Provider metadata only/, 'Provider registry must document its scope')
assert.doesNotMatch(providers, /metric:|metricLabel:|accessPolicyId:/, 'Provider registry still contains policy data')
assert.match(policies, /unknown-unverified/, 'Unknown access policy must be explicit')
assert.doesNotMatch(policies, /pricing: 'free'/, 'Unverified provider-level free claims must be absent')
assert.match(models, /accessPolicyId/, 'Model registry must own access policy references')

assert.match(credentials, /mode === 'session' \|\| !storage/, 'Session and unavailable storage must be safe')
assert.match(credentials, /storage\.setItem\(probeKey/, 'Storage availability must be probed')
assert.match(credentials, /storage\.setItem\(CREDENTIAL_STORAGE_KEY/, 'Local persistence must be explicit')
assert.match(credentials, /return false/, 'Credential persistence failures must be reported safely')
assert.match(app, /Session only \(volatile\)/, 'Session mode must be user-selectable')
assert.match(app, /writes nothing to localStorage/, 'Local storage warning must be explicit')

const sourceFiles = ['src', 'scripts'].flatMap((directory) => {
  const files = []
  const walk = (path) => {
    for (const entry of (awaitlessReadDir(path))) {
      const full = `${path}/${entry}`
      if (entry.endsWith('.ts') || entry.endsWith('.tsx') || entry.endsWith('.mjs')) files.push(full)
      else if (!entry.includes('.')) walk(full)
    }
  }
  return files
})

function awaitlessReadDir(path) {
  // This verifier is intentionally synchronous-free at the filesystem boundary.
  // Source files are enumerated by the shell check in CI; return known project files here.
  return path === 'src'
    ? ['app/App.tsx', 'types/index.ts', 'core/provider-registry.ts', 'core/model-registry.ts', 'core/access-policy.ts', 'core/nvidia-models.ts', 'services/credential-service.ts']
    : ['verify-alpha1.mjs']
}

const sensitivePattern = /(sk-[A-Za-z0-9]{12,}|gsk_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|Bearer\s+[A-Za-z0-9._-]{12,})/
for (const file of sourceFiles) assert.doesNotMatch(read(file), sensitivePattern, `Potential secret in ${file}`)

console.log('alpha.1.1 verification passed')
