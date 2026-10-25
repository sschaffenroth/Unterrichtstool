var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.js
import { DurableObject } from "cloudflare:workers";
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var LEBENSDAUER_MS = 28 * 24 * 3600 * 1e3;
function json(daten, status = 200) {
  return new Response(JSON.stringify(daten), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS } });
}
__name(json, "json");
var worker_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (url.pathname === "/api/raum" && req.method === "POST") {
      for (let i = 0; i < 25; i++) {
        const code = String(1e3 + Math.floor(Math.random() * 9e3));
        const raum = env.RAUM.get(env.RAUM.idFromName(code));
        const r = await raum.anlegen(code);
        if (r) return json(r);
      }
      return json({ fehler: "kein freier Code" }, 503);
    }
    const api = url.pathname.match(/^\/api\/raum\/(\d{4})\/(aktuell|antwort|frage|status|ergebnis|loeschen)$/);
    if (api) {
      const raum = env.RAUM.get(env.RAUM.idFromName(api[1]));
      const was = api[2];
      if (was === "aktuell") return json(await raum.aktuell());
      if (req.method !== "POST") return json({ fehler: "POST erwartet" }, 405);
      let daten;
      try {
        daten = await req.json();
      } catch (e) {
        return json({ fehler: "kein JSON" }, 400);
      }
      const r = await raum[was](daten);
      return json(r, r && r.fehler ? r.status || 400 : 200);
    }
    if (/^\/(r\/)?\d{4}\/?$/.test(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL("/schueler.html", url), req));
    }
    if (url.pathname === "/") return env.ASSETS.fetch(new Request(new URL("/index.html", url), req));
    return env.ASSETS.fetch(req);
  }
};
var Raum = class extends DurableObject {
  static {
    __name(this, "Raum");
  }
  async anlegen(code) {
    const s = this.ctx.storage;
    if (await s.get("token")) return null;
    const token = crypto.randomUUID();
    await s.put({ token, code, angelegt: Date.now(), frage: null });
    await s.setAlarm(Date.now() + LEBENSDAUER_MS);
    return { code, token };
  }
  async alarm() {
    await this.ctx.storage.deleteAll();
  }
  async pruefen(token) {
    const t = await this.ctx.storage.get("token");
    return t && token && t === token;
  }
  async aktuell() {
    const s = this.ctx.storage;
    if (!await s.get("token")) return { raum: false };
    const f = await s.get("frage");
    const st = await s.get("status");
    return { raum: true, frage: f || null, status: st || null, jetzt: Date.now() };
  }
  async status({ token, status }) {
    if (!await this.pruefen(token)) return { fehler: "kein Zugriff", status: 403 };
    if (!status) {
      await this.ctx.storage.put("status", null);
      return { ok: true };
    }
    const text = /* @__PURE__ */ __name((v, n) => String(v == null ? "" : v).slice(0, n), "text");
    const a = status.auftrag || null;
    const sauber = {
      fach: text(status.fach, 40),
      titel: text(status.titel, 200),
      abschnitt: text(status.abschnitt, 200),
      auftrag: a ? {
        text: text(a.text, 600),
        sozialform: text(a.sozialform, 20),
        dauer_min: Number(a.dauer_min) || 0,
        abgabe: text(a.abgabe, 300)
      } : null,
      material: (status.material || []).slice(0, 8).map((m) => ({
        text: text(m.text, 200),
        ort: text(m.ort, 300),
        datei: text(m.datei, 200),
        url: /^https?:\/\//.test(String(m.url || "")) ? text(m.url, 500) : ""
      })),
      countdown: status.countdown ? { rest: Math.max(0, Number(status.countdown.rest) || 0), laeuft: !!status.countdown.laeuft } : null,
      extern: !!status.extern,
      tafel: tafelSauber(status.tafel),
      gesendet: Date.now()
    };
    await this.ctx.storage.put("status", sauber);
    return { ok: true };
  }
  async frage({ token, frage }) {
    if (!await this.pruefen(token)) return { fehler: "kein Zugriff", status: 403 };
    if (frage) {
      const sauber = {
        schritt: String(frage.schritt || "").slice(0, 80),
        baustein: frage.baustein === "vorhersage" ? "vorhersage" : "abstimmung",
        frage: String(frage.frage || "").slice(0, 300),
        optionen: (frage.optionen || []).slice(0, 12).map((o) => String(o).slice(0, 120)),
        mehrfach: !!frage.mehrfach,
        kennung: frage.kennung === "team" ? "team" : "geraet",
        seit: Date.now()
      };
      await this.ctx.storage.put("frage", sauber);
    } else {
      await this.ctx.storage.put("frage", null);
    }
    return { ok: true };
  }
  async antwort({ geraet, team, schritt, auswahl }) {
    const f = await this.ctx.storage.get("frage");
    if (!f || f.schritt !== schritt) return { fehler: "Diese Frage ist nicht mehr offen.", status: 409 };
    const liste = (Array.isArray(auswahl) ? auswahl : [auswahl]).filter((o) => f.optionen.includes(o));
    if (!liste.length) return { fehler: "keine g\xFCltige Auswahl" };
    if (!f.mehrfach && liste.length > 1) return { fehler: "nur eine Auswahl" };
    let schluessel;
    if (f.kennung === "team") {
      const n = parseInt(team, 10);
      if (!(n >= 1 && n <= 40)) return { fehler: "Teamnummer 1 bis 40" };
      schluessel = "t" + n;
    } else {
      if (!/^[a-z0-9-]{8,40}$/i.test(String(geraet || ""))) return { fehler: "Ger\xE4te-Kennung fehlt" };
      schluessel = "g" + geraet;
    }
    await this.ctx.storage.put(`a:${schritt}:${schluessel}`, liste);
    return { ok: true };
  }
  async ergebnis({ token }) {
    if (!await this.pruefen(token)) return { fehler: "kein Zugriff", status: 403 };
    const alle = await this.ctx.storage.list({ prefix: "a:" });
    const stimmen = {}, teilnehmer = {};
    for (const [k, liste] of alle) {
      const [, schritt] = k.split(":");
      stimmen[schritt] = stimmen[schritt] || {};
      teilnehmer[schritt] = (teilnehmer[schritt] || 0) + 1;
      for (const o of liste) stimmen[schritt][o] = (stimmen[schritt][o] || 0) + 1;
    }
    return { stimmen, teilnehmer, frage: await this.ctx.storage.get("frage") || null };
  }
  async loeschen({ token }) {
    if (!await this.pruefen(token)) return { fehler: "kein Zugriff", status: 403 };
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    return { ok: true };
  }
};
function tafelSauber(t, tiefe = 0) {
  if (t == null || tiefe > 8) return null;
  if (typeof t === "string") return t.slice(0, 3e3);
  if (typeof t === "number" || typeof t === "boolean") return t;
  if (Array.isArray(t)) return t.slice(0, 60).map((x) => tafelSauber(x, tiefe + 1));
  if (typeof t === "object") {
    const aus = {};
    for (const [k, v] of Object.entries(t).slice(0, 20)) {
      if (!/^[a-z_]{1,20}$/.test(k)) continue;
      if (k === "url") {
        if (/^https?:\/\//.test(String(v))) aus.url = String(v).slice(0, 500);
        continue;
      }
      aus[k] = tafelSauber(v, tiefe + 1);
    }
    return aus;
  }
  return null;
}
__name(tafelSauber, "tafelSauber");

// ../../../tmp/claude-0/-home-claude/1093c21b-5bd9-5edc-ac32-98a747a32099/scratchpad/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../tmp/claude-0/-home-claude/1093c21b-5bd9-5edc-ac32-98a747a32099/scratchpad/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-zm7zc5/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../tmp/claude-0/-home-claude/1093c21b-5bd9-5edc-ac32-98a747a32099/scratchpad/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-zm7zc5/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Raum,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
