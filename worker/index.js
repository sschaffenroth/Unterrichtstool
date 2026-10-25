/* Cloudflare Worker: Räume für die Schüler-Handys.
   Ein Raum je Stunde, 4-stelliger Code, eigenes Durable Object (SQLite, Free-Plan).
   Gespeichert werden nur: die freigegebene Frage, je Antwort eine zufällige Geräte-Kennung oder
   Team-/Platznummer und die Antwort selbst, dazu Meldungen aus Praxisphasen (Ampel, Fortschritt) je
   Platznummer. Keine Namen, keine IP-Adressen.
   Ein Raum löscht sich 4 Wochen nach dem Anlegen selbst (oder sofort über „Raum löschen“).

   API (alle Antworten JSON, CORS offen, weil die Regie als Datei läuft):
     POST /api/raum                          → { code, token }        neuen Raum anlegen
     GET  /api/raum/CODE/aktuell             → { frage | null, status }  für die Schüler-Seite
     GET  /api/raum/CODE/bild                → { schritt, daten }     Bild zur Hotspot-Frage
     POST /api/raum/CODE/antwort  {geraet, team?, schritt, …Antwort}
     POST /api/raum/CODE/melden   {geraet, platz, hilfe?, erledigt?, helfen?}   Praxisphase
     POST /api/raum/CODE/frage    {token, frage | null}   Frage freigeben oder schließen
     POST /api/raum/CODE/bild     {token, schritt, daten} Bild für eine Hotspot-Frage
     POST /api/raum/CODE/status   {token, status}         aktueller Schritt für die Begleitseite
                                  (Titel, Arbeitsauftrag, Countdown, Material-Links, laufende Methoden;
                                  nie Notizen oder Lösungen)
     POST /api/raum/CODE/ergebnis {token}     → { stimmen, teilnehmer, antworten, meldungen }
     POST /api/raum/CODE/verwalten {token, was: quittieren|leeren, platz?}
     POST /api/raum/CODE/loeschen {token}
   Seiten: /  (Code eingeben), /1234 (Schüler-Seite für Raum 1234) */
import { DurableObject } from "cloudflare:workers";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const LEBENSDAUER_MS = 28 * 24 * 3600 * 1000;
const FRAGETYPEN = ["abstimmung", "vorhersage", "wortwolke", "zielscheibe", "exit", "hotspot", "ordnen", "fehlerzeile"];
const AMPEL = ["gruen", "gelb", "rot"];

