#!/usr/bin/env node
/**
 * Lightweight E2E-style check: manifest + rules index present, governance linked, then mdc:validate.
 * CI substitute for Cursor-only injection tests.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const required = [
    join(root, ".cursor", "index.mdc"),
    join(root, ".cursor", "rules", "index.mdc"),
    join(root, "docs", "cursor-mdc-governance.md"),
];

let failed = false;
const bad = (msg) => {
    console.error(`fail ${msg}`);
    failed = true;
};
const ok = (msg) => console.log(`ok   ${msg}`);

for (const p of required) {
    if (!existsSync(p)) {
        bad(`missing: ${p}`);
    } else {
        ok(`exists ${p.replace(root + "/", "")}`);
    }
}

const govPath = join(root, "docs", "cursor-mdc-governance.md");
if (existsSync(govPath)) {
    const text = readFileSync(govPath, "utf8");
    if (!text.includes("mdc:validate")) {
        bad("docs/cursor-mdc-governance.md must mention mdc:validate");
    } else {
        ok("governance documents mdc:validate");
    }
    if (!text.includes("graphify:mcp:doctor")) {
        bad("docs/cursor-mdc-governance.md must mention graphify:mcp:doctor");
    } else {
        ok("governance documents graphify:mcp:doctor");
    }
}

const validate = spawnSync("pnpm", ["run", "mdc:validate"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
});
if (validate.status !== 0) {
    const output = [validate.stdout, validate.stderr, validate.error?.message]
        .filter(Boolean)
        .join('\n')
        .trim();
    bad(`mdc:validate failed:\n${output || `exit ${validate.status}`}`);
} else {
    ok("pnpm run mdc:validate (nested) passed");
}

process.exit(failed ? 1 : 0);
