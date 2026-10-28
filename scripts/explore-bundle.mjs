import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const assetsDir = path.resolve('dist/assets')
// Outside dist/: Lighthouse CI audits every HTML file in dist/, and this report
// is not part of the app.
const reportPath = path.resolve('benchmark-reports/source-map-explorer.html')

if (!fs.existsSync(assetsDir)) {
    console.error('dist/assets does not exist. Run the build first.')
    process.exit(1)
}

const bundleFile = fs
    .readdirSync(assetsDir)
    .filter((file) => /^index-.*\.js$/.test(file))
    .map((file) => ({
        file,
        time: fs.statSync(path.join(assetsDir, file)).mtimeMs,
    }))
    .sort((left, right) => right.time - left.time)[0]?.file

if (!bundleFile) {
    console.error('No index chunk found in dist/assets.')
    process.exit(1)
}

const bundlePath = path.join(assetsDir, bundleFile)
// Hidden source maps carry no sourceMappingURL comment, so the map is passed
// explicitly. Deployed builds have no maps at all (stamp-build-metadata --verify).
const mapPath = `${bundlePath}.map`
if (!fs.existsSync(mapPath)) {
    console.error(
        `No source map for ${bundleFile}. Build with BUILD_SOURCEMAP=hidden ` +
            '(as benchmark.yml does) -- production builds intentionally emit none.',
    )
    process.exit(1)
}
fs.mkdirSync(path.dirname(reportPath), { recursive: true })
const result = spawnSync(
    'pnpm',
    [
        'exec',
        'source-map-explorer',
        bundlePath,
        mapPath,
        '--html',
        reportPath,
        '--no-border-checks',
    ],
    {
        stdio: 'inherit',
        shell: process.platform === 'win32',
    },
)

if (result.status !== 0) {
    process.exit(result.status ?? 1)
}
