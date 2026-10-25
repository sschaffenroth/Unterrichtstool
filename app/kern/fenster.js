/* Fenster und Monitore: welche Anzeige-Fenster offen sind, öffnen/schließen, fest einem Monitor zuordnen.
   Die Zuordnung gilt für dieses Gerät und alle Stunden (Browser-Speicher, Schlüssel tafelsystem:geraet).
   Monitore erkennt die Window Management API (Chrome/Edge, einmal „Fensterverwaltung“ erlauben).
   Ohne sie merkt sich jedes Fenster seine letzte Position. */
"use strict";

const GERAET_SCHLUESSEL = "tafelsystem:geraet";
const FENSTER = {};            // Name → Fenster (nur im Regie-Fenster)
let BILDSCHIRME = null;        // aus getScreenDetails()
let bildschirmHinweis = null;
let START_NAME = null, START_ANSICHT = null;   // für ein Anzeige-Fenster aus der Adresse

function geraet() { try { return JSON.parse(localStorage.getItem(GERAET_SCHLUESSEL)) || {}; } catch (e) { return {}; } }
function geraetAendern(fn) { const g = geraet(); fn(g); try { localStorage.setItem(GERAET_SCHLUESSEL, JSON.stringify(g)); } catch (e) { /* ohne Speicher */ } }

function zusatzFenster() { return geraet().zusatz || []; }
function alleAnzeigen() {
  const aus = Object.keys(STUNDE.anzeigen || { Board: "geteilt" });
  for (const z of zusatzFenster()) if (!aus.includes(z.name)) aus.push(z.name);
  if (START_NAME && !aus.includes(START_NAME)) aus.push(START_NAME);
  return aus;
}
function zusatzAnsicht(name) {
  const z = zusatzFenster().find((x) => x.name === name);
  return (z && z.ansicht) || (name === START_NAME ? START_ANSICHT : null);
}
function fensterOffen(name) { const w = FENSTER[name]; return !!(w && !w.closed); }

/* ------------------------------------------------------------------ Monitore */
function fingerabdruck(s) { return { label: s.label || "", left: s.left, top: s.top, width: s.width, height: s.height }; }
function bildschirmFinden(fp) {
  if (!fp || !BILDSCHIRME) return null;
  return BILDSCHIRME.find((s) => s.label === fp.label && s.left === fp.left && s.top === fp.top)
    || BILDSCHIRME.find((s) => fp.label && s.label === fp.label)
    || BILDSCHIRME.find((s) => s.left === fp.left && s.top === fp.top && s.width === fp.width);
}
function bildschirmName(s, i) {
  return (s.label || "Bildschirm " + (i + 1)) + " · " + s.width + "×" + s.height + (s.isPrimary ? " · Haupt" : "");
}
async function bildschirmeLaden(fragen) {
  if (!("getScreenDetails" in window)) { bildschirmHinweis = "Monitore zuordnen geht nur in Chrome oder Edge."; return; }
  try {
    if (!fragen) {
      let zustand = "prompt";
      try { zustand = (await navigator.permissions.query({ name: "window-management" })).state; } catch (e) { /* ältere Namen */ }
      if (zustand !== "granted") { bildschirmHinweis = zustand === "denied" ? "„Fensterverwaltung“ ist für diese Datei blockiert (Schloss links in der Adresszeile)." : null; return; }
    }
    const d = await window.getScreenDetails();
    BILDSCHIRME = d.screens;
    bildschirmHinweis = null;
    d.addEventListener("screenschange", () => { BILDSCHIRME = d.screens; neuZeichnen(); });
  } catch (e) {
    bildschirmHinweis = "Ohne die Erlaubnis „Fensterverwaltung“ kann ich keine Monitore zuordnen.";
  }
  neuZeichnen();
}

function platzFuer(name) {
  const g = geraet();
  const s = bildschirmFinden((g.monitor || {})[name]);
  if (s) return { left: s.availLeft, top: s.availTop, width: s.availWidth, height: s.availHeight };
  const p = (g.position || {})[name];
  if (p) return { left: p.x, top: p.y, width: p.w, height: p.h };
  return null;
}

/* ------------------------------------------------------------------ Öffnen, schließen, platzieren */
function fensterOeffnen(name) {
  if (fensterOffen(name)) { fensterPlatzieren(name); FENSTER[name].focus(); return true; }
  const p = platzFuer(name);
  const ansicht = zusatzAnsicht(name);
  const url = location.href.split("#")[0] + "#anzeige=" + encodeURIComponent(name) + (ansicht ? "&ansicht=" + ansicht : "");
  const merkmale = p ? `popup,left=${p.left},top=${p.top},width=${p.width},height=${p.height}` : "popup,width=1280,height=720";
  const w = window.open(url, "tafel-" + name, merkmale);
  if (!w) return false;
  FENSTER[name] = w;
  partnerVerbinden(w);
  if (p) { try { w.moveTo(p.left, p.top); w.resizeTo(p.width, p.height); } catch (e) { /* Browser lässt es nicht zu */ } }
  setTimeout(neuZeichnen, 300);
  return true;
}
function fensterPlatzieren(name) {
  const w = FENSTER[name], p = platzFuer(name);
  if (!w || w.closed || !p) return;
  try { w.moveTo(p.left, p.top); w.resizeTo(p.width, p.height); } catch (e) { /* nicht erlaubt */ }
}
function fensterSchliessen(name) {
  const w = FENSTER[name];
  if (w && !w.closed) { try { w.postMessage({ tafelsystem: "schliessen", schluessel: SPEICHER_SCHLUESSEL }, "*"); w.close(); } catch (e) { /* schon zu */ } }
  delete FENSTER[name];
  setTimeout(neuZeichnen, 200);
}
function alleFensterOeffnen() {
  let blockiert = 0;
  for (const n of alleAnzeigen()) if (!fensterOffen(n) && !fensterOeffnen(n)) blockiert++;
  if (blockiert) alert("Der Browser hat " + blockiert + " Fenster blockiert.\nEinmal Pop-ups für diese Datei erlauben (Symbol rechts in der Adresszeile), dann gehen alle mit einem Klick auf.");
}

