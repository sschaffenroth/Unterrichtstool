/* Methoden: spontan aus der Regie startbar (Karte „Methoden“) oder von einem Schritt der Stunde eingeschaltet
   (`methoden:` am Schritt, `auftrag.phasen`, `auftrag.rollenwechsel_min`).

   Jede laufende Methode steht in Z.methoden[art]. Höchstens eine liegt groß auf dem Board (Z.buehne),
   die anderen erscheinen klein in der Leiste unten links oder gar nicht (m.ansicht: "klein" | "aus").

   art          was                                                  Handy
   energizer    1 bis 3 min Bewegung oder Spiel, zählt nicht zur Schrittzeit   nein
   phasen       Think-Pair-Share, 1-2-4-Alle: Sozialformen nacheinander       nein (Begleitseite zeigt die Phase)
   rollen       Rollenwechsel beim Pair Programming, Signal alle n min       nein
   hilfe        Hilfe-Ampel mit Platznummer, Warteschlange in der Regie       ja
   fortschritt  Teams haken Aufgaben ab, Balken je Aufgabe                   ja
   tempo        Lerntempoduett: wer fertig ist, bekommt einen Partner         ja (baut auf fortschritt)
   helfer       Helfersystem: wer fertig ist, hilft, wer Hilfe braucht       ja (baut auf hilfe, fortschritt)
   wortwolke, zielscheibe, exit: spontane Handy-Fragen (Z.spontan[id])        ja */
"use strict";

/* ------------------------------------------------------------------ Zeit */
function laufzeit(t) { return t ? (t.basis || 0) + (t.seit ? jetzt() - t.seit : 0) : 0; }
function zeitgeber() { return { basis: 0, seit: jetzt() }; }
function zeitAnhalten(t) { const u = Object.assign({}, t); if (u.seit) { u.basis += jetzt() - u.seit; u.seit = null; } return u; }
function zeitWeiter(t) { const u = Object.assign({}, t); if (!u.seit) u.seit = jetzt(); return u; }
function zeitSetzen(t, ms) { return { basis: Math.max(0, ms), seit: t && t.seit ? jetzt() : null }; }
function serverJetzt() { return jetzt() + ((Z.online && Z.online.versatz) || 0); }

/* ------------------------------------------------------------------ Sammlungen */
const ENERGIZER = [
  { titel: "Strecken", dauer: 1, text: "Aufstehen, Fenster auf.\nArme hoch, Schultern kreisen, Nacken locker.\nEine Minute, dann geht es weiter." },
  { titel: "Atempause", dauer: 1, text: "Augen schließen oder aus dem Fenster schauen.\nVier Sekunden ein, vier halten, sechs aus.\nFünfmal." },
  { titel: "Zählen bis 20", dauer: 2, text: "Alle stehen.\nDie Klasse zählt bis 20, ohne Absprache und ohne feste Reihenfolge.\nSprechen zwei gleichzeitig, beginnt ihr wieder bei 1." },
  { titel: "Schnick-Schnack-Schnuck-Turnier", dauer: 3, text: "Alle stehen und spielen gegen den Nachbarn.\nWer verliert, wird Fan des Siegers und feuert ihn an.\nDie Sieger spielen weiter, bis zwei Fanblöcke übrig sind." },
  { titel: "Wer bin ich?", dauer: 3, begriff: true, text: "Eine Person stellt sich mit dem Rücken zur Tafel.\nAn der Tafel steht ein Fachbegriff.\nSie stellt Fragen, die Klasse antwortet nur mit Ja oder Nein." },
  { titel: "Begriffe-Blitz", dauer: 2, begriff: true, text: "Reihum in einem Satz: Wofür braucht man den Begriff an der Tafel?\nWer nichts weiß, sagt „weiter“.\nNach drei Beiträgen kommt ein neuer Begriff." },
  { titel: "Aufstellung", dauer: 2, text: "Stellt euch in einer Reihe auf.\nLinks: „Das kann ich schon allein.“ Rechts: „Da brauche ich noch Hilfe.“\nWer nebeneinander steht, tauscht sich kurz aus." },
  { titel: "Platzwechsel", dauer: 2, text: "Alle stehen auf und setzen sich an einen anderen Platz.\nNeue Nachbarn: in einem Satz sagen, was heute bisher am schwierigsten war." },
  { titel: "Code-Golf", dauer: 3, golf: true, text: "Schreibt das kürzeste Programm für die Aufgabe an der Tafel.\nNach drei Minuten vergleichen wir: Wer hat die wenigsten Zeichen?" },
];
const CODE_GOLF = [
  "Gib die Zahlen von 1 bis 10 aus.",
  "Prüfe, ob eine Zahl gerade ist, und gib Ja oder Nein aus.",
  "Kehre einen Text um.",
  "Zähle, wie oft der Buchstabe e in einem Text vorkommt.",
  "Gib das größte Element einer Liste aus, ohne max zu verwenden.",
  "Gib alle Zahlen von 1 bis 30 aus, die durch 3 teilbar sind.",
];
const PHASEN_VORLAGEN = {
  tps: { titel: "Think-Pair-Share", phasen: [
    { sozialform: "EA", min: 2, text: "Allein nachdenken, Stichpunkte notieren." },
    { sozialform: "PA", min: 3, text: "Mit dem Nachbarn vergleichen und auf eine Antwort einigen." },
    { sozialform: "Plenum", min: 5, text: "Paare stellen ihre Antwort vor." }] },
  "124": { titel: "1-2-4-Alle", phasen: [
    { sozialform: "EA", min: 1, text: "Allein: eigene Idee notieren." },
    { sozialform: "PA", min: 2, text: "Zu zweit: Ideen zusammenlegen." },
    { sozialform: "GA", min: 4, text: "Zu viert: die beste Idee auswählen." },
    { sozialform: "Plenum", min: 5, text: "Jede Gruppe nennt ihre beste Idee." }] },
};
const ZIEL_DIMENSIONEN = ["Ich habe es verstanden", "Ich kann es allein anwenden", "Das Tempo passte", "Ich habe mitgemacht"];
const SOZIALFORM_WORT = { EA: "Einzelarbeit", PA: "Partnerarbeit", GA: "Gruppenarbeit", Plenum: "Plenum" };

function energizerListe() { return [...(STUNDE.energizer || []), ...ENERGIZER]; }
function begriffe() { return STUNDE.begriffe || []; }
function zufall(liste, ausser) {
  const l = liste.length > 1 ? liste.filter((x) => x !== ausser) : liste;
  return l.length ? l[Math.floor(Math.random() * l.length)] : null;
}

