/* Kern: Stundendaten, Zustand, Aktionen, Uhr und Abgleich zwischen Fenstern.
   Alle Fenster (Regie, Anzeigen) halten denselben Zustand. Jede Aktion ändert den Zustand
   und schickt ihn ganz an die anderen Fenster (postMessage, geht auch bei file://). */
"use strict";

const STUNDE = JSON.parse(document.getElementById("stunde-daten").textContent);
const BILDER = {};
(function bilderLaden() {
  const roh = JSON.parse(document.getElementById("stunde-bilder").textContent);
  for (const [id, daten] of Object.entries(roh)) {
    // data:-URL einmal in eine Blob-URL wandeln, dann muss der Browser nicht bei jedem Zeichnen neu dekodieren
    try {
      const [kopf, b64] = daten.split(",");
      const typ = kopf.slice(5).split(";")[0];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      BILDER[id] = URL.createObjectURL(new Blob([bytes], { type: typ }));
    } catch (e) { BILDER[id] = daten; }
  }
})();

const SCHRITTE = STUNDE.schritte;
const SPEICHER_SCHLUESSEL = "tafelsystem:" + [STUNDE.stunde.fach, STUNDE.stunde.nr, STUNDE.stunde.datum].join(":");
const ANZEIGEN = Object.keys(STUNDE.anzeigen || { Board: "geteilt" });

function jetzt() { return Date.now(); }

function neuerZustand() {
  return {
    version: 0,
    schritt: ersterAktiverIndex({ aktiv: {} }),
    reiter: {},        // schrittId -> Reiterindex
    ansicht: {},       // Anzeigename -> Überschreibung (gilt bis zum nächsten Schrittwechsel)
    marken: {},        // schlüssel -> Anzahl offener Marken
    codeteil: {},      // schlüssel -> Teil bei geteilten Code-Ansichten
    zaehler: {},       // schrittId -> { name: n }
    stimmen: {},       // schrittId -> { option: n }   (offline: Handzeichen)
    aktiv: {},         // schrittId -> true, wenn ein ausgeblendeter Schritt eingeschaltet ist
    striche: {},       // schlüssel -> Liste von Strichen (Zeichnen)
    overlay: null,     // { von: [ids], loesung: bool }
    uhr: { laeuft: false, basis: 0, seit: null },
    schrittBeginn: 0,  // Stundenzeit (ms) beim Betreten des aktuellen Schritts
    ist: {},           // schrittId -> ms
    countdown: null,   // { id, dauer, basis, seit }
    raum: null,        // { code, token } Raum für die Handys auf dem Server
    freigabe: null,    // schrittId, deren Frage gerade auf den Handys offen ist
    online: { stimmen: {}, teilnehmer: {}, antworten: {}, meldungen: {}, versatz: 0 },   // Antworten und Meldungen von den Handys
    verbindung: null,  // "ok" | "fehler"
    methoden: {},      // laufende Methoden: art -> Zustand (kern/methoden.js)
    buehne: null,      // Methode, die gerade groß auf dem Board liegt
    spontan: {},       // id -> Frage einer spontan gestarteten Handy-Methode (Wortwolke, Zielscheibe, Exit-Ticket)
    einschuebe: [],    // Energizer usw.: { art, titel, ms, schritt } zählen nicht zur Schrittzeit
    versteckt: {},     // Frage-id -> ausgeblendete Wörter der Wortwolke
    markiert: {},      // Exit-Ticket: Frage-id + Text -> "richtig" | "falsch" | "aufgreifen"
    sicherheit: {},    // Frage-id -> true: Abstimmung mit „sicher / geraten“
    sql: {},           // schlüssel -> { verlauf: [Anweisungen], text }
  };
}

let Z = laden() || neuerZustand();

function laden() {
  try {
    const roh = localStorage.getItem(SPEICHER_SCHLUESSEL);
    if (!roh) return null;
    const z = JSON.parse(roh);
    if (typeof z.schritt !== "number" || !SCHRITTE[z.schritt]) return null;
    return auffuellen(z);
  } catch (e) { return null; }
}
/* gespeicherter oder empfangener Zustand: fehlende Felder (ältere Fassung) ergänzen */
function auffuellen(z) {
  const n = Object.assign(neuerZustand(), z);
  n.online = Object.assign(neuerZustand().online, z.online || {});
  return n;
}
function speichern() {
  try { localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(Z)); } catch (e) { /* ohne Speicher weiter */ }
}

