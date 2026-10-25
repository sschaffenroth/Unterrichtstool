/* Anzeige: zeichnet, was eine physische Anzeige (Board, Beamer …) gerade zeigen soll.
   Ansichten: tafel, auftrag, geteilt, extern, schwarz. Dieselbe Funktion zeichnet auch die
   Vorschau in der Regie (rolle "vorschau"). */
"use strict";

function ansichtVon(name, s = schritt()) {
  return Z.ansicht[name] || (s.zeige && s.zeige[name]) || (STUNDE.anzeigen && STUNDE.anzeigen[name]) || zusatzAnsicht(name) || "geteilt";
}

function stundenkarte(s) {
  return el("div", { class: "stundenkarte" },
    el("div", { class: "fach" }, STUNDE.stunde.fach + ", " + (STUNDE.stunde.klasse || "")),
    el("h1", null, STUNDE.stunde.titel),
    s && s.titel ? el("p", null, s.titel) : null);
}

function tafelTeil(s, rolle) {
  const reiter = s.tafel.reiter;
  const index = Math.min(Z.reiter[s.id] || 0, reiter.length - 1);
  const b = reiter[index];
  const ctx = { schritt: s, schluessel: s.id + ":" + index, rolle };
  const fn = BAUSTEINE[b.baustein];
  let inhalt;
  try { inhalt = fn ? fn(b, ctx) : platzhalter(b); }
  catch (e) { console.error(e); inhalt = platzhalter(b, "Fehler beim Zeichnen: " + e.message); }
  return el("div", { class: "teil" },
    reiter.length > 1 ? el("div", { class: "reiterleiste" }, reiter.map((r, i) =>
      el("button", { class: i === index ? "aktiv" : "", onclick: () => tun("reiter", { id: s.id, index: i }) }, ein(r.titel || "Teil " + (i + 1))))) : null,
    el("div", { class: "reiterinhalt" }, inhalt));
}

function ablaufleiste(s) {
  const abschnitte = [];
  for (const i of aktiveIndizes()) {
    const a = SCHRITTE[i].abschnitt;
    if (a && !abschnitte.includes(a)) abschnitte.push(a);
  }
  const iAkt = abschnitte.indexOf(s.abschnitt);
  return el("div", { class: "ablaufleiste" },
    abschnitte.map((a, i) => el("span", { class: "abschnitt" + (i === iAkt ? " aktiv" : i < iAkt ? " erledigt" : "") }, ein(a))),
    el("span", { class: "titel-klein" }, STUNDE.stunde.fach + ": " + ein(STUNDE.stunde.titel)));
}

function anzeigeInhalt(name, rolle) {
  const s = schritt();
  const ansicht = ansichtVon(name, s);
  const buehne = el("div", { class: "buehne" });
  if (ansicht === "schwarz") { buehne.classList.add("schwarz"); return buehne; }
  if (ansicht === "extern") {
    buehne.classList.add("extern");
    buehne.append(el("div", { class: "extern-hinweis" }, el("b", null, "Fremder Eingang"), "Eingang am Board umschalten", el("br"), ein(s.titel)));
    return buehne;
  }
  if (STUNDE.ablaufleiste) buehne.append(ablaufleiste(s));
  const hatT = !!s.tafel, hatA = !!s.auftrag;
  const auftragTeil = (voll) => el("div", { class: "teil" }, BAUSTEINE.auftrag(s.auftrag, { schritt: s, voll }));
  const flaeche = el("div", { class: "flaeche" });
  if (ansicht === "geteilt" && hatT && hatA) {
    flaeche.classList.add("geteilt");
    flaeche.append(tafelTeil(s, rolle), auftragTeil(false));
  } else if ((ansicht === "auftrag" && hatA) || (!hatT && hatA)) {
    flaeche.append(auftragTeil(true));
  } else if (hatT && ansicht !== "auftrag") {
    flaeche.append(tafelTeil(s, rolle));
  } else {
    flaeche.append(el("div", { class: "teil" }, stundenkarte(s)));
  }
  if (Z.overlay && Z.overlay.anmelden && Z.raum) {
    flaeche.append(el("div", { class: "overlay" },
      el("button", { class: "schliessen", onclick: () => tun("overlay", { wert: null }) }, "Schließen"),
      el("div", { class: "baustein", style: "justify-content:center;align-items:center" }, mitmachenKasten(s.schueler ? s : null, true))));
  } else if (Z.overlay && Z.overlay.von && ansicht !== "auftrag") {
    flaeche.append(el("div", { class: "overlay" },
      el("button", { class: "schliessen", onclick: () => tun("overlay", { wert: null }) }, "Schließen"),
      el("div", { class: "baustein b-ergebnis" }, Z.overlay.von.map((id) => ergebnisBlock(id, Z.overlay.loesung)))));
  }
  buehne.append(flaeche);
  return buehne;
}

