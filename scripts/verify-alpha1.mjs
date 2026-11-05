import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'src/app/App.tsx',
  'src/types/index.ts',
  'src/core/provider-registry.ts',
  'src/core/model-registry.ts',
  'src/core/access-policy.ts',
  'src/services/credential-service.ts',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(file), true, `Missing alpha.1 file: ${file}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const lockfile = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const expectedVersions = {
  react: '19.3.1',
  'react-dom': '19.3.1',
  typescript: '7.0.2',
  vite: '8.3.6',
  '@vitejs/plugin-react': '6.2.1',
}

assert.equal(packageJson.version, '0.2.0-alpha.1')
for (const [name, version] of Object.entries(expectedVersions)) {
  assert.equal(packageJson.dependencies[name], version, `${name} is not pinned`)
  assert.equal(lockfile.packages[`node_modules/${name}`]?.version, version, `${name} lockfile drift`)
}

const app = readFileSync('src/app/App.tsx', 'utf8')
assert.match(app, /provider-registry/)
assert.match(app, /credential-service/)
assert.doesNotMatch(app, /const providers: Provider\[\]/)

console.log('alpha.1 verification passed')
