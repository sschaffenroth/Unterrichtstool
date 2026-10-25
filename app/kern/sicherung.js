/* Sicherung: Ansichten als PNG auf dem eigenen Rechner ablegen, eine oder alle, dazu alle als PDF.
   Ablage: einmal einen Ordner wählen (z. B. den Stundenordner), dann landen die Dateien dort.
   Ohne gewählten Ordner gehen sie in den Download-Ordner. Nichts geht in die Cloud. */
"use strict";

const BREITE = 1920, HOEHE = 1080;
let ABLAGE = null;                 // FileSystemDirectoryHandle
let sicherungMeldung = "";

/* ------------------------------------------------------------------ Ablageordner (merkt sich der Browser je Stunde) */
function griffDb() {
  return new Promise((ok, fehler) => {
    const r = indexedDB.open("tafelsystem", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("griffe");
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fehler(r.error);
  });
}
async function griffLesen() {
  try {
    const db = await griffDb();
    return await new Promise((ok) => { const t = db.transaction("griffe").objectStore("griffe").get("ablage:" + SPEICHER_SCHLUESSEL); t.onsuccess = () => ok(t.result || null); t.onerror = () => ok(null); });
  } catch (e) { return null; }
}
async function griffSchreiben(h) {
  try { const db = await griffDb(); db.transaction("griffe", "readwrite").objectStore("griffe").put(h, "ablage:" + SPEICHER_SCHLUESSEL); } catch (e) { /* nur für diese Sitzung */ }
}
griffLesen().then((h) => { if (h) { ABLAGE = h; neuZeichnen(); } });

async function ablageWaehlen() {
  if (!("showDirectoryPicker" in window)) { alert("Ordner wählen geht nur in Chrome oder Edge. Die Dateien landen sonst im Download-Ordner."); return; }
  try {
    ABLAGE = await window.showDirectoryPicker({ id: "tafelsystem", mode: "readwrite", startIn: "documents" });
    await griffSchreiben(ABLAGE);
    meldung("Ablage: " + ABLAGE.name);
  } catch (e) { /* abgebrochen */ }
}
async function ablageBereit() {
  if (!ABLAGE) return false;
  try {
    if ((await ABLAGE.queryPermission({ mode: "readwrite" })) === "granted") return true;
    return (await ABLAGE.requestPermission({ mode: "readwrite" })) === "granted";
  } catch (e) { return false; }
}
async function dateiAblegen(name, blob, unterordner, ordnerBereit) {
  if (ordnerBereit) {
    let ziel = ABLAGE;
    if (unterordner) ziel = await ABLAGE.getDirectoryHandle(unterordner, { create: true });
    const datei = await ziel.getFileHandle(name, { create: true });
    const w = await datei.createWritable();
    await w.write(blob);
    await w.close();
  } else {
    herunterladen(name, blob, "image/png");
  }
}

/* gibt es die Datei im Ablageordner schon, wird _2, _3 … angehängt statt zu überschreiben */
async function freierName(name) {
  const [stamm, endung] = [name.replace(/\.png$/, ""), ".png"];
  for (let i = 1; i < 100; i++) {
    const versuch = i === 1 ? name : stamm + "_" + i + endung;
    try { await ABLAGE.getFileHandle(versuch); } catch (e) { return versuch; }
  }
  return name;
}

function meldung(text) {
  sicherungMeldung = text;
  for (const e of document.querySelectorAll("[data-sicherung]")) e.textContent = text;
}
function dateiname(text) { return String(text).replace(/[^\wäöüÄÖÜß-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60); }
function warten(ms) { return new Promise((r) => setTimeout(r, ms)); }
function bild(ms) { return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms || 0)))); }