/* Menü in der Reihenfolge der Karte. schluessel = art oder art:vorlage */
const MENUE = [
  { schluessel: "energizer", art: "energizer", titel: "Energizer", kurz: "Bewegung oder Spiel, 1 bis 3 min", gruppe: "Pause" },
  { schluessel: "phasen:tps", art: "phasen", titel: "Think-Pair-Share", kurz: "allein, zu zweit, alle", gruppe: "Sozialform" },
  { schluessel: "phasen:124", art: "phasen", titel: "1-2-4-Alle", kurz: "allein, zu zweit, zu viert, alle", gruppe: "Sozialform" },
  { schluessel: "rollen", art: "rollen", titel: "Rollenwechsel", kurz: "Fahrer und Navigator tauschen", gruppe: "Sozialform" },
  { schluessel: "hilfe", art: "hilfe", titel: "Hilfe-Ampel", kurz: "Handy: grün, gelb, rot mit Platz", gruppe: "Praxisphase", handy: true },
  { schluessel: "fortschritt", art: "fortschritt", titel: "Fortschritt", kurz: "Handy: Aufgaben abhaken", gruppe: "Praxisphase", handy: true },
  { schluessel: "tempo", art: "tempo", titel: "Lerntempoduett", kurz: "wer fertig ist, bekommt einen Partner", gruppe: "Praxisphase", handy: true },
  { schluessel: "helfer", art: "helfer", titel: "Helfersystem", kurz: "wer fertig ist, hilft", gruppe: "Praxisphase", handy: true },
  { schluessel: "wortwolke", art: "wortwolke", titel: "Wortwolke", kurz: "Handy: 1 bis 3 Wörter", gruppe: "Rückmeldung", handy: true },
  { schluessel: "zielscheibe", art: "zielscheibe", titel: "Zielscheibe", kurz: "Handy: Selbsteinschätzung", gruppe: "Rückmeldung", handy: true },
  { schluessel: "exit", art: "exit", titel: "Exit-Ticket", kurz: "Handy: Was war unklar?", gruppe: "Rückmeldung", handy: true },
];
const TITEL = { energizer: "Energizer", phasen: "Phasen", rollen: "Rollenwechsel", hilfe: "Hilfe-Ampel", fortschritt: "Fortschritt",
  tempo: "Lerntempoduett", helfer: "Helfersystem", wortwolke: "Wortwolke", zielscheibe: "Zielscheibe", exit: "Exit-Ticket" };
const FRAGE_METHODEN = ["wortwolke", "zielscheibe", "exit"];

/* ------------------------------------------------------------------ Fragen (Schritt oder spontan) */
function frageDef(id) {
  if (!id) return null;
  if (Z.spontan[id]) return Z.spontan[id];
  const s = schrittNachId(id);
  return s && s.schueler ? s.schueler : null;
}
function frageTitel(id) {
  const d = frageDef(id);
  const s = schrittNachId(id);
  return (d && d.frage) || (s && s.titel) || TITEL[(d || {}).baustein] || id;
}
function antwortenVon(id) { return ((Z.online && Z.online.antworten) || {})[id] || []; }
function teilnehmerVon(id) { return ((Z.online && Z.online.teilnehmer) || {})[id] || 0; }

/* ------------------------------------------------------------------ Stand der zeitabhängigen Methoden */
function phasenStand(phasen, vergangen) {
  let t = 0;
  for (let i = 0; i < phasen.length; i++) {
    const d = (Number(phasen[i].min) || 0) * 60000;
    if (vergangen < t + d) return { i, rest: t + d - vergangen, ende: false };
    t += d;
  }
  return { i: phasen.length - 1, rest: 0, ende: true };
}
function phasenBeginn(phasen, i) { return phasen.slice(0, i).reduce((a, p) => a + (Number(p.min) || 0) * 60000, 0); }
/* Phasen im Auftrag des aktuellen Schritts (auftrag.phasen), Zeit läuft mit dem Countdown */
function auftragPhase(s = schritt()) {
  const ph = s.auftrag && s.auftrag.phasen;
  if (!ph || !ph.length) return null;
  const c = Z.countdown && Z.countdown.id === s.id ? Z.countdown : null;
  return { phasen: ph, stand: phasenStand(ph, c ? laufzeit(c) : 0), laeuft: !!(c && c.seit) };
}
function rollenStand(m) {
  const v = m.anCountdown ? (Z.countdown && Z.countdown.id === m.quelle ? laufzeit(Z.countdown) : 0) : laufzeit(m.uhr);
  const iv = Math.max(1, Number(m.min) || 10) * 60000;
  const k = Math.floor(v / iv);
  return { k, rest: iv - (v - k * iv), blitz: k > 0 && v - k * iv < 10000 };
}
function energizerRest(m) { return m.dauer - laufzeit(m.uhr); }

/* Schlüssel für alles, was sich mit der Zeit von selbst ändert (Phase wechselt, Rollen tauschen):
   ändert er sich, zeichnen Board und Regie neu und die Regie gibt ein Signal. */
function zeitSchluessel() {
  const teile = [];
  const ap = auftragPhase();
  if (ap) teile.push("a" + ap.stand.i + (ap.stand.ende ? "e" : ""));
  const p = Z.methoden.phasen;
  if (p) { const st = phasenStand(p.phasen, laufzeit(p.uhr)); teile.push("p" + st.i + (st.ende ? "e" : "")); }
  const r = Z.methoden.rollen;
  if (r) { const st = rollenStand(r); teile.push("r" + st.k + (st.blitz ? "b" : "")); }
  const e = Z.methoden.energizer;
  if (e) teile.push("e" + (energizerRest(e) <= 0 ? "x" : ""));
  return teile.join(",");
}
let zeitSchluesselZuletzt = null;
/* in der Regie alle 500 ms: Signal bei Phasenwechsel, Rollentausch und Ende des Energizers */
function methodenTakt() {
  const k = zeitSchluessel();
  const vorher = zeitSchluesselZuletzt;
  zeitSchluesselZuletzt = k;
  if (vorher !== null && k !== vorher) {
    const alt = vorher.split(","), neu = k.split(",");
    const signal = neu.some((t) => !alt.includes(t) && (/^[ap]\d+$/.test(t) || /^[ap]\d+e$/.test(t) || /^r[1-9]\d*b$/.test(t) || t === "ex"));
    if (signal && tonEinstellung !== "aus") signalTon();
    neuZeichnen();
  }
}

/* Restzeiten in [data-rest] laufend schreiben (Board und Regie) */
function methodenUhren(wurzel) {
  for (const e of wurzel.querySelectorAll("[data-rest]")) {
    const was = e.getAttribute("data-rest");
    let rest = null, pause = false;
    const m = Z.methoden[was];
    if (was === "energizer" && m) { rest = energizerRest(m); pause = !m.uhr.seit; }
    else if (was === "phasen" && m) { rest = phasenStand(m.phasen, laufzeit(m.uhr)).rest; pause = !m.uhr.seit; }
    else if (was === "rollen" && m) { rest = rollenStand(m).rest; pause = m.anCountdown ? !(Z.countdown && Z.countdown.seit) : !m.uhr.seit; }
    else if (was === "auftragphase") { const ap = auftragPhase(); if (ap) { rest = ap.stand.rest; pause = !ap.laeuft; } }
    if (rest == null) { e.textContent = ""; continue; }
    e.textContent = rest > 0 ? formatMinSek(rest) : "0:00";
    e.classList.toggle("ende", rest <= 0);
    e.classList.toggle("pause", pause && rest > 0);
  }
  for (const e of wurzel.querySelectorAll("[data-seit]")) {
    e.textContent = formatMinSek(Math.max(0, serverJetzt() - Number(e.getAttribute("data-seit"))));
  }
}

