// One-shot screenshot runner: serves ./dist, launches headless Chromium, and
// captures every CampusIQ screen. Dependency-free (Node 22 built-ins only).
//
//   node scripts/screenshots/run.mjs                 # all screens
//   INCLUDE_BRAIN=1 node scripts/screenshots/run.mjs # also Campus Brain
//
// Override the browser with CHROME=/path/to/chrome if auto-detection fails.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const dist = path.join(repoRoot, "dist");
const outDir = path.join(repoRoot, "screenshots");
const PORT = 5180;

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("No dist/ build found. Run `npm run build` first.");
  process.exit(1);
}

function findChrome() {
  if (process.env.CHROME && fs.existsSync(process.env.CHROME)) return process.env.CHROME;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((c) => fs.existsSync(c));
}

const chrome = findChrome();
if (!chrome) {
  console.error("Chrome/Chromium not found. Set CHROME=/path/to/chrome and retry.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, [path.join(here, "server.mjs"), dist, String(PORT)], { stdio: "inherit" });
const userDataDir = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "ciq-shots-"));
const browser = spawn(chrome, [
  "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
  "--force-color-profile=srgb", "--font-render-hinting=none",
  `--user-data-dir=${userDataDir}`, "--remote-debugging-port=9222", "about:blank",
], { stdio: "ignore" });

async function waitFor(url, tries = 40) {
  for (let i = 0; i < tries; i++) { try { await fetch(url); return true; } catch {} await sleep(300); }
  return false;
}

const cleanup = () => { try { server.kill(); } catch {} try { browser.kill(); } catch {} };
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });

await waitFor(`http://127.0.0.1:${PORT}/`);
await waitFor("http://127.0.0.1:9222/json/version");

// `--brain` flag (or INCLUDE_BRAIN=1) also captures the Campus Brain screen.
const includeBrain = process.argv.includes("--brain") || process.env.INCLUDE_BRAIN === "1";
const cap = spawn(process.execPath, [path.join(here, "capture.mjs"), `http://127.0.0.1:${PORT}`, outDir], {
  stdio: "inherit",
  env: { ...process.env, INCLUDE_BRAIN: includeBrain ? "1" : "" },
});
cap.on("exit", (code) => { cleanup(); console.log(`\nScreenshots written to ${outDir}`); process.exit(code ?? 0); });