/* ------------------------------------------------------------------ im Anzeige-Fenster */
function anzeigeFensterMelden(name) {
  const melden = (typ) => { try { window.opener && window.opener.postMessage({ tafelsystem: typ, schluessel: SPEICHER_SCHLUESSEL, name }, "*"); } catch (e) { /* Regie zu */ } };
  setInterval(() => melden("da"), 3000);
  addEventListener("beforeunload", () => { positionMerken(name); melden("tschuess"); });
  setInterval(() => positionMerken(name), 5000);
}
function positionMerken(name) {
  if (document.fullscreenElement) return;
  geraetAendern((g) => { (g.position = g.position || {})[name] = { x: screenX, y: screenY, w: outerWidth, h: outerHeight }; });
}

/* ------------------------------------------------------------------ Karte in der Regie */
function fensterKarte() {
  const g = geraet();
  const zeilen = alleAnzeigen().map((name) => {
    const offen = fensterOffen(name);
    const fp = (g.monitor || {})[name];
    const gefunden = bildschirmFinden(fp);
    const zusatz = zusatzFenster().find((z) => z.name === name);
    const auswahl = el("select", { class: "knopf klein", onchange: (e) => {
      const i = e.target.value;
      geraetAendern((gg) => { gg.monitor = gg.monitor || {}; if (i === "") delete gg.monitor[name]; else gg.monitor[name] = fingerabdruck(BILDSCHIRME[+i]); });
      fensterPlatzieren(name);
      neuZeichnen();
    } },
      el("option", { value: "" }, fp && !BILDSCHIRME ? "festgelegt: " + (fp.label || fp.width + "×" + fp.height) : "Monitor: nicht festgelegt"),
      (BILDSCHIRME || []).map((s, i) => el("option", { value: i, selected: gefunden === s }, bildschirmName(s, i))));
    return el("div", { class: "fenster-zeile" },
      el("span", { class: "fenster-status" + (offen ? " offen" : ""), title: offen ? "offen" : "zu" }, offen ? "●" : "○"),
      el("span", { class: "fenster-name" }, name, zusatz ? el("span", { class: "naechster" }, " · " + zusatz.ansicht) : null),
      auswahl,
      offen ? el("button", { class: "knopf klein", onclick: () => fensterSchliessen(name) }, "Schließen")
        : el("button", { class: "knopf klein haupt", onclick: () => { if (!fensterOeffnen(name)) alert("Fenster blockiert: Pop-ups für diese Datei erlauben."); } }, "Öffnen"),
      offen && platzFuer(name) ? el("button", { class: "knopf klein", title: "auf den festgelegten Monitor schieben", onclick: () => fensterPlatzieren(name) }, "Platzieren") : null,
      zusatz ? el("button", { class: "knopf klein", title: "Fenster aus der Liste nehmen", onclick: () => { fensterSchliessen(name); geraetAendern((gg) => { gg.zusatz = (gg.zusatz || []).filter((z) => z.name !== name); }); neuZeichnen(); } }, "Entfernen") : null);
  });
  return el("div", { class: "karte" },
    el("h2", null, "Fenster und Monitore"),
    zeilen,
    el("div", { class: "zeile", style: "margin-top:8px" },
      BILDSCHIRME ? el("span", { class: "naechster" }, BILDSCHIRME.length + " Monitore erkannt")
        : el("button", { class: "knopf klein", onclick: () => bildschirmeLaden(true) }, "Monitore erkennen"),
      el("button", { class: "knopf klein", onclick: zusatzFensterAnlegen }, "+ Fenster"),
      el("label", { class: "naechster", style: "display:inline-flex;gap:4px;align-items:center" },
        el("input", { type: "checkbox", checked: g.autoStart !== false, onchange: (e) => geraetAendern((gg) => { gg.autoStart = e.target.checked; }) }),
        "beim Stundenstart öffnen")),
    bildschirmHinweis ? el("p", { class: "naechster", style: "margin:6px 0 0" }, bildschirmHinweis) : null,
    el("p", { class: "naechster", style: "margin:6px 0 0" }, "Die Zuordnung gilt auf diesem Laptop für alle Stunden."));
}

function zusatzFensterAnlegen() {
  const name = (prompt("Name des Fensters (z. B. Monitor 2):", "Monitor " + (alleAnzeigen().length + 1)) || "").trim();
  if (!name || alleAnzeigen().includes(name)) return;
  const ansicht = (prompt("Was soll es zeigen? tafel, auftrag, geteilt oder schwarz", "auftrag") || "auftrag").trim();
  geraetAendern((g) => { (g.zusatz = g.zusatz || []).push({ name, ansicht: ["tafel", "auftrag", "geteilt", "schwarz"].includes(ansicht) ? ansicht : "auftrag" }); });
  neuZeichnen();
}
