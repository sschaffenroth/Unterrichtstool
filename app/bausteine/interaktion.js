/* Ergebnisse der Handy-Fragen auf Tafel und Regie: Wortwolke, Zielscheibe, Exit-Ticket, Hotspot,
   Codezeilen ordnen, Fehlerzeile, Abstimmung mit Sicherheit.
   Die Fragen kommen aus einem Schritt (schueler: …) oder spontan aus dem Methoden-Menü (Z.spontan). */
"use strict";

const BAUSTEIN_TITEL = { abstimmung: "Abstimmung", vorhersage: "Vorhersage", wortwolke: "Wortwolke", zielscheibe: "Zielscheibe", exit: "Exit-Ticket",
  hotspot: "Auf dem Bild tippen", ordnen: "Codezeilen ordnen", fehlerzeile: "Fehlerzeile antippen" };
const WOLKE_FARBEN = ["#e8730c", "#2b5cab", "#1d1d1f", "#2f8f4e", "#8a4fb3", "#c23b22"];
function streuwert(text) { let h = 2166136261; for (const c of String(text)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }

/* Ansicht je Fragetyp. opt.rolle: "board" | "regie" | "tafel"; opt.loesung: Lösung zeigen */
function ergebnisAnsicht(id, opt = {}) {
  const d = frageDef(id);
  if (!d) return el("div", { class: "leer-hinweis" }, "Keine Frage „" + id + "“.");
  const typ = d.baustein;
  if (typ === "wortwolke") return wolkeAnsicht(id);
  if (typ === "zielscheibe") return zielscheibeAnsicht(id, d);
  if (typ === "hotspot") return hotspotAnsicht(id, d, opt.loesung);
  if (typ === "ordnen") return ordnenAnsicht(id, d, opt.loesung);
  if (typ === "fehlerzeile") return fehlerzeileAnsicht(id, d, opt.loesung);
  if (typ === "exit") return exitBoard(id, d);
  return ergebnisBlock(id, opt.loesung);
}

/* ------------------------------------------------------------------ Wortwolke */
function wolkeZaehlen(id) {
  const zahl = {}, form = {};
  for (const a of antwortenVon(id)) for (const w of a.woerter || []) {
    const k = w.toLowerCase();
    zahl[k] = (zahl[k] || 0) + 1;
    form[k] = form[k] || {};
    form[k][w] = (form[k][w] || 0) + 1;
  }
  return Object.keys(zahl).map((k) => ({ k, n: zahl[k], text: Object.entries(form[k]).sort((a, b) => b[1] - a[1])[0][0] }));
}
function wolkeAnsicht(id) {
  const aus = Z.versteckt[id] || [];
  const woerter = wolkeZaehlen(id).filter((w) => !aus.includes(w.k));
  if (!woerter.length) return el("div", { class: "b-wolke leer" }, el("div", { class: "leer-hinweis" }, "Noch keine Wörter."));
  const max = Math.max(...woerter.map((w) => w.n));
  woerter.sort((a, b) => streuwert(a.k) - streuwert(b.k));
  return el("div", { class: "b-wolke" }, woerter.map((w) => el("span", {
    class: "wolke-wort",
    style: "font-size:" + (1.4 + 4.2 * Math.sqrt(w.n / max)).toFixed(2) + "em;color:" + WOLKE_FARBEN[Math.floor(streuwert(w.k + "f") * WOLKE_FARBEN.length)],
    title: w.n + "×",
  }, w.text)));
}
function wolkeRegie(id) {
  const aus = Z.versteckt[id] || [];
  const woerter = wolkeZaehlen(id).sort((a, b) => b.n - a.n);
  return el("div", null,
    woerter.length ? el("div", { class: "wolke-regie" }, woerter.map((w) => {
      const versteckt = aus.includes(w.k);
      return el("button", { class: "knopf klein" + (versteckt ? " durch" : ""), title: versteckt ? "wieder zeigen" : "an der Tafel ausblenden", onclick: () => tun("verstecken", { id, wort: w.k, an: !versteckt }) }, w.text + " " + w.n);
    })) : el("p", { class: "naechster" }, "Noch keine Wörter."),
    woerter.length ? el("p", { class: "naechster" }, "Antippen blendet ein Wort an der Tafel aus.") : null);
}

/* ------------------------------------------------------------------ Zielscheibe */
/* Mitte = 4 (volle Zustimmung), außen = 0. Je Ring ein Sektor, je Antwort ein Punkt, dazu der Mittelwert. */
function zielscheibeAnsicht(id, d) {
  const dim = d.dimensionen || ZIEL_DIMENSIONEN;
  const antworten = antwortenVon(id).filter((a) => Array.isArray(a.werte));
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "-160 -130 320 260");
  svg.setAttribute("class", "zielscheibe");
  const teil = (tag, a, text) => { const e = document.createElementNS(ns, tag); for (const k in a) e.setAttribute(k, a[k]); if (text != null) e.textContent = text; svg.append(e); return e; };
  const R = 100;
  const radius = (wert) => R * (1 - wert / 5) - R / 10;   // 4 → 10, 0 → 90
  for (let ring = 5; ring >= 1; ring--) teil("circle", { cx: 0, cy: 0, r: (R * ring) / 5, fill: ring % 2 ? "#fdf0e4" : "#fff", stroke: "#dcd9d2", "stroke-width": 0.8 });
  const n = dim.length;
  const winkel = (i) => (-Math.PI / 2) + (2 * Math.PI * i) / n;
  for (let i = 0; i < n; i++) {
    const w = winkel(i);
    teil("line", { x1: 0, y1: 0, x2: R * Math.cos(w), y2: R * Math.sin(w), stroke: "#a9a8a3", "stroke-width": 0.8 });
    const mitte = winkel(i + 0.5);
    const lx = (R + 8) * Math.cos(mitte), ly = (R + 8) * Math.sin(mitte);
    const t = teil("text", { x: lx, y: ly, "font-size": 8.5, "text-anchor": Math.abs(Math.cos(mitte)) < 0.2 ? "middle" : Math.cos(mitte) > 0 ? "start" : "end", "dominant-baseline": "middle", fill: "#1d1d1f" });
    wortUmbruch(dim[i], 22).forEach((z, j, alle) => { const ts = document.createElementNS(ns, "tspan"); ts.setAttribute("x", lx); ts.setAttribute("dy", j ? "1.15em" : -(alle.length - 1) * 0.55 + "em"); ts.textContent = z; t.append(ts); });
  }
  antworten.forEach((a, k) => {
    for (let i = 0; i < n; i++) {
      const v = a.werte[i];
      if (v == null) continue;
      const w = winkel(i + 0.15 + 0.7 * streuwert(k + ":" + i));
      const r = radius(v) + (streuwert(i + "r" + k) - 0.5) * 12;
      teil("circle", { cx: r * Math.cos(w), cy: r * Math.sin(w), r: 3.2, fill: "#2b5cab", "fill-opacity": 0.75 });
    }
  });
  if (antworten.length) {
    for (let i = 0; i < n; i++) {
      const werte = antworten.map((a) => a.werte[i]).filter((v) => v != null);
      if (!werte.length) continue;
      const m = werte.reduce((x, y) => x + y, 0) / werte.length;
      const r = radius(m);
      const w1 = winkel(i + 0.08), w2 = winkel(i + 0.92);
      teil("path", { d: `M ${r * Math.cos(w1)} ${r * Math.sin(w1)} A ${r} ${r} 0 0 1 ${r * Math.cos(w2)} ${r * Math.sin(w2)}`, fill: "none", stroke: "#e8730c", "stroke-width": 3, "stroke-linecap": "round" });
    }
  }
  return el("div", { class: "b-zielscheibe" }, svg,
    el("div", { class: "ziel-legende" }, antworten.length ? "Punkte: je Antwort. Orange: Mittelwert. Mitte heißt „trifft voll zu“." : "Noch keine Antworten."));
}
function wortUmbruch(text, breite) {
  const zeilen = [""];
  for (const w of String(text).split(" ")) {
    if ((zeilen[zeilen.length - 1] + " " + w).trim().length > breite && zeilen[zeilen.length - 1]) zeilen.push(w);
    else zeilen[zeilen.length - 1] = (zeilen[zeilen.length - 1] + " " + w).trim();
  }
  return zeilen;
}