/* Bühne in einen Rahmen einpassen: 1em = 1 % der Breite, höchstens so groß, dass 16:9 passt */
function einpassen(buehne, breite, hoehe) {
  buehne.style.width = breite + "px";
  buehne.style.height = hoehe + "px";
  buehne.style.fontSize = Math.min(breite / 100, hoehe / 56.25) + "px";
}

function anzeigeSchluessel(name) {
  return JSON.stringify([name, Z.schritt, Z.reiter, Z.ansicht, Z.marken, Z.codeteil, Z.stimmen, Z.striche, Z.overlay, Z.aktiv, Z.countdown && Z.countdown.id, Z.raum && Z.raum.code, Z.freigabe, Z.online]);
}

/* Vollbild-Anzeige (eigenes Fenster oder dieses Fenster). Kann mehrmals aufgerufen werden:
   das Hauptfenster wechselt zwischen Regie und Board. */
let anzeigeRahmen = null, anzeigeBuehne = null, anzeigeLetzter = "", anzeigeEingerichtet = false;

function anzeigeStarten(name) {
  ROLLE = "anzeige";
  ANZEIGE_NAME = name;
  document.title = name + ": " + ein(STUNDE.stunde.titel);
  document.body.classList.remove("regie-seite");
  anzeigeRahmen = el("div", { class: "rahmen" });
  anzeigeLetzter = "";
  document.getElementById("app").replaceChildren(anzeigeRahmen);
  if (!anzeigeEingerichtet) {
    anzeigeEingerichtet = true;
    beobachten(() => { if (ROLLE === "anzeige") anzeigeZeichnen(); });
    addEventListener("resize", () => { if (ROLLE === "anzeige") anzeigeZeichnen(); });
    setInterval(() => { if (ROLLE === "anzeige") countdownsAktualisieren(anzeigeRahmen); }, 250);
  }
  anzeigeZeichnen(true);
}

function anzeigeZeichnen(erzwingen) {
  const name = ANZEIGE_NAME;
  const k = anzeigeSchluessel(name) + innerWidth + "x" + innerHeight;
  if (k !== anzeigeLetzter || erzwingen || !anzeigeBuehne) {
    anzeigeLetzter = k;
    const alt = anzeigeBuehne;
    anzeigeBuehne = anzeigeInhalt(name, "anzeige");
    anzeigeBuehne.append(el("div", { class: "eckknoepfe" },
      el("button", { title: "Zurück (←)", onclick: () => tun("zurueck") }, "‹"),
      el("button", { title: "Weiter (→)", onclick: () => tun("weiter") }, "›"),
      el("button", { title: "Vollbild (F)", onclick: vollbild }, "⛶"),
      el("button", { title: "Diese Ansicht als PNG sichern (S)", onclick: () => ansichtSichern(name) }, "📷"),
      el("button", { title: "Regie (R)", onclick: () => regieSchublade(name) }, "☰")));
    // nur die Bühne tauschen: die Ebene mit eingebetteten Seiten bleibt im Dokument (sonst laden sie neu)
    if (alt && alt.parentNode === anzeigeRahmen) alt.replaceWith(anzeigeBuehne);
    else anzeigeRahmen.prepend(anzeigeBuehne);
    if (einbettEbene.parentNode !== anzeigeRahmen) anzeigeRahmen.append(einbettEbene);
  }
  einpassen(anzeigeBuehne, innerWidth, innerHeight);
  countdownsAktualisieren(anzeigeRahmen);
  requestAnimationFrame(einbettungenLegen);
}

