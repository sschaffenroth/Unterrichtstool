/* Baustein ergebnis: zeigt die Antworten früherer Schüler-Schritte (Balken, Wortwolke, Zielscheibe …).
   Offline kommen die Zahlen bei Abstimmungen aus der Regie (Handzeichen zählen). */
"use strict";

const BALKEN_TYPEN = ["abstimmung", "vorhersage"];

function ergebnisBlock(id, mitLoesung) {
  const sch = frageDef(id);
  const s = schrittNachId(id);
  if (!sch) return el("div", { class: "ergebnis-block" }, el("div", { class: "leer-hinweis" }, "Kein Schüler-Schritt „" + id + "“."));
  if (!BALKEN_TYPEN.includes(sch.baustein) && !(sch.baustein === "exit" && (sch.optionen || []).length)) {
    return el("div", { class: "ergebnis-block breit" }, el("h3", null, sch.frage || sch.offen || (s && s.titel) || ""), ergebnisAnsicht(id, { loesung: mitLoesung }));
  }
  const stimmen = stimmenVon(id);
  const optionen = sch.optionen || [];
  const max = Math.max(1, ...optionen.map((o) => stimmen[o] || 0));
  const summe = optionen.reduce((a, o) => a + (stimmen[o] || 0), 0);
  const zeigeLoesung = mitLoesung && sch.loesung != null;
  const si = sicherheitZahlen(id);
  return el("div", { class: "ergebnis-block" },
    el("h3", null, sch.frage || (s && s.titel) || ""),
    summe === 0
      ? el("div", { class: "leer-hinweis" }, "Noch keine Stimmen.")
      : optionen.map((o) => el("div", { class: "balken-zeile" + (zeigeLoesung && o === sch.loesung ? " loesung" : "") },
          el("span", { class: "name" }, o),
          el("div", { class: "bahn" },
            el("div", { class: "balken", style: "width:" + ((stimmen[o] || 0) / max) * 100 + "%" },
              si.mit && stimmen[o] ? el("div", { class: "sicher-anteil", style: "width:" + ((si.sicher[o] || 0) / stimmen[o]) * 100 + "%" }) : null)),
          el("span", { class: "zahl" }, stimmen[o] || 0))),
    summe ? el("div", { class: "anzahl" }, (sch.mehrfach ? "Nennungen: " : "Stimmen: ") + summe,
      si.mit ? el("span", null, "dunkler Teil: sicher, heller Teil: geraten" + (zeigeLoesung ? ". Falsch, aber sicher: " + si.falschSicher : "")) : null) : null);
}

BAUSTEINE.ergebnis = (b, ctx) => {
  const ids = Array.isArray(b.von) ? b.von : [b.von];
  return el("div", { class: "baustein b-ergebnis" }, ids.map((id) => ergebnisBlock(id, b.loesung !== false && vorhersageAufgeloest(id, ctx.schritt))));
};

/* Lösung sichtbar? Abstimmungen: sofort. Vorhersage, Hotspot, Ordnen, Fehlerzeile: erst wenn der aktuelle Schritt
   ihr `aufloesen_in` ist oder danach kommt (ohne `aufloesen_in`: nach dem eigenen Schritt). */
const SPAETE_LOESUNG = ["vorhersage", "hotspot", "ordnen", "fehlerzeile"];
function vorhersageAufgeloest(id, aktuellerSchritt) {
  const s = schrittNachId(id);
  if (!s || !s.schueler || !SPAETE_LOESUNG.includes(s.schueler.baustein)) return true;
  const iAkt = SCHRITTE.findIndex((x) => x.id === aktuellerSchritt.id);
  const iEigen = SCHRITTE.findIndex((x) => x.id === s.id);
  if (!s.schueler.aufloesen_in) return iAkt > iEigen;
  return iAkt >= SCHRITTE.findIndex((x) => x.id === s.schueler.aufloesen_in);
}