/* ------------------------------------------------------------------ eine Ansicht außerhalb des Bildschirms zeichnen und fotografieren */
function exportBuehne(index, reiter, name, { alleMarken = false, mitOverlay = false } = {}) {
  const echt = Z;
  const z = JSON.parse(JSON.stringify(Z));
  const s = SCHRITTE[index];
  z.schritt = index;
  if (!mitOverlay) z.overlay = null;
  if (index !== echt.schritt) z.ansicht = {};
  if (reiter != null) z.reiter[s.id] = reiter;
  if (alleMarken && s.tafel) s.tafel.reiter.forEach((b, i) => { if (b.baustein === "code") z.marken[s.id + ":" + i] = (b.marken || []).length; });
  let buehne;
  Z = z;
  try { buehne = anzeigeInhalt(name, "vorschau"); } finally { Z = echt; }
  const halter = el("div", { style: `position:fixed;left:-${BREITE * 3}px;top:0;width:${BREITE}px;height:${HOEHE}px;overflow:hidden;pointer-events:none` }, buehne);
  document.body.append(halter);
  einpassen(buehne, BREITE, HOEHE);
  const d = s.auftrag && s.auftrag.dauer_min;
  for (const e of buehne.querySelectorAll("[data-countdown]")) {
    if (index === Z.schritt && Z.countdown) { const rest = countdownRest(); e.textContent = formatMinSek(Math.max(0, rest)); }
    else e.textContent = d ? d + ":00" : "";
  }
  return { halter, buehne };
}

async function buehneAlsPng(buehne) {
  await Promise.all([...buehne.querySelectorAll("img")].map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => { i.onload = i.onerror = r; }))));
  await bild(30);   // Zeichenflächen malen im nächsten Bild
  return htmlToImage.toBlob(buehne, { width: BREITE, height: HOEHE, pixelRatio: 1, backgroundColor: "#ffffff" });
}

async function schrittAlsPng(index, reiter, name, optionen) {
  const { halter, buehne } = exportBuehne(index, reiter, name, optionen);
  try { return await buehneAlsPng(buehne); } finally { halter.remove(); }
}

/* Alle Folien: jeder aktive Schritt, jeder Reiter, so wie die Anzeige sie zeigt (extern/schwarz fallen weg). */
function folienListe(name) {
  const liste = [];
  let nr = 0;
  for (const i of aktiveIndizes()) {
    const s = SCHRITTE[i];
    const ansicht = (s.zeige && s.zeige[name]) || (STUNDE.anzeigen || {})[name] || zusatzAnsicht(name) || "geteilt";
    if (ansicht === "extern" || ansicht === "schwarz") continue;
    if (!s.tafel && !s.auftrag) continue;
    nr++;
    const reiter = s.tafel ? s.tafel.reiter : [null];
    reiter.forEach((r, j) => liste.push({
      index: i, reiter: s.tafel ? j : null,
      datei: String(nr).padStart(2, "0") + "_" + dateiname(s.titel) + (reiter.length > 1 ? "_" + (j + 1) + "_" + dateiname(r.titel || "") : "") + ".png",
      titel: ein(s.titel) + (reiter.length > 1 ? ", " + ein(r.titel || j + 1) : ""),
    }));
  }
  return liste;
}

/* ------------------------------------------------------------------ Knöpfe */
async function ansichtSichern(name) {
  const bereit = await ablageBereit();
  meldung("Sichere …");
  try {
    const s = schritt();
    const blob = await schrittAlsPng(Z.schritt, null, name, { mitOverlay: true });
    // Form Sicherung_JJJJ-MM-TT_<Titel>.png (so nimmt schueler_repo.py sie ins Klassen-Repository)
    let datei = "Sicherung_" + datumHeute() + "_" + dateiname(s.titel) + (s.tafel && s.tafel.reiter.length > 1 ? "_" + dateiname(s.tafel.reiter[Z.reiter[s.id] || 0].titel || "") : "") + ".png";
    if (bereit) datei = await freierName(datei);
    await dateiAblegen(datei, blob, null, bereit);
    meldung("Gesichert: " + datei + (bereit ? " in " + ABLAGE.name : " (Downloads)"));
  } catch (e) { console.error(e); meldung("Sichern fehlgeschlagen: " + e.message); }
}

