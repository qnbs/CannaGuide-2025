import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const lighthouseDir = path.resolve(".lighthouseci");

const bytesToKb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

const walk = (dir) => {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += walk(fullPath);
    } else {
      total += fs.statSync(fullPath).size;
    }
  }
  return total;
};

const findLargestMatch = (dir, pattern) => {
  const matcher = new RegExp(pattern);
  let largestFile = null;
  let largestSize = 0;

  for (const entry of fs.readdirSync(dir)) {
    if (!matcher.test(entry)) continue;
    const fullPath = path.join(dir, entry);
    const size = fs.statSync(fullPath).size;
    if (size > largestSize) {
      largestSize = size;
      largestFile = entry;
    }
  }

  return largestFile ? { file: largestFile, size: largestSize } : null;
};

const readLatestLighthouseReport = () => {
  if (!fs.existsSync(lighthouseDir)) return null;

  const reports = fs
    .readdirSync(lighthouseDir)
    .filter((file) => file.endsWith(".json") && file.includes("lhr"))
    .map((file) => ({
      file,
      time: fs.statSync(path.join(lighthouseDir, file)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);

  if (reports.length === 0) return null;

  const reportPath = path.join(lighthouseDir, reports[0].file);
  return JSON.parse(fs.readFileSync(reportPath, "utf8"));
};

const bundleSizeKb = fs.existsSync(distDir) ? bytesToKb(walk(distDir)) : 0;
const mainBundle = fs.existsSync(path.join(distDir, "assets"))
  ? findLargestMatch(path.join(distDir, "assets"), "^index-.*\\.js$")
  : null;
const lighthouseReport = readLatestLighthouseReport();

const metrics = {
  distSizeKb: bundleSizeKb,
  mainBundleKb: mainBundle ? bytesToKb(mainBundle.size) : 0,
  mainBundleFile: mainBundle?.file ?? null,
  lighthousePerformance: lighthouseReport
    ? Math.round(lighthouseReport.categories.performance.score * 100)
    : null,
  lighthouseAccessibility: lighthouseReport
    ? Math.round(lighthouseReport.categories.accessibility.score * 100)
    : null,
  ciTimeSeconds: Number(process.env.CI_TIME_SECONDS ?? 0),
};

console.log(JSON.stringify(metrics, null, 2));