/* ------------------------------------------------------------------ Schritte */
function istAktiv(s, z = Z) { return !s.ausgeblendet || !!z.aktiv[s.id]; }
function ersterAktiverIndex(z) {
  const i = SCHRITTE.findIndex((s) => istAktiv(s, z));
  return i < 0 ? 0 : i;
}
function aktiveIndizes(z = Z) { return SCHRITTE.map((s, i) => (istAktiv(s, z) ? i : -1)).filter((i) => i >= 0); }
function schritt(z = Z) { return SCHRITTE[z.schritt]; }
function schrittNachId(id) { return SCHRITTE.find((s) => s.id === id); }
function naechsterIndex(richtung, z = Z) {
  const liste = aktiveIndizes(z);
  if (richtung > 0) return liste.find((i) => i > z.schritt);
  return [...liste].reverse().find((i) => i < z.schritt);
}

/* ------------------------------------------------------------------ Uhr */
function stundenzeit(z = Z) { return z.uhr.basis + (z.uhr.laeuft ? jetzt() - z.uhr.seit : 0); }
function schrittzeit(id, z = Z) {
  const vorher = z.ist[id] || 0;
  return SCHRITTE[z.schritt].id === id ? vorher + Math.max(0, stundenzeit(z) - z.schrittBeginn) : vorher;
}
/* Prognose: wie viele Minuten nach Plan endet die Stunde, wenn alle restlichen Schritte ihre Sollzeit brauchen? */
function prognose(z = Z) {
  const liste = aktiveIndizes(z);
  const akt = SCHRITTE[z.schritt];
  let rest = Math.max(0, akt.soll_min * 60000 - schrittzeit(akt.id, z));
  for (const i of liste) if (i > z.schritt) rest += SCHRITTE[i].soll_min * 60000;
  const ende = stundenzeit(z) + rest;
  return { ende, ueber: ende - STUNDE.stunde.dauer * 60000 };
}
function countdownRest(z = Z) {
  const c = z.countdown;
  if (!c) return null;
  return c.dauer - (c.basis + (c.seit ? jetzt() - c.seit : 0));
}
function formatMinSek(ms, mitVorzeichen) {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  const t = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  return (neg ? "−" : mitVorzeichen ? "+" : "") + t;
}
function formatMin(ms) {
  const m = Math.round(ms / 60000);
  return (m > 0 ? "+" : m < 0 ? "−" : "±") + Math.abs(m) + " min";
}

