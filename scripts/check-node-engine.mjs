#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { nodeSatisfiesDeclaredEngines } from './agent-doctor.mjs'

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
const nodeRange = packageJson.engines?.node

if (!nodeSatisfiesDeclaredEngines(process.versions.node, nodeRange)) {
    console.error(
        `Node ${process.version} does not satisfy package.json engines.node '${nodeRange ?? 'missing'}'. ` +
            'Install a supported version before running setup.',
    )
    process.exit(1)
}

console.log(`Node ${process.version} satisfies package.json engines.node ${nodeRange}`)
