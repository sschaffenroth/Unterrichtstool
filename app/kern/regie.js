/* Regie: Ablauf mit Soll/Ist, Vorschau und Ansicht je Anzeige, Notizen, Zähler, Handzeichen.
   Läuft als eigenes Fenster (Laptop) oder als Schublade über der Tafel. */
"use strict";

const ANSICHTEN = [["geteilt", "Geteilt"], ["tafel", "Tafel"], ["auftrag", "Auftrag"], ["extern", "Extern"], ["schwarz", "Schwarz"]];
let tonEinstellung = (() => { try { return localStorage.getItem("tafelsystem:ton") || "extern"; } catch (e) { return "extern"; } })();
const signalisiert = {};

function regieInhalt(modus) {
  const s = schritt();
  const p = prognose();
  const laeuft = Z.uhr.laeuft;

  const kopf = el("div", { class: "regie-kopf" },
    el("span", { class: "fach" }, STUNDE.stunde.fach + " " + (STUNDE.stunde.nr ?? "")),
    el("h1", null, STUNDE.stunde.titel),
    el("span", { class: "uhr", "data-uhrzeit": "" }, ""),
    el("span", { class: "lauf", "data-stundenzeit": "" }, ""),
    el("span", { class: "prognose" + (p.ueber > 60000 ? " spaet" : ""), "data-prognose": "", title: "Ende, wenn alle restlichen Schritte ihre Sollzeit brauchen" }, ""),
    el("div", { class: "rechts" },
      el("button", { class: "knopf" + (laeuft ? "" : " haupt"), onclick: () => {
        tun(laeuft ? "uhrPause" : "uhrStart");
        if (!laeuft && modus !== "schublade" && geraet().autoStart !== false) alleFensterOeffnen();
        if (!laeuft && !Z.raum && SERVER && SCHRITTE.some((x) => x.schueler)) raumAnlegen();
      } }, laeuft ? "Uhr anhalten" : Z.uhr.basis ? "Uhr weiter" : "Stunde starten"),
      handyKnoepfe(),
      modus !== "schublade" ? el("button", { class: "knopf", title: "Board im Vollbild auf seinem Monitor, weitere Fenster auf ihre Monitore", onclick: alleFensterOeffnen }, "Fenster öffnen") : null,
      modus === "fenster" ? el("button", { class: "knopf", title: "Dieses Fenster zeigt das Board, die Regie liegt dann hinter ☰", onclick: () => { location.hash = "anzeige=" + alleAnzeigen()[0]; location.reload(); } }, "Hier " + alleAnzeigen()[0] + " zeigen") : null,
      el("select", { class: "knopf", title: "Ton bei Soll-Ende", onchange: (e) => { tonEinstellung = e.target.value; try { localStorage.setItem("tafelsystem:ton", tonEinstellung); } catch (x) {} } },
        [["extern", "Ton: nur bei Extern"], ["alle", "Ton: jeder Schritt"], ["aus", "Ton: aus"]].map(([w, t]) => el("option", { value: w, selected: w === tonEinstellung }, t))),
      el("button", { class: "knopf", onclick: befundExport }, "Zeiten sichern"),
      el("button", { class: "knopf", onclick: () => { if (confirm("Alle Zeiten, Zähler und Stimmen dieser Stunde löschen?")) tun("ruecksetzen"); } }, "Zurücksetzen"),
      modus === "schublade" ? el("button", { class: "knopf haupt", onclick: () => document.querySelector(".schublade").remove() }, "Schließen") : null));

  /* Spalte 1: Ablauf */
  const ablauf = el("ul", { class: "ablauf" });
  let letzterAbschnitt = null;
  SCHRITTE.forEach((x, i) => {
    if (x.abschnitt && x.abschnitt !== letzterAbschnitt) { letzterAbschnitt = x.abschnitt; ablauf.append(el("li", { class: "abschnitt-kopf" }, x.abschnitt)); }
    const aktiv = istAktiv(x);
    const ist = schrittzeit(x.id);
    const ueber = ist > x.soll_min * 60000;
    ablauf.append(el("li", {
      class: "eintrag" + (i === Z.schritt ? " aktiv" : "") + (i < Z.schritt ? " erledigt" : "") + (aktiv ? "" : " aus"),
      onclick: () => aktiv && tun("gehe", { index: i }),
    },
      el("span", { class: "name" }, x.titel),
      el("span", { class: "zeiten" }, ist ? el("span", { class: ueber ? "ueber" : "", "data-ist": x.id }, formatMinSek(ist)) : el("span", { "data-ist": x.id }, ""), " / " + x.soll_min + "′"),
      el("div", { class: "merkmale" },
        x.pruefpunkt ? el("span", { class: "pp" }, "Prüfpunkt") : null,
        x.kuerzen === "nie" ? el("span", { class: "nie" }, "nie kürzen") : x.kuerzen === "ja" ? el("span", null, "kürzbar") : null,
        x.schueler ? el("span", null, x.schueler.baustein) : null,
        x.zeige ? el("span", null, Object.values(x.zeige).join(", ")) : null,
        x.ausgeblendet ? el("button", { class: "knopf klein", onclick: (e) => { e.stopPropagation(); tun("einschalten", { id: x.id, an: !aktiv }); } }, aktiv ? "ausblenden" : "einschalten") : null)));
  });

  /* Spalte 2: aktueller Schritt */
  const naechster = SCHRITTE[naechsterIndex(1)];
  const mitte = el("div", { class: "spalte" },
    el("div", { class: "karte", "data-schrittkarte": "" },
      el("h2", null, s.abschnitt || "Schritt"),
      el("p", { class: "schritt-titel" }, s.titel),
      el("div", { class: "schritt-zeit" },
        el("span", { class: "gross", "data-schrittzeit": "" }, ""), el("span", null, "von " + s.soll_min + " min"),
        Z.countdown ? el("span", null, "Countdown ", el("b", { "data-countdown": s.id }, "")) : null)),
    el("div", { class: "schritt-steuerung" },
      el("button", { class: "knopf", onclick: () => tun("zurueck") }, "‹ Zurück"),
      el("button", { class: "knopf haupt weiter", onclick: () => tun("weiter") }, naechster ? "Weiter: " + naechster.titel + " ›" : "Ende der Stunde")),
    ueberwachenKarte(),
    steuerKarte(s),
    modus !== "schublade" ? fensterKarte() : null,
    sicherungKarte());

  /* Spalte 3: Notizen, Handzeichen, Zähler */
  const r = s.regie || {};
  const notizen = el("div", { class: "karte" }, el("h2", null, "Notizen"),
    r.notiz ? el("div", { class: "notiz-block" }, el("p", null, r.notiz)) : null,
    r.erwartet ? el("div", { class: "notiz-block erwartet" }, el("h3", null, "Erwartet"), el("p", null, r.erwartet)) : null,
    r.wenn_es_stockt ? el("div", { class: "notiz-block stockt" }, el("h3", null, "Wenn es stockt"), el("p", null, r.wenn_es_stockt)) : null,
    (r.einwaende || []).length ? el("div", { class: "notiz-block" }, el("h3", null, "Einwände"), r.einwaende.map((x) => el("div", { class: "frage-paar" }, el("div", { class: "f" }, x.einwand), el("div", { class: "a" }, x.antwort)))) : null,
    (r.kontrollfragen || []).length ? el("div", { class: "notiz-block" }, el("h3", null, "Kontrollfragen"), r.kontrollfragen.map((x) => el("div", { class: "frage-paar" }, el("div", { class: "f" }, x.frage), el("div", { class: "a" }, x.antwort)))) : null,
    !r.notiz && !r.erwartet && !r.wenn_es_stockt && !(r.einwaende || []).length && !(r.kontrollfragen || []).length ? el("p", { class: "naechster" }, "Keine Notizen zu diesem Schritt.") : null);

  const rechts = el("div", { class: "spalte" }, notizen, handzeichenKarte(s), zaehlerKarte(s),
    naechster ? el("div", { class: "karte naechster" }, "Als Nächstes: ", el("b", null, naechster.titel), " · " + naechster.soll_min + " min",
      naechster.regie && naechster.regie.notiz ? el("div", { style: "margin-top:6px" }, naechster.regie.notiz) : null) : null);

  return el("div", { class: "regie" }, kopf,
    el("div", { class: "regie-rumpf" }, el("div", { class: "spalte" }, el("div", { class: "karte" }, el("h2", null, "Ablauf"), ablauf)), mitte, rechts));
}

