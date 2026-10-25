/* Baustein sql: SQL-Abfragen live an der Tafel (SQLite im Browser, sql.js, offline).
   Die Datenbank kommt aus `datenbank: datei.db` oder `schema:` (SQL-Text) und ist in die Tafel.html eingebettet.
   Ausgeführte Anweisungen stehen im Zustand (Z.sql[schlüssel].verlauf); jedes Fenster spielt sie auf einer frischen
   Datenbank nach, so zeigen Board und Regie dasselbe. „Zurücksetzen“ leert den Verlauf. */
"use strict";

let SQL_MODUL = null, SQL_LAEDT = false, SQL_FEHLER = null;
const SQL_DB = {};          // schlüssel -> { db, n (nachgespielte Anweisungen), letzte }
const SQL_ENTWURF = {};     // schlüssel -> getippter Text, noch nicht ausgeführt

function sqlLaden() {
  if (SQL_MODUL || SQL_LAEDT || SQL_FEHLER) return;
  const roh = document.getElementById("sql-wasm");
  if (!roh || typeof initSqlJs !== "function") { SQL_FEHLER = "sql.js fehlt in dieser Datei"; return; }
  SQL_LAEDT = true;
  const bin = atob(JSON.parse(roh.textContent));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  initSqlJs({ wasmBinary: bytes }).then((m) => { SQL_MODUL = m; SQL_LAEDT = false; allesNeuZeichnen(); })
    .catch((e) => { SQL_FEHLER = e.message; SQL_LAEDT = false; allesNeuZeichnen(); });
}
function allesNeuZeichnen() { if (typeof anzeigeLetzter !== "undefined") anzeigeLetzter = ""; neuZeichnen(); }

function base64Bytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* Datenbank für einen Reiter: frisch anlegen und den Verlauf nachspielen (nur das Neue, wenn möglich) */
function sqlStand(b, schluessel, verlauf) {
  let c = SQL_DB[schluessel];
  if (!c || c.n > verlauf.length || c.verlauf.some((x, i) => x !== verlauf[i])) {
    if (c) c.db.close();
    const db = b.db_b64 ? new SQL_MODUL.Database(base64Bytes(b.db_b64)) : new SQL_MODUL.Database();
    if (b.schema) db.exec(b.schema);
    c = SQL_DB[schluessel] = { db, n: 0, verlauf: [], letzte: null };
  }
  for (; c.n < verlauf.length; c.n++) {
    const text = verlauf[c.n];
    c.verlauf.push(text);
    try {
      const erg = c.db.exec(text);
      const r = erg.length ? erg[erg.length - 1] : null;
      c.letzte = { text, spalten: r ? r.columns : [], zeilen: r ? r.values : [], geaendert: r ? null : c.db.getRowsModified() };
    } catch (e) {
      c.letzte = { text, fehler: e.message };
    }
  }
  return c;
}

/* Tabellen der Datenbank für die Übersicht */
function sqlTabellen(db) {
  try {
    const r = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    return r.length ? r[0].values.map((v) => v[0]) : [];
  } catch (e) { return []; }
}

function sqlAusfuehren(schluessel, b, text) {
  const z = Z.sql[schluessel] || { verlauf: [] };
  const t = String(text || "").trim();
  if (!t) return;
  delete SQL_ENTWURF[schluessel];
  tun("sql", { schluessel, wert: { verlauf: [...(z.verlauf || []), t].slice(-200), text: t } });
}

BAUSTEINE.sql = (b, ctx) => {
  const schluessel = ctx.schluessel;
  sqlLaden();
  const z = Z.sql[schluessel] || { verlauf: [], text: b.abfrage || "" };
  const text = SQL_ENTWURF[schluessel] != null ? SQL_ENTWURF[schluessel] : z.text != null ? z.text : b.abfrage || "";
  const eingabe = el("textarea", { class: "sql-eingabe", spellcheck: "false", "data-feld": "sql:" + schluessel, rows: 5,
    oninput: (e) => { SQL_ENTWURF[schluessel] = e.target.value; },
    onkeydown: (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sqlAusfuehren(schluessel, b, e.target.value); } } });
  eingabe.value = text;
  let ergebnis, tabellen = [];
  if (SQL_FEHLER) ergebnis = el("div", { class: "sql-fehler" }, "SQL nicht verfügbar: " + SQL_FEHLER);
  else if (!SQL_MODUL) ergebnis = el("div", { class: "leer-hinweis" }, "Datenbank lädt …");
  else {
    const c = sqlStand(b, schluessel, z.verlauf || []);
    tabellen = sqlTabellen(c.db);
    const l = c.letzte;
    if (!l) ergebnis = el("div", { class: "leer-hinweis" }, "Abfrage eintippen und „Ausführen“ (Strg + Enter).");
    else if (l.fehler) ergebnis = el("div", { class: "sql-fehler" }, el("b", null, "Fehler: "), l.fehler);
    else if (!l.spalten.length) ergebnis = el("div", { class: "leer-hinweis" }, "Ausgeführt. Geänderte Zeilen: " + (l.geaendert || 0) + ".");
    else {
      const max = b.max_zeilen || 50;
      ergebnis = el("div", { class: "sql-ergebnis" },
        el("table", null,
          el("thead", null, el("tr", null, l.spalten.map((s) => el("th", null, s)))),
          el("tbody", null, l.zeilen.slice(0, max).map((r) => el("tr", null, r.map((v) => el("td", { class: v === null ? "null" : typeof v === "number" ? "zahl" : "" }, v === null ? "NULL" : String(v))))))),
        el("div", { class: "sql-anzahl" }, l.zeilen.length + (l.zeilen.length === 1 ? " Zeile" : " Zeilen") + (l.zeilen.length > max ? ", gezeigt: " + max : "")));
    }
  }
  return el("div", { class: "baustein b-sql" },
    el("div", { class: "sql-oben" },
      eingabe,
      el("div", { class: "sql-knoepfe" },
        el("button", { class: "sql-los", onclick: () => sqlAusfuehren(schluessel, b, eingabe.value) }, "Ausführen"),
        el("button", { onclick: () => { delete SQL_ENTWURF[schluessel]; tun("sql", { schluessel, wert: { verlauf: [], text: b.abfrage || "" } }); } }, "Zurücksetzen"))),
    (b.beispiele || []).length ? el("div", { class: "sql-beispiele" }, b.beispiele.map((x) => el("button", {
      onclick: () => { SQL_ENTWURF[schluessel] = x.abfrage; if (x.sofort === false) allesNeuZeichnen(); else sqlAusfuehren(schluessel, b, x.abfrage); } }, x.titel || x.abfrage))) : null,
    tabellen.length ? el("div", { class: "sql-tabellen" }, "Tabellen: ", tabellen.map((t) => el("button", { onclick: () => sqlAusfuehren(schluessel, b, "SELECT * FROM " + t + ";") }, t))) : null,
    ergebnis);
};

/* fürs Handy: Abfrage und Ergebnis als Text */
function sqlAlsText(b, schluessel) {
  const z = Z.sql[schluessel];
  if (!SQL_MODUL || !z || !(z.verlauf || []).length) return { text: z ? z.text : b.abfrage || "" };
  const l = sqlStand(b, schluessel, z.verlauf).letzte;
  if (!l) return { text: z.text };
  return { text: l.text, fehler: l.fehler || "", spalten: l.spalten || [], zeilen: (l.zeilen || []).slice(0, 20).map((r) => r.map((v) => (v === null ? "NULL" : String(v)))), anzahl: (l.zeilen || []).length };
}