function json(daten, status = 200) {
  return new Response(JSON.stringify(daten), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS } });
}
const text = (v, n) => String(v == null ? "" : v).slice(0, n);
const liste = (v, n, laenge) => (Array.isArray(v) ? v : []).slice(0, n).map((x) => text(x, laenge));

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

    const api = url.pathname.match(/^\/api\/raum\/(\d{4})\/(aktuell|antwort|melden|frage|bild|status|ergebnis|verwalten|loeschen)$/);
    if (api) {
      const raum = env.RAUM.get(env.RAUM.idFromName(api[1]));
      const was = api[2];
      if (was === "aktuell") return json(await raum.aktuell());
      if (was === "bild" && req.method === "GET") return json(await raum.bildHolen());
      if (req.method !== "POST") return json({ fehler: "POST erwartet" }, 405);
      let daten;
      try { daten = await req.json(); } catch (e) { return json({ fehler: "kein JSON" }, 400); }
      const r = await raum[was === "bild" ? "bildSetzen" : was](daten);
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
    const a = status.auftrag || null;
    const m = status.methoden || {};
    const sauber = {
      fach: text(status.fach, 40),
      titel: text(status.titel, 200),
      abschnitt: text(status.abschnitt, 200),
      auftrag: a ? {
        text: text(a.text, 600),
        sozialform: text(a.sozialform, 20),
        dauer_min: Number(a.dauer_min) || 0,
        abgabe: text(a.abgabe, 300),
        phase: text(a.phase, 80),
      } : null,
      material: (status.material || []).slice(0, 8).map((x) => ({
        text: text(x.text, 200),
        ort: text(x.ort, 300),
        datei: text(x.datei, 200),
        url: /^https?:\/\//.test(String(x.url || "")) ? text(x.url, 500) : "",
      })),
      countdown: status.countdown ? { rest: Math.max(0, Number(status.countdown.rest) || 0), laeuft: !!status.countdown.laeuft } : null,
      extern: !!status.extern,
      tafel: tafelSauber(status.tafel),
      // laufende Methoden der Praxisphase: was die Handys anbieten sollen
      methoden: {
        hilfe: !!m.hilfe,
        fortschritt: m.fortschritt ? { aufgaben: liste(m.fortschritt.aufgaben, 12, 30) } : null,
        tempo: !!m.tempo,
        helfer: !!m.helfer,
        paare: (Array.isArray(m.paare) ? m.paare : []).slice(0, 30).map((p) => ({
          a: platzNummer(p.a), b: platzNummer(p.b), aufgabe: text(p.aufgabe, 30), art: p.art === "hilfe" ? "hilfe" : "duett",
        })).filter((p) => p.a && p.b),
        hinweis: text(m.hinweis, 200),
      },
      gesendet: Date.now(),
    };
    await this.ctx.storage.put("status", sauber);
    return { ok: true };
  }

  async frage({ token, frage }) {
    if (!(await this.pruefen(token))) return { fehler: "kein Zugriff", status: 403 };
    if (!frage) { await this.ctx.storage.put("frage", null); return { ok: true }; }
    const typ = FRAGETYPEN.includes(frage.baustein) ? frage.baustein : "abstimmung";
    const sauber = {
      schritt: text(frage.schritt, 80).replace(/:/g, "_"),
      baustein: typ,
      frage: text(frage.frage, 300),
      kennung: frage.kennung === "team" ? "team" : "geraet",
      seit: Date.now(),
    };
    if (typ === "abstimmung" || typ === "vorhersage" || typ === "exit") {
      sauber.optionen = liste(frage.optionen, 12, 120);
      sauber.mehrfach = typ !== "exit" && !!frage.mehrfach;
      sauber.sicherheit = !!frage.sicherheit;
    }
    if (typ === "exit") sauber.offen = text(frage.offen, 200);
    if (typ === "wortwolke") sauber.max_woerter = Math.min(3, Math.max(1, parseInt(frage.max_woerter, 10) || 1));
    if (typ === "zielscheibe") sauber.dimensionen = liste(frage.dimensionen, 6, 60).filter(Boolean);
    if (typ === "ordnen") sauber.zeilen = liste(frage.zeilen, 20, 160);
    if (typ === "fehlerzeile") sauber.zeilen = liste(frage.zeilen, 40, 160);
    if (typ === "hotspot") sauber.bild = !!frage.bild;
    await this.ctx.storage.put("frage", sauber);
    return { ok: true };
  }

  async bildSetzen({ token, schritt, daten }) {
    if (!(await this.pruefen(token))) return { fehler: "kein Zugriff", status: 403 };
    if (!/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(String(daten || "")) || daten.length > 700000) return { fehler: "Bild ungültig oder zu groß" };
    await this.ctx.storage.put("bild", { schritt: text(schritt, 80).replace(/:/g, "_"), daten });
    return { ok: true };
  }

  async bildHolen() {
    return (await this.ctx.storage.get("bild")) || { schritt: null, daten: null };
  }

  async antwort(d) {
    const f = await this.ctx.storage.get("frage");
    if (!f || f.schritt !== d.schritt) return { fehler: "Diese Frage ist nicht mehr offen.", status: 409 };
    const wert = antwortPruefen(f, d);
    if (wert.fehler) return wert;
    let schluessel;
    if (f.kennung === "team") {
      const n = platzNummer(d.team);
      if (!n) return { fehler: "Teamnummer 1 bis 40" };
      schluessel = "t" + n;
    } else {
      if (!/^[a-z0-9-]{8,40}$/i.test(String(d.geraet || ""))) return { fehler: "Geräte-Kennung fehlt" };
      schluessel = "g" + d.geraet;
    }
    await this.ctx.storage.put(`a:${f.schritt}:${schluessel}`, wert);
    return { ok: true };
  }

  /* Praxisphase: Hilfe-Ampel, erledigte Aufgaben, „ich helfe gern“. Je Platznummer ein Eintrag. */
  async melden({ geraet, platz, hilfe, erledigt, helfen }) {
    const st = await this.ctx.storage.get("status");
    const m = (st && st.methoden) || {};
    const n = platzNummer(platz);
    if (!n) return { fehler: "Platznummer 1 bis 40" };
    if (!/^[a-z0-9-]{8,40}$/i.test(String(geraet || ""))) return { fehler: "Geräte-Kennung fehlt" };
    const k = "m:" + n;
    const alt = (await this.ctx.storage.get(k)) || { erledigt: {} };
    const aufgaben = (m.fortschritt && m.fortschritt.aufgaben) || [];
    const neu = { ...alt, geraet: text(geraet, 40), zeit: Date.now() };
    if (hilfe) {
      if (!m.hilfe && !m.helfer) return { fehler: "Die Ampel ist gerade nicht an." };
      if (!AMPEL.includes(hilfe.stufe)) return { fehler: "Ampel: grün, gelb oder rot" };
      const aufgabe = aufgaben.includes(hilfe.aufgabe) ? hilfe.aufgabe : "";
      const gleich = alt.hilfe && alt.hilfe.stufe === hilfe.stufe && alt.hilfe.aufgabe === aufgabe;
      neu.hilfe = { stufe: hilfe.stufe, aufgabe, seit: gleich ? alt.hilfe.seit : Date.now() };
    }
    if (erledigt) {
      if (!m.fortschritt) return { fehler: "Fortschritt ist gerade nicht an." };
      const liste = (Array.isArray(erledigt) ? erledigt : []).filter((a) => aufgaben.includes(a));
      const e = {};
      for (const a of liste) e[a] = (alt.erledigt && alt.erledigt[a]) || Date.now();
      neu.erledigt = e;
    }
    if (helfen != null) neu.helfen = !!helfen;
    await this.ctx.storage.put(k, neu);
    return { ok: true };
  }

  async verwalten({ token, was, platz }) {
    if (!(await this.pruefen(token))) return { fehler: "kein Zugriff", status: 403 };
    if (was === "quittieren") {
      const k = "m:" + platzNummer(platz);
      const alt = await this.ctx.storage.get(k);
      if (alt) await this.ctx.storage.put(k, { ...alt, hilfe: { stufe: "gruen", aufgabe: "", seit: Date.now() } });
      return { ok: true };
    }
    if (was === "leeren") {
      const alle = await this.ctx.storage.list({ prefix: "m:" });
      await this.ctx.storage.delete([...alle.keys()]);
      return { ok: true };
    }
    return { fehler: "unbekannt" };
  }

  async ergebnis({ token }) {
    if (!(await this.pruefen(token))) return { fehler: "kein Zugriff", status: 403 };
    const alle = await this.ctx.storage.list({ prefix: "a:" });
    const stimmen = {}, teilnehmer = {}, antworten = {};
    for (const [k, w] of alle) {
      const schritt = k.split(":")[1];
      const wert = Array.isArray(w) ? { auswahl: w } : w;      // ältere Räume: nur die Liste
      teilnehmer[schritt] = (teilnehmer[schritt] || 0) + 1;
      if (wert.auswahl) {
        stimmen[schritt] = stimmen[schritt] || {};
        for (const o of wert.auswahl) stimmen[schritt][o] = (stimmen[schritt][o] || 0) + 1;
      }
      (antworten[schritt] = antworten[schritt] || []).push(wert);
    }
    const meldungen = {};
    for (const [k, w] of await this.ctx.storage.list({ prefix: "m:" })) {
      meldungen[k.slice(2)] = { hilfe: w.hilfe || null, erledigt: w.erledigt || {}, helfen: !!w.helfen, zeit: w.zeit };
    }
    return { stimmen, teilnehmer, antworten, meldungen, frage: (await this.ctx.storage.get("frage")) || null, jetzt: Date.now() };
  }

  async loeschen({ token }) {
    if (!(await this.pruefen(token))) return { fehler: "kein Zugriff", status: 403 };
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    return { ok: true };
  }
}