/* ------------------------------------------------------------------ Starten und Beenden */
function neueMethode(art, werte) {
  const w = werte || {};
  const s = schritt();
  if (art === "energizer") {
    const liste = energizerListe();
    const nr = w.nr === "zufall" || w.nr == null || w.nr === "" ? Math.floor(Math.random() * liste.length) : Number(w.nr);
    const e = liste[nr] || liste[0];
    const b = e.begriff ? zufall(begriffe()) : null;
    return { titel: e.titel, text: e.text, nr, dauer: (Number(w.min) || e.dauer || 2) * 60000, uhr: zeitgeber(), abStunde: stundenzeit(),
      begriff: b, aufgabe: e.golf ? zufall(CODE_GOLF) : null, ansicht: "klein", schritt: s.id };
  }
  if (art === "phasen") {
    const v = PHASEN_VORLAGEN[w.vorlage] || PHASEN_VORLAGEN.tps;
    const phasen = v.phasen.map((p, i) => Object.assign({}, p, { min: Number((w.min || [])[i]) || p.min }));
    return { titel: v.titel, phasen, impuls: w.impuls || "", uhr: zeitgeber(), ansicht: "klein" };
  }
  if (art === "rollen") {
    return { min: Number(w.min) || 10, namen: (w.namen || "Fahrer, Navigator").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 2), uhr: zeitgeber(), ansicht: "klein" };
  }
  if (art === "hilfe") return { ansicht: "klein" };
  if (art === "fortschritt") return { aufgaben: aufgabenListe(w.aufgaben), ansicht: "klein" };
  if (art === "tempo") return { paare: [], gehabt: [], fertig: 0, ansicht: "klein" };
  if (art === "helfer") return { paare: [], ansicht: "klein" };
  return null;
}
function aufgabenListe(text) {
  if (Array.isArray(text)) return text.map(String).slice(0, 12);
  const l = String(text || "").split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
  if (l.length) return l.slice(0, 12);
  const a = schritt().auftrag;
  return (a && a.aufgaben) || ["A1", "A2", "A3"];
}

async function methodeStarten(schluessel, werte) {
  const [art, vorlage] = schluessel.split(":");
  const w = Object.assign({ vorlage }, werte || {});
  if (FRAGE_METHODEN.includes(art)) { await frageMethodeStarten(art, w); return; }
  const handy = MENUE.find((x) => x.art === art).handy;
  if (handy && SERVER && !Z.raum) await raumAnlegen();
  if (art === "tempo" || art === "helfer") {
    if (!Z.methoden.fortschritt) tun("methode", { art: "fortschritt", wert: neueMethode("fortschritt", w) });
    if (art === "helfer" && !Z.methoden.hilfe) tun("methode", { art: "hilfe", wert: neueMethode("hilfe", w) });
  }
  if (art === "fortschritt" && Z.methoden.fortschritt) { tun("methodeAendern", { art, teil: { aufgaben: aufgabenListe(w.aufgaben) } }); return; }
  tun("methode", { art, wert: neueMethode(art, w) });
  if (["energizer", "phasen"].includes(art)) tun("buehne", { art });
  methodeWahl = null;
  baldAbholen();
}
/* Handys sofort informieren, nicht erst beim nächsten 2-Sekunden-Takt */
function baldAbholen() { if (FUEHREND && Z.raum) setTimeout(() => abholen(true), 50); }

async function frageMethodeStarten(art, w) {
  const id = "m_" + art + "_" + Date.now().toString(36);
  let frage;
  if (art === "wortwolke") frage = { baustein: "wortwolke", frage: w.frage || "Ein Wort dazu:", max_woerter: Number(w.max) || 1 };
  else if (art === "zielscheibe") {
    const dim = String(w.dimensionen || "").split("\n").map((x) => x.trim()).filter(Boolean);
    frage = { baustein: "zielscheibe", frage: w.frage || "Wie lief es für dich?", dimensionen: dim.length ? dim.slice(0, 6) : ZIEL_DIMENSIONEN };
  } else {
    const k = w.kontroll ? schrittNachId(w.kontroll) : null;
    const sch = k && k.schueler;
    frage = { baustein: "exit", offen: w.offen || "Was war heute am unklarsten?",
      frage: sch ? sch.frage : "", optionen: sch ? sch.optionen : [], loesung: sch ? sch.loesung : null };
  }
  if (Z.methoden[art]) await methodeStoppen(art);
  tun("spontan", { id, frage: Object.assign({ titel: TITEL[art], zeit: new Date().toISOString() }, frage) });
  tun("methode", { art, wert: { id, ansicht: "klein" } });
  tun("buehne", { art });
  methodeWahl = null;
  if (SERVER) await freigebenId(id);
}

async function methodeStoppen(art) {
  const m = Z.methoden[art];
  if (!m) return;
  if (m.id && Z.freigabe === m.id) await freigabeBeenden();
  if (art === "fortschritt") { for (const a of ["tempo", "helfer"]) if (Z.methoden[a]) tun("methode", { art: a, wert: null }); }
  if (art === "hilfe" && Z.methoden.helfer) tun("methode", { art: "helfer", wert: null });
  tun("methode", { art, wert: null });
  baldAbholen();
}

/* reine Zustandsänderung beim Beenden (läuft in AKTION.methode) */
function methodeBeenden(z, art) {
  const m = z.methoden[art];
  if (!m) return;
  if (art === "energizer") {
    const t = stundenzeit(z);
    const ms = Math.max(0, t - (m.abStunde || t));
    z.einschuebe.push({ art, titel: m.titel, ms: laufzeit(m.uhr), schritt: m.schritt });
    if (SCHRITTE[z.schritt].id === m.schritt) z.schrittBeginn = Math.min(t, z.schrittBeginn + ms);   // nicht der Schrittzeit zurechnen
  }
}

