/* Bausteine ohne eigenes Verhalten: titel, bild, folie, qr, schwarz, uhr, Platzhalter. */
"use strict";

const BAUSTEINE = {};

BAUSTEINE.titel = (b) =>
  el("div", { class: "baustein b-titel" }, el("h1", null, b.text || ""), b.untertitel ? el("p", null, b.untertitel) : null);

BAUSTEINE.bild = (b) => {
  const mitSchleier = b.schleier !== undefined ? !!b.schleier : !!b.frage;
  const band = b.frage || b.untertitel
    ? el("div", { class: "band" }, b.frage ? el("div", { class: "z1" }, b.frage) : null, b.untertitel ? el("div", { class: "z2" }, b.untertitel) : null)
    : null;
  return el("div", { class: "baustein b-bild" + (mitSchleier && band ? " schleier" : "") },
    el("div", { class: "bildflaeche" }, el("img", { src: BILDER[b.bild_id] || "", alt: b.alt || "", draggable: "false" })),
    band);
};

/* Schrift so groß wie möglich, bis der Inhalt die Hülle füllt (zwischen minEm und maxEm, in em der Bühne) */
function schriftEinpassen(huelle, inhalt, minEm, maxEm) {
  const passen = () => {
    if (!huelle.isConnected || !huelle.clientHeight) return;
    const stil = getComputedStyle(huelle);
    const hoehe = huelle.clientHeight - parseFloat(stil.paddingTop) - parseFloat(stil.paddingBottom);
    const breite = huelle.clientWidth - parseFloat(stil.paddingLeft) - parseFloat(stil.paddingRight);
    let lo = minEm, hi = maxEm;
    for (let i = 0; i < 14; i++) {
      const mitte = (lo + hi) / 2;
      inhalt.style.fontSize = mitte + "em";
      if (inhalt.scrollHeight <= hoehe + 1 && inhalt.scrollWidth <= breite + 1) lo = mitte; else hi = mitte;
    }
    inhalt.style.fontSize = lo + "em";
  };
  requestAnimationFrame(passen);
  try { new ResizeObserver(passen).observe(huelle); } catch (e) { /* ältere Browser */ }
}

/* folie: Markdown-Text. Schrift passt sich der Textmenge an.
   aufdecken: true  Absätze (und Listenpunkte) nacheinander zeigen: Tipp auf die Folie oder Regie */
BAUSTEINE.folie = (b, ctx) => {
  const inhalt = el("div", { class: "inhalt", html: b.html || "" });
  const huelle = el("div", { class: "baustein b-folie" }, inhalt);
  if (b.aufdecken) {
    const teile = [...inhalt.querySelectorAll(":scope > p, :scope > h2, :scope > ul > li, :scope > ol > li")];
    const n = Math.max(1, Z.marken[ctx.schluessel] || 1);
    teile.forEach((t, i) => t.classList.toggle("verdeckt", i >= n));
    huelle.classList.add("aufdecken");
    if (ctx.rolle !== "vorschau") huelle.addEventListener("click", () => tun("marke", { schluessel: ctx.schluessel, anzahl: n < teile.length ? n + 1 : 1 }));
  }
  schriftEinpassen(huelle, inhalt, 1.9, b.groesse === "normal" ? 1.9 : 5);
  return huelle;
};

/* einbetten: vorhandene HTML-Datei (z. B. eine Tafel-App) als Reiter. Läuft nur auf der Anzeige in einem
   dauerhaften Rahmen, damit ihr Zustand beim Weiterschalten der Regie nicht verloren geht. */
BAUSTEINE.einbetten = (b, ctx) => {
  if (ctx.rolle === "vorschau") {
    return el("div", { class: "baustein b-platzhalter" }, el("div", null, el("b", null, b.name || "Eingebettete Seite"), el("p", null, "läuft auf der Anzeige")));
  }
  return el("div", { class: "baustein b-einbetten", "data-einbetten": ctx.schluessel });
};

BAUSTEINE.qr = (b) =>
  el("div", { class: "baustein b-qr" },
    el("div", { class: "qr", html: b.svg || "" }),
    el("div", { class: "text" }, b.text || "", el("div", { class: "url" }, b.url || "")));

BAUSTEINE.schwarz = () => el("div", { class: "baustein", style: "background:#000" });

BAUSTEINE.uhr = (b, ctx) => {
  const e = el("div", { class: "baustein b-titel", style: "align-items:center" },
    el("h1", { "data-countdown": ctx.schritt.id, style: "font-size:12em;font-variant-numeric:tabular-nums" }, ""));
  return e;
};

function platzhalter(b, grund) {
  return el("div", { class: "baustein b-platzhalter" },
    el("div", null,
      el("b", null, "Baustein „" + (b.name || b.baustein) + "“"),
      el("p", null, grund || "Noch nicht umgesetzt. Bitte die bisherige Lösung verwenden."),
      b.beschreibung ? el("p", null, b.beschreibung) : null));
}