/* Überwachen: durch alle Ansichten schalten (Anzeigen und Handys). Nur zum Ansehen, nichts davon geht aufs Board. */
let ueberwachenTab = "alle";
function ueberwachenKarte() {
  const namen = alleAnzeigen();
  const tabs = [["alle", "Alle"], ...namen.map((n) => [n, n]), ["handys", "Handys"]];
  if (!tabs.some(([t]) => t === ueberwachenTab)) ueberwachenTab = "alle";
  const leiste = el("div", { class: "zeile", style: "margin-bottom:10px" },
    tabs.map(([t, text]) => el("button", { class: "knopf klein" + (t === ueberwachenTab ? " aktiv" : ""), onclick: () => { ueberwachenTab = t; neuZeichnen(); } }, text)));
  let inhalt;
  if (ueberwachenTab === "alle") {
    inhalt = el("div", { class: "ueberwachen-raster" },
      namen.map((n) => el("div", null, el("div", { class: "ueberwachen-titel" }, n + " · " + ansichtName(ansichtVon(n)) + (fensterOffen(n) ? "" : " · Fenster zu")), vorschau(n))),
      el("div", null, el("div", { class: "ueberwachen-titel" }, "Handys"), handyVorschau(false)));
  } else if (ueberwachenTab === "handys") {
    inhalt = handyVorschau(true);
  } else {
    const wert = ansichtVon(ueberwachenTab);
    inhalt = el("div", null,
      el("div", { class: "zeile", style: "margin-bottom:8px" }, el("span", { class: "etikett" }, "zeigt"), ANSICHTEN.map(([w, t]) =>
        el("button", { class: "knopf klein" + (w === wert ? " aktiv" : ""), onclick: () => tun("ansicht", { anzeige: ueberwachenTab, wert: w }) }, t))),
      vorschau(ueberwachenTab));
  }
  return el("div", { class: "karte" }, el("h2", null, "Überwachen"), leiste, inhalt);
}
function ansichtName(w) { return (ANSICHTEN.find(([x]) => x === w) || [w, w])[1]; }
function vorschau(name) {
  const rahmen = el("div", { class: "vorschau-rahmen" });
  const buehne = anzeigeInhalt(name, "vorschau");
  rahmen.append(buehne);
  requestAnimationFrame(() => { const r = rahmen.getBoundingClientRect(); einpassen(buehne, r.width, r.height); countdownsAktualisieren(rahmen); });
  return rahmen;
}