/* Schrittwechsel: Energizer und Phasen enden, Methoden des alten Schritts enden, die des neuen beginnen */
function methodenBeimSchrittwechsel(z, alt, neu) {
  for (const [art, m] of Object.entries(z.methoden)) {
    if (art === "energizer" || art === "phasen" || (m.quelle && m.quelle === alt.id)) {
      methodeBeenden(z, art);
      delete z.methoden[art];
    }
  }
  z.buehne = null;
  const liste = Array.isArray(neu.methoden) ? neu.methoden : neu.methoden ? Object.keys(neu.methoden) : [];
  const a = neu.auftrag || {};
  for (const art of liste) {
    if (z.methoden[art] || !["hilfe", "fortschritt", "tempo", "helfer"].includes(art)) continue;
    if ((art === "tempo" || art === "helfer") && !z.methoden.fortschritt) z.methoden.fortschritt = { aufgaben: a.aufgaben || ["A1", "A2", "A3"], ansicht: "klein", quelle: neu.id };
    if (art === "helfer" && !z.methoden.hilfe) z.methoden.hilfe = { ansicht: "klein", quelle: neu.id };
    const m = art === "fortschritt" ? { aufgaben: a.aufgaben || ["A1", "A2", "A3"], ansicht: "klein" }
      : art === "tempo" ? { paare: [], gehabt: [], fertig: 0, ansicht: "klein" }
      : art === "helfer" ? { paare: [], ansicht: "klein" } : { ansicht: "klein" };
    if (!z.methoden[art]) z.methoden[art] = Object.assign(m, { quelle: neu.id });
  }
  if (a.rollenwechsel_min && !z.methoden.rollen) {
    z.methoden.rollen = { min: a.rollenwechsel_min, namen: a.rollen || ["Fahrer", "Navigator"], anCountdown: !!z.countdown,
      uhr: { basis: 0, seit: jetzt() }, ansicht: "klein", quelle: neu.id };
  }
}

/* ------------------------------------------------------------------ Praxisphase: Meldungen auswerten */
function meldungen() { return (Z.online && Z.online.meldungen) || {}; }
function platzListe() { return Object.keys(meldungen()).map(Number).sort((a, b) => a - b); }
function hilfeSchlange() {
  return Object.entries(meldungen())
    .filter(([, r]) => r.hilfe && (r.hilfe.stufe === "rot" || r.hilfe.stufe === "gelb"))
    .map(([p, r]) => ({ platz: +p, stufe: r.hilfe.stufe, aufgabe: r.hilfe.aufgabe, seit: r.hilfe.seit }))
    .sort((a, b) => (a.stufe === b.stufe ? a.seit - b.seit : a.stufe === "rot" ? -1 : 1));
}
function fortschrittZahlen() {
  const m = Z.methoden.fortschritt;
  if (!m) return [];
  const r = meldungen();
  const plaetze = Object.keys(r).length;
  return m.aufgaben.map((a) => ({ aufgabe: a, n: Object.values(r).filter((x) => x.erledigt && x.erledigt[a]).length, von: plaetze }));
}
/* höchste erledigte Aufgabe je Platz */
function aufgabenStand() {
  const aufgaben = (Z.methoden.fortschritt || {}).aufgaben || [];
  const stand = {};
  for (const [p, r] of Object.entries(meldungen())) {
    let best = -1, zeit = 0;
    for (const [a, t] of Object.entries(r.erledigt || {})) { const i = aufgaben.indexOf(a); if (i > best) { best = i; zeit = t; } }
    stand[p] = { i: best, zeit };
  }
  return { aufgaben, stand };
}

/* Lerntempoduett: wer eine Aufgabe fertig hat, wartet an der Haltestelle dieser Aufgabe; zwei Wartende bilden ein Paar.
   Ein Paar endet, sobald einer der beiden die nächste Aufgabe abhakt. Wer schon ein Paar zu einer Aufgabe hatte,
   bekommt für diese Aufgabe kein zweites. */
function duettBerechnen(m) {
  const { aufgaben, stand } = aufgabenStand();
  const bei = (p) => (stand[p] && stand[p].i >= 0 ? aufgaben[stand[p].i] : null);
  const gehabt = new Set(m.gehabt || []);
  const paare = (m.paare || []).filter((pa) => bei(pa.a) === pa.aufgabe && bei(pa.b) === pa.aufgabe);
  const fertig = (m.fertig || 0) + (m.paare || []).length - paare.length;
  const belegt = new Set(paare.flatMap((pa) => [String(pa.a), String(pa.b)]));
  const wartend = [];
  for (let i = 0; i < aufgaben.length; i++) {
    const w = Object.entries(stand).filter(([p, st]) => st.i === i && !belegt.has(p) && !gehabt.has(p + ":" + aufgaben[i]))
      .sort((x, y) => x[1].zeit - y[1].zeit).map(([p]) => +p);
    while (w.length >= 2) {
      const a = w.shift(), b = w.shift();
      paare.push({ a, b, aufgabe: aufgaben[i], art: "duett" });
      gehabt.add(a + ":" + aufgaben[i]); gehabt.add(b + ":" + aufgaben[i]);
    }
    for (const p of w) wartend.push({ platz: p, aufgabe: aufgaben[i] });
  }
  return { paare, gehabt: [...gehabt], fertig, wartend };
}

/* Helfersystem: wer rot oder gelb meldet, bekommt einen Helfer, der „ich helfe gern“ gesetzt und die Aufgabe
   schon erledigt hat (ohne Aufgabe: irgendein Helfer). Das Paar endet, wenn der Platz wieder grün ist. */
function helferBerechnen(m) {
  const r = meldungen();
  const schlange = hilfeSchlange();
  const sucht = new Set(schlange.map((x) => x.platz));
  const helfer = (p) => r[p] && r[p].helfen && !sucht.has(+p);
  const paare = (m.paare || []).filter((pa) => sucht.has(pa.b) && helfer(pa.a));
  const belegt = new Set(paare.flatMap((pa) => [pa.a, pa.b]));
  const offen = [];
  for (const s of schlange) {
    if (belegt.has(s.platz)) continue;
    const kandidaten = Object.keys(r).map(Number).filter((p) => helfer(p) && !belegt.has(p) && (!s.aufgabe || (r[p].erledigt || {})[s.aufgabe]));
    if (kandidaten.length) {
      const a = kandidaten.sort((x, y) => (r[x].erledigt[s.aufgabe] || 0) - (r[y].erledigt[s.aufgabe] || 0))[0];
      paare.push({ a, b: s.platz, aufgabe: s.aufgabe || "", art: "hilfe" });
      belegt.add(a); belegt.add(s.platz);
    } else offen.push(s);
  }
  const frei = Object.keys(r).map(Number).filter((p) => helfer(p) && !belegt.has(p));
  return { paare, offen, frei };
}

/* nach jedem Abholen (führendes Fenster): Paare neu bilden, nur bei Änderung in den Zustand schreiben */
function paareAktualisieren() {
  const t = Z.methoden.tempo;
  if (t) {
    const d = duettBerechnen(t);
    if (JSON.stringify([d.paare, d.gehabt, d.fertig]) !== JSON.stringify([t.paare, t.gehabt, t.fertig])) tun("methodeAendern", { art: "tempo", teil: { paare: d.paare, gehabt: d.gehabt, fertig: d.fertig } });
  }
  const h = Z.methoden.helfer;
  if (h) {
    const d = helferBerechnen(h);
    if (JSON.stringify(d.paare) !== JSON.stringify(h.paare)) tun("methodeAendern", { art: "helfer", teil: { paare: d.paare } });
  }
}

