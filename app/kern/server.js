/* Verbindung zum Worker: Raum für die Handys anlegen, Frage freigeben, Antworten abholen.
   Nur das führende Fenster (Regie, oder das Board, wenn es allein läuft) spricht mit dem Server.
   Ohne Netz bleibt alles bedienbar, Abstimmungen laufen dann über Handzeichen. */
"use strict";

const SERVER = (STUNDE.server || "").replace(/\/$/, "");
let FUEHREND = false;

function anmeldeAdresse(z = Z) { return z.raum ? SERVER + "/" + z.raum.code : null; }
function anmeldeKurz(z = Z) { return z.raum ? SERVER.replace(/^https?:\/\//, "") + "/" + z.raum.code : ""; }
function qrSvg(text) {
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  return q.createSvgTag({ cellSize: 4, margin: 1, scalable: true });
}
const QR_CACHE = {};
function qrFuer(text) { return (QR_CACHE[text] = QR_CACHE[text] || qrSvg(text)); }

async function serverRufen(pfad, daten) {
  const r = await fetch(SERVER + pfad, {
    method: daten ? "POST" : "GET",
    headers: daten ? { "content-type": "application/json" } : undefined,
    body: daten ? JSON.stringify(daten) : undefined,
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.fehler || "Server " + r.status);
  return d;
}

async function raumAnlegen() {
  if (!SERVER) { alert("Für diese Stunde ist kein Server eingetragen."); return; }
  try {
    const d = await serverRufen("/api/raum", {});
    tun("raum", { raum: { code: d.code, token: d.token } });
    tun("verbindung", { wert: "ok" });
  } catch (e) {
    tun("verbindung", { wert: "fehler" });
    alert("Server nicht erreichbar. Abstimmungen gehen weiter über Handzeichen.\n(" + e.message + ")");
  }
}

async function raumLoeschen() {
  if (!Z.raum || !confirm("Raum " + Z.raum.code + " mit allen Handy-Antworten löschen?")) return;
  try { await serverRufen("/api/raum/" + Z.raum.code + "/loeschen", { token: Z.raum.token }); } catch (e) { /* trotzdem lokal vergessen */ }
  tun("raum", { raum: null });
}

async function freigeben(s) {
  if (!Z.raum) await raumAnlegen();
  if (!Z.raum) return;
  const sch = s.schueler;
  try {
    await serverRufen("/api/raum/" + Z.raum.code + "/frage", {
      token: Z.raum.token,
      frage: { schritt: s.id, baustein: sch.baustein, frage: sch.frage, optionen: sch.optionen, mehrfach: !!sch.mehrfach, kennung: sch.kennung || "geraet" },
    });
    tun("freigabe", { id: s.id });
  } catch (e) { tun("verbindung", { wert: "fehler" }); alert("Freigabe nicht angekommen: " + e.message); }
}

async function freigabeBeenden() {
  if (Z.raum) { try { await serverRufen("/api/raum/" + Z.raum.code + "/frage", { token: Z.raum.token, frage: null }); } catch (e) { /* Server schließt beim nächsten Freigeben */ } }
  tun("freigabe", { id: null });
}

/* Antworten regelmäßig abholen. Verlässt die Regie den Schritt, wird die Freigabe beendet. */
let abholenLaeuft = false;
async function abholen() {
  if (!FUEHREND || !Z.raum || abholenLaeuft) return;
  abholenLaeuft = true;
  try {
    if (Z.freigabe && Z.freigabe !== schritt().id) await freigabeBeenden();
    const d = await serverRufen("/api/raum/" + Z.raum.code + "/ergebnis", { token: Z.raum.token });
    const neu = { stimmen: d.stimmen || {}, teilnehmer: d.teilnehmer || {} };
    if (JSON.stringify(neu) !== JSON.stringify(Z.online)) tun("online", { daten: neu });
    if (Z.verbindung !== "ok") tun("verbindung", { wert: "ok" });
  } catch (e) {
    if (/kein Zugriff/.test(e.message)) tun("raum", { raum: null });       // Raum gelöscht oder abgelaufen
    else if (Z.verbindung !== "fehler") tun("verbindung", { wert: "fehler" });
  }
  abholenLaeuft = false;
}
function abholenStarten() { FUEHREND = true; setInterval(abholen, 2000); }

/* Stimmen eines Schritts: Handzeichen + Handys */
function stimmenVon(id) {
  const summe = Object.assign({}, Z.stimmen[id] || {});
  const online = (Z.online && Z.online.stimmen && Z.online.stimmen[id]) || {};
  for (const [o, n] of Object.entries(online)) summe[o] = (summe[o] || 0) + n;
  return summe;
}

/* Kasten „Mitmachen“: QR, kurze Adresse, Code */
function mitmachenKasten(s, gross) {
  if (!Z.raum) return null;
  const adresse = anmeldeAdresse();
  const offen = s && Z.freigabe === s.id;
  const antworten = s && Z.online && Z.online.teilnehmer ? Z.online.teilnehmer[s.id] || 0 : 0;
  return el("div", { class: "mitmachen" + (gross ? " gross" : "") },
    el("div", { class: "qr", html: qrFuer(adresse) }),
    el("div", { class: "mitmachen-text" },
      el("div", { class: "mm-titel" }, gross ? "Mitmachen mit dem Handy" : "Mitmachen"),
      el("div", { class: "mm-adresse" }, anmeldeKurz()),
      el("div", { class: "mm-code" }, "Code ", el("b", null, Z.raum.code)),
      offen ? el("div", { class: "mm-status" }, "Frage ist offen · " + antworten + (antworten === 1 ? " Antwort" : " Antworten")) : null));
}
