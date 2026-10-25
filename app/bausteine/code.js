/* Baustein code: Code wie im Editor (Zeilennummern, Syntaxfarben aus dem Bauskript, mindestens 20 pt).
   Die Schrift wächst, bis die Ansicht die Fläche füllt (nie kleiner als die Grundgröße).
   Marken: Antippen öffnet die Erklärung, Marken der Reihe nach.
     als: notiz (Standard)  Erklärung grün neben der Zeile
     als: zeile             Erklärung als grüne Codezeile im Programm, mit Einrückung
                            position: vor | nach (Standard: nach bei Docstrings, sonst vor)
   Lange Programme über `ansichten` in Teile geteilt, nie verkleinert.
   Noch nicht umgesetzt: fehler, probelauf, nebeneinander (Bauskript meldet es). */
"use strict";

function zeilenText(html) { return String(html || "").replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&"); }
function einrueckung(text) { return (/^[ \t]*/.exec(text) || [""])[0]; }

BAUSTEINE.code = (b, ctx) => {
  const schluessel = ctx.schluessel;
  const zeilen = b.zeilen_html || [];
  const teile = b.ansichten && b.ansichten.length ? b.ansichten : [[1, zeilen.length]];
  const teil = Math.min(Z.codeteil[schluessel] || 0, teile.length - 1);
  const [von, bis] = teile[teil];
  const marken = b.marken || [];
  const offen = Z.marken[schluessel] || 0;

  const raster = el("div", { class: "code-raster" });
  const zeileEinfuegen = (m, nr) => {
    // Erklärung als echte Codezeile(n): Einrückung der markierten Zeile, bei Docstrings die der Folgezeile
    const docstring = /^\s*("""|''')/.test(m.einblenden || "");
    const position = m.position || (docstring ? "nach" : "vor");
    let einzug = einrueckung(zeilenText(zeilen[nr - 1]));
    if (position === "nach") {
      const folge = zeilen.slice(nr).map(zeilenText).find((t) => t.trim());
      einzug = folge ? einrueckung(folge) : einzug + "    ";
      if (einzug.length <= einrueckung(zeilenText(zeilen[nr - 1])).length && /:\s*$/.test(zeilenText(zeilen[nr - 1]))) einzug = einrueckung(zeilenText(zeilen[nr - 1])) + "    ";
    }
    const reihen = String(m.einblenden || "").split("\n").map((t) => el("span", { class: "codezeile eingeblendet" }, einzug + t));
    return { position, reihen };
  };

  for (let nr = von; nr <= bis; nr++) {
    const mIndex = marken.findIndex((m) => m.zeile === nr);
    const m = marken[mIndex];
    const istOffen = mIndex >= 0 && mIndex < offen;
    const alsZeile = istOffen && m.als === "zeile" ? zeileEinfuegen(m, nr) : null;
    const zusatz = (reihen) => reihen.forEach((r) => raster.append(el("span", { class: "nr" }, ""), r, el("span"), el("span")));
    if (alsZeile && alsZeile.position === "vor") zusatz(alsZeile.reihen);
    raster.append(
      el("span", { class: "nr" }, nr),
      el("span", { class: "codezeile" + (istOffen ? " markiert" : ""), html: zeilen[nr - 1] || " " }),
      m ? el("button", {
        class: "marke" + (istOffen ? " offen" : ""),
        onclick: () => tun("marke", { schluessel, anzahl: istOffen ? mIndex : mIndex + 1 }),
      }, m.label || "●") : el("span"),
      istOffen && m.einblenden && m.als !== "zeile" ? el("span", { class: "erklaerung" }, m.einblenden) : el("span"));
    if (alsZeile && alsZeile.position === "nach") zusatz(alsZeile.reihen);
  }
  const huelle = el("div", { class: "baustein b-code" },
    teile.length > 1 ? el("div", { class: "teile" }, teile.map((t, i) =>
      el("button", { class: i === teil ? "aktiv" : "", onclick: () => tun("codeteil", { schluessel, teil: i }) }, "Zeilen " + t[0] + " bis " + t[1]))) : null,
    raster);
  schriftEinpassen(huelle, raster, 1, 1.9);
  return huelle;
};
