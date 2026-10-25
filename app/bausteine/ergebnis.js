/* Baustein ergebnis: zeigt die Stimmen früherer Schüler-Schritte als Balken.
   Offline kommen die Zahlen aus der Regie (Handzeichen zählen). */
"use strict";

function ergebnisBlock(id, mitLoesung) {
  const s = schrittNachId(id);
  const sch = s && s.schueler;
  if (!sch) return el("div", { class: "ergebnis-block" }, el("div", { class: "leer-hinweis" }, "Kein Schüler-Schritt „" + id + "“."));
  const stimmen = Z.stimmen[id] || {};
  const optionen = sch.optionen || [];
  const max = Math.max(1, ...optionen.map((o) => stimmen[o] || 0));
  const summe = optionen.reduce((a, o) => a + (stimmen[o] || 0), 0);
  const zeigeLoesung = mitLoesung && sch.loesung != null;
  return el("div", { class: "ergebnis-block" },
    el("h3", null, sch.frage || s.titel),
    summe === 0
      ? el("div", { class: "leer-hinweis" }, "Noch keine Stimmen.")
      : optionen.map((o) => el("div", { class: "balken-zeile" + (zeigeLoesung && o === sch.loesung ? " loesung" : "") },
          el("span", { class: "name" }, o),
          el("div", { class: "bahn" }, el("div", { class: "balken", style: "width:" + ((stimmen[o] || 0) / max) * 100 + "%" })),
          el("span", { class: "zahl" }, stimmen[o] || 0))),
    summe ? el("div", { class: "anzahl" }, (sch.mehrfach ? "Nennungen: " : "Stimmen: ") + summe) : null);
}

BAUSTEINE.ergebnis = (b, ctx) => {
  const ids = Array.isArray(b.von) ? b.von : [b.von];
  return el("div", { class: "baustein b-ergebnis" }, ids.map((id) => ergebnisBlock(id, b.loesung !== false && vorhersageAufgeloest(id, ctx.schritt))));
};

/* Eine Vorhersage gilt als aufgelöst, wenn der aktuelle Schritt ihr `aufloesen_in` ist oder danach kommt. */
function vorhersageAufgeloest(id, aktuellerSchritt) {
  const s = schrittNachId(id);
  if (!s || !s.schueler || s.schueler.baustein !== "vorhersage") return true;
  const iAkt = SCHRITTE.findIndex((x) => x.id === aktuellerSchritt.id);
  const iEigen = SCHRITTE.findIndex((x) => x.id === s.id);
  if (!s.schueler.aufloesen_in) return iAkt > iEigen;
  return iAkt >= SCHRITTE.findIndex((x) => x.id === s.schueler.aufloesen_in);
}
