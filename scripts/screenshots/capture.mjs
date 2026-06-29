// Drives headless Chromium (CDP on :9222) to capture full-page screenshots of
// every CampusIQ route. Logs in through the REAL login form, then navigates via
// the in-app sidebar (client-side routing) so the auth session never resets.
// No npm deps — Node 22 built-in fetch + WebSocket.
//
// Usage: node capture.mjs <baseUrl> <outDir>     (env INCLUDE_BRAIN=1 to add Campus Brain)

import fs from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:5180";
const OUT = process.argv[3] || "/tmp/cap/screens";
const CDP = "http://127.0.0.1:9222";
const INCLUDE_BRAIN = process.env.INCLUDE_BRAIN === "1";
fs.mkdirSync(OUT, { recursive: true });

// [navLabel, fileName, caption] — navLabel matches the sidebar button text.
const HOD_SHOTS = [
  ["Campus Command Center", "01-command-center", "Campus Command Center"],
  ...(INCLUDE_BRAIN ? [["Campus Brain", "02-campus-brain", "Campus Brain — Executive Dashboard"]] : []),
  ["Campus Copilot", "03-campus-copilot", "AI Campus Copilot"],
  ["Intelligence Centre", "04-intelligence-centre", "Campus Intelligence Centre"],
  ["Campus Analytics Center", "05-analytics", "Campus Analytics Center"],
  ["Faculty Workspace", "06-faculty-workspace", "Faculty Workspace"],
  ["Resource Operations Center", "07-resources", "Resource Operations Center"],
  ["Event Operations Center", "08-events", "Event Operations Center"],
  ["Campus Service Center", "09-service-center", "Campus Service Center"],
  ["Asset Management", "10-assets", "Asset Management"],
  ["Maintenance Operations", "11-maintenance", "Maintenance Operations"],
  ["Campus Communications Center", "12-communications", "Communications Center"],
  ["Notices Board", "13-notices", "Notices Board"],
  ["Safety & Emergency", "14-safety", "Safety & Emergency Center"],
  ["Mobility Operations Center", "15-transport", "Mobility / Transport Operations"],
  ["Knowledge Center", "16-library", "Knowledge Center (Library)"],
  ["Polls & Feedback", "17-polls", "Polls & Feedback"],
  ["Campus Canteen", "18-canteen", "Campus Canteen"],
  ["Settings", "19-settings", "Settings"],
];
const STUDENT_SHOTS = [["Student Experience Hub", "20-student-hub", "Student Experience Hub"]];
const PUBLIC_SHOTS = [
  ["/auth/login", "21-login", "Authentication Portal"],
  ["/about", "22-about", "About CampusIQ"],
  ["/canteen-staff/login", "23-canteen-staff-login", "Canteen Staff Portal"],
];

let _id = 0;
function rpc(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++_id;
    const onMsg = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === id) { ws.removeEventListener("message", onMsg); m.error ? reject(new Error(m.error.message)) : resolve(m.result); }
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evalJS(ws, expression) {
  const r = await rpc(ws, "Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || "eval error");
  return r.result.value;
}

async function connect() {
  const list = await (await fetch(`${CDP}/json/list`)).json();
  const target = list.find((t) => t.type === "page");
  if (!target) throw new Error("no CDP page target");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  await rpc(ws, "Page.enable");
  await rpc(ws, "Runtime.enable");
  await rpc(ws, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  return ws;
}

async function hardNav(ws, url) {
  await rpc(ws, "Page.navigate", { url });
  for (let i = 0; i < 50; i++) {
    await sleep(150);
    if ((await evalJS(ws, "document.readyState")) === "complete") break;
  }
  await sleep(400);
}

async function fullPageShot(ws, file) {
  const metrics = await rpc(ws, "Page.getLayoutMetrics");
  const size = metrics.cssContentSize || metrics.contentSize;
  const h = Math.max(900, Math.min(7000, Math.ceil(size.height) || 900));
  await rpc(ws, "Emulation.setDeviceMetricsOverride", { width: 1440, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(500);
  const shot = await rpc(ws, "Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
  await rpc(ws, "Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  return fs.statSync(file).size;
}

// Log in via the real form; resolve once the dashboard sidebar is present.
async function login(ws, userId, password) {
  await hardNav(ws, `${BASE}/auth/login`);
  await evalJS(ws, `(() => {
    function setVal(el, v){ const d=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; d.call(el, v); el.dispatchEvent(new Event('input',{bubbles:true})); }
    const t=document.querySelector('input[type="text"]'); const p=document.querySelector('input[type="password"]');
    if(t) setVal(t, ${JSON.stringify(userId)}); if(p) setVal(p, ${JSON.stringify(password)});
    const f=document.querySelector('form'); if(f) f.requestSubmit();
    return !!(t&&p&&f);
  })()`);
  // wait out the welcome→dashboard transition (~4s) until sidebar nav appears
  for (let i = 0; i < 40; i++) {
    await sleep(400);
    const ready = await evalJS(ws, `!!document.querySelector('aside nav button')`);
    if (ready) { await sleep(1200); return true; }
  }
  return false;
}

async function navClick(ws, label) {
  const clicked = await evalJS(ws, `(() => {
    const btns=[...document.querySelectorAll('aside nav button')];
    const b=btns.find(x=>x.textContent.trim().includes(${JSON.stringify(label)}));
    if(b){ b.click(); return true; } return false;
  })()`);
  await sleep(1700); // framer-motion + async render
  return clicked;
}

const results = [];
const ws = await connect();

// ── HOD session (admin — sees nearly every module) ──
const hodOk = await login(ws, "HOD2024001", "password123");
console.log("HOD login:", hodOk);
for (const [label, name, caption] of HOD_SHOTS) {
  const found = await navClick(ws, label);
  const file = `${OUT}/${name}.png`;
  let bytes = 0, ok = true;
  try { bytes = await fullPageShot(ws, file); } catch { ok = false; }
  results.push({ name, caption, role: "HOD", nav: found, bytes, ok });
  console.log(`${ok && found ? "OK " : "?? "} ${name}  nav=${found} ${bytes}b`);
}

// ── Student session (for Student Experience Hub) ──
const stuOk = await login(ws, "STU2024001", "password123");
console.log("Student login:", stuOk);
for (const [label, name, caption] of STUDENT_SHOTS) {
  const found = await navClick(ws, label);
  const file = `${OUT}/${name}.png`;
  let bytes = 0, ok = true;
  try { bytes = await fullPageShot(ws, file); } catch { ok = false; }
  results.push({ name, caption, role: "Student", nav: found, bytes, ok });
  console.log(`${ok && found ? "OK " : "?? "} ${name}  nav=${found} ${bytes}b`);
}

// ── Public pages ──
await evalJS(ws, "localStorage.removeItem('CampusIQ_token')");
for (const [route, name, caption] of PUBLIC_SHOTS) {
  await hardNav(ws, `${BASE}${route}`);
  await sleep(1400);
  const file = `${OUT}/${name}.png`;
  let bytes = 0, ok = true;
  try { bytes = await fullPageShot(ws, file); } catch { ok = false; }
  results.push({ name, caption, role: "Public", nav: true, bytes, ok });
  console.log(`${ok ? "OK " : "?? "} ${name}  ${bytes}b  ${route}`);
}

ws.close();
fs.writeFileSync(`${OUT}/_manifest.json`, JSON.stringify(results, null, 2));
const uniq = new Set(results.map((r) => r.bytes)).size;
console.log(`\nDONE: ${results.filter((r) => r.ok).length}/${results.length} captured · ${uniq} distinct sizes (want > 5)`);
