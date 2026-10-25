/* Baustein code: Code wie im Editor (Zeilennummern, Syntaxfarben aus dem Bauskript, mindestens 20 pt).
   Marken: Antippen öffnet die Erklärung neben der Zeile, Marken der Reihe nach.
   Lange Programme über `ansichten` in Teile geteilt, nie verkleinert.
   Noch nicht umgesetzt: fehler, probelauf, nebeneinander (Bauskript warnt). */
"use strict";

BAUSTEINE.code = (b, ctx) => {
  const schluessel = ctx.schluessel;
  const zeilen = b.zeilen_html || [];
  const teile = b.ansichten && b.ansichten.length ? b.ansichten : [[1, zeilen.length]];
  const teil = Math.min(Z.codeteil[schluessel] || 0, teile.length - 1);
  const [von, bis] = teile[teil];
  const marken = b.marken || [];
  const offen = Z.marken[schluessel] || 0;

  const raster = el("div", { class: "code-raster" });
  for (let nr = von; nr <= bis; nr++) {
    const mIndex = marken.findIndex((m) => m.zeile === nr);
    const m = marken[mIndex];
    const istOffen = mIndex >= 0 && mIndex < offen;
    raster.append(
      el("span", { class: "nr" }, nr),
      el("span", { class: "codezeile" + (istOffen ? " markiert" : ""), html: zeilen[nr - 1] || " " }),
      m ? el("button", {
        class: "marke" + (istOffen ? " offen" : ""),
        onclick: () => tun("marke", { schluessel, anzahl: istOffen ? mIndex : mIndex + 1 }),
      }, m.label || "●") : el("span"),
      istOffen && m.einblenden ? el("span", { class: "erklaerung" }, m.einblenden) : el("span"));
  }
  return el("div", { class: "baustein b-code" },
    teile.length > 1 ? el("div", { class: "teile" }, teile.map((t, i) =>
      el("button", { class: i === teil ? "aktiv" : "", onclick: () => tun("codeteil", { schluessel, teil: i }) }, "Zeilen " + t[0] + "–" + t[1]))) : null,
    raster);
};