/* ------------------------------------------------------------------ Hotspot */
function hotspotAnsicht(id, d, loesung) {
  const punkte = antwortenVon(id).filter((a) => a.x != null);
  const l = loesung && d.loesung;
  return el("div", { class: "baustein b-hotspot" },
    el("div", { class: "hotspot-flaeche" },
      el("img", { src: BILDER[d.bild_id] || "", alt: d.alt || "", draggable: "false" }),
      l ? el("div", { class: "hotspot-loesung", style: `left:${l.x * 100}%;top:${l.y * 100}%;width:${(l.r || 0.06) * 200}%;` }) : null,
      punkte.map((p) => el("div", { class: "hotspot-punkt", style: `left:${p.x * 100}%;top:${p.y * 100}%` }))),
    el("div", { class: "hotspot-zahl" }, punkte.length + (punkte.length === 1 ? " Tipp" : " Tipps") + (l && punkte.length ? ", davon im Kreis: " + punkte.filter((p) => trifft(p, l)).length : "")));
}
function trifft(p, l) { return Math.hypot(p.x - l.x, (p.y - l.y) * (l.verhaeltnis || 0.5625)) <= (l.r || 0.06); }

/* ------------------------------------------------------------------ Codezeilen ordnen */
function ordnenAuswerten(id, d) {
  const n = (d.zeilen || []).length;
  const antworten = antwortenVon(id).filter((a) => Array.isArray(a.reihenfolge) && a.reihenfolge.length === n);
  const richtig = new Array(n).fill(0);
  let ganz = 0;
  for (const a of antworten) {
    let alle = true;
    a.reihenfolge.forEach((g, k) => { if (d.mischung[g] === k) richtig[k]++; else alle = false; });
    if (alle) ganz++;
  }
  return { n, antworten: antworten.length, richtig, ganz };
}
function ordnenAnsicht(id, d, loesung) {
  const e = ordnenAuswerten(id, d);
  const anteil = (k) => (e.antworten ? Math.round((e.richtig[k] / e.antworten) * 100) : 0);
  return el("div", { class: "baustein b-ordnen" },
    el("div", { class: "ordnen-kopf" }, el("b", null, e.ganz + " von " + e.antworten), e.antworten === 1 ? " Antwort ganz richtig" : " Antworten ganz richtig"),
    el("div", { class: "ordnen-zeilen" }, (d.zeilen || []).map((z, k) => el("div", { class: "ordnen-zeile" },
      el("span", { class: "nr" }, k + 1),
      el("div", { class: "bahn" }, el("div", { class: "balken" + (anteil(k) >= 70 ? " gut" : anteil(k) < 40 ? " schlecht" : ""), style: "width:" + anteil(k) + "%" })),
      el("span", { class: "zahl" }, anteil(k) + " %"),
      loesung ? el("code", null, z) : el("span", { class: "leise" }, "Platz " + (k + 1) + " richtig")))));
}

