import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

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
for (const file of requiredFiles) assert.equal(existsSync(file), true, `Missing required file: ${file}`)

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
assert.equal(lockfile.version, packageJson.version, 'package-lock root version drift')
assert.equal(lockfile.packages[''].version, packageJson.version, 'package-lock package version drift')
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
assert.ok(app.includes('providers.map('), 'Provider UI must be generated from the registry')
assert.ok(!/providers\\[(?:0|1|2)\\]/.test(app), 'Provider UI must not rely on positional registry entries')
assert.ok(!/provider\\.metric|provider\\.metricLabel/.test(app), 'Provider UI must not read provider-level quotas')
assert.ok(providers.includes('Provider metadata only'), 'Provider registry must document its scope')
assert.ok(!/metric:|metricLabel:|accessPolicyId:/.test(providers), 'Provider registry still contains policy data')
assert.ok(policies.includes('unknown-unverified'), 'Unknown access policy must be explicit')
assert.ok(!/pricing: 'free'/.test(policies), 'Unverified provider-level free claims must be absent')
assert.ok(models.includes('accessPolicyId'), 'Model registry must own access policy references')
assert.ok(app.includes("useState<CredentialStorageMode>('session')"), 'Session must be the default credential mode')
assert.ok(app.includes("loadCredentials('session')"), 'Startup must not load persistent credentials')
assert.ok(app.includes('Session only (volatile)'), 'Session and local modes must remain selectable')
assert.ok(credentials.includes("if (mode === 'session') return emptyCredentials()"), 'Session load must return before storage access')
assert.ok(credentials.includes("if (mode === 'session') return false"), 'Session save must return before storage access')
assert.ok(credentials.includes('targetStorage.getItem(CREDENTIAL_STORAGE_KEY)'), 'Local loading must use the credential key')
assert.ok(credentials.includes('targetStorage.setItem(CREDENTIAL_STORAGE_KEY'), 'Local persistence must be explicit')

// Recursively inspect source-like files. Excluded directories are generated/dependency trees only.
const excludedDirectories = new Set(['node_modules', 'dist', '.git', 'coverage'])
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const scannedFiles = []
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) walk(path.join(directory, entry.name))
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      scannedFiles.push(path.join(directory, entry.name))
    }
  }
}
for (const directory of ['src', 'scripts']) if (existsSync(directory)) walk(directory)

// Build patterns from fragments so this verifier does not match its own detection signatures.
const secretPatterns = [
  new RegExp('sk-' + '[A-Za-z0-9]{20,}'),
  new RegExp('gsk' + '_' + '[A-Za-z0-9]{20,}'),
  new RegExp('github' + '_pat_' + '[A-Za-z0-9_]{20,}'),
  new RegExp('Bearer' + String.fromCharCode(92) + 's+' + '[A-Za-z0-9._-]{20,}', 'i'),
]
for (const file of scannedFiles) {
  if (path.resolve(file) === path.resolve('scripts/verify-alpha1.mjs')) continue
  const content = read(file)
  for (const pattern of secretPatterns) {
    assert.equal(pattern.test(content), false, `Potential hard-coded credential detected in ${file}`)
  }
}

execFileSync(process.execPath, ['scripts/test-credentials.mjs'], { stdio: 'inherit' })
console.log(`alpha.1.2 verification passed; recursively scanned ${scannedFiles.length - 1} source files`)