/* ------------------------------------------------------------------ Aktionen */
const AKTION = {
  gehe(z, { index }) {
    if (index == null || !SCHRITTE[index] || index === z.schritt) return;
    const alt = SCHRITTE[z.schritt];
    const t = stundenzeit(z);
    z.ist[alt.id] = (z.ist[alt.id] || 0) + Math.max(0, t - z.schrittBeginn);
    z.schritt = index;
    z.schrittBeginn = t;
    z.ansicht = {};
    z.overlay = null;
    const neu = SCHRITTE[index];
    const d = neu.auftrag && neu.auftrag.dauer_min;
    z.countdown = d ? { id: neu.id, dauer: d * 60000, basis: 0, seit: z.uhr.laeuft ? jetzt() : null } : null;
    methodenBeimSchrittwechsel(z, alt, neu);
  },
  weiter(z) { AKTION.gehe(z, { index: naechsterIndex(1, z) }); },
  zurueck(z) { AKTION.gehe(z, { index: naechsterIndex(-1, z) }); },
  uhrStart(z) {
    if (z.uhr.laeuft) return;
    z.uhr.laeuft = true; z.uhr.seit = jetzt();
    if (z.countdown && !z.countdown.seit && z.countdown.basis === 0) z.countdown.seit = jetzt();
  },
  uhrPause(z) {
    if (!z.uhr.laeuft) return;
    z.uhr.basis += jetzt() - z.uhr.seit; z.uhr.laeuft = false; z.uhr.seit = null;
  },
  ansicht(z, { anzeige, wert }) { z.ansicht[anzeige] = wert; },
  reiter(z, { id, index }) { z.reiter[id] = index; },
  marke(z, { schluessel, anzahl }) { z.marken[schluessel] = Math.max(0, anzahl); },
  codeteil(z, { schluessel, teil }) { z.codeteil[schluessel] = teil; z.marken[schluessel] = z.marken[schluessel] || 0; },
  zaehler(z, { id, name, delta }) {
    const t = (z.zaehler[id] = z.zaehler[id] || {});
    t[name] = Math.max(0, (t[name] || 0) + delta);
  },
  stimme(z, { id, option, delta }) {
    const t = (z.stimmen[id] = z.stimmen[id] || {});
    t[option] = Math.max(0, (t[option] || 0) + delta);
  },
  einschalten(z, { id, an }) { if (an) z.aktiv[id] = true; else delete z.aktiv[id]; },
  overlay(z, { wert }) { z.overlay = wert; },
  strich(z, { schluessel, strich }) { (z.striche[schluessel] = z.striche[schluessel] || []).push(strich); },
  strichZurueck(z, { schluessel }) { (z.striche[schluessel] || []).pop(); },
  striche_loeschen(z, { schluessel }) { z.striche[schluessel] = []; },
  countdown(z, { was, ms }) {
    const c = z.countdown;
    if (!c) return;
    if (was === "pause" && c.seit) { c.basis += jetzt() - c.seit; c.seit = null; }
    else if (was === "start" && !c.seit) { c.seit = jetzt(); }
    else if (was === "plus") { c.dauer += 60000; }
    else if (was === "minus") { c.dauer = Math.max(60000, c.dauer - 60000); }
    else if (was === "neu") { c.basis = 0; c.seit = jetzt(); }
    else if (was === "springen") { c.basis = Math.max(0, Math.min(c.dauer, ms)); if (c.seit) c.seit = jetzt(); }
  },
  ruecksetzen(z) { const raum = z.raum; Object.assign(z, neuerZustand()); z.raum = raum; },
  raum(z, { raum }) { z.raum = raum; if (!raum) { z.freigabe = null; z.online = neuerZustand().online; } },
  freigabe(z, { id }) { z.freigabe = id; },
  online(z, { daten }) { z.online = daten; },
  verbindung(z, { wert }) { z.verbindung = wert; },
  methode(z, { art, wert }) {
    if (wert) z.methoden[art] = wert;
    else { methodeBeenden(z, art); delete z.methoden[art]; if (z.buehne === art) z.buehne = null; }
  },
  methodeAendern(z, { art, teil }) { if (z.methoden[art]) Object.assign(z.methoden[art], teil); },
  buehne(z, { art }) { z.buehne = art; },
  spontan(z, { id, frage }) { z.spontan[id] = frage; },
  verstecken(z, { id, wort, an }) {
    const l = (z.versteckt[id] = z.versteckt[id] || []);
    const i = l.indexOf(wort);
    if (an && i < 0) l.push(wort); else if (!an && i >= 0) l.splice(i, 1);
  },
  markieren(z, { schluessel, wert }) { if (wert) z.markiert[schluessel] = wert; else delete z.markiert[schluessel]; },
  sicherheit(z, { id, an }) { if (an) z.sicherheit[id] = true; else delete z.sicherheit[id]; },
  sql(z, { schluessel, wert }) { z.sql[schluessel] = wert; },
};

/* ------------------------------------------------------------------ Abgleich zwischen Fenstern */
const PARTNER = new Set();
const BEOBACHTER = [];
function beobachten(fn) { BEOBACHTER.push(fn); }
function neuZeichnen() { for (const fn of BEOBACHTER) fn(); }