/* Was die Schüler am Handy sehen, nachgebaut aus dem Zustand */
function handyVorschau(gross) {
  const s = Z.freigabe ? schrittNachId(Z.freigabe) : null;
  const sch = s && s.schueler;
  const online = sch ? ((Z.online.stimmen || {})[s.id] || {}) : {};
  const antworten = sch ? ((Z.online.teilnehmer || {})[s.id] || 0) : 0;
  let bildschirm;
  if (!Z.raum) {
    bildschirm = el("div", { class: "handy-warten" }, "Noch kein Raum. „Handys verbinden“ oder „Stunde starten“ legt ihn an.");
  } else if (sch) {
    bildschirm = el("div", null,
      el("div", { class: "handy-frage" }, sch.frage || s.titel),
      sch.kennung === "team" ? el("div", { class: "handy-klein" }, "Eure Teamnummer: [  ]") : null,
      sch.mehrfach ? el("div", { class: "handy-klein" }, "Mehrere Antworten möglich.") : null,
      (sch.optionen || []).map((o) => el("div", { class: "handy-option" }, el("span", { class: "handy-kreis" + (sch.mehrfach ? " eckig" : "") }), el("span", null, o), el("b", { class: "handy-zahl" }, online[o] || ""))),
      el("div", { class: "handy-knopf" }, "Senden"),
      el("div", { class: "handy-klein", style: "margin-top:8px;color:#2f8f4e;font-weight:600" }, antworten + (sch.kennung === "team" ? " Teams" : " Handys") + " haben geantwortet"));
  } else {
    bildschirm = el("div", { class: "handy-warten" }, el("div", { class: "handy-punkte" }, "● ● ●"), "Angemeldet. Warte auf die nächste Frage …");
  }
  const handy = el("div", { class: "handy" + (gross ? " gross" : "") },
    el("div", { class: "handy-kopf" }, el("span", null, el("b", null, "Mitmachen"), " · ohne Namen"), el("span", null, Z.raum ? "Raum " + Z.raum.code : "")),
    el("div", { class: "handy-inhalt" }, bildschirm));
  const anmeldung = Z.raum ? el("div", { class: "handy-anmeldung" },
    el("div", { class: "qr", html: qrFuer(anmeldeAdresse()) }),
    el("div", null,
      el("div", { style: "font-weight:700;color:var(--orange)" }, "Anmeldung"),
      el("div", null, anmeldeKurz()),
      el("div", null, "Code ", el("b", null, Z.raum.code)),
      el("a", { href: anmeldeAdresse(), target: "_blank", rel: "noopener" }, "Schüler-Seite öffnen"),
      Z.verbindung === "fehler" ? el("div", { style: "color:var(--rot);font-weight:600" }, "Server nicht erreichbar") : null)) : null;
  return el("div", { class: "handy-bereich" + (gross ? " gross" : "") }, handy, gross ? anmeldung : (anmeldung ? el("div", { class: "handy-klein" }, anmeldeKurz()) : null));
}

