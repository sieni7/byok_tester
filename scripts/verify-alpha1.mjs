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
  'src/services/nvidia-chat-service.ts',
  'src/core/nvidia-models.ts',
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
assert.equal(packageJson.version, '0.2.0-alpha.3')
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
const nvidiaService = read('src/services/nvidia-chat-service.ts')
const nvidiaModels = read('src/core/nvidia-models.ts')
assert.ok(app.includes('providers.map('), 'Provider UI must be generated from the registry')
assert.ok(app.includes("useState<ProviderId>('nvidia')"), 'NVIDIA NIM must be the default active provider in alpha.3')
assert.ok(app.includes("isOperational={provider.id === 'nvidia'}"), 'Provider cards must distinguish the operational alpha.3 provider')
assert.ok(app.includes("provider.id === 'nvidia' ? 'featured operational' : 'coming-soon'") || app.includes("isOperational ? 'featured operational' : 'coming-soon'"), 'NVIDIA must be visually featured and future providers differentiated')
assert.ok(app.includes('provider-live-label'), 'The playground must visibly identify the active NVIDIA provider')
assert.ok(!app.includes('Choisir le fournisseur actif'), 'Alpha.3 must not offer non-operational providers as active choices')
assert.ok(providers.indexOf("id: 'nvidia'") < providers.indexOf("id: 'openrouter'"), 'NVIDIA must lead the provider registry')
assert.ok(providers.includes("badge: 'À venir'"), 'Future providers must be explicitly labeled as upcoming')
assert.ok(!/providers\[(?:0|1|2)\]/.test(app), 'Provider UI must not rely on positional registry entries')
assert.ok(!/provider\.metric|provider\.metricLabel/.test(app), 'Provider UI must not read provider-level quotas')
assert.ok(providers.includes('Provider metadata only'), 'Provider registry must document its scope')
assert.ok(!/metric:|metricLabel:|accessPolicyId:/.test(providers), 'Provider registry still contains policy data')
assert.ok(policies.includes('unknown-unverified'), 'Unknown access policy must be explicit')
assert.ok(!/pricing: 'free'/.test(policies), 'Unverified provider-level free claims must be absent')
assert.ok(models.includes('accessPolicyId'), 'Model registry must own access policy references')
assert.ok(nvidiaModels.includes('meta/llama-3.1-8b-instruct'), 'NVIDIA NIM model identifier must be registered')
assert.ok(nvidiaModels.includes('unknown-unverified'), 'NVIDIA model access policy must remain unverified')
assert.ok(nvidiaService.includes('https://integrate.api.nvidia.com/v1/chat/completions'), 'NVIDIA NIM endpoint must be explicit')
assert.ok(nvidiaService.includes('Authorization:'), 'NVIDIA requests must use bearer authentication')
assert.ok(!nvidiaService.includes('console.log'), 'NVIDIA service must not log request credentials')
assert.ok(app.includes("useState<CredentialStorageMode>('session')"), 'Session must be the default credential mode')
assert.ok(app.includes("loadCredentials('session')"), 'Startup must not load persistent credentials')
assert.ok(app.includes('credential-mode-options'), 'Credential modes must be presented as explicit options')
assert.ok(app.includes('aria-pressed={storageMode === \'session\'}'), 'Session mode selection must expose its pressed state')
assert.ok(app.includes('aria-pressed={storageMode === \'local\'}'), 'Local mode selection must expose its pressed state')
assert.ok(app.includes('Session mode active: no credentials are read from or written to persistent browser storage.'), 'Session mode must explain its persistence behavior')
assert.ok(app.includes('localStorage is not encrypted or a secure vault.'), 'Local mode must explain its security limitation')
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
  new RegExp('sk-' + '[A-Za-z0-9-]{20,}'),
  new RegExp('sk-or-v1-' + '[A-Za-z0-9]{20,}'),
  new RegExp('gsk' + '_' + '[A-Za-z0-9]{20,}'),
  new RegExp('github' + '_pat_' + '[A-Za-z0-9_]{20,}'),
  new RegExp('gh' + '(?:p|o|u|s|r)_' + '[A-Za-z0-9]{20,}'),
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
console.log(`alpha.3 verification passed; recursively scanned ${scannedFiles.length - 1} source files`)