async function alleFolienSichern(name) {
  const bereit = await ablageBereit();
  const liste = folienListe(name);
  const ordner = "Folien_" + STUNDE.stunde.fach + "_" + (STUNDE.stunde.nr ?? "") + "_" + datumHeute();
  try {
    for (let k = 0; k < liste.length; k++) {
      meldung("Folie " + (k + 1) + " von " + liste.length + " …");
      const f = liste[k];
      const blob = await schrittAlsPng(f.index, f.reiter, name, { alleMarken: true });
      await dateiAblegen(f.datei, blob, bereit ? ordner : null, bereit);
      if (!bereit) await warten(250);   // Browser nimmt viele Downloads sonst nicht an
    }
    meldung(liste.length + " Folien gesichert" + (bereit ? " in " + ABLAGE.name + "/" + ordner : " (Downloads)"));
  } catch (e) { console.error(e); meldung("Sichern fehlgeschlagen: " + e.message); }
}

async function alleFolienPdf(name) {
  // Fenster sofort öffnen, solange der Klick noch gilt; Inhalt kommt danach
  const w = window.open("", "tafel-pdf", "width=900,height=700");
  if (!w) { alert("Fenster blockiert: Pop-ups für diese Datei erlauben."); return; }
  w.document.write("<!doctype html><meta charset='utf-8'><title>Folien</title><p style='font:16px system-ui;padding:20px'>Folien werden erzeugt …</p>");
  const liste = folienListe(name);
  const bilder = [];
  try {
    for (let k = 0; k < liste.length; k++) {
      meldung("PDF: Folie " + (k + 1) + " von " + liste.length + " …");
      const blob = await schrittAlsPng(liste[k].index, liste[k].reiter, name, { alleMarken: true });
      bilder.push(await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); }));
    }
  } catch (e) { console.error(e); meldung("PDF fehlgeschlagen: " + e.message); w.close(); return; }
  const titel = STUNDE.stunde.fach + " " + (STUNDE.stunde.nr ?? "") + " " + STUNDE.stunde.titel;
  w.document.open();
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${titel.replace(/</g, "&lt;")}</title>
<style>@page { size: 297mm 167.06mm; margin: 0; } html, body { margin: 0; background: #555; }
img { display: block; width: 297mm; height: 167.06mm; page-break-after: always; background: #fff; margin: 0 auto 8px; }
@media print { body { background: none; } img { margin: 0; } }</style></head><body>
${bilder.map((b) => `<img src="${b}">`).join("\n")}
<script>window.onload = () => setTimeout(() => print(), 300);<\/script></body></html>`);
  w.document.close();
  meldung("PDF: im Druckfenster „Als PDF speichern“ wählen.");
}

function sicherungKarte() {
  const name = alleAnzeigen()[0];
  return el("div", { class: "karte" },
    el("h2", null, "Sicherung"),
    el("div", { class: "zeile", style: "margin-bottom:8px" },
      el("button", { class: "knopf klein haupt", title: "was " + name + " gerade zeigt, mit Zeichnungen und Ergebnissen", onclick: () => ansichtSichern(name) }, "Diese Ansicht als PNG"),
      el("button", { class: "knopf klein", onclick: () => alleFolienSichern(name) }, "Alle Folien als PNG"),
      el("button", { class: "knopf klein", onclick: () => alleFolienPdf(name) }, "Alle Folien als PDF")),
    el("div", { class: "zeile" },
      el("span", { class: "etikett" }, "Ablage"),
      el("span", null, ABLAGE ? ABLAGE.name : "Download-Ordner"),
      el("button", { class: "knopf klein", onclick: ablageWaehlen }, ABLAGE ? "anderen Ordner" : "Ordner wählen")),
    el("p", { class: "naechster", style: "margin:6px 0 0", "data-sicherung": "" }, sicherungMeldung));
}
