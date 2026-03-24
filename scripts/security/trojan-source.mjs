import { spawnSync } from 'node:child_process'

const excludedPrefixes = [
    'dist/',
    'node_modules/',
    'coverage/',
    'artifacts/',
    'test-results/',
    '.lighthouseci/',
    '.git/',
]

const excludedExtensions = [
    // Images
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.icns',
    '.webp',
    '.avif',
    '.svg',
    // Fonts
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    // Media
    '.mp4',
    '.webm',
    '.mp3',
    '.ogg',
    // Archives
    '.zip',
    '.tar',
    '.gz',
    '.br',
    '.zst',
    // Build artifacts / generated
    '.map',
    '.snap',
    '.tsbuildinfo',
    '.lock',
    // Binary / ML models
    '.wasm',
    '.onnx',
    '.bin',
    '.dat',
    '.pb',
    '.tflite',
    // Misc binary
    '.pdf',
    '.exe',
    '.dll',
    '.so',
    '.dylib',
]

/** Batch size to avoid OS arg-length limits (ARG_MAX) */
const BATCH_SIZE = 200

const result = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 32,
})

if (result.error) {
    throw result.error
}

if (result.status !== 0) {
    process.stdout.write(result.stdout ?? '')
    process.stderr.write(result.stderr ?? '')
    process.exit(result.status ?? 1)
}

const files = (result.stdout ?? '')
    .split('\0')
    .filter(Boolean)
    .filter((file) => !excludedPrefixes.some((prefix) => file.startsWith(prefix)))
    .filter((file) => !excludedExtensions.some((ext) => file.toLowerCase().endsWith(ext)))

if (files.length === 0) {
    console.error('trojan-source: no files to scan')
    process.exit(0)
}

console.error(`trojan-source: scanning ${files.length} files in batches of ${BATCH_SIZE}…`)

let failed = false

for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE)
    const scan = spawnSync('npx', ['--no-install', 'anti-trojan-source', ...batch], {
        stdio: 'inherit',
    })
    if (scan.status !== 0) {
        failed = true
    }
}

process.exit(failed ? 1 : 0)
