import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const assetsDir = path.resolve("dist/assets");
const reportPath = path.resolve("dist/source-map-explorer.html");

if (!fs.existsSync(assetsDir)) {
  console.error("dist/assets does not exist. Run the build first.");
  process.exit(1);
}

const bundleFile = fs
  .readdirSync(assetsDir)
  .filter((file) => /^index-.*\.js$/.test(file))
  .map((file) => ({
    file,
    time: fs.statSync(path.join(assetsDir, file)).mtimeMs,
  }))
  .sort((left, right) => right.time - left.time)[0]?.file;

if (!bundleFile) {
  console.error("No index chunk found in dist/assets.");
  process.exit(1);
}

const bundlePath = path.join(assetsDir, bundleFile);
const result = spawnSync(
  "npx",
  ["source-map-explorer", bundlePath, "--html", reportPath, "--no-border-checks"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