function anzeigeKarte(name) {
  const wert = ansichtVon(name);
  const rahmen = el("div", { class: "vorschau-rahmen" });
  const buehne = anzeigeInhalt(name, "vorschau");
  rahmen.append(buehne);
  requestAnimationFrame(() => { const r = rahmen.getBoundingClientRect(); einpassen(buehne, r.width, r.height); countdownsAktualisieren(rahmen); });
  return el("div", { class: "karte" },
    el("h2", null, name + " zeigt"),
    el("div", { class: "zeile", style: "margin-bottom:8px" }, ANSICHTEN.map(([w, t]) =>
      el("button", { class: "knopf klein" + (w === wert ? " aktiv" : ""), onclick: () => tun("ansicht", { anzeige: name, wert: w }) }, t))),
    rahmen);
}

function steuerKarte(s) {
  const teile = [];
  if (s.tafel && s.tafel.reiter.length > 1) {
    const idx = Z.reiter[s.id] || 0;
    teile.push(el("div", { class: "zeile" }, el("span", { class: "etikett" }, "Reiter"),
      s.tafel.reiter.map((r, i) => el("button", { class: "knopf klein" + (i === idx ? " aktiv" : ""), onclick: () => tun("reiter", { id: s.id, index: i }) }, r.titel || "Teil " + (i + 1)))));
  }
  if (s.tafel) {
    const idx = Math.min(Z.reiter[s.id] || 0, s.tafel.reiter.length - 1);
    const b = s.tafel.reiter[idx];
    const schluessel = s.id + ":" + idx;
    if (b.baustein === "code" && (b.marken || []).length) {
      const n = Z.marken[schluessel] || 0;
      teile.push(el("div", { class: "zeile" }, el("span", { class: "etikett" }, "Marken " + n + "/" + b.marken.length),
        el("button", { class: "knopf klein haupt", onclick: () => tun("marke", { schluessel, anzahl: Math.min(b.marken.length, n + 1) }) }, n < b.marken.length ? "Nächste: " + b.marken[n].label : "alle offen"),
        el("button", { class: "knopf klein", onclick: () => tun("marke", { schluessel, anzahl: n - 1 }) }, "eine zurück"),
        el("button", { class: "knopf klein", onclick: () => tun("marke", { schluessel, anzahl: 0 }) }, "alle zu")));
    }
  }
  if (Z.countdown) {
    const c = Z.countdown;
    teile.push(el("div", { class: "zeile" }, el("span", { class: "etikett" }, "Countdown"),
      el("button", { class: "knopf klein", onclick: () => tun("countdown", { was: c.seit ? "pause" : "start" }) }, c.seit ? "Pause" : "Start"),
      el("button", { class: "knopf klein", onclick: () => tun("countdown", { was: "minus" }) }, "−1 min"),
      el("button", { class: "knopf klein", onclick: () => tun("countdown", { was: "plus" }) }, "+1 min"),
      el("button", { class: "knopf klein", onclick: () => tun("countdown", { was: "neu" }) }, "neu starten")));
  }
  // Ergebnisse früherer Schüler-Schritte auf das Board legen
  const quellen = SCHRITTE.filter((x) => x.schueler && ["abstimmung", "vorhersage"].includes(x.schueler.baustein) && SCHRITTE.indexOf(x) <= Z.schritt);
  if (quellen.length) {
    teile.push(el("div", { class: "zeile" }, el("span", { class: "etikett" }, "Ergebnis zeigen"),
      quellen.map((x) => {
        const an = Z.overlay && Z.overlay.von.includes(x.id);
        const mitLoesung = vorhersageAufgeloest(x.id, schritt());
        return el("button", { class: "knopf klein" + (an ? " aktiv" : ""), onclick: () => tun("overlay", { wert: an ? null : { von: [x.id], loesung: mitLoesung } }) }, x.titel + (x.schueler.baustein === "vorhersage" && mitLoesung ? " (mit Lösung)" : ""));
      })));
  }
  if (!teile.length) return null;
  return el("div", { class: "karte" }, el("h2", null, "Steuerung"), teile.map((t) => el("div", { style: "margin-bottom:8px" }, t)));
}

