import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const LINT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function run(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "ignore"],
  }).trim();
}

function tryRun(command) {
  try {
    return run(command);
  } catch {
    return "";
  }
}

function hasRef(ref) {
  return tryRun(`git rev-parse --verify --quiet ${ref}`) !== "";
}

function resolveBaseRef() {
  if (process.env.LINT_BASE_REF) {
    return process.env.LINT_BASE_REF;
  }

  if (process.env.GITHUB_BASE_REF) {
    return `origin/${process.env.GITHUB_BASE_REF}`;
  }

  if (hasRef("origin/main")) {
    return "origin/main";
  }

  if (hasRef("main")) {
    return "main";
  }

  if (hasRef("HEAD~1")) {
    return "HEAD~1";
  }

  return "";
}

function getChangedFiles(baseRef) {
  const files = new Set();

  if (baseRef) {
    let diffTarget = "";
    if (baseRef === "HEAD~1") {
      diffTarget = "HEAD~1..HEAD";
    } else {
      const mergeBase = tryRun(`git merge-base ${baseRef} HEAD`);
      if (mergeBase) {
        diffTarget = `${mergeBase}...HEAD`;
      }
    }

    if (diffTarget) {
      const committedDiff = tryRun(
        `git diff --name-only --diff-filter=ACMRTUXB ${diffTarget}`,
      );
      committedDiff
        .split("\n")
        .map((file) => file.trim())
        .filter(Boolean)
        .forEach((file) => files.add(file));
    }
  }

  const stagedDiff = tryRun(
    "git diff --name-only --cached --diff-filter=ACMRTUXB",
  );
  stagedDiff
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean)
    .forEach((file) => files.add(file));

  const workingTreeDiff = tryRun("git diff --name-only --diff-filter=ACMRTUXB");
  workingTreeDiff
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean)
    .forEach((file) => files.add(file));

  return [...files]
    .filter((file) => {
      const extension = file.slice(file.lastIndexOf("."));
      return LINT_EXTENSIONS.has(extension);
    })
    .filter((file) => existsSync(file));
}

function main() {
  const inGitRepo = tryRun("git rev-parse --is-inside-work-tree") === "true";
  if (!inGitRepo) {
    console.log("[lint:changed] Not inside a git repository. Skipping.");
    process.exit(0);
  }

  const baseRef = resolveBaseRef();
  const changedFiles = getChangedFiles(baseRef);

  if (changedFiles.length === 0) {
    console.log(
      `[lint:changed] No changed JS/TS files found (base: ${baseRef || "n/a"}).`,
    );
    process.exit(0);
  }

  console.log(
    `[lint:changed] Linting ${changedFiles.length} changed files (base: ${baseRef}).`,
  );
  const result = spawnSync(
    "npx",
    [
      "eslint",
      "--quiet",
      "--report-unused-disable-directives",
      ...changedFiles,
    ],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  process.exit(result.status ?? 1);
}

main();
