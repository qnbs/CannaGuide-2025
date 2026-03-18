import { spawnSync } from 'node:child_process'

const excludedPrefixes = [
    'dist/',
    'node_modules/',
    'coverage/',
    'artifacts/',
    'test-results/',
    '.lighthouseci/',
]

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

if (files.length === 0) {
    process.exit(0)
}

const scan = spawnSync('npx', ['--no-install', 'anti-trojan-source', ...files], {
    stdio: 'inherit',
})

process.exit(scan.status ?? 1)
