/** Entry script registered for Graphify in root `.mcp.json`. */
export const GRAPHIFY_NODE_LAUNCHER = "scripts/graphify-mcp-launcher.mjs";

/**
 * True when `node` will run the Graphify launcher as its script.
 * A flag before the script, including `--version`, does not count:
 * Node handles that flag and does not start the MCP server.
 * Arguments after the launcher are script arguments and stay allowed.
 */
export function selectsGraphifyNodeLauncher(args) {
    if (!Array.isArray(args)) return false;
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (typeof arg !== "string" || arg.length === 0) return false;
        if (arg === "--") {
            return args[index + 1] === GRAPHIFY_NODE_LAUNCHER;
        }
        if (arg.startsWith("-")) return false;
        return arg === GRAPHIFY_NODE_LAUNCHER;
    }
    return false;
}