/* Eingebettete Seiten liegen in einer eigenen Ebene über der Bühne und bleiben erhalten,
   solange die Stunde läuft. Sie werden über ihren Platzhalter gelegt oder versteckt. */
const einbettEbene = el("div", { class: "einbett-ebene" });
const EINBETTUNGEN = {};
function einbettBaustein(schluessel) {
  const [id, i] = schluessel.split(":");
  const s = schrittNachId(id);
  return s && s.tafel ? s.tafel.reiter[+i] : null;
}
function einbettungenLegen() {
  if (ROLLE !== "anzeige" || !anzeigeBuehne) return;
  const platz = Z.overlay ? null : anzeigeBuehne.querySelector("[data-einbetten]");   // Ergebnis oder QR liegen obendrauf
  const ziel = platz ? platz.getAttribute("data-einbetten") : null;
  if (ziel && !EINBETTUNGEN[ziel]) {
    const b = einbettBaustein(ziel);
    if (b) {
      const f = el("iframe", { class: "einbettung", title: b.name || "Eingebettete Seite", allow: "fullscreen; clipboard-write" });
      const basis = b.basis ? '<base href="' + new URL(b.basis, location.href).href + '">' : "";
      f.srcdoc = basis + (b.html_einbettung || "");
      EINBETTUNGEN[ziel] = f;
      einbettEbene.append(f);
    }
  }
  const r = platz ? platz.getBoundingClientRect() : null;
  const rr = anzeigeRahmen.getBoundingClientRect();
  for (const [k, f] of Object.entries(EINBETTUNGEN)) {
    if (k === ziel && r) {
      Object.assign(f.style, { display: "block", left: r.left - rr.left + "px", top: r.top - rr.top + "px", width: r.width + "px", height: r.height + "px" });
    } else {
      f.style.display = "none";
    }
  }
}
addEventListener("resize", () => requestAnimationFrame(einbettungenLegen));

function vollbild() {
  if (document.fullscreenElement) { document.exitFullscreen(); return; }
  const s = ROLLE === "anzeige" ? bildschirmFinden((geraet().monitor || {})[ANZEIGE_NAME]) : null;
  document.documentElement.requestFullscreen(s ? { screen: s } : undefined).catch(() => {});
}

/* eine Tastenbelegung für beide Rollen */
function tastenEinrichten() {
  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select")) return;
    const name = ROLLE === "anzeige" ? ANZEIGE_NAME : null;
    const k = e.key;
    if (["ArrowRight", "PageDown", " "].includes(k)) { e.preventDefault(); tun("weiter"); }
    else if (["ArrowLeft", "PageUp"].includes(k)) { e.preventDefault(); tun("zurueck"); }
    else if (k === "b" || k === "B" || k === ".") tun("ansicht", { anzeige: name || alleAnzeigen()[0], wert: ansichtVon(name || alleAnzeigen()[0]) === "schwarz" ? null : "schwarz" });
    else if (k === "f" || k === "F") vollbild();
    else if (k === "s" || k === "S") ansichtSichern(name || alleAnzeigen()[0]);
    else if ((k === "r" || k === "R") && name) regieSchublade(name);
    else if (k === "Escape") { const s = document.querySelector(".schublade"); if (s) s.remove(); }
  });
}
