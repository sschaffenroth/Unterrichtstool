/* Anzeige: zeichnet, was eine physische Anzeige (Board, Beamer …) gerade zeigen soll.
   Ansichten: tafel, auftrag, geteilt, extern, schwarz. Dieselbe Funktion zeichnet auch die
   Vorschau in der Regie (rolle "vorschau"). */
"use strict";

function ansichtVon(name, s = schritt()) {
  return Z.ansicht[name] || (s.zeige && s.zeige[name]) || (STUNDE.anzeigen && STUNDE.anzeigen[name]) || "geteilt";
}

function stundenkarte(s) {
  return el("div", { class: "stundenkarte" },
    el("div", { class: "fach" }, STUNDE.stunde.fach + " · " + (STUNDE.stunde.klasse || "")),
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
      el("button", { class: i === index ? "aktiv" : "", onclick: () => tun("reiter", { id: s.id, index: i }) }, r.titel || "Teil " + (i + 1)))) : null,
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
    abschnitte.map((a, i) => el("span", { class: "abschnitt" + (i === iAkt ? " aktiv" : i < iAkt ? " erledigt" : "") }, a)),
    el("span", { class: "titel-klein" }, STUNDE.stunde.fach + " · " + STUNDE.stunde.titel));
}

function anzeigeInhalt(name, rolle) {
  const s = schritt();
  const ansicht = ansichtVon(name, s);
  const buehne = el("div", { class: "buehne" });
  if (ansicht === "schwarz") { buehne.classList.add("schwarz"); return buehne; }
  if (ansicht === "extern") {
    buehne.classList.add("extern");
    buehne.append(el("div", { class: "extern-hinweis" }, el("b", null, "Fremder Eingang"), "Eingang am Board umschalten · " + s.titel));
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
  if (Z.overlay && ansicht !== "auftrag") {
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
  return JSON.stringify([name, Z.schritt, Z.reiter, Z.ansicht, Z.marken, Z.codeteil, Z.stimmen, Z.striche, Z.overlay, Z.aktiv, Z.countdown && Z.countdown.id]);
}

/* Vollbild-Anzeige (eigenes Fenster oder dieses Fenster) */
function anzeigeStarten(name) {
  document.title = name + " · " + STUNDE.stunde.titel;
  const rahmen = el("div", { class: "rahmen" });
  document.getElementById("app").replaceChildren(rahmen);
  let letzter = "";
  let buehne = null;
  const eck = () => el("div", { class: "eckknoepfe" },
    el("button", { title: "Zurück (←)", onclick: () => tun("zurueck") }, "‹"),
    el("button", { title: "Weiter (→)", onclick: () => tun("weiter") }, "›"),
    el("button", { title: "Vollbild (F)", onclick: vollbild }, "⛶"),
    el("button", { title: "Regie (R)", onclick: () => regieSchublade(name) }, "☰"));

  function zeichnen(erzwingen) {
    const k = anzeigeSchluessel(name) + innerWidth + "x" + innerHeight;
    if (k !== letzter || erzwingen) {
      letzter = k;
      buehne = anzeigeInhalt(name, "anzeige");
      buehne.append(eck());
      rahmen.replaceChildren(buehne);
    }
    einpassen(buehne, innerWidth, innerHeight);
    countdownsAktualisieren(rahmen);
  }
  beobachten(() => zeichnen());
  addEventListener("resize", () => zeichnen());
  setInterval(() => countdownsAktualisieren(rahmen), 250);
  tastenBelegen(name);
  zeichnen(true);
}

function vollbild() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}

function tastenBelegen(name) {
  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    const k = e.key;
    if (["ArrowRight", "PageDown", " "].includes(k)) { e.preventDefault(); tun("weiter"); }
    else if (["ArrowLeft", "PageUp"].includes(k)) { e.preventDefault(); tun("zurueck"); }
    else if (k === "b" || k === "B" || k === ".") tun("ansicht", { anzeige: name || ANZEIGEN[0], wert: ansichtVon(name || ANZEIGEN[0]) === "schwarz" ? null : "schwarz" });
    else if (k === "f" || k === "F") vollbild();
    else if ((k === "r" || k === "R") && name) regieSchublade(name);
    else if (k === "Escape") { const s = document.querySelector(".schublade"); if (s) s.remove(); }
  });
}