/* was die Begleitseite der Handys über laufende Methoden wissen muss (nie Notizen, nie Lösungen) */
function methodenStatus(st) {
  const M = Z.methoden;
  st.methoden = {
    hilfe: !!(M.hilfe || M.helfer),
    fortschritt: M.fortschritt ? { aufgaben: M.fortschritt.aufgaben } : null,
    tempo: !!M.tempo,
    helfer: !!M.helfer,
    paare: [...((M.tempo && M.tempo.paare) || []), ...((M.helfer && M.helfer.paare) || [])],
    hinweis: M.rollen ? (M.rollen.namen || []).join(" und ") + ": Rollen tauschen alle " + M.rollen.min + " min" : "",
  };
  // Phasen ersetzen Sozialform, Text und Countdown des Auftrags
  const p = M.phasen;
  if (p) {
    const ps = phasenStand(p.phasen, laufzeit(p.uhr));
    const ph = p.phasen[ps.i];
    st.auftrag = { text: [p.impuls, ph.text].filter(Boolean).join("\n"), sozialform: ph.sozialform, dauer_min: ph.min, abgabe: "", phase: p.titel + ", Phase " + (ps.i + 1) + " von " + p.phasen.length };
    st.countdown = { rest: Math.round(ps.rest), laeuft: !!p.uhr.seit };
  } else {
    const ap = auftragPhase();
    if (ap && st.auftrag) {
      const ph = ap.phasen[ap.stand.i];
      st.auftrag = Object.assign({}, st.auftrag, { sozialform: ph.sozialform, phase: "Phase " + (ap.stand.i + 1) + " von " + ap.phasen.length + (ph.text ? ": " + ph.text : "") });
      st.countdown = { rest: Math.round(ap.stand.rest), laeuft: ap.laeuft };
    }
  }
  const e = M.energizer;
  if (e) {
    st.auftrag = { text: e.titel + "\n" + e.text, sozialform: "Pause", dauer_min: Math.round(e.dauer / 60000), abgabe: "", phase: "Energizer" };
    st.countdown = { rest: Math.max(0, Math.round(energizerRest(e))), laeuft: !!e.uhr.seit };
  }
  return st;
}

/* ------------------------------------------------------------------ Board: groß und klein */
function eckQr() {
  return Z.raum ? el("div", { class: "methode-qr" }, el("div", { class: "qr", html: qrFuer(anmeldeAdresse()) }), el("div", null, anmeldeKurz())) : null;
}
function methodeGross(art) {
  const m = Z.methoden[art];
  if (!m) return null;
  const kopf = (titel, ...rest) => el("div", { class: "methode-kopf" }, el("span", { class: "methode-art" }, TITEL[art]), titel ? el("h1", null, titel) : null, ...rest);
  if (art === "energizer") {
    return el("div", { class: "methode-gross m-energizer" },
      kopf(m.titel, el("div", { class: "methode-uhr", "data-rest": "energizer" }, "")),
      el("div", { class: "methode-text" }, m.text),
      m.begriff ? el("div", { class: "methode-begriff" }, m.begriff.begriff) : null,
      m.aufgabe ? el("div", { class: "methode-begriff klein" }, m.aufgabe) : null);
  }
  if (art === "phasen") {
    const st = phasenStand(m.phasen, laufzeit(m.uhr));
    const ph = m.phasen[st.i];
    return el("div", { class: "methode-gross m-phasen" },
      kopf(m.impuls || m.titel, el("div", { class: "methode-uhr", "data-rest": "phasen" }, "")),
      phasenLeiste(m.phasen, st.i),
      el("div", { class: "phase-jetzt" }, piktogramm(ph.sozialform), el("div", null, el("div", { class: "phase-wort" }, SOZIALFORM_WORT[ph.sozialform] || ph.sozialform), el("div", { class: "phase-text" }, ph.text || ""))));
  }
  if (art === "rollen") {
    const st = rollenStand(m);
    return el("div", { class: "methode-gross m-rollen" }, kopf("Rollen tauschen alle " + m.min + " Minuten"),
      el("div", { class: "rollen-namen" }, (m.namen || []).map((n) => el("span", null, n))),
      el("div", { class: "methode-text" }, "Wechsel in ", el("b", { "data-rest": "rollen" }, ""), st.k ? el("span", null, "\nBisher " + st.k + (st.k === 1 ? " Wechsel" : " Wechsel")) : null));
  }
  if (art === "hilfe" || art === "helfer") {
    const schlange = hilfeSchlange();
    const paare = (Z.methoden.helfer && Z.methoden.helfer.paare) || [];
    return el("div", { class: "methode-gross m-hilfe" }, kopf(art === "helfer" ? "Wer fertig ist, hilft" : "Ich komme zu"),
      schlange.length ? el("div", { class: "hilfe-liste" }, schlange.map((x) => {
        const pa = paare.find((p) => p.b === x.platz);
        return el("div", { class: "hilfe-eintrag " + x.stufe }, el("b", null, "Platz " + x.platz), x.aufgabe ? el("span", null, x.aufgabe) : null,
          pa ? el("span", { class: "hilfe-helfer" }, "Platz " + pa.a + " hilft") : null);
      })) : el("div", { class: "methode-text leise" }, "Gerade braucht niemand Hilfe."),
      eckQr());
  }
  if (art === "fortschritt") {
    return el("div", { class: "methode-gross m-fortschritt" }, kopf("Wie weit seid ihr?"),
      el("div", { class: "fortschritt-balken" }, fortschrittZahlen().map((x) => el("div", { class: "balken-zeile" },
        el("span", { class: "name" }, x.aufgabe),
        el("div", { class: "bahn" }, el("div", { class: "balken", style: "width:" + (x.von ? (x.n / x.von) * 100 : 0) + "%" })),
        el("span", { class: "zahl" }, x.n + "/" + x.von)))),
      eckQr());
  }
  if (art === "tempo") {
    const d = duettBerechnen(m);
    return el("div", { class: "methode-gross m-tempo" }, kopf("Lerntempoduett"),
      m.paare.length ? el("div", { class: "duett-liste" }, m.paare.map((p) => el("div", { class: "duett-paar" },
        el("span", { class: "haltestelle" }, "Haltestelle " + p.aufgabe), el("b", null, "Platz " + p.a + " und Platz " + p.b)))) : el("div", { class: "methode-text leise" }, "Wer eine Aufgabe fertig hat, hakt sie am Handy ab und bekommt hier einen Partner."),
      d.wartend.length ? el("div", { class: "duett-wartend" }, "Wartet: ", d.wartend.map((w) => "Platz " + w.platz + " (" + w.aufgabe + ")").join(", ")) : null,
      eckQr());
  }
  if (FRAGE_METHODEN.includes(art)) {
    const f = frageDef(m.id) || {};
    const n = teilnehmerVon(m.id);
    return el("div", { class: "methode-gross m-frage" },
      kopf(art === "exit" ? f.offen : f.frage, el("div", { class: "methode-zahl" }, n + (n === 1 ? " Antwort" : " Antworten"))),
      art === "exit" ? el("div", { class: "methode-text" }, "Bitte am Handy beantworten.\nDie Antworten sieht nur die Lehrkraft.") : ergebnisAnsicht(m.id, { rolle: "board" }),
      Z.freigabe === m.id ? eckQr() : null);
  }
  return null;
}
function phasenLeiste(phasen, aktiv) {
  return el("div", { class: "phasen-leiste" }, phasen.map((p, i) => el("div", { class: "phase" + (i === aktiv ? " aktiv" : i < aktiv ? " erledigt" : "") },
    piktogramm(p.sozialform), el("span", null, SOZIALFORM_WORT[p.sozialform] || p.sozialform), el("small", null, p.min + " min"))));
}

