#!/usr/bin/env node
/**
 * Export minimal metadata for all .mdc rules (prep for MDC -> Graph bridge).
 * Usage: node scripts/export-mdc-metadata.mjs [--out path.json]
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const rulesDir = join(root, ".cursor", "rules");
const outArg = process.argv.indexOf("--out");
const outPath = outArg >= 0 ? process.argv[outArg + 1] : null;

function parseFrontmatter(raw) {
    if (!raw.startsWith("---\n")) {
        return { meta: {}, bodyStart: 0 };
    }
    const end = raw.indexOf("\n---\n", 4);
    if (end === -1) {
        return { meta: {}, bodyStart: 0 };
    }
    const block = raw.slice(4, end);
    const meta = {};
    for (const line of block.split("\n")) {
        const idx = line.indexOf(":");
        if (idx === -1) {
            continue;
        }
        const key = line.slice(0, idx).trim();
        meta[key] = line.slice(idx + 1).trim();
    }
    return { meta, bodyStart: end + 5 };
}

async function main() {
    const entries = await readdir(rulesDir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile() && e.name.endsWith(".mdc")).map((e) => e.name);
    const records = [];

    for (const name of files.sort()) {
        const full = join(rulesDir, name);
        const raw = await readFile(full, "utf8");
        const { meta } = parseFrontmatter(raw);
        const id = name.replace(/\.mdc$/, "");
        records.push({
            id,
            file: `.cursor/rules/${name}`,
            description: meta.description ?? null,
            globs: meta.globs ?? null,
            alwaysApply: meta.alwaysApply === "true",
        });
    }

    const payload = { generatedAt: new Date().toISOString(), rules: records };
    const json = `${JSON.stringify(payload, null, 2)}\n`;

    if (outPath) {
        await writeFile(outPath, json, "utf8");
        console.log(`[OK] wrote ${outPath}`);
    } else {
        process.stdout.write(json);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
