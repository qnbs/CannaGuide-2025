#!/usr/bin/env node
/**
 * Diagnostics for the Graphify MCP server: paths, uv, bash, graph.json, Python imports.
 * Usage: `pnpm run graphify:mcp:doctor` (from the repo root).
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
// Graphify scores INFERRED edges on a two-value scale: 0.5 for indirect_call
// (every React callback produces one) and 0.8 for everything else. A 0.7 floor
// therefore rejects the tool's own normal output. 0.5 is its true floor, so the
// check still catches missing or corrupt scores without failing on valid graphs.
const MIN_INFERRED_CONFIDENCE = 0.5;
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

        // Validate the raw field: Number() coerces true and [1] to 1, so a malformed
        // edge would otherwise clear the floor. A missing or corrupt score is a
        // corrupt graph, not an absent one — dropping those silently would let an
        // all-corrupt graph fall through to the "no inferred edges" branch and pass.
        const rawInferredScores = edgeList
            .filter((edge) => edge?.confidence === "INFERRED")
            .map((edge) => edge.confidence_score);
        const isValidScore = (score) =>
            typeof score === "number" && Number.isFinite(score);
        const corrupt = rawInferredScores.filter(
            (score) => !isValidScore(score),
        ).length;
        const inferredScores = rawInferredScores.filter(isValidScore);
        if (corrupt > 0) {
            bad(
                `inferred edges with missing or non-numeric confidence_score: ${corrupt} edge(s)`,
            );
        }
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
        } else if (corrupt === 0) {
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
            const dirty = spawnSync("git", ["status", "--porcelain"], {
                encoding: "utf8",
                cwd: root,
            });
            const hasLocalChanges =
                dirty.status === 0 && dirty.stdout.trim().length > 0;
            if (
                Number.isFinite(commitEpochMs) &&
                graphStat.mtimeMs < commitEpochMs
            ) {
                if (hasLocalChanges) {
                    console.error(
                        "warn graph.json older than last commit but working tree dirty — run: graphify update . before push",
                    );
                } else {
                    bad("graph.json older than last git commit; run: graphify update .");
                }
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
    shell: isWindows,
});

let usesNodeLauncher = false;
const mcpConfigPath = join(root, ".mcp.json");
if (existsSync(mcpConfigPath)) {
    try {
        const mcpCfg = JSON.parse(readFileSync(mcpConfigPath, "utf8"));
        usesNodeLauncher = mcpCfg?.mcpServers?.graphify?.command === "node";
    } catch {
        /* ignore */
    }
}

if (bash.status !== 0) {
    if (isWindows && usesNodeLauncher) {
        console.error(
            "warn bash not runnable -- OK on Windows when .mcp.json uses node graphify-mcp-launcher.mjs",
        );
    } else {
        bad("bash not runnable -- legacy MCP entry uses bash + scripts/graphify-mcp-stdio.sh");
    }
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
    "Claude Code reads .mcp.json at the repo root -- the 'graphify' server appears in /mcp; approve it there.",
);
console.log(
    "Launcher: node scripts/graphify-mcp-launcher.mjs (cross-platform) or bash/cmd fallbacks in scripts/",
);
console.log(
    "GitKraken MCP: node scripts/gitkraken-mcp-launcher.mjs -- requires gk auth login",
);

process.exit(failed ? 1 : 0);