function tun(typ, daten = {}) {
  AKTION[typ](Z, daten);
  Z.version++;
  speichern();
  senden();
  neuZeichnen();
}
const GESEHEN = new Set();
function senden() {
  const id = Math.random().toString(36).slice(2) + Date.now();
  GESEHEN.add(id);
  const nachricht = { tafelsystem: "zustand", schluessel: SPEICHER_SCHLUESSEL, z: Z, id };
  for (const w of PARTNER) {
    try { if (w.closed) PARTNER.delete(w); else w.postMessage(nachricht, "*"); } catch (e) { PARTNER.delete(w); }
  }
}
window.addEventListener("message", (e) => {
  const d = e.data;
  if (!d || !d.tafelsystem || d.schluessel !== SPEICHER_SCHLUESSEL) return;
  if (d.tafelsystem === "tschuess") {
    if (e.source) PARTNER.delete(e.source);
    if (d.name && FENSTER[d.name] === e.source) { delete FENSTER[d.name]; setTimeout(neuZeichnen, 100); }
    return;
  }
  if (d.tafelsystem === "schliessen") { window.close(); return; }
  const neu = e.source && !PARTNER.has(e.source);
  if (e.source) PARTNER.add(e.source);
  if ((d.tafelsystem === "da" || d.tafelsystem === "hallo") && d.name && e.source) {
    const vorher = JSON.stringify(ANZEIGE_STATUS[d.name] || {});
    ANZEIGE_STATUS[d.name] = { haupt: !!d.haupt, vollbild: !!d.vollbild };
    if (FENSTER[d.name] !== e.source || vorher !== JSON.stringify(ANZEIGE_STATUS[d.name])) { FENSTER[d.name] = e.source; neuZeichnen(); }
  }
  if (d.tafelsystem === "hallo" || (d.tafelsystem === "da" && neu)) {
    e.source.postMessage({ tafelsystem: "zustand", schluessel: SPEICHER_SCHLUESSEL, z: Z }, "*");
  } else if (d.tafelsystem === "zustand") {
    if (d.id && GESEHEN.has(d.id)) return;
    if (d.id) GESEHEN.add(d.id);
    Z = auffuellen(d.z);
    speichern();
    for (const w of PARTNER) if (w !== e.source) { try { w.postMessage(d, "*"); } catch (x) { PARTNER.delete(w); } }
    neuZeichnen();
  }
});
function partnerVerbinden(w, name) {
  if (!w) return;
  PARTNER.add(w);
  try { w.postMessage({ tafelsystem: "hallo", schluessel: SPEICHER_SCHLUESSEL, name }, "*"); } catch (e) { /* noch nicht geladen */ }
}
function hatPartner() { for (const w of PARTNER) if (!w.closed) return true; return false; }

/* ------------------------------------------------------------------ Hilfen */
function el(tag, attrs, ...kinder) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "style") e.setAttribute("style", v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kinder.flat()) {
    if (k == null || k === false) continue;
    if (k.nodeType) { e.append(k); continue; }
    String(k).split("\n").forEach((teil, i) => { if (i) e.append(document.createElement("br")); e.append(document.createTextNode(teil)); });
  }
  return e;
}
/* einzeilig: Zeilenumbrüche aus der Stunde werden zu Leerzeichen (für Knöpfe, Chips, Listen) */
function ein(t) { return String(t == null ? "" : t).replace(/\s*\n\s*/g, " "); }

function herunterladen(name, inhalt, typ) {
  const a = el("a", { href: typeof inhalt === "string" && inhalt.startsWith("data:") ? inhalt : URL.createObjectURL(new Blob([inhalt], { type: typ })), download: name });
  document.body.append(a); a.click(); a.remove();
}
function datumHeute() { return new Date().toISOString().slice(0, 10); }

/* Ton und Vibration für das Signal bei Soll-Ende */
let audioKontext = null;
function signalTon() {
  try {
    audioKontext = audioKontext || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioKontext.currentTime;
    for (const [ab, f] of [[0, 880], [0.25, 660]]) {
      const o = audioKontext.createOscillator(), g = audioKontext.createGain();
      o.frequency.value = f; o.connect(g); g.connect(audioKontext.destination);
      g.gain.setValueAtTime(0.0001, t0 + ab);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + ab + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + ab + 0.22);
      o.start(t0 + ab); o.stop(t0 + ab + 0.25);
    }
  } catch (e) { /* kein Ton */ }
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) { /* kein Vibrieren */ }
}