/* kleine Anzeige in der Leiste unten links */
function methodeKlein(art) {
  const m = Z.methoden[art];
  if (!m || m.ansicht === "aus" || Z.buehne === art) return null;
  const chip = (...k) => el("div", { class: "methode-chip" }, el("b", null, TITEL[art]), ...k);
  if (art === "energizer") return chip(m.titel, el("span", { "data-rest": "energizer" }, ""));
  if (art === "phasen") { const st = phasenStand(m.phasen, laufzeit(m.uhr)); return chip(SOZIALFORM_WORT[m.phasen[st.i].sozialform], el("span", { "data-rest": "phasen" }, "")); }
  if (art === "rollen") return chip("tauschen in ", el("span", { "data-rest": "rollen" }, ""));
  if (art === "hilfe") { const s = hilfeSchlange(); return chip(s.length ? s.map((x) => "Platz " + x.platz).join(", ") : "niemand wartet"); }
  if (art === "fortschritt") return chip(fortschrittZahlen().map((x) => x.aufgabe + " " + x.n + "/" + x.von).join("   "));
  if (art === "tempo") return chip(m.paare.length ? m.paare.map((p) => p.a + " + " + p.b + " (" + p.aufgabe + ")").join(", ") : "noch keine Paare");
  if (art === "helfer") return chip(m.paare.length ? m.paare.map((p) => p.a + " hilft " + p.b).join(", ") : "keine Paare");
  if (FRAGE_METHODEN.includes(art)) return chip(teilnehmerVon(m.id) + " Antworten");
  return null;
}
function methodenLeiste() {
  const chips = Object.keys(Z.methoden).map(methodeKlein).filter(Boolean);
  return chips.length ? el("div", { class: "methoden-leiste" }, chips) : null;
}
function rollenBlitz() {
  const m = Z.methoden.rollen;
  if (!m) return null;
  const st = rollenStand(m);
  if (!st.blitz) return null;
  return el("div", { class: "rollen-blitz" }, el("div", null, "Rollen tauschen!"), el("small", null, (m.namen || []).join(" und ") + " wechseln, Wechsel Nr. " + st.k));
}

/* ------------------------------------------------------------------ Regie: Karte „Methoden“ */
let methodeWahl = null;           // geöffnete Einstellung im Menü (nur dieses Fenster)
const FORM = {};                  // Eingaben im Menü, bleiben beim Neuzeichnen erhalten
function feld(name, standard, attrs) {
  const wert = FORM[name] != null ? FORM[name] : standard;
  const tag = (attrs && attrs.zeilen) ? "textarea" : "input";
  const e = el(tag, Object.assign({ class: "eingabe", "data-feld": name, oninput: (ev) => { FORM[name] = ev.target.value; } }, attrs && attrs.zeilen ? { rows: attrs.zeilen } : { type: (attrs && attrs.typ) || "text" }, attrs && attrs.min != null ? { min: attrs.min, max: attrs.max } : {}, attrs && attrs.breit ? { style: "flex:1" } : {}));
  e.value = wert == null ? "" : wert;
  return e;
}
function auswahlFeld(name, optionen, standard) {
  const wert = FORM[name] != null ? FORM[name] : standard;
  return el("select", { class: "eingabe", "data-feld": name, onchange: (ev) => { FORM[name] = ev.target.value; neuZeichnen(); } },
    optionen.map(([w, t]) => el("option", { value: w, selected: String(w) === String(wert) }, t)));
}
function zeileMit(etikett, ...k) { return el("div", { class: "zeile methode-zeile" }, el("span", { class: "etikett" }, etikett), ...k); }

