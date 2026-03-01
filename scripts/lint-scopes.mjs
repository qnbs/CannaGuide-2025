import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const CONFIG_PATH = new URL("./lint-burndown.config.json", import.meta.url);

function loadConfig() {
  const raw = readFileSync(CONFIG_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed.strictScopes || !Array.isArray(parsed.strictScopes)) {
    throw new Error(
      "Invalid lint-burndown config: strictScopes must be an array.",
    );
  }
  return parsed;
}

function main() {
  const config = loadConfig();
  const strictScopes = config.strictScopes;

  if (strictScopes.length === 0) {
    console.log("[lint:scopes] No strict scopes configured. Skipping.");
    process.exit(0);
  }

  console.log(
    `[lint:scopes] Running strict lint for ${strictScopes.length} scope(s).`,
  );
  const result = spawnSync(
    "npx",
    [
      "eslint",
      "--report-unused-disable-directives",
      "--max-warnings",
      "0",
      ...strictScopes,
    ],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  process.exit(result.status ?? 1);
}

main();
