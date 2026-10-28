/**
 * The one pin for every place that runs graphify or the MCP server through
 * `uv run` (CG-AUD-20261028-A-S5): the MCP launcher, the MCP doctor (also run
 * by CI) and, by test, the graphify-update workflow.
 *
 * `uv run --with graphifyy` resolved whatever was newest on PyPI at each
 * launch, so a new release -- or a compromised one -- ran unreviewed on every
 * session start. Exact versions fix the two direct packages; `--exclude-newer`
 * fixes their transitive dependencies (pydantic, starlette, ...) as of a date,
 * so nothing published later can enter the resolution. Bump all three together
 * and keep .github/workflows/graphify-update.yml in step
 * (scripts/graphify-pins.test.mjs).
 */
export const GRAPHIFYY_VERSION = '0.9.36'
export const MCP_VERSION = '2.0.0'
/** Just after graphifyy 0.9.36 (2026-08-07); mcp 2.0.0 is from 2026-07-28. */
export const UV_EXCLUDE_NEWER = '2026-08-08T00:00:00Z'

/** `uv run` arguments up to the command, with the pinned packages. */
export function uvRunWithPins({ graphifyy = GRAPHIFYY_VERSION, mcp = MCP_VERSION } = {}) {
    return [
        'run',
        '--no-project',
        '--exclude-newer',
        UV_EXCLUDE_NEWER,
        '--with',
        `graphifyy==${graphifyy}`,
        '--with',
        `mcp==${mcp}`,
    ]
}
