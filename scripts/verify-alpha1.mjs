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
const css = read('src/styles.css')
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
assert.ok(app.includes('Mode session actif : aucune clé n’est lue depuis ou écrite dans le stockage persistant du navigateur.'), 'Session mode must explain its persistence behavior')
assert.ok(app.includes('Ce stockage n’est pas chiffré et ne constitue pas un coffre-fort sécurisé.'), 'Local mode must explain its security limitation')
assert.ok(app.includes('Saisissez une clé API avant de l’enregistrer.'), 'Empty API keys must be rejected')
assert.ok(app.includes('Remplacer la clé actuellement enregistrée dans Keydock ?'), 'Replacing an existing key must require confirmation')
assert.ok(app.includes('Supprimer la copie de cette clé conservée dans Keydock ?'), 'Deleting a key must require confirmation')
assert.ok(app.includes('ne révoque pas la clé auprès du fournisseur.'), 'Deleting a local copy must not be presented as provider-side revocation')
assert.ok(app.includes('Stockage local indisponible : le navigateur bloque l’accès à localStorage.'), 'Unavailable local storage must be reported explicitly')
assert.ok(credentials.includes("if (mode === 'session') return emptyCredentials()"), 'Session load must return before storage access')
assert.ok(credentials.includes("if (mode === 'session') return false"), 'Session save must return before storage access')
assert.ok(credentials.includes('targetStorage.getItem(CREDENTIAL_STORAGE_KEY)'), 'Local loading must use the credential key')
assert.ok(credentials.includes('targetStorage.setItem(CREDENTIAL_STORAGE_KEY'), 'Local persistence must be explicit')

assert.ok(app.includes('useRef(false)'), 'A synchronous lock must prevent duplicate submissions before React state updates')
assert.ok(app.includes('Saisissez un prompt avant de lancer le test.'), 'Empty prompts must be rejected with feedback')
assert.ok(app.includes('Votre prompt est conservé : vous pouvez le modifier ou le renvoyer.'), 'Successful requests must retain the prompt for retry or editing')
assert.ok(app.includes('NVIDIA NIM traite votre demande…'), 'The in-flight request must expose a loading status')
assert.ok(app.includes('disabled={isSending || !draftMessage.trim()}'), 'The submit button must be disabled while sending or when the prompt is blank')
assert.ok(app.includes('setSendError(error instanceof Error ? error.message'), 'Failed requests must expose a normalized error while retaining the prompt')
assert.ok(!app.includes("setDraftMessage('')"), 'The test flow must not clear the prompt after submission')
assert.ok(app.includes('setMessages((current) => ['), 'The conversation must record the prompt only after a successful provider response')

assert.ok(app.includes('Aller au contenu principal'), 'A visible-on-focus skip link must be available')
assert.ok(app.includes('aria-label="Navigation principale"'), 'Primary navigation must be named')
assert.ok(app.includes('role="log" aria-label="Échanges avec NVIDIA NIM"'), 'Conversation updates must expose a labeled log')
assert.ok(app.includes('Ctrl + Entrée (ou ⌘ + Entrée) pour tester'), 'The keyboard shortcut must be documented')
assert.ok(app.includes('requestSubmit()'), 'Ctrl/Cmd+Enter must submit the prompt')
assert.ok(!app.includes('attachedFile') && !app.includes('isListening'), 'Unsupported attachment and microphone controls must be removed')
assert.ok(!app.includes('href="#docs"'), 'Navigation must not point to a missing documentation anchor')
assert.ok(app.includes('className="mobile-nav"'), 'Mobile users must have visible primary navigation')
assert.ok(app.includes('id="settings"'), 'Settings navigation must target a real section')
assert.ok(css.includes(':focus-visible'), 'Keyboard focus must be visible')
assert.ok(css.includes('min-height: 44px'), 'Interactive controls must target 44px touch height')
assert.ok(css.includes('prefers-reduced-motion: reduce'), 'Reduced-motion preference must be respected')
assert.ok(css.includes('@media (max-width: 340px)'), 'Narrow 320px screens must have a dedicated layout adjustment')

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