function handyKnoepfe() {
  if (!SERVER) return null;
  if (!Z.raum) return el("button", { class: "knopf", title: "Raum auf dem Server anlegen: QR-Code und Link für die Handys", onclick: raumAnlegen }, "Handys verbinden");
  const an = Z.overlay && Z.overlay.anmelden;
  return el("span", { class: "handys" },
    el("span", { class: "raum-chip" + (Z.verbindung === "fehler" ? " fehler" : ""), title: anmeldeAdresse() }, (Z.verbindung === "fehler" ? "⚠ " : "● ") + "Raum " + Z.raum.code),
    el("button", { class: "knopf" + (an ? " aktiv" : ""), onclick: () => tun("overlay", { wert: an ? null : { anmelden: true } }) }, an ? "QR vom Board" : "Anmelde-QR aufs Board"),
    el("button", { class: "knopf", title: "Link kopieren", onclick: () => { try { navigator.clipboard.writeText(anmeldeAdresse()); } catch (e) {} } }, "Link kopieren"),
    el("button", { class: "knopf", onclick: raumLoeschen }, "Raum löschen"));
}

function handzeichenKarte(s) {
  const sch = s.schueler;
  if (!sch || !["abstimmung", "vorhersage"].includes(sch.baustein)) return null;
  const st = Z.stimmen[s.id] || {};
  const online = (Z.online.stimmen || {})[s.id] || {};
  const antworten = (Z.online.teilnehmer || {})[s.id] || 0;
  const offen = Z.freigabe === s.id;
  const freigabeZeile = SERVER ? el("div", { class: "zeile", style: "margin-bottom:10px" },
    el("button", { class: "knopf" + (offen ? " aktiv" : " haupt"), onclick: () => (offen ? freigabeBeenden() : freigeben(s)) }, offen ? "Handys schließen" : "Für Handys freigeben"),
    el("span", { class: "naechster" }, Z.raum ? antworten + (sch.kennung === "team" ? " Teams" : " Handys") + " geantwortet" + (Z.verbindung === "fehler" ? " · Server nicht erreichbar" : "") : "noch kein Raum")) : null;
  return el("div", { class: "karte" },
    el("h2", null, (sch.baustein === "vorhersage" ? "Vorhersage" : "Abstimmung") + (sch.kennung === "team" ? " · je Team" : "") + " · Handy und Handzeichen"),
    el("p", { style: "margin:0 0 8px;font-weight:600" }, sch.frage || ""),
    freigabeZeile,
    (sch.optionen || []).map((o) => el("div", { class: "zaehler-zeile" + (o === sch.loesung ? " loesung" : "") },
      el("span", null, o, online[o] ? el("span", { class: "online-zahl" }, " + " + online[o] + " 📱") : null),
      el("button", { class: "knopf", onclick: () => tun("stimme", { id: s.id, option: o, delta: -1 }) }, "−"),
      el("span", { class: "z" }, st[o] || 0),
      el("button", { class: "knopf", onclick: () => tun("stimme", { id: s.id, option: o, delta: 1 }) }, "+"))),
    sch.mehrfach ? el("p", { class: "naechster", style: "margin:4px 0 0" }, "Mehrfachauswahl: je Option zählen.") : null,
    sch.aufloesen_in ? el("p", { class: "naechster", style: "margin:4px 0 0" }, "Auflösung in: " + (schrittNachId(sch.aufloesen_in) || {}).titel) : null);
}

function zaehlerKarte(s) {
  const namen = (s.regie && s.regie.zaehler) || [];
  if (!namen.length) return null;
  const t = Z.zaehler[s.id] || {};
  return el("div", { class: "karte" }, el("h2", null, "Zähler für den Befund"),
    namen.map((n) => el("div", { class: "zaehler-zeile" },
      el("span", null, n),
      el("button", { class: "knopf", onclick: () => tun("zaehler", { id: s.id, name: n, delta: -1 }) }, "−"),
      el("span", { class: "z" }, t[n] || 0),
      el("button", { class: "knopf", onclick: () => tun("zaehler", { id: s.id, name: n, delta: 1 }) }, "+"))));
}