/* ------------------------------------------------------------------ Fehlerzeile */
function fehlerzeileAnsicht(id, d, loesung) {
  const zahl = {};
  const antworten = antwortenVon(id).filter((a) => a.zeile);
  for (const a of antworten) zahl[a.zeile] = (zahl[a.zeile] || 0) + 1;
  const max = Math.max(1, ...Object.values(zahl));
  const richtig = [].concat(d.loesung || []);
  return el("div", { class: "baustein b-fehlerzeile" },
    el("div", { class: "fehler-kopf" }, antworten.length + (antworten.length === 1 ? " Antwort" : " Antworten"),
      loesung && richtig.length ? ", richtig: " + antworten.filter((a) => richtig.includes(a.zeile)).length : ""),
    el("div", { class: "fehler-code" }, (d.zeilen_html || d.zeilen || []).map((h, i) => {
      const nr = i + 1, n = zahl[nr] || 0;
      return el("div", { class: "fehler-zeile" + (loesung && richtig.includes(nr) ? " loesung" : ""), style: n ? "--anteil:" + (n / max).toFixed(2) : "" },
        el("span", { class: "nr" }, nr), el("span", { class: "code", html: d.zeilen_html ? h : null }, d.zeilen_html ? null : h), el("span", { class: "zahl" }, n || ""));
    })));
}

/* ------------------------------------------------------------------ Exit-Ticket */
function exitBoard(id, d) {
  // am Board nur die Zahl: Kontrollfrage und Texte sieht nur die Regie
  return el("div", { class: "b-exit" },
    el("div", { class: "leer-hinweis" }, teilnehmerVon(id) + (teilnehmerVon(id) === 1 ? " Exit-Ticket" : " Exit-Tickets") + " abgegeben.\nDie Antworten sieht nur die Lehrkraft."));
}
const MARKEN = [["richtig", "✓", "richtig verstanden"], ["falsch", "✗", "falsch verstanden"], ["aufgreifen", "★", "nächste Stunde aufgreifen"]];
function exitRegie(id) {
  const d = frageDef(id) || {};
  const antworten = antwortenVon(id);
  const texte = antworten.map((a) => a.text).filter(Boolean);
  const zaehl = (w) => texte.filter((t) => Z.markiert[id + "|" + t] === w).length;
  return el("div", null,
    (d.optionen || []).length ? el("div", { class: "methode-ergebnis-klein" }, ergebnisBlock(id, true)) : null,
    el("p", { class: "naechster" }, (d.offen || "Offene Frage") + ": " + texte.length + " Texte" + (texte.length ? ", ✓ " + zaehl("richtig") + ", ✗ " + zaehl("falsch") + ", ★ " + zaehl("aufgreifen") : "")),
    el("div", { class: "exit-liste" }, texte.map((t) => {
      const s = id + "|" + t;
      return el("div", { class: "exit-text " + (Z.markiert[s] || "") },
        el("span", null, t),
        el("span", { class: "exit-marken" }, MARKEN.map(([w, zeichen, titel]) => el("button", { class: "knopf klein" + (Z.markiert[s] === w ? " aktiv" : ""), title: titel,
          onclick: () => tun("markieren", { schluessel: s, wert: Z.markiert[s] === w ? null : w }) }, zeichen))));
    })));
}

/* ------------------------------------------------------------------ Abstimmung mit Sicherheit */
function sicherheitZahlen(id) {
  const d = frageDef(id) || {};
  const res = { sicher: {}, geraten: {}, falschSicher: 0, mit: 0 };
  for (const a of antwortenVon(id)) {
    if (a.sicher == null) continue;
    res.mit++;
    for (const o of a.auswahl || []) (a.sicher ? res.sicher : res.geraten)[o] = ((a.sicher ? res.sicher : res.geraten)[o] || 0) + 1;
    if (a.sicher && d.loesung != null && !(a.auswahl || []).includes(d.loesung)) res.falschSicher++;
  }
  return res;
}
