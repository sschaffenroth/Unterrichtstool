/* Testserver: führt worker/index.js lokal aus, mit nachgebautem Durable-Object-Speicher im Arbeitsspeicher.
   Aufruf: node tests/testserver.mjs PORT   (gibt „bereit PORT“ aus, sobald er lauscht)
   Liefert wie Cloudflare die Dateien aus public/ und die API. Nur für Tests. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || 8799);

// „cloudflare:workers“ gibt es in Node nicht: Import durch eine kleine Klasse ersetzen
const quelle = fs.readFileSync(path.join(WURZEL, "worker", "index.js"), "utf8")
  .replace(/import \{ DurableObject \} from "cloudflare:workers";/, "class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }");
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "worker-")), "index.mjs");
fs.writeFileSync(tmp, quelle);
const { default: worker, Raum } = await import(pathToFileURL(tmp).href);

class Speicher {
  constructor() { this.m = new Map(); }
  async get(k) {
    if (Array.isArray(k)) return new Map(k.filter((x) => this.m.has(x)).map((x) => [x, structuredClone(this.m.get(x))]));
    return this.m.has(k) ? structuredClone(this.m.get(k)) : undefined;
  }
  async put(k, v) {
    if (typeof k === "object") { for (const [a, b] of Object.entries(k)) this.m.set(a, structuredClone(b)); return; }
    this.m.set(k, structuredClone(v));
  }
  async delete(k) { for (const x of [].concat(k)) this.m.delete(x); }
  async list({ prefix = "" } = {}) {
    return new Map([...this.m.keys()].filter((k) => k.startsWith(prefix)).sort().map((k) => [k, structuredClone(this.m.get(k))]));
  }
  async deleteAll() { this.m.clear(); }
  async setAlarm() {}
  async deleteAlarm() {}
}
const RAEUME = new Map();
const env = {
  RAUM: {
    idFromName: (n) => n,
    get: (id) => {
      if (!RAEUME.has(id)) RAEUME.set(id, new Raum({ storage: new Speicher() }, env));
      return RAEUME.get(id);
    },
  },
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      const datei = path.join(WURZEL, "public", path.normalize(p).replace(/^(\.\.[/\\])+/, ""));
      if (!fs.existsSync(datei) || fs.statSync(datei).isDirectory()) return new Response("nicht gefunden", { status: 404 });
      const typ = datei.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream";
      return new Response(fs.readFileSync(datei), { headers: { "content-type": typ } });
    },
  },
};

http.createServer(async (req, res) => {
  const teile = [];
  for await (const t of req) teile.push(t);
  const body = Buffer.concat(teile);
  const anfrage = new Request("http://127.0.0.1:" + port + req.url, {
    method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
  });
  try {
    const antwort = await worker.fetch(anfrage, env);
    res.writeHead(antwort.status, Object.fromEntries(antwort.headers));
    res.end(Buffer.from(await antwort.arrayBuffer()));
  } catch (e) {
    res.writeHead(500); res.end(String(e && e.stack));
  }
}).listen(port, "127.0.0.1", () => console.log("bereit " + port));