/* laufende Werte ohne neues Zeichnen */
function regieTakt(wurzel) {
  const s = schritt();
  const t = schrittzeit(s.id);
  const soll = s.soll_min * 60000;
  const set = (sel, text, fn) => { for (const e of wurzel.querySelectorAll(sel)) { e.textContent = text; if (fn) fn(e); } };
  const d = new Date();
  set("[data-uhrzeit]", String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"));
  set("[data-stundenzeit]", formatMinSek(stundenzeit()) + " von " + STUNDE.stunde.dauer + " min");
  const p = prognose();
  const gestartet = Z.uhr.laeuft || Z.uhr.basis > 0;
  set("[data-prognose]", gestartet ? "Prognose " + formatMin(p.ueber) : "nicht gestartet", (e) => e.classList.toggle("spaet", gestartet && p.ueber > 60000));
  set("[data-schrittzeit]", formatMinSek(t), (e) => e.classList.toggle("ueber", t > soll));
  set("[data-ist='" + s.id + "']", formatMinSek(t), (e) => e.classList.toggle("ueber", t > soll));
  countdownsAktualisieren(wurzel);
  if (Z.uhr.laeuft && t >= soll && !signalisiert[s.id + ":" + Z.schrittBeginn]) {
    signalisiert[s.id + ":" + Z.schrittBeginn] = true;
    const k = wurzel.querySelector("[data-schrittkarte]");
    if (k) { k.classList.remove("signal"); void k.offsetWidth; k.classList.add("signal"); }
    const extern = alleAnzeigen().some((n) => ansichtVon(n) === "extern");
    if (tonEinstellung === "alle" || (tonEinstellung === "extern" && extern)) signalTon();
  }
}

function regieZeichnen(ziel, modus) {
  const ablauf = ziel.querySelector(".ablauf");
  const scroll = ablauf ? ablauf.scrollTop : null;
  const seite = ziel.scrollTop;
  ziel.replaceChildren(regieInhalt(modus));
  if (scroll != null) ziel.querySelector(".ablauf").scrollTop = scroll;
  else { const a = ziel.querySelector(".eintrag.aktiv"); if (a) a.scrollIntoView({ block: "center" }); }
  ziel.scrollTop = seite;
  regieTakt(ziel);
}

let regieEingerichtet = false;
function regieStarten(modus) {
  ROLLE = "regie";
  REGIE_MODUS = modus;
  document.title = "Regie · " + STUNDE.stunde.titel;
  document.body.classList.add("regie-seite");
  const ziel = document.getElementById("app");
  ziel.replaceChildren();
  if (!regieEingerichtet) {
    regieEingerichtet = true;
    beobachten(() => { if (ROLLE === "regie") regieZeichnen(ziel, REGIE_MODUS); });
    setInterval(() => { if (ROLLE === "regie") regieTakt(ziel); }, 500);
    let groesse = 0;
    addEventListener("resize", () => { clearTimeout(groesse); groesse = setTimeout(() => { if (ROLLE === "regie") regieZeichnen(ziel, REGIE_MODUS); }, 150); });
  }
  regieZeichnen(ziel, modus);
}

function regieSchublade() {
  if (document.querySelector(".schublade")) { document.querySelector(".schublade").remove(); return; }
  const innen = el("div", { class: "regie-huelle" });
  const schublade = el("div", { class: "schublade", onclick: (e) => { if (e.target === schublade) schublade.remove(); } }, innen);
  document.body.append(schublade);
  const zeichnen = () => { if (document.body.contains(schublade)) regieZeichnen(innen, "schublade"); };
  beobachten(zeichnen);
  const takt = setInterval(() => { if (!document.body.contains(schublade)) clearInterval(takt); else regieTakt(innen); }, 500);
  zeichnen();
}

function befundExport() {
  const t = stundenzeit();
  const daten = {
    stunde: STUNDE.stunde, exportiert: new Date().toISOString(), stundenzeit_min: +(t / 60000).toFixed(1),
    schritte: SCHRITTE.map((x) => ({ id: x.id, titel: x.titel, soll_min: x.soll_min, ist_min: +(schrittzeit(x.id) / 60000).toFixed(1), aktiv: istAktiv(x) })),
    zaehler: Z.zaehler, stimmen: Z.stimmen,
  };
  herunterladen("Befund_" + STUNDE.stunde.fach + "_" + STUNDE.stunde.nr + "_" + (STUNDE.stunde.datum || datumHeute()) + ".json", JSON.stringify(daten, null, 2), "application/json");
}
