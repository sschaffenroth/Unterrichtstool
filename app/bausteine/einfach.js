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

BAUSTEINE.folie = (b) => el("div", { class: "baustein b-folie" }, el("div", { class: "inhalt", html: b.html || "" }));

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
