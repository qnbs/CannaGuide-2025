#!/usr/bin/env node
/**
 * Diagnose für Cursor Graphify-MCP: Pfade, uv, bash, graph.json, Python-Imports.
 * Nutzung: `pnpm run graphify:mcp:doctor` (Repo-Root).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const graphJson = join(root, "graphify-out", "graph.json");
const launcher = join(root, "scripts", "graphify-mcp-stdio.sh");

let failed = false;
const ok = (msg) => console.log(`ok   ${msg}`);
const bad = (msg) => {
    console.error(`fail ${msg}`);
    failed = true;
};

if (!existsSync(launcher)) {
    bad(`launcher missing: ${launcher}`);
} else {
    try {
        const mode = statSync(launcher).mode;
        const execBit = 0o111;
        if ((mode & execBit) === 0) {
            bad("scripts/graphify-mcp-stdio.sh is not executable (chmod +x)");
        } else {
            ok("launcher script exists and is executable");
        }
    } catch (e) {
        bad(`launcher stat: ${e.message}`);
    }
}

if (!existsSync(graphJson)) {
    bad("graphify-out/graph.json missing — run: graphify update .");
} else {
    try {
        JSON.parse(readFileSync(graphJson, "utf8"));
        ok("graphify-out/graph.json is valid JSON");
    } catch (e) {
        bad(`graphify-out/graph.json: ${e.message}`);
    }
}

const bash = spawnSync("bash", ["--noprofile", "--norc", "-c", "exit 0"], {
    encoding: "utf8",
});
if (bash.status !== 0) {
    bad("bash not runnable — default MCP entry uses bash + scripts/graphify-mcp-stdio.sh");
} else {
    ok("bash runs");
}

const uvVer = spawnSync("uv", ["--version"], { encoding: "utf8" });
if (uvVer.status !== 0) {
    bad("uv not on PATH — https://docs.astral.sh/uv/getting-started/installation/");
} else {
    ok(uvVer.stdout.trim());
}

const imports = spawnSync(
    "uv",
    [
        "run",
        "--with",
        "graphifyy",
        "--with",
        "mcp",
        "python",
        "-c",
        "import mcp, graphify",
    ],
    {
        encoding: "utf8",
        cwd: root,
        timeout: 180_000,
    },
);
if (imports.status !== 0) {
    bad(
        `uv run (graphifyy + mcp) import failed: ${(imports.stderr || imports.stdout || "").trim() || `exit ${imports.status}`}`,
    );
} else {
    ok("uv can import graphify + PyPI package mcp");
}

console.log("");
console.log(
    "Cursor: Settings → MCP → Server «graphify» aktivieren; nach Änderung neu laden oder IDE neu starten.",
);
console.log(
    ".cursor/mcp.json nutzt cwd «${workspaceFolder}» — Workspace-Root soll das Repo sein (nicht die Parent-Ordner).",
);

process.exit(failed ? 1 : 0);