function einstellungen(schluessel) {
  const [art, vorlage] = schluessel.split(":");
  const start = (werte) => el("button", { class: "knopf haupt", onclick: () => methodeStarten(schluessel, werte()) }, Z.methoden[art] && !FRAGE_METHODEN.includes(art) ? "Übernehmen" : "Starten");
  const teile = [];
  const aufgabenStandard = ((schritt().auftrag || {}).aufgaben || ["A1", "A2", "A3"]).join(", ");
  if (art === "energizer") {
    const liste = energizerListe();
    const nr = FORM.energizer_nr != null ? FORM.energizer_nr : "zufall";
    const e = liste[nr] || null;
    teile.push(zeileMit("Welcher", auswahlFeld("energizer_nr", [["zufall", "Zufall"], ...liste.map((x, i) => [i, x.titel + " (" + x.dauer + " min)"])], "zufall")));
    teile.push(zeileMit("Minuten", feld("energizer_min", e ? e.dauer : "", { typ: "number", min: 1, max: 10 })));
    if (e) teile.push(el("p", { class: "naechster methode-vorschau" }, e.text));
    if (liste.some((x) => x.begriff) && !begriffe().length) teile.push(el("p", { class: "naechster" }, "Keine BEGRIFFE.md im Stundenordner: Begriffsspiele zeigen keinen Begriff."));
    teile.push(start(() => ({ nr: FORM.energizer_nr, min: FORM.energizer_min })));
  } else if (art === "phasen") {
    const v = PHASEN_VORLAGEN[vorlage];
    teile.push(zeileMit("Frage", feld("phasen_impuls", "", { breit: true })));
    teile.push(zeileMit("Minuten", v.phasen.map((p, i) => el("label", { class: "phase-min" }, SOZIALFORM_WORT[p.sozialform] + " ", feld("phasen_" + vorlage + "_" + i, p.min, { typ: "number", min: 1, max: 30 })))));
    teile.push(start(() => ({ impuls: FORM.phasen_impuls, min: v.phasen.map((p, i) => FORM["phasen_" + vorlage + "_" + i]) })));
  } else if (art === "rollen") {
    teile.push(zeileMit("alle", feld("rollen_min", 10, { typ: "number", min: 1, max: 60 }), "min"));
    teile.push(zeileMit("Rollen", feld("rollen_namen", "Fahrer, Navigator", { breit: true })));
    teile.push(start(() => ({ min: FORM.rollen_min, namen: FORM.rollen_namen })));
  } else if (art === "hilfe") {
    teile.push(el("p", { class: "naechster" }, "Die Handys zeigen eine Ampel mit Platznummer. Hier erscheint, wer wartet."));
    teile.push(start(() => ({})));
  } else if (art === "fortschritt" || art === "tempo" || art === "helfer") {
    teile.push(zeileMit("Aufgaben", Z.methoden.fortschritt && art !== "fortschritt" ? el("span", null, Z.methoden.fortschritt.aufgaben.join(", ")) : feld("aufgaben", aufgabenStandard, { breit: true })));
    teile.push(el("p", { class: "naechster" }, art === "tempo" ? "Wer eine Aufgabe abhakt, wartet an deren Haltestelle. Zwei Wartende werden ein Paar und vergleichen."
      : art === "helfer" ? "Wer fertig ist, setzt am Handy „ich helfe gern“. Wer rot oder gelb meldet, bekommt einen Helfer, der die Aufgabe schon hat."
      : "Die Handys haken die Aufgaben ab. Hier und auf Wunsch am Board: Balken je Aufgabe."));
    teile.push(start(() => ({ aufgaben: FORM.aufgaben || aufgabenStandard })));
  } else if (art === "wortwolke") {
    teile.push(zeileMit("Frage", feld("wolke_frage", "Ein Wort dazu:", { breit: true })));
    teile.push(zeileMit("Wörter", auswahlFeld("wolke_max", [[1, "1 Wort"], [2, "bis 2 Wörter"], [3, "bis 3 Wörter"]], 1)));
    teile.push(start(() => ({ frage: FORM.wolke_frage || "Ein Wort dazu:", max: FORM.wolke_max || 1 })));
  } else if (art === "zielscheibe") {
    teile.push(zeileMit("Frage", feld("ziel_frage", "Wie lief es für dich?", { breit: true })));
    teile.push(zeileMit("Ringe", feld("ziel_dim", ZIEL_DIMENSIONEN.join("\n"), { zeilen: 4, breit: true })));
    teile.push(start(() => ({ frage: FORM.ziel_frage, dimensionen: FORM.ziel_dim || ZIEL_DIMENSIONEN.join("\n") })));
  } else if (art === "exit") {
    const kontroll = SCHRITTE.filter((x) => x.schueler && ["abstimmung", "vorhersage"].includes(x.schueler.baustein));
    teile.push(zeileMit("Offen", feld("exit_offen", "Was war heute am unklarsten?", { breit: true })));
    if (kontroll.length) teile.push(zeileMit("dazu", auswahlFeld("exit_kontroll", [["", "keine Kontrollfrage"], ...kontroll.map((x) => [x.id, ein(x.schueler.frage || x.titel)])], "")));
    teile.push(start(() => ({ offen: FORM.exit_offen, kontroll: FORM.exit_kontroll })));
  }
  if (MENUE.find((x) => x.art === art).handy && !SERVER) teile.unshift(el("p", { class: "naechster", style: "color:var(--rot)" }, "Ohne Server keine Handys: die Methode läuft nur an der Tafel."));
  return el("div", { class: "methode-einstellung" }, teile);
}

function ansichtKnoepfe(art) {
  const m = Z.methoden[art];
  const gross = Z.buehne === art;
  const k = (text, aktiv, fn) => el("button", { class: "knopf klein" + (aktiv ? " aktiv" : ""), onclick: fn }, text);
  return el("span", { class: "methode-ansicht" }, el("span", { class: "etikett" }, "Board"),
    k("groß", gross, () => tun("buehne", { art: gross ? null : art })),
    k("klein", !gross && m.ansicht !== "aus", () => { if (gross) tun("buehne", { art: null }); tun("methodeAendern", { art, teil: { ansicht: "klein" } }); }),
    k("aus", !gross && m.ansicht === "aus", () => { if (gross) tun("buehne", { art: null }); tun("methodeAendern", { art, teil: { ansicht: "aus" } }); }));
}

