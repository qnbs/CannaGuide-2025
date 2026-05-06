#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const RULES_DIR = join(process.cwd(), '.cursor', 'rules');
const MAX_LINES = 200;
const allowedFrontmatterKeys = new Set(['description', 'globs', 'alwaysApply']);

function parseFrontmatter(raw, filePath) {
    if (!raw.startsWith('---\n')) {
        throw new Error(`${filePath}: missing frontmatter start delimiter`);
    }

    const end = raw.indexOf('\n---\n', 4);
    if (end === -1) {
        throw new Error(`${filePath}: missing frontmatter end delimiter`);
    }

    const block = raw.slice(4, end).trimEnd();
    const body = raw.slice(end + 5);
    const map = new Map();

    for (const line of block.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.length === 0) {
            continue;
        }

        const idx = line.indexOf(':');
        if (idx === -1) {
            throw new Error(`${filePath}: invalid frontmatter line "${line}"`);
        }

        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        map.set(key, value);
    }

    return { frontmatter: map, body };
}

function validateFrontmatter(frontmatter, filePath, errors) {
    for (const key of frontmatter.keys()) {
        if (!allowedFrontmatterKeys.has(key)) {
            errors.push(`${filePath}: unknown frontmatter key "${key}"`);
        }
    }

    if (frontmatter.has('description')) {
        const description = frontmatter.get('description') ?? '';
        if (description.length > 120) {
            errors.push(`${filePath}: description exceeds 120 characters`);
        }
    }

    if (frontmatter.has('globs')) {
        const globs = frontmatter.get('globs') ?? '';
        if (globs.includes('"') || globs.includes("'")) {
            errors.push(`${filePath}: globs must not contain quotes`);
        }
        if (/, /.test(globs)) {
            errors.push(`${filePath}: globs must not contain spaces after commas`);
        }
    }

    if (!frontmatter.has('alwaysApply')) {
        errors.push(`${filePath}: frontmatter must include alwaysApply`);
    }
}

async function main() {
    const entries = await readdir(RULES_DIR, { withFileTypes: true });
    const files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mdc'))
        .map((entry) => join(RULES_DIR, entry.name))
        .sort();

    const errors = [];

    for (const filePath of files) {
        const raw = await readFile(filePath, 'utf8');
        const lineCount = raw.split('\n').length;

        if (lineCount > MAX_LINES) {
            errors.push(`${filePath}: exceeds ${MAX_LINES} lines (${lineCount})`);
        }

        let parsed;
        try {
            parsed = parseFrontmatter(raw, filePath);
        } catch (error) {
            errors.push(String(error.message ?? error));
            continue;
        }

        validateFrontmatter(parsed.frontmatter, filePath, errors);

        if (!parsed.body.includes('<example>')) {
            errors.push(`${filePath}: missing <example> block`);
        }
        if (!parsed.body.includes('<example type="invalid">')) {
            errors.push(`${filePath}: missing <example type="invalid"> block`);
        }
    }

    if (errors.length > 0) {
        console.error('[FAIL] MDC validation failed');
        for (const error of errors) {
            console.error(`- ${error}`);
        }
        process.exit(1);
    }

    console.log(`[PASS] MDC validation passed for ${files.length} rule file(s)`);
}

main().catch((error) => {
    console.error('[FAIL] Unexpected MDC validation error');
    console.error(error);
    process.exit(1);
});
