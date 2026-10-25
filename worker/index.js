/* Cloudflare Worker: Räume für die Schüler-Handys.
   Ein Raum je Stunde, 4-stelliger Code, eigenes Durable Object (SQLite, Free-Plan).
   Gespeichert werden nur: die freigegebene Frage, je Antwort eine zufällige Geräte-Kennung oder
   Teamnummer und die gewählten Optionen. Keine Namen, keine IP-Adressen.
   Ein Raum löscht sich 4 Wochen nach dem Anlegen selbst (oder sofort über „Raum löschen“).

   API (alle Antworten JSON, CORS offen, weil die Regie als Datei läuft):
     POST /api/raum                          → { code, token }        neuen Raum anlegen
     GET  /api/raum/CODE/aktuell             → { frage | null }        für die Schüler-Seite
     POST /api/raum/CODE/antwort  {geraet, team?, schritt, auswahl[]}
     POST /api/raum/CODE/frage    {token, frage | null}   Frage freigeben oder schließen
     POST /api/raum/CODE/status   {token, status}         aktueller Schritt für die Begleitseite
                                  (Titel, Arbeitsauftrag, Countdown, Material-Links; nie Notizen oder Lösungen)
     POST /api/raum/CODE/ergebnis {token}     → { stimmen, teilnehmer, geraete }
     POST /api/raum/CODE/loeschen {token}
   Seiten: /  (Code eingeben), /1234 (Schüler-Seite für Raum 1234) */
import { DurableObject } from "cloudflare:workers";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const LEBENSDAUER_MS = 28 * 24 * 3600 * 1000;

function json(daten, status = 200) {
  return new Response(JSON.stringify(daten), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS } });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (url.pathname === "/api/raum" && req.method === "POST") {
      for (let i = 0; i < 25; i++) {
        const code = String(1000 + Math.floor(Math.random() * 9000));
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
      try { daten = await req.json(); } catch (e) { return json({ fehler: "kein JSON" }, 400); }
      const r = await raum[was](daten);
      return json(r, r && r.fehler ? r.status || 400 : 200);
    }

    // /1234 oder /r/1234 → Schüler-Seite
    if (/^\/(r\/)?\d{4}\/?$/.test(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL("/schueler.html", url), req));
    }
    if (url.pathname === "/") return env.ASSETS.fetch(new Request(new URL("/index.html", url), req));
    return env.ASSETS.fetch(req);
  },
};

export class Raum extends DurableObject {
  async anlegen(code) {
    const s = this.ctx.storage;
    if (await s.get("token")) return null;
    const token = crypto.randomUUID();
    await s.put({ token, code, angelegt: Date.now(), frage: null });
    await s.setAlarm(Date.now() + LEBENSDAUER_MS);
    return { code, token };
  }

  async alarm() { await this.ctx.storage.deleteAll(); }

  async pruefen(token) {
    const t = await this.ctx.storage.get("token");
    return t && token && t === token;
  }

  async aktuell() {
    const s = this.ctx.storage;
    if (!(await s.get("token"))) return { raum: false };
    const f = await s.get("frage");
    const st = await s.get("status");
    return { raum: true, frage: f || null, status: st || null, jetzt: Date.now() };
  }

  async status({ token, status }) {
    if (!(await this.pruefen(token))) return { fehler: "kein Zugriff", status: 403 };
    if (!status) { await this.ctx.storage.put("status", null); return { ok: true }; }
    const text = (v, n) => String(v == null ? "" : v).slice(0, n);
    const a = status.auftrag || null;
    const sauber = {
      fach: text(status.fach, 40),
      titel: text(status.titel, 200),
      abschnitt: text(status.abschnitt, 200),
      auftrag: a ? {
        text: text(a.text, 600),
        sozialform: text(a.sozialform, 20),
        dauer_min: Number(a.dauer_min) || 0,
        abgabe: text(a.abgabe, 300),
      } : null,
      material: (status.material || []).slice(0, 8).map((m) => ({
        text: text(m.text, 200),
        ort: text(m.ort, 300),
        datei: text(m.datei, 200),
        url: /^https?:\/\//.test(String(m.url || "")) ? text(m.url, 500) : "",
      })),
      countdown: status.countdown ? { rest: Math.max(0, Number(status.countdown.rest) || 0), laeuft: !!status.countdown.laeuft } : null,
      extern: !!status.extern,
      tafel: tafelSauber(status.tafel),
      gesendet: Date.now(),
    };
    await this.ctx.storage.put("status", sauber);
    return { ok: true };
  }

  async frage({ token, frage }) {
    if (!(await this.pruefen(token))) return { fehler: "kein Zugriff", status: 403 };
    if (frage) {
      const sauber = {
        schritt: String(frage.schritt || "").slice(0, 80),
        baustein: frage.baustein === "vorhersage" ? "vorhersage" : "abstimmung",
        frage: String(frage.frage || "").slice(0, 300),
        optionen: (frage.optionen || []).slice(0, 12).map((o) => String(o).slice(0, 120)),
        mehrfach: !!frage.mehrfach,
        kennung: frage.kennung === "team" ? "team" : "geraet",
        seit: Date.now(),
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
    if (!liste.length) return { fehler: "keine gültige Auswahl" };
    if (!f.mehrfach && liste.length > 1) return { fehler: "nur eine Auswahl" };
    let schluessel;
    if (f.kennung === "team") {
      const n = parseInt(team, 10);
      if (!(n >= 1 && n <= 40)) return { fehler: "Teamnummer 1 bis 40" };
      schluessel = "t" + n;
    } else {
      if (!/^[a-z0-9-]{8,40}$/i.test(String(geraet || ""))) return { fehler: "Geräte-Kennung fehlt" };
      schluessel = "g" + geraet;
    }
    await this.ctx.storage.put(`a:${schritt}:${schluessel}`, liste);
    return { ok: true };
  }

  async ergebnis({ token }) {
    if (!(await this.pruefen(token))) return { fehler: "kein Zugriff", status: 403 };
    const alle = await this.ctx.storage.list({ prefix: "a:" });
    const stimmen = {}, teilnehmer = {};
    for (const [k, liste] of alle) {
      const [, schritt] = k.split(":");
      stimmen[schritt] = stimmen[schritt] || {};
      teilnehmer[schritt] = (teilnehmer[schritt] || 0) + 1;
      for (const o of liste) stimmen[schritt][o] = (stimmen[schritt][o] || 0) + 1;
    }
    return { stimmen, teilnehmer, frage: (await this.ctx.storage.get("frage")) || null };
  }

  async loeschen({ token }) {
    if (!(await this.pruefen(token))) return { fehler: "kein Zugriff", status: 403 };
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    return { ok: true };
  }
}

/* Tafel-Inhalt als Text: nur einfache Daten, Längen begrenzt, Links nur http(s). Die Schüler-Seite zeigt alles als Text an. */
function tafelSauber(t, tiefe = 0) {
  if (t == null || tiefe > 8) return null;
  if (typeof t === "string") return t.slice(0, 3000);
  if (typeof t === "number" || typeof t === "boolean") return t;
  if (Array.isArray(t)) return t.slice(0, 60).map((x) => tafelSauber(x, tiefe + 1));
  if (typeof t === "object") {
    const aus = {};
    for (const [k, v] of Object.entries(t).slice(0, 20)) {
      if (!/^[a-z_]{1,20}$/.test(k)) continue;
      if (k === "url") { if (/^https?:\/\//.test(String(v))) aus.url = String(v).slice(0, 500); continue; }
      aus[k] = tafelSauber(v, tiefe + 1);
    }
    return aus;
  }
  return null;
}