function aktiveMethode(art) {
  const m = Z.methoden[art];
  const kopf = el("div", { class: "methode-aktiv-kopf" }, el("b", null, TITEL[art] + (m.titel && art !== "energizer" ? ": " + m.titel : "")),
    m.quelle ? el("span", { class: "naechster" }, "aus dem Schritt") : null,
    ansichtKnoepfe(art),
    el("button", { class: "knopf klein", onclick: () => methodeStoppen(art) }, "Beenden"));
  const teile = [];
  const k = (text, fn, haupt) => el("button", { class: "knopf klein" + (haupt ? " haupt" : ""), onclick: fn }, text);
  if (art === "energizer") {
    teile.push(zeileMit(m.titel, el("b", { class: "methode-uhr-klein", "data-rest": "energizer" }, ""),
      k(m.uhr.seit ? "Pause" : "Weiter", () => tun("methodeAendern", { art, teil: { uhr: m.uhr.seit ? zeitAnhalten(m.uhr) : zeitWeiter(m.uhr) } })),
      k("+1 min", () => tun("methodeAendern", { art, teil: { dauer: m.dauer + 60000 } })),
      m.begriff ? k("neuer Begriff", () => tun("methodeAendern", { art, teil: { begriff: zufall(begriffe(), m.begriff) } })) : null,
      m.aufgabe ? k("andere Aufgabe", () => tun("methodeAendern", { art, teil: { aufgabe: zufall(CODE_GOLF, m.aufgabe) } })) : null));
    if (m.begriff && m.begriff.erklaerung) teile.push(el("p", { class: "naechster" }, el("b", null, m.begriff.begriff + ": "), m.begriff.erklaerung));
  } else if (art === "phasen") {
    const st = phasenStand(m.phasen, laufzeit(m.uhr));
    teile.push(zeileMit("Phase " + (st.i + 1) + "/" + m.phasen.length, el("b", { class: "methode-uhr-klein", "data-rest": "phasen" }, ""),
      k(m.uhr.seit ? "Pause" : "Weiter", () => tun("methodeAendern", { art, teil: { uhr: m.uhr.seit ? zeitAnhalten(m.uhr) : zeitWeiter(m.uhr) } })),
      st.i < m.phasen.length - 1 ? k("nächste Phase", () => tun("methodeAendern", { art, teil: { uhr: zeitSetzen(m.uhr, phasenBeginn(m.phasen, st.i + 1)) } }), true) : null,
      k("+1 min", () => tun("methodeAendern", { art, teil: { phasen: m.phasen.map((p, i) => (i === st.i ? Object.assign({}, p, { min: Number(p.min) + 1 }) : p)) } }))));
    teile.push(el("div", { class: "naechster" }, m.phasen.map((p, i) => (i === st.i ? "▶ " : "") + (SOZIALFORM_WORT[p.sozialform] || p.sozialform) + " " + p.min + " min").join("   ")));
  } else if (art === "rollen") {
    const st = rollenStand(m);
    teile.push(zeileMit("Wechsel in", el("b", { class: "methode-uhr-klein", "data-rest": "rollen" }, ""), el("span", { class: "naechster" }, "bisher " + st.k),
      m.anCountdown ? null : k("jetzt tauschen", () => tun("methodeAendern", { art, teil: { uhr: zeitSetzen(m.uhr, (st.k + 1) * m.min * 60000) } }))));
  } else if (art === "hilfe") {
    const s = hilfeSchlange();
    const paare = (Z.methoden.helfer && Z.methoden.helfer.paare) || [];
    teile.push(s.length ? el("div", { class: "hilfe-regie" }, s.map((x) => {
      const pa = paare.find((p) => p.b === x.platz);
      return el("div", { class: "hilfe-zeile " + x.stufe },
        el("span", null, el("b", null, "Platz " + x.platz), " ", x.stufe === "rot" ? "komme nicht weiter" : "Frage", x.aufgabe ? ", " + x.aufgabe : "", pa ? ", Platz " + pa.a + " hilft" : ""),
        el("span", { class: "naechster", "data-seit": x.seit }, ""),
        k("erledigt", () => quittieren(x.platz), true));
    })) : el("p", { class: "naechster" }, "Niemand wartet. " + platzListe().length + " Plätze angemeldet."));
  } else if (art === "fortschritt") {
    teile.push(el("div", null, fortschrittZahlen().map((x) => el("div", { class: "balken-zeile klein" },
      el("span", { class: "name" }, x.aufgabe), el("div", { class: "bahn" }, el("div", { class: "balken", style: "width:" + (x.von ? (x.n / x.von) * 100 : 0) + "%" })), el("span", { class: "zahl" }, x.n + "/" + x.von)))));
    const { aufgaben, stand } = aufgabenStand();
    const hinten = Object.entries(stand).filter(([, st]) => st.i < 0).map(([p]) => p);
    if (hinten.length) teile.push(el("p", { class: "naechster" }, "Noch nichts abgehakt: Platz " + hinten.join(", ")));
    if (aufgaben.length) teile.push(el("div", { class: "zeile" }, k("Meldungen leeren", () => { if (confirm("Alle Meldungen (Ampel und Fortschritt) dieser Stunde löschen?")) meldungenLeeren(); })));
  } else if (art === "tempo") {
    const d = duettBerechnen(m);
    teile.push(el("div", null, m.paare.map((p) => el("div", null, el("b", null, "Platz " + p.a + " + Platz " + p.b), " an Haltestelle " + p.aufgabe)),
      d.wartend.length ? el("p", { class: "naechster" }, "Wartet: " + d.wartend.map((w) => "Platz " + w.platz + " (" + w.aufgabe + ")").join(", ")) : null,
      el("p", { class: "naechster" }, "Abgeschlossene Paare: " + (m.fertig || 0))));
  } else if (art === "helfer") {
    const d = helferBerechnen(m);
    teile.push(el("div", null, m.paare.map((p) => el("div", null, el("b", null, "Platz " + p.a), " hilft ", el("b", null, "Platz " + p.b), p.aufgabe ? " bei " + p.aufgabe : "")),
      d.offen.length ? el("p", { class: "naechster" }, "Ohne Helfer: Platz " + d.offen.map((x) => x.platz).join(", ")) : null,
      el("p", { class: "naechster" }, "Helfen gern: " + (d.frei.length ? "Platz " + d.frei.join(", ") : "niemand frei"))));
  } else if (FRAGE_METHODEN.includes(art)) {
    teile.push(frageRegie(m.id));
  }
  return el("div", { class: "methode-aktiv" }, kopf, teile);
}

/* Regie-Teil einer Handy-Frage (spontan oder aus dem Schritt): freigeben, Zahl, Ergebnis, bei Exit die Antworten */
function frageRegie(id) {
  const d = frageDef(id) || {};
  const offen = Z.freigabe === id;
  const n = teilnehmerVon(id);
  const teile = [];
  if (SERVER) teile.push(el("div", { class: "zeile", style: "margin-bottom:8px" },
    el("button", { class: "knopf klein" + (offen ? " aktiv" : " haupt"), onclick: () => (offen ? freigabeBeenden() : freigebenId(id)) }, offen ? "Handys schließen" : "Für Handys freigeben"),
    el("span", { class: "naechster" }, Z.raum ? n + (d.kennung === "team" ? " Teams" : " Handys") + " geantwortet" + (Z.verbindung === "fehler" ? ", Server nicht erreichbar" : "") : "noch kein Raum")));
  if (d.baustein === "exit") teile.push(exitRegie(id));
  else if (d.baustein === "wortwolke") teile.push(wolkeRegie(id));
  else teile.push(el("div", { class: "methode-ergebnis-klein" }, ergebnisAnsicht(id, { rolle: "regie" })));
  return el("div", null, teile);
}

async function quittieren(platz) {
  if (!Z.raum) return;
  try { await serverRufen("/api/raum/" + Z.raum.code + "/verwalten", { token: Z.raum.token, was: "quittieren", platz }); await abholen(true); } catch (e) { alert("Nicht angekommen: " + e.message); }
}
async function meldungenLeeren() {
  if (!Z.raum) return;
  try { await serverRufen("/api/raum/" + Z.raum.code + "/verwalten", { token: Z.raum.token, was: "leeren" }); await abholen(true); } catch (e) { alert("Nicht angekommen: " + e.message); }
}

function methodenKarte() {
  const gruppen = [];
  for (const e of MENUE) {
    let g = gruppen.find((x) => x.name === e.gruppe);
    if (!g) gruppen.push((g = { name: e.gruppe, eintraege: [] }));
    g.eintraege.push(e);
  }
  const menue = el("div", { class: "methoden-menue" }, gruppen.map((g) => el("div", { class: "methoden-gruppe" },
    el("div", { class: "etikett" }, g.name),
    el("div", { class: "methoden-knoepfe" }, g.eintraege.map((e) => el("button", {
      class: "methode-knopf" + (methodeWahl === e.schluessel ? " aktiv" : "") + (Z.methoden[e.art] ? " laeuft" : ""),
      title: e.kurz,
      onclick: () => { methodeWahl = methodeWahl === e.schluessel ? null : e.schluessel; neuZeichnen(); },
    }, e.titel))))));
  return el("div", { class: "karte methoden-karte" }, el("h2", null, "Methoden"),
    Object.keys(Z.methoden).map(aktiveMethode),
    menue,
    methodeWahl ? einstellungen(methodeWahl) : null);
}