function platzNummer(v) {
  const n = parseInt(v, 10);
  return n >= 1 && n <= 40 ? n : 0;
}

/* Antwort je Fragetyp prüfen und auf das Nötige kürzen */
function antwortPruefen(f, d) {
  const typ = f.baustein;
  if (typ === "abstimmung" || typ === "vorhersage" || typ === "exit") {
    const auswahl = (Array.isArray(d.auswahl) ? d.auswahl : d.auswahl == null ? [] : [d.auswahl]).filter((o) => f.optionen.includes(o));
    const w = {};
    if (f.optionen.length) {
      if (!auswahl.length && typ !== "exit") return { fehler: "keine gültige Auswahl" };
      if (!f.mehrfach && auswahl.length > 1) return { fehler: "nur eine Auswahl" };
      w.auswahl = auswahl;
    }
    if (f.sicherheit && d.sicher != null) w.sicher = !!d.sicher;
    if (typ === "exit") {
      w.text = text(d.text, 300).trim();
      if (!w.text && !(w.auswahl || []).length) return { fehler: "Bitte etwas eintragen." };
    }
    return w;
  }
  if (typ === "wortwolke") {
    const woerter = (Array.isArray(d.woerter) ? d.woerter : [d.woerter]).map((x) => text(x, 30).trim().replace(/\s+/g, " ")).filter(Boolean).slice(0, f.max_woerter);
    if (!woerter.length) return { fehler: "Bitte ein Wort eintragen." };
    return { woerter };
  }
  if (typ === "zielscheibe") {
    const werte = (Array.isArray(d.werte) ? d.werte : []).slice(0, f.dimensionen.length).map((x) => Math.max(0, Math.min(4, Math.round(Number(x)))));
    if (werte.length !== f.dimensionen.length || werte.some((x) => Number.isNaN(x))) return { fehler: "Bitte jeden Regler setzen." };
    return { werte };
  }
  if (typ === "hotspot") {
    const x = Number(d.x), y = Number(d.y);
    if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return { fehler: "Bitte auf das Bild tippen." };
    return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
  }
  if (typ === "ordnen") {
    const r = (Array.isArray(d.reihenfolge) ? d.reihenfolge : []).map((x) => parseInt(x, 10));
    const n = f.zeilen.length;
    if (r.length !== n || new Set(r).size !== n || r.some((x) => !(x >= 0 && x < n))) return { fehler: "Reihenfolge unvollständig" };
    return { reihenfolge: r };
  }
  if (typ === "fehlerzeile") {
    const z = parseInt(d.zeile, 10);
    if (!(z >= 1 && z <= f.zeilen.length)) return { fehler: "Bitte eine Zeile antippen." };
    return { zeile: z };
  }
  return { fehler: "unbekannter Fragetyp" };
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
