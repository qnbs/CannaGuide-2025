#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { posix } from 'node:path'

const PROJECTS = ['packages/ai-core/tsconfig.json', 'packages/ui/tsconfig.json']
const failures = []

for (const project of PROJECTS) {
    const config = JSON.parse(readFileSync(project, 'utf8'))
    const options = config.compilerOptions ?? {}
    const outDir = posix.normalize(options.outDir ?? '')
    const buildInfo = posix.normalize(options.tsBuildInfoFile ?? '')

    if (options.composite !== true) {
        failures.push(`${project}: compilerOptions.composite must be true`)
        continue
    }

    if (!outDir || !buildInfo) {
        failures.push(`${project}: outDir and tsBuildInfoFile must both be explicit`)
        continue
    }

    const normalizedOutDir = outDir.replace(/^\.\//, '').replace(/\/$/, '')
    const normalizedBuildInfo = buildInfo.replace(/^\.\//, '')
    if (!normalizedBuildInfo.startsWith(`${normalizedOutDir}/`)) {
        failures.push(
            `${project}: tsBuildInfoFile (${buildInfo}) must live under outDir (${outDir})`,
        )
    }
}

if (failures.length > 0) {
    console.error('[FAIL] TypeScript incremental metadata can diverge from cached declarations:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
}

console.log(
    `[OK] ${PROJECTS.length} composite projects cache declarations and incremental metadata atomically.`,
)
