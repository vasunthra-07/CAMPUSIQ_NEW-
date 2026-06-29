// Minimal static file server with SPA fallback (no deps).
// Usage: node server.mjs <distDir> <port>
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const dist = process.argv[2] || "./dist";
const port = Number(process.argv[3] || 5180);

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".txt": "text/plain", ".map": "application/json",
};

http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    let filePath = path.join(dist, urlPath);
    if (urlPath === "/" || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      // Static asset miss → SPA fallback to index.html (client-side routing).
      if (urlPath.startsWith("/assets/") && fs.existsSync(filePath)) {
        // fallthrough
      } else {
        filePath = path.join(dist, "index.html");
      }
    }
    const ext = path.extname(filePath).toLowerCase();
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch (e) {
    res.writeHead(404); res.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`serving ${dist} at http://127.0.0.1:${port}`));
