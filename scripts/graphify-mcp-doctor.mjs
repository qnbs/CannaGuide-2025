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
const windowsLauncher = join(root, "scripts", "graphify-mcp-stdio-windows.cmd");
const MAX_GRAPH_AGE_HOURS = 168;
const MIN_INFERRED_CONFIDENCE = 0.7;
const isWindows = process.platform === "win32";

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
        if (!isWindows && (mode & execBit) === 0) {
            bad("scripts/graphify-mcp-stdio.sh is not executable (chmod +x)");
        } else if (isWindows) {
            ok("launcher script exists (executable bit check skipped on Windows)");
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
        const parsed = JSON.parse(readFileSync(graphJson, "utf8"));
        const hasNodes = Array.isArray(parsed.nodes);
        const edgeList = Array.isArray(parsed.edges)
            ? parsed.edges
            : Array.isArray(parsed.links)
              ? parsed.links
              : null;
        const hasEdges = Array.isArray(edgeList);
        if (!hasNodes || !hasEdges) {
            bad("graphify-out/graph.json schema invalid (expected nodes[] and edges[])");
        } else {
            ok("graphify-out/graph.json is valid JSON and schema-like");
        }

        const inferredScores = edgeList
            .filter((edge) => edge?.confidence === "INFERRED")
            .map((edge) => Number(edge.confidence_score))
            .filter(Number.isFinite);
        if (inferredScores.length > 0) {
            const belowThreshold = inferredScores.filter(
                (score) => score < MIN_INFERRED_CONFIDENCE,
            ).length;
            if (belowThreshold > 0) {
                bad(
                    `inferred confidence below threshold ${MIN_INFERRED_CONFIDENCE}: ${belowThreshold} edge(s)`,
                );
            } else {
                ok(
                    `inferred confidence threshold >= ${MIN_INFERRED_CONFIDENCE} satisfied (${inferredScores.length} edges)`,
                );
            }
        } else {
            ok("no inferred edges detected (confidence threshold check skipped)");
        }

        const graphStat = statSync(graphJson);
        const nowMs = Date.now();
        const ageHours = (nowMs - graphStat.mtimeMs) / (1000 * 60 * 60);
        if (ageHours > MAX_GRAPH_AGE_HOURS) {
            bad(
                `graph.json is stale (${ageHours.toFixed(1)}h old > ${MAX_GRAPH_AGE_HOURS}h); run: graphify update .`,
            );
        } else {
            ok(`graph.json freshness check passed (${ageHours.toFixed(1)}h old)`);
        }

        const lastCommit = spawnSync("git", ["log", "-1", "--format=%ct"], {
            encoding: "utf8",
            cwd: root,
        });
        if (lastCommit.status === 0) {
            const commitEpochMs = Number(lastCommit.stdout.trim()) * 1000;
            if (Number.isFinite(commitEpochMs) && graphStat.mtimeMs < commitEpochMs) {
                bad("graph.json older than last git commit; run: graphify update .");
            } else {
                ok("graph.json is newer/equal than latest git commit timestamp");
            }
        } else {
            bad("could not read latest git commit timestamp for graph age check");
        }
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

if (!existsSync(windowsLauncher)) {
    bad("Windows fallback launcher missing: scripts/graphify-mcp-stdio-windows.cmd");
} else {
    ok("Windows fallback launcher exists");
}

const uvVer = spawnSync("uv", ["--version"], { encoding: "utf8" });
if (uvVer.status !== 0) {
    if (isWindows) {
        console.error(
            "warn uv not on PATH — skipping Python import check on Windows local fallback",
        );
    } else {
        bad("uv not on PATH — https://docs.astral.sh/uv/getting-started/installation/");
    }
} else {
    ok(uvVer.stdout.trim());
}

if (uvVer.status === 0) {
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
} else {
    console.error("skip uv import check because uv is unavailable");
}

console.log("");
console.log(
    "Cursor: Settings → MCP → Server «graphify» aktivieren; nach Änderung neu laden oder IDE neu starten.",
);
console.log(
    ".cursor/mcp.json nutzt cwd «${workspaceFolder}» — Workspace-Root soll das Repo sein (nicht die Parent-Ordner).",
);

process.exit(failed ? 1 : 0);
