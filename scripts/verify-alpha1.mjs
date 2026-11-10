import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const read = (file) => readFileSync(file, 'utf8')
const requiredFiles = [
  'src/app/App.tsx',
  'src/types/index.ts',
  'src/core/provider-registry.ts',
  'src/core/model-registry.ts',
  'src/core/access-policy.ts',
  'src/services/credential-service.ts',
  'scripts/test-credentials.mjs',
  '.nvmrc',
]
for (const file of requiredFiles) assert.equal(existsSync(file), true, `Missing alpha.1.2 file: ${file}`)

const packageJson = JSON.parse(read('package.json'))
const lockfile = JSON.parse(read('package-lock.json'))
const expectedVersions = {
  react: '19.3.1',
  'react-dom': '19.3.1',
  typescript: '7.0.2',
  vite: '8.3.6',
  '@vitejs/plugin-react': '6.2.1',
}
assert.equal(packageJson.version, '0.2.0-alpha.1.2')
assert.equal(lockfile.version, packageJson.version)
assert.equal(lockfile.packages[''].version, packageJson.version)
assert.equal(packageJson.engines.node, '^20.19.0 || >=22.12.0')
assert.equal(read('.nvmrc').trim(), '22.12.0')
assert.equal(packageJson.scripts['test:credentials'], 'node scripts/test-credentials.mjs')
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
assert.match(app, /useState<CredentialStorageMode>\('session'\)/, 'Session must be the default mode')
assert.match(app, /loadCredentials\('session'\)/, 'Startup must not load local credentials')
assert.match(providers, /Provider metadata only/)
assert.doesNotMatch(providers, /metric:|metricLabel:|accessPolicyId:/)
assert.match(policies, /unknown-unverified/)
assert.doesNotMatch(policies, /pricing: 'free'/)
assert.match(models, /accessPolicyId/)
assert.match(credentials, /if \(mode === 'session'\) return emptyCredentials\(\)/)
assert.match(credentials, /storage === undefined \? getDefaultLocalStorage\(\)/)
assert.match(credentials, /storage\.setItem\(probeKey/)
assert.match(credentials, /(resolvedStorage|targetStorage)\.setItem\(CREDENTIAL_STORAGE_KEY/)
assert.match(credentials, /return false/)

const sourceFiles = []
const excludedDirectories = new Set(['node_modules', 'dist', '.git', '.vite'])
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) collect(`${directory}/${entry.name}`)
      continue
    }
    if (/\.(ts|tsx|mjs|json|html|css|toml)$/.test(entry.name)) sourceFiles.push(`${directory}/${entry.name}`)
  }
}
collect('.')

const secretPatterns = [
  new RegExp(['sk', '-'].join('') + '[A-Za-z0-9]{12,}'),
  new RegExp(['gsk', '_'].join('') + '[A-Za-z0-9]{12,}'),
  new RegExp(['github', '_pat', '_'].join('') + '[A-Za-z0-9_]{12,}'),
  new RegExp(['Bearer', '\\s+'].join('') + '[A-Za-z0-9._-]{12,}'),
]
for (const file of sourceFiles) {
  const contents = read(file)
  for (const pattern of secretPatterns) assert.equal(pattern.test(contents), false, `Potential secret in ${file}`)
}

const behavior = spawnSync(process.execPath, ['scripts/test-credentials.mjs'], { encoding: 'utf8' })
assert.equal(behavior.status, 0, `Credential behavioral tests failed:\n${behavior.stdout}\n${behavior.stderr}`)

console.log(`alpha.1.2 verification passed (${sourceFiles.length} files scanned)`)
