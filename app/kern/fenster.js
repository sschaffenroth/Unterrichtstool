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
let ROLLE = null;              // "regie" oder "anzeige" (das Hauptfenster kann wechseln)
let ANZEIGE_NAME = null;       // welche Anzeige dieses Fenster zeigt
let REGIE_MODUS = "fenster";   // "fenster" (Hauptfenster) oder "popup" (Regie neben dem Vollbild-Board)
let REGIE_FENSTER = null;      // im Vollbild-Board: das Regie-Fenster
const ANZEIGE_STATUS = {};     // Name → { haupt, vollbild } (in der Regie)

/* Protokoll der letzten Fenster-Schritte (für die Diagnose), im Browser-Speicher geteilt */
function prot(text) {
  const z = new Date().toTimeString().slice(0, 8) + " " + (ROLLE || "?") + ": " + text;
  try {
    const l = JSON.parse(localStorage.getItem("tafelsystem:protokoll") || "[]");
    l.push(z);
    localStorage.setItem("tafelsystem:protokoll", JSON.stringify(l.slice(-40)));
  } catch (e) { /* ohne Speicher */ }
}
function protokoll() { try { return JSON.parse(localStorage.getItem("tafelsystem:protokoll") || "[]"); } catch (e) { return []; } }

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
      for (const n of ["window-management", "window-placement"]) {
        try { zustand = (await navigator.permissions.query({ name: n })).state; break; } catch (e) { /* anderer Name */ }
      }
      prot("Erlaubnis Fensterverwaltung beim Laden: " + zustand);
      if (zustand !== "granted") { bildschirmHinweis = zustand === "denied" ? "„Fensterverwaltung“ ist für diese Datei blockiert (Schloss links in der Adresszeile)." : null; return; }
    }
    const d = await window.getScreenDetails();
    BILDSCHIRME = d.screens;
    bildschirmHinweis = null;
    prot("Monitore: " + d.screens.map((x, i) => bildschirmName(x, i) + " @" + x.left + "," + x.top).join(" | ") + " · dieses Fenster auf: " + (d.currentScreen && d.currentScreen.label));
    d.addEventListener("screenschange", () => { BILDSCHIRME = d.screens; neuZeichnen(); });
  } catch (e) {
    prot("getScreenDetails Fehler: " + e.name + " " + e.message);
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
/* Board im echten Vollbild: das Hauptfenster geht mit einem Klick im Vollbild auf den Monitor des Boards,
   im selben Moment öffnet sich die Regie als eigenes Fenster auf dem Laptop. (Ein per Skript geöffnetes
   Fenster darf nicht ohne Antippen ins Vollbild, das Hauptfenster schon.) */
function vollbildMoeglich(name) {
  if (ROLLE !== "regie" || REGIE_MODUS !== "fenster" || !BILDSCHIRME || BILDSCHIRME.length < 2) return false;
  return !!bildschirmFinden((geraet().monitor || {})[name]);
}
function anzeigeImVollbildStarten(name) {
  const ziel = bildschirmFinden((geraet().monitor || {})[name]);
  if (!ziel) return false;
  const g = geraet();
  const rm = bildschirmFinden(g.regieMonitor);
  const rp = g.regiePosition;
  const platz = rm ? { left: rm.availLeft, top: rm.availTop, width: rm.availWidth, height: rm.availHeight }
    : rp ? { left: rp.x, top: rp.y, width: rp.w, height: rp.h }
    : { left: screenX, top: screenY, width: outerWidth, height: outerHeight };
  navigator.permissions.query({ name: "window-management" }).then((r) => prot("Erlaubnis beim Klick: " + r.state)).catch(() => {});
  prot("Vollbild-Start " + name + " auf " + (ziel.label || "?") + " @" + ziel.left + "," + ziel.top + " · Klick noch gültig: " + (navigator.userActivation ? navigator.userActivation.isActive : "?"));
  // Reihenfolge ist wichtig: erst Vollbild auf dem anderen Monitor anfordern, dann das Regie-Fenster öffnen (ein Klick reicht für beides)
  const fs = document.documentElement.requestFullscreen({ screen: ziel });
  const w = window.open(location.href.split("#")[0] + "#regie", "tafel-regie",
    `popup,left=${platz.left},top=${platz.top},width=${platz.width},height=${platz.height}`);
  prot("Regie-Fenster: " + (w ? "offen" : "blockiert"));
  if (w) { REGIE_FENSTER = w; partnerVerbinden(w); }
  // Dieses Fenster wird erst Board, wenn das Vollbild auf dem Tafel-Monitor wirklich geklappt hat
  fs.then(async () => {
    await new Promise((r) => setTimeout(r, 300));
    prot("Vollbild angenommen, Fenster jetzt bei " + screenX + "," + screenY + " " + innerWidth + "×" + innerHeight + " · Ziel " + ziel.left + "," + ziel.top + " " + ziel.width + "×" + ziel.height);
    const mitte = screenX + outerWidth / 2;
    if (!(mitte >= ziel.left && mitte < ziel.left + ziel.width)) {
      // Browser hat das Vollbild auf dem eigenen Monitor gemacht (z. B. ohne Erlaubnis „Fensterverwaltung“)
      prot("Vollbild auf falschem Monitor, zurück zur Regie");
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      if (w && !w.closed) w.close();
      REGIE_FENSTER = null;
      alert("Der Browser hat das Vollbild auf diesem Monitor gemacht statt auf „" + (ziel.label || "der Tafel") + "“.\nMeist fehlt die Erlaubnis „Fensterverwaltung“: Schloss-Symbol links in der Adresszeile → Fensterverwaltung → Zulassen, dann die Datei neu laden.\n\nBitte danach „Diagnose“ öffnen und mir den Text schicken.");
      return;
    }
    FUEHREND = !w;            // die Regie im eigenen Fenster holt die Handy-Antworten
    anzeigeStarten(name);
    hauptMelden(name);
  }).catch((e) => {
    prot("Vollbild abgelehnt: " + e.name + " " + e.message);
    if (w && !w.closed) w.close();
    REGIE_FENSTER = null;
    alert("Das Board konnte nicht im Vollbild auf „" + (ziel.label || "dem Tafel-Monitor") + "“ starten.\n(" + e.message + ")\n\nBitte noch einmal auf „Fenster öffnen“ klicken. Hilft das nicht: „Diagnose“ öffnen und mir den Text schicken.");
  });
  return true;
}
/* Hauptfenster als Board: der Regie melden, dass es da ist und ob es im Vollbild ist */
let hauptMeldenLaeuft = false;
function hauptMelden(name) {
  const melden = () => { if (REGIE_FENSTER && !REGIE_FENSTER.closed && ROLLE === "anzeige") {
    try { REGIE_FENSTER.postMessage({ tafelsystem: "da", schluessel: SPEICHER_SCHLUESSEL, name: ANZEIGE_NAME, haupt: true, vollbild: !!document.fullscreenElement }, "*"); } catch (e) { /* zu */ }
  } };
  if (!hauptMeldenLaeuft) {
    hauptMeldenLaeuft = true;
    setInterval(melden, 2000);
    document.addEventListener("fullscreenchange", melden);
  }
  setTimeout(melden, 500);
}
/* Vollbild ohne Berührung verweigert: großer Hinweis, ein Tipp genügt */
function vollbildHinweis(name) {
  if (document.querySelector(".vollbild-hinweis")) return;
  const h = el("div", { class: "vollbild-hinweis" }, el("div", null, el("b", null, "Einmal tippen"), "für Vollbild"));
  h.addEventListener("pointerdown", () => {
    const s = bildschirmFinden((geraet().monitor || {})[name]);
    document.documentElement.requestFullscreen(s ? { screen: s } : undefined).catch(() => {});
    h.remove();
  });
  document.body.append(h);
}
/* Nachrichten an das Hauptfenster (Board im Vollbild) */
addEventListener("message", (e) => {
  const d = e.data;
  if (!d || d.schluessel !== SPEICHER_SCHLUESSEL || ROLLE !== "anzeige" || d.name !== ANZEIGE_NAME) return;
  if (d.tafelsystem === "monitor" || d.tafelsystem === "vollbild") {
    const s = bildschirmFinden((geraet().monitor || {})[ANZEIGE_NAME]);
    document.documentElement.requestFullscreen(s ? { screen: s } : undefined).catch(() => vollbildHinweis(ANZEIGE_NAME));
  } else if (d.tafelsystem === "beenden" && !window.opener) {
    // Board beenden: Vollbild aus, Regie-Fenster zu, dieses Fenster ist wieder die Regie
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (REGIE_FENSTER && !REGIE_FENSTER.closed) REGIE_FENSTER.close();
    REGIE_FENSTER = null;
    FUEHREND = true;
    regieStarten("fenster");
  }
});
function anHauptfenster(name, typ) {
  const w = FENSTER[name];
  if (w && !w.closed) w.postMessage({ tafelsystem: typ, schluessel: SPEICHER_SCHLUESSEL, name }, "*");
}
/* in der Regie neben dem Board: Lage des Regie-Fensters merken */
function regieLageMerken() {
  setInterval(() => {
    if (ROLLE !== "regie" || REGIE_MODUS !== "popup" || geraet().regieMonitor) return;
    geraetAendern((g) => { g.regiePosition = { x: screenX, y: screenY, w: outerWidth, h: outerHeight }; });
  }, 5000);
}

/* Monitore direkt beim Klick abfragen: bei Dateien vom eigenen Rechner merkt sich Chrome die Erlaubnis
   „Fensterverwaltung“ nicht immer, dann fragt der Browser hier noch einmal nach. */
async function monitoreSicherstellen() {
  if (BILDSCHIRME || !("getScreenDetails" in window)) return;
  if (!Object.keys(geraet().monitor || {}).length && !geraet().regieMonitor) return;
  await bildschirmeLaden(true);
}

async function fensterOeffnen(name) {
  if (!BILDSCHIRME && (geraet().monitor || {})[name] && "getScreenDetails" in window) {
    await bildschirmeLaden(true);
    if (BILDSCHIRME && name === alleAnzeigen()[0] && vollbildMoeglich(name) && !(navigator.userActivation && navigator.userActivation.isActive)) {
      prot("Monitore erst jetzt geladen, Klick verbraucht: um zweiten Klick bitten");
      alert("Monitore erkannt. Bitte jetzt noch einmal auf „Fenster öffnen“ klicken.");
      return true;
    }
  }
  prot("Öffnen " + name + ": Monitore " + (BILDSCHIRME ? BILDSCHIRME.length : "unbekannt") + ", zugeordnet " + JSON.stringify((geraet().monitor || {})[name] || null) + ", gefunden " + !!bildschirmFinden((geraet().monitor || {})[name]) + ", Vollbild-Weg " + vollbildMoeglich(name));
  if (ANZEIGE_STATUS[name] && ANZEIGE_STATUS[name].haupt && fensterOffen(name)) { anHauptfenster(name, "vollbild"); return true; }
  if (fensterOffen(name)) { fensterPlatzieren(name); FENSTER[name].focus(); return true; }
  if (name === alleAnzeigen()[0] && vollbildMoeglich(name)) return anzeigeImVollbildStarten(name);
  if ((geraet().monitor || {})[name] && !BILDSCHIRME) await bildschirmeLaden(true);
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
  if (ANZEIGE_STATUS[name] && ANZEIGE_STATUS[name].haupt) { anHauptfenster(name, "monitor"); return; }
  const w = FENSTER[name], p = platzFuer(name);
  if (!w || w.closed || !p) return;
  try { w.moveTo(p.left, p.top); w.resizeTo(p.width, p.height); } catch (e) { /* nicht erlaubt */ }
}
function fensterSchliessen(name) {
  if (ANZEIGE_STATUS[name] && ANZEIGE_STATUS[name].haupt) {   // Board im Hauptfenster: dort wird es wieder zur Regie
    anHauptfenster(name, "beenden");
    delete FENSTER[name]; delete ANZEIGE_STATUS[name];
    return;
  }
  const w = FENSTER[name];
  if (w && !w.closed) { try { w.postMessage({ tafelsystem: "schliessen", schluessel: SPEICHER_SCHLUESSEL }, "*"); w.close(); } catch (e) { /* schon zu */ } }
  delete FENSTER[name];
  setTimeout(neuZeichnen, 200);
}
async function alleFensterOeffnen() {
  let blockiert = 0;
  const namen = alleAnzeigen();
  // zuerst die weiteren Fenster (solange dieses Fenster noch die Regie ist), das Board zuletzt im Vollbild
  for (const n of namen.slice(1)) if (!fensterOffen(n) && !(await fensterOeffnen(n))) blockiert++;
  if (!fensterOffen(namen[0]) && !(await fensterOeffnen(namen[0]))) blockiert++;
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
  if ((geraet().monitor || {})[name]) return;   // Monitor festgelegt: die Zuordnung gilt, nicht die letzte Position
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
    const st = ANZEIGE_STATUS[name] || {};
    const art = offen ? (st.haupt ? (st.vollbild ? "Vollbild" : "kein Vollbild") : "Fenster")
      : name === alleAnzeigen()[0] && vollbildMoeglich(name) ? "öffnet im Vollbild auf " + (gefunden.label || "dem Monitor")
      : fp && !BILDSCHIRME ? "Monitore beim Öffnen abfragen"
      : fp && !gefunden ? "festgelegter Monitor nicht angeschlossen"
      : "";
    return el("div", { class: "fenster-zeile" },
      el("span", { class: "fenster-status" + (offen ? " offen" : ""), title: offen ? "offen" : "zu" }, offen ? "●" : "○"),
      el("span", { class: "fenster-name" }, name, el("span", { class: "naechster" }, (zusatz ? " · " + zusatz.ansicht : "") + (art ? " · " + art : ""))),
      auswahl,
      offen ? el("button", { class: "knopf klein", onclick: () => fensterSchliessen(name) }, st.haupt ? "Beenden" : "Schließen")
        : el("button", { class: "knopf klein haupt", onclick: async () => { if (!(await fensterOeffnen(name))) alert("Fenster blockiert: Pop-ups für diese Datei erlauben."); } }, "Öffnen"),
      offen && st.haupt && !st.vollbild ? el("button", { class: "knopf klein", onclick: () => anHauptfenster(name, "vollbild") }, "Vollbild")
        : offen && (st.haupt || platzFuer(name)) ? el("button", { class: "knopf klein", title: "auf den festgelegten Monitor schieben", onclick: () => fensterPlatzieren(name) }, "Platzieren") : null,
      zusatz ? el("button", { class: "knopf klein", title: "Fenster aus der Liste nehmen", onclick: () => { fensterSchliessen(name); geraetAendern((gg) => { gg.zusatz = (gg.zusatz || []).filter((z) => z.name !== name); }); neuZeichnen(); } }, "Entfernen") : null);
  });
  const regieFp = g.regieMonitor;
  const regieZeile = BILDSCHIRME && BILDSCHIRME.length > 1 ? el("div", { class: "fenster-zeile" },
    el("span", { class: "fenster-status offen" }, "●"),
    el("span", { class: "fenster-name" }, "Regie", el("span", { class: "naechster" }, " · dieses Fenster")),
    el("select", { class: "knopf klein", onchange: (e) => { const i = e.target.value; geraetAendern((gg) => { if (i === "") delete gg.regieMonitor; else gg.regieMonitor = fingerabdruck(BILDSCHIRME[+i]); }); neuZeichnen(); } },
      el("option", { value: "" }, "Monitor: wo das Fenster gerade ist"),
      BILDSCHIRME.map((s, i) => el("option", { value: i, selected: bildschirmFinden(regieFp) === s }, bildschirmName(s, i))))) : null;
  return el("div", { class: "karte" },
    el("h2", null, "Fenster und Monitore"),
    zeilen,
    regieZeile,
    el("div", { class: "zeile", style: "margin-top:8px" },
      BILDSCHIRME ? el("span", { class: "naechster" }, BILDSCHIRME.length + " Monitore erkannt")
        : el("button", { class: "knopf klein", onclick: () => bildschirmeLaden(true) }, "Monitore erkennen"),
      el("button", { class: "knopf klein", onclick: zusatzFensterAnlegen }, "+ Fenster"),
      el("button", { class: "knopf klein", onclick: diagnoseZeigen }, "Diagnose"),
      el("label", { class: "naechster", style: "display:inline-flex;gap:4px;align-items:center" },
        el("input", { type: "checkbox", checked: g.autoStart !== false, onchange: (e) => geraetAendern((gg) => { gg.autoStart = e.target.checked; }) }),
        "beim Stundenstart öffnen")),
    location.protocol === "file:" ? el("p", { class: "hinweis-kasten" }, el("b", null, "Monitore zuordnen und Vollbild auf der Tafel "), "gehen in Edge nicht, wenn die Datei direkt geöffnet ist. Bitte über „Tafel starten“ im Fachordner öffnen (Adresse beginnt dann mit http://localhost).") : null,
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

/* Diagnose: alles, was zum Fehlersuchen nötig ist, zum Kopieren */
async function diagnoseZeigen() {
  let erlaubnis = "?";
  for (const n of ["window-management", "window-placement"]) { try { erlaubnis = (await navigator.permissions.query({ name: n })).state; break; } catch (e) { /* anderer Name */ } }
  const text = [
    "Browser: " + navigator.userAgent,
    "Adresse: " + location.protocol + " · Rolle: " + ROLLE + " / " + REGIE_MODUS,
    "Fensterverwaltung: " + ("getScreenDetails" in window ? "vorhanden" : "fehlt") + " · Erlaubnis: " + erlaubnis,
    "Bildschirm dieses Fensters: " + screen.width + "×" + screen.height + " · Fenster bei " + screenX + "," + screenY,
    "Monitore: " + (BILDSCHIRME ? BILDSCHIRME.map((x, i) => bildschirmName(x, i) + " @" + x.left + "," + x.top).join(" | ") : "nicht geladen"),
    "Zuordnung: " + JSON.stringify(geraet().monitor || {}) + " · Regie: " + JSON.stringify(geraet().regieMonitor || null),
    "Board-Weg: " + (vollbildMoeglich(alleAnzeigen()[0]) ? "Vollbild im Hauptfenster" : "eigenes Fenster"),
    "Fenster: " + JSON.stringify(Object.fromEntries(alleAnzeigen().map((n) => [n, { offen: fensterOffen(n), ...(ANZEIGE_STATUS[n] || {}) }]))),
    "",
    "Protokoll:",
    ...protokoll(),
  ].join("\n");
  const feld = el("textarea", { readonly: true, style: "width:100%;height:340px;font:12px Consolas,monospace" });
  feld.value = text;
  const box = el("div", { class: "schublade", onclick: (e) => { if (e.target === box) box.remove(); } },
    el("div", { class: "regie-huelle", style: "padding:16px;height:auto;max-height:100%" },
      el("h2", { style: "margin-top:0" }, "Diagnose Fenster und Monitore"),
      feld,
      el("div", { class: "zeile", style: "margin-top:8px" },
        el("button", { class: "knopf haupt", onclick: () => { feld.select(); try { navigator.clipboard.writeText(text); } catch (e) { document.execCommand("copy"); } } }, "Kopieren"),
        el("button", { class: "knopf", onclick: () => box.remove() }, "Schließen"))));
  document.body.append(box);
}
