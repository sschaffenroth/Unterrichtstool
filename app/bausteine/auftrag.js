/* Baustein auftrag: Piktogramm + Sozialform, Countdown, ein Satz, Material mit QR, Abgabe.
   Zwei Formen: als schmale Leiste neben der Tafel (geteilt) und als volle Ansicht. */
"use strict";

const SOZIALFORM = {
  EA: { wort: "Einzelarbeit", personen: 1 },
  PA: { wort: "Partnerarbeit", personen: 2 },
  GA: { wort: "Gruppenarbeit", personen: 3 },
  Plenum: { wort: "Plenum", personen: 0 },
};

function piktogramm(form) {
  const f = SOZIALFORM[form] || SOZIALFORM.EA;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 60 60");
  svg.setAttribute("class", "pikto");
  const teil = (tag, a) => { const e = document.createElementNS(ns, tag); for (const k in a) e.setAttribute(k, a[k]); svg.append(e); };
  teil("circle", { cx: 30, cy: 30, r: 29, fill: "#e8730c" });
  const person = (x, y, s) => {
    teil("circle", { cx: x, cy: y, r: 5 * s, fill: "#fff" });
    teil("path", { d: `M${x - 9 * s} ${y + 19 * s} q0 -11 ${9 * s} -11 q${9 * s} 0 ${9 * s} 11 z`, fill: "#fff" });
  };
  if (f.personen === 1) person(30, 22, 1.3);
  else if (f.personen === 2) { person(20, 24, 1.05); person(40, 24, 1.05); }
  else if (f.personen === 3) { person(17, 27, 0.85); person(43, 27, 0.85); person(30, 19, 0.95); }
  else { teil("rect", { x: 16, y: 11, width: 28, height: 13, rx: 2, fill: "#fff" }); person(17, 36, 0.7); person(30, 36, 0.7); person(43, 36, 0.7); }
  return svg;
}

BAUSTEINE.auftrag = (b, ctx) => {
  const ap = b.phasen && b.phasen.length ? auftragPhase(ctx.schritt) : null;
  const form = ap ? ap.phasen[ap.stand.i].sozialform : b.sozialform;
  const f = SOZIALFORM[form] || { wort: form || "" };
  const material = (b.material || []).map((m) =>
    el("div", { class: "material-eintrag" },
      m.svg ? el("div", { class: "qr", html: m.svg }) : null,
      el("div", null,
        el("div", { class: "m-text" }, m.text),
        m.ort ? el("div", { class: "m-ort" }, m.ort) : null,
        m.datei ? el("div", { class: "m-datei" }, m.datei) : null)));
  // mit Phasen zählt der Countdown die aktuelle Phase herunter
  const uhr = ap ? el("div", { class: "countdown", "data-rest": "auftragphase" }, "") : b.dauer_min ? el("div", { class: "countdown", "data-countdown": ctx.schritt.id }, "") : null;
  const rollen = b.rollenwechsel_min && Z.methoden.rollen ? el("div", { class: "rollen-hinweis" },
    (Z.methoden.rollen.namen || ["Fahrer", "Navigator"]).join(" und ") + " tauschen alle " + b.rollenwechsel_min + " min", el("br"),
    "nächster Wechsel in ", el("b", { "data-rest": "rollen" }, "")) : null;
  return el("div", { class: "auftrag" + (ctx.voll ? " voll" : "") },
    el("div", { class: "kopf" },
      piktogramm(form),
      el("div", null, el("div", { class: "sozialform" }, f.wort),
        ap ? el("div", { class: "dauer" }, "Phase " + (ap.stand.i + 1) + " von " + ap.phasen.length) : b.dauer_min ? el("div", { class: "dauer" }, b.dauer_min + " Minuten") : null),
      ctx.voll ? uhr : null),
    !ctx.voll ? uhr : null,
    ap ? el("div", { class: "auftrag-phasen" }, ap.phasen.map((p, i) => el("div", { class: "phase" + (i === ap.stand.i ? " aktiv" : i < ap.stand.i ? " erledigt" : "") },
      el("b", null, (SOZIALFORM[p.sozialform] || { wort: p.sozialform }).wort), " " + p.min + " min", p.text && i === ap.stand.i ? el("div", null, p.text) : null))) : null,
    el("div", { class: "text" }, b.text || ""),
    rollen,
    ctx.schritt.schueler ? mitmachenKasten(ctx.schritt, false) : null,
    material.length ? el("div", { class: "material" }, material) : null,
    b.abgabe ? el("div", { class: "abgabe" }, el("b", null, "Abgabe: "), b.abgabe) : null);
};

/* Countdown-Felder laufend aktualisieren (ohne neu zu zeichnen) */
function countdownsAktualisieren(wurzel) {
  for (const e of wurzel.querySelectorAll("[data-countdown]")) {
    const c = Z.countdown;
    if (!c || c.id !== e.getAttribute("data-countdown")) { e.textContent = ""; continue; }
    const rest = countdownRest();
    e.textContent = rest > 0 ? formatMinSek(rest) : "0:00";
    e.classList.toggle("ende", rest <= 0);
    e.classList.toggle("pause", !c.seit && rest > 0);
  }
  methodenUhren(wurzel);
}
