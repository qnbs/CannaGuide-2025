#!/usr/bin/env node
/**
 * Write and check the metadata artifact for a Cloudflare Pages preview.
 *
 * `write` runs in the secret-free pull_request build. `check` runs in the
 * default-branch publish job and rejects a metadata file that does not match
 * the triggering workflow_run. A pull request can replace `write`; it cannot
 * replace `check`, because that job checks out the default branch.
 *
 * Run: node scripts/cloudflare-preview-meta.mjs write|check
 */

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const BRANCH = /^[a-zA-Z0-9._-]{1,63}$/
const SHA = /^[0-9a-f]{40}$/
const PR = /^[0-9]+$/

export function safeBranch(raw, pr) {
    const safe = String(raw ?? '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 63)
    if (BRANCH.test(safe)) return safe
    const fallback = `pr-${pr}`
    if (!BRANCH.test(fallback)) return null
    return fallback
}

export function previewMeta({ rawBranch, sha, pr }) {
    const prText = String(pr ?? '')
    const shaText = String(sha ?? '')
    const branch = safeBranch(rawBranch, prText)
    if (!branch || !SHA.test(shaText) || !PR.test(prText)) return null
    return { branch, sha: shaText, pr: prText }
}

export function checkedPreviewMeta(meta, eventSha, eventPr) {
    const record = previewMeta({
        rawBranch: meta?.branch,
        sha: meta?.sha,
        pr: meta?.pr,
    })
    if (!record) return null
    if (record.sha !== String(eventSha ?? '')) return null
    if (record.pr !== String(eventPr ?? '')) return null
    return record
}

function writeMeta() {
    const record = previewMeta({
        rawBranch: process.env.RAW_HEAD_REF,
        sha: process.env.PREVIEW_SHA,
        pr: process.env.PREVIEW_PR,
    })
    if (!record) {
        console.error('[FAIL] Refusing to write preview metadata.')
        process.exit(1)
    }
    writeFileSync('preview-meta.json', JSON.stringify(record))
    console.log(`[OK] Preview metadata for PR ${record.pr} at ${record.sha}`)
}

function checkMeta() {
    const meta = JSON.parse(readFileSync('preview-meta/preview-meta.json', 'utf8'))
    const record = checkedPreviewMeta(meta, process.env.EVENT_SHA, process.env.EVENT_PR)
    if (!record) {
        console.error('[FAIL] Preview metadata does not match the triggering run.')
        process.exit(1)
    }
    appendFileSync(
        process.env.GITHUB_OUTPUT,
        `branch=${record.branch}\nsha=${record.sha}\npr=${record.pr}\n`,
    )
    console.log(`[OK] Preview metadata matches PR ${record.pr}`)
}

function main() {
    const command = process.argv[2]
    if (command === 'write') writeMeta()
    else if (command === 'check') checkMeta()
    else {
        console.error('[FAIL] Expected write or check.')
        process.exit(1)
    }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
