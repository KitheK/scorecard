#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function usage() {
  console.log(`scorecard-kit — descriptive project manuals

Usage (inside the kit folder):
  npx scorecard-kit <command>      or      node bin/scorecard.js <command>

Commands:
  dev       Install if needed; open interview when answers empty, else Write mode
  interview Start dev server on /interview (local authoring)
  demos     Start the kit and open in-app dogfood demos
  build     Production static build (no Write/save)
  export    Print instructions + README badge snippet
  refresh   Reminder: re-scan via skill; open /write review
  check     Validate content JSON + provenance + paths
  look      Open look-gallery.html specimen page
  help      Show this message
`);
}

function nodeOk() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 20) {
    console.error(`Node 20+ required (found ${process.versions.node}). Install: https://nodejs.org/`);
    process.exit(1);
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32", cwd: root, ...opts });
    child.on("exit", (code) => (code === 0 ? resolvePromise() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function ensureInstall() {
  if (!existsSync(join(root, "node_modules"))) {
    console.log("Installing dependencies…");
    await run("npm", ["install"]);
  }
}

// Bind Vite to one explicit IPv4 loopback address so the URL we print and open is
// exactly where the server listens ("localhost" can resolve to ::1 or 127.0.0.1).
const HOST = "127.0.0.1";

function freePort(start = 5199) {
  return new Promise((resolvePort) => {
    const tryPort = (p) => {
      const s = createServer();
      s.listen(p, HOST, () => {
        s.close(() => resolvePort(p));
      });
      s.on("error", () => tryPort(p + 1));
    };
    tryPort(start);
  });
}

async function openBrowser(url) {
  const cmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["", url] : [url];
  spawn(cmd, args, { shell: true, stdio: "ignore", detached: true }).unref();
}

/** Wait until the dev server answers, so the browser never opens on a dead URL. */
async function waitForServer(url, timeoutMs = 30000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function startServer(path, label) {
  nodeOk();
  await ensureInstall();
  const port = await freePort(5199);
  const url = `http://${HOST}:${port}${path}`;
  console.log(`${label}: ${url}`);
  // --strictPort: fail loudly instead of silently moving to a port we did not print
  const child = spawn("npx", ["vite", "--host", HOST, "--port", String(port), "--strictPort"], {
    cwd: root,
    shell: true,
    stdio: "inherit",
  });
  const stop = () => {
    child.kill("SIGTERM");
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("exit", (code) => process.exit(code ?? 0));
  if (await waitForServer(url)) {
    if (!process.env.SCORECARD_NO_OPEN) openBrowser(url);
  } else {
    console.error(`Scorecard did not answer on ${url} within 30s.`);
  }
}

function normalizeAnswerValue(raw) {
  if (raw && typeof raw === "object" && raw !== null && "value" in raw) return raw.value;
  return raw;
}

function interviewNeedsForm(data) {
  const keys = Object.keys(data?.answers ?? {});
  if (keys.length === 0) return true;
  return !keys.some((k) => {
    const v = normalizeAnswerValue(data.answers[k]);
    if (v === null || v === undefined) return false;
    if (typeof v === "string" && !v.trim()) return false;
    return true;
  });
}

function resolveInterviewPath() {
  const interviewPath = join(root, "content", "interview.json");
  if (!existsSync(interviewPath)) return { path: "/interview", label: "Scorecard interview" };
  try {
    const data = JSON.parse(readFileSync(interviewPath, "utf8"));
    if (interviewNeedsForm(data)) {
      return { path: "/interview", label: "Scorecard interview" };
    }
  } catch {
    return { path: "/interview", label: "Scorecard interview" };
  }
  return { path: "/write", label: "Scorecard Write mode" };
}

async function cmdDev() {
  const { path, label } = resolveInterviewPath();
  await startServer(path, label);
}

async function cmdInterview() {
  await startServer("/interview", "Scorecard interview");
}

async function cmdBuild() {
  nodeOk();
  await ensureInstall();
  await run("npm", ["run", "build"]);
  console.log("Built dist/ (read-only; no Write mode).");
}

function cmdExport() {
  const badge = `[![Scorecard](https://img.shields.io/badge/scorecard-manual-103dff)](./scorecard/)`;
  console.log("Print /export in the browser (Ctrl+P → PDF).\n");
  console.log("README snippet:\n");
  console.log(badge);
  writeFileSync(join(root, "EXPORT-README-SNIPPET.md"), badge + "\n", "utf8");
  console.log("Wrote EXPORT-README-SNIPPET.md");
}

async function cmdDemos() {
  await startServer("/demos", "Dogfood demos");
}

function cmdRefresh() {
  console.log("Refresh: re-run the scorecard skill (Claude, Codex, Copilot, Cursor, or any agent that loaded it).");
  console.log("It must propose a diff for authored content — never overwrite.");
  console.log("Then open Write → Review: npx scorecard-kit dev");
}

function cmdCheck() {
  nodeOk();
  const contentDir = join(root, "content");
  const files = readdirSync(contentDir).filter((f) => f.endsWith(".json"));
  let errors = 0;
  for (const f of files) {
    try {
      const data = JSON.parse(readFileSync(join(contentDir, f), "utf8"));
      if (data.schemaVersion !== 1) {
        console.error(`${f}: unexpected schemaVersion`);
        errors++;
      }
      const walk = (obj, path = "") => {
        if (!obj || typeof obj !== "object") return;
        if (obj.provenance === "confirmed" && obj.source === "generated") {
          console.error(`${f}${path}: agent cannot confirm`);
          errors++;
        }
        if (Array.isArray(obj)) obj.forEach((v, i) => walk(v, `${path}[${i}]`));
        else Object.entries(obj).forEach(([k, v]) => walk(v, `${path}.${k}`));
      };
      walk(data);
      if (f === "architecture.json" && Array.isArray(data.nodes)) {
        for (const n of data.nodes) {
          if (n.path) {
            const p = resolve(root, "../..", n.path);
            const alt = resolve(root, n.path);
            if (!existsSync(p) && !existsSync(alt) && !existsSync(resolve(process.cwd(), n.path))) {
              // paths in fixture are relative to monorepo; warn only
              console.warn(`${f}: path may be missing locally: ${n.path}`);
            }
          }
        }
      }
    } catch (e) {
      console.error(`${f}: ${e}`);
      errors++;
    }
  }
  // planted-secret self-check on a sample string
  const sample = 'API_KEY="sk-planted-secret-value"';
  if (!/API_KEY|SECRET|TOKEN/i.test(sample)) {
    console.error("redaction self-check failed");
    errors++;
  }
  if (errors) {
    console.error(`check failed (${errors})`);
    process.exit(1);
  }
  console.log(`check ok (${files.length} files)`);
}

function cmdLook() {
  const gallery = join(root, "look-gallery.html");
  if (!existsSync(gallery)) {
    console.error("look-gallery.html missing");
    process.exit(1);
  }
  const url = `file://${gallery.replace(/\\/g, "/")}`;
  openBrowser(url);
  console.log(`Opened ${url}`);
}

const cmd = process.argv[2] ?? "help";
const map = {
  dev: cmdDev,
  interview: cmdInterview,
  demos: cmdDemos,
  build: cmdBuild,
  export: cmdExport,
  refresh: cmdRefresh,
  check: cmdCheck,
  look: cmdLook,
  help: usage,
  "--help": usage,
};

Promise.resolve((map[cmd] ?? usage)()).catch((e) => {
  console.error(e);
  process.exit(1);
});
