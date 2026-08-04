/**
 * Render `templates/dc/*.dc.html` to A4 PDFs.
 *
 * The templates need three things that are easy to get wrong:
 *   1. React on `window` — `support.js` expects it but does not bundle it
 *   2. an HTTP origin — `file://` breaks `import('./page-numbers.js')`
 *   3. an @page rule injected AFTER load — for flowing documents `doc-page.js`
 *      emits @page with no size descriptor and re-appends it to win source
 *      order, so Chrome's --print-to-pdf-paper-* flags are ignored
 *
 * Usage: node scripts/render-pdf.mjs [name ...]     (default: all)
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "templates/dc");
const WORK = join(ROOT, ".render");
const OUT = join(ROOT, "out");
const PORT = 8931;

const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const VENDOR = {
  "react.js": "https://unpkg.com/react@18/umd/react.production.min.js",
  "react-dom.js": "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "tailwind.js": "https://cdn.tailwindcss.com/3.4.0",
};

// Appended after load so it lands last in source order and wins the @page cascade.
const FORCE_A4 = `<script>
window.addEventListener('load',function(){setTimeout(function(){
  var t=document.createElement('style');
  t.textContent='@page{size:210mm 297mm;margin:0}';
  document.head.appendChild(t);},400);});
</script>
</body>`;

const run = (cmd, args) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: "ignore" });
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
    p.on("error", rej);
  });

async function vendor() {
  const dir = join(WORK, "vendor");
  await mkdir(dir, { recursive: true });
  for (const [file, url] of Object.entries(VENDOR)) {
    const dest = join(dir, file);
    if (existsSync(dest)) continue;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`vendor ${file}: HTTP ${res.status}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
}

async function wrap(name) {
  let h = await readFile(join(SRC, name), "utf8");
  h = h.replace(
    '<script src="./support.js"></script>',
    '<script src="./vendor/react.js"></script>\n' +
      '<script src="./vendor/react-dom.js"></script>\n' +
      '<script src="./runtime/support.js"></script>',
  );
  h = h.replace(
    '<script src="https://cdn.tailwindcss.com"></script>',
    '<script src="./vendor/tailwind.js"></script>',
  );
  h = h.replaceAll('src="./doc-page.js"', 'src="./runtime/doc-page.js"');
  h = h.replaceAll("import('./page-numbers.js')", "import('./runtime/page-numbers.js')");
  h = h.replaceAll('src="./logo.png"', 'src="./runtime/logo.png"');
  h = h.replace("</body>", FORCE_A4);
  await writeFile(join(WORK, name), h, "utf8");
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png" };

async function main() {
  const wanted = process.argv.slice(2);
  const all = (await readdir(SRC)).filter((f) => f.endsWith(".dc.html"));
  const targets = wanted.length
    ? all.filter((f) => wanted.some((w) => f.includes(w)))
    : all;
  if (!targets.length) throw new Error(`no templates matched: ${wanted.join(", ")}`);

  await rm(WORK, { recursive: true, force: true });
  await mkdir(WORK, { recursive: true });
  await mkdir(OUT, { recursive: true });
  await vendor();
  await run("cp", ["-R", join(SRC, "runtime"), join(WORK, "runtime")]);
  for (const t of targets) await wrap(t);

  const server = createServer(async (req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).slice(1);
      const body = await readFile(join(WORK, rel));
      res.writeHead(200, { "Content-Type": MIME[extname(rel)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

  try {
    for (const t of targets) {
      const out = join(OUT, t.replace(/\.dc\.html$/, ".pdf"));
      await run(CHROME, [
        "--headless", "--disable-gpu", "--no-sandbox",
        "--virtual-time-budget=25000",
        "--run-all-compositor-stages-before-draw",
        "--print-to-pdf-no-header", "--no-pdf-header-footer",
        `--print-to-pdf=${out}`,
        `http://127.0.0.1:${PORT}/${encodeURIComponent(t)}`,
      ]);
      console.log(`  ${t} -> out/${t.replace(/\.dc\.html$/, ".pdf")}`);
    }
  } finally {
    server.close();
    await rm(WORK, { recursive: true, force: true });
  }

  console.log("\nVerify before trusting any PDF — a blank page renders at the right size:");
  console.log("  pdfinfo out/<f>.pdf | grep -E 'Pages|Page size'");
  console.log("  pdftotext out/<f>.pdf - | grep -F '<expected string>'");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
