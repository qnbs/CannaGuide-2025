#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { nodeSatisfiesDeclaredEngines } from './agent-doctor.mjs'

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
const nodeRange = packageJson.engines?.node
const pinPath = resolve('.node-version')
const pin = existsSync(pinPath) ? readFileSync(pinPath, 'utf8').trim() : ''

if (!/^\d+\.\d+\.\d+$/.test(pin) || !nodeSatisfiesDeclaredEngines(pin, nodeRange)) {
    console.error(
        `.node-version must pin an exact Node version within engines.node '${nodeRange ?? 'missing'}'.`,
    )
    process.exit(1)
}

if (!nodeSatisfiesDeclaredEngines(process.versions.node, nodeRange)) {
    console.error(
        `Node ${process.version} does not satisfy package.json engines.node '${nodeRange ?? 'missing'}'. ` +
            'Install a supported version before running setup.',
    )
    process.exit(1)
}

if (process.argv.includes('--pinned') && process.versions.node !== pin) {
    console.error(`Node ${process.version} differs from the .node-version pin ${pin}.`)
    process.exit(1)
}

console.log(`Node ${process.version} satisfies package.json engines.node ${nodeRange}`)
