// Bundle the Pocket UI host part (src/host.js + schemastery) into one ESM file
// that build_dsh_phone_layout.py ships as dsh-ui-mobile's lib/index.js.
import { build } from 'esbuild'
import { rmSync } from 'node:fs'

rmSync('lib', { recursive: true, force: true })

await build({
  entryPoints: ['src/host.js'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node22'],
  legalComments: 'inline',
  logLevel: 'info',
})

// The bundle carries schemastery and cosmokit (MIT): ship their notices.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const schemastery = require.resolve('@deepseek-ai/schemastery/package.json')
const cosmokit = createRequire(schemastery).resolve('@deepseek-ai/cosmokit/package.json')
const notice = [schemastery, cosmokit].map((manifest) => {
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
  return `## ${pkg.name} ${pkg.version} (${pkg.license})\n\nBundled into lib/index.js.\n\n\`\`\`text\n${readFileSync(manifest.replace(/package\.json$/, 'LICENSE'), 'utf8').trim()}\n\`\`\`\n`
}).join('\n')
writeFileSync('lib/THIRD-PARTY-NOTICES.md', `# Third-party notices\n\n${notice}`)
