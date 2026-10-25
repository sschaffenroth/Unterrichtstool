#!/usr/bin/env python3
"""Bauskript: Tafel.yaml (Format tafelstunde/0) → eine HTML-Datei, die offline im Browser läuft.

Aufruf:
    python build/bauen.py PFAD/ZUM/Stundenordner/Tafel.yaml [-o Ausgabe.html] [--bildbreite 1920]

Ohne -o entsteht Tafel.html neben der Tafel.yaml.

Das Skript
- prüft die Datei (Bausteine, Pflichtfelder, Verweise zwischen Schritten, Pfade),
- verkleinert Bilder und bettet sie ein,
- färbt Code ein (Pygments), erzeugt QR-Codes (segno), wandelt Markdown in HTML,
- schreibt Kern und Bausteine aus app/ in eine einzige Datei.

Benötigt: PyYAML, Pillow, Pygments, segno  (pip install pyyaml pillow pygments segno)
"""
from __future__ import annotations

import argparse
import base64
import os
import html
import io
import json
import re
import sys
from pathlib import Path

import yaml
from PIL import Image

WURZEL = Path(__file__).resolve().parent.parent
APP = WURZEL / "app"
STANDARD_SERVER = "https://unterrichtstool.s-schaffenroth.workers.dev"
JS_REIHENFOLGE = [
    "lib/qrcode.js",
    "lib/html-to-image.js",
    "kern/zustand.js",
    "kern/server.js",
    "kern/fenster.js",
    "kern/sicherung.js",
    "bausteine/einfach.js",
    "bausteine/auftrag.js",
    "bausteine/code.js",
    "bausteine/zeichnen.js",
    "bausteine/ergebnis.js",
    "bausteine/interaktion.js",
    "bausteine/sql.js",
    "kern/methoden.js",
    "kern/anzeige.js",
    "kern/regie.js",
    "kern/start.js",
]

TAFEL_BAUSTEINE = {"titel", "bild", "folie", "qr", "schwarz", "uhr", "code", "zeichnen", "ergebnis",
                   "zuordnen", "beschriften", "urteilen", "codestreifen", "testfaelle", "partner",
                   "kette", "grafik", "brett", "sql", "neu", "einbetten"}
UMGESETZT = {"titel", "bild", "folie", "qr", "schwarz", "uhr", "code", "zeichnen", "ergebnis", "auftrag", "einbetten", "sql"}
SCHUELER_BAUSTEINE = {"abstimmung", "vorhersage", "wortwolke", "zielscheibe", "exit", "hotspot", "ordnen", "fehlerzeile",
                      "formular", "feedback", "fragen"}
SCHUELER_UMGESETZT = {"abstimmung", "vorhersage", "wortwolke", "zielscheibe", "exit", "hotspot", "ordnen", "fehlerzeile"}
SCHRITT_METHODEN = {"hilfe", "fortschritt", "tempo", "helfer"}
ZIEL_DIMENSIONEN = ["Ich habe es verstanden", "Ich kann es allein anwenden", "Das Tempo passte", "Ich habe mitgemacht"]
ANSICHTEN = {"tafel", "auftrag", "geteilt", "extern", "schwarz"}
SOZIALFORMEN = {"EA", "PA", "GA", "Plenum"}


class Bericht:
    def __init__(self) -> None:
        self.fehler: list[str] = []
        self.warnungen: list[str] = []
        self.hinweise: list[str] = []

    def f(self, ort: str, text: str) -> None:
        self.fehler.append(f"{ort}: {text}")

    def w(self, ort: str, text: str) -> None:
        self.warnungen.append(f"{ort}: {text}")

    def h(self, ort: str, text: str) -> None:
        self.hinweise.append(f"{ort}: {text}")


# ---------------------------------------------------------------------------------------------- Helfer

def markdown_zu_html(text: str) -> str:
    """Kleines Markdown: Absätze, **fett**, `code`, Zeilenumbruch, Listen mit - , Überschrift ##."""
    bloecke = re.split(r"\n\s*\n", text.strip())
    teile = []
    for block in bloecke:
        zeilen = block.split("\n")
        if all(z.lstrip().startswith(("- ", "* ")) for z in zeilen):
            teile.append("<ul>" + "".join(f"<li>{inline(z.lstrip()[2:])}</li>" for z in zeilen) + "</ul>")
        elif block.startswith("## "):
            teile.append(f"<h2>{inline(block[3:])}</h2>")
        else:
            teile.append("<p>" + "<br>".join(inline(z) for z in zeilen) + "</p>")
    return "\n".join(teile)


def inline(text: str) -> str:
    t = html.escape(text)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", t)
    return t


# Trennpunkte und Gedankenstriche in Texten der Stunde werden zu Zeilenumbrüchen (Wunsch der Lehrkraft:
# „·“ und „—“ irritieren an der Tafel). Code, Links, Dateinamen und Kennungen bleiben unberührt.
NICHT_UMBRECHEN = {"quelltext", "url", "datei", "id", "baustein", "sozialform", "von", "aufloesen_in", "kennung", "sprache", "format", "datum",
                   "erwartet", "eingabe", "eingaben", "probelauf", "fehler", "faelle", "fachordner", "ort", "methoden"}
NICHT_UMBRECHEN_BAUSTEINE = {"code", "testfaelle", "codestreifen", "beschriften", "urteilen", "einbetten",
                             "ordnen", "fehlerzeile", "sql"}   # Programmtext bleibt wörtlich
TRENNER = re.compile(r"\s+[·—–]\s+")
TRENNER_ENDE = re.compile(r"\s+[·—–]\s*$")


def umbrechen(wert, schluessel=None):
    if schluessel in NICHT_UMBRECHEN:
        return wert
    if isinstance(wert, str):
        return TRENNER_ENDE.sub("", TRENNER.sub("\n", wert))
    if isinstance(wert, list):
        return [umbrechen(v) for v in wert]
    if isinstance(wert, dict):
        if wert.get("baustein") in NICHT_UMBRECHEN_BAUSTEINE:
            return wert
        return {k: umbrechen(v, k) for k, v in wert.items()}
    return wert


def ort_und_datei(url: str) -> tuple[str, str]:
    """Aus einem GitHub-Link Ort und Dateiname machen: Repository und Ordner (je eine Zeile), Datei."""
    from urllib.parse import unquote, urlparse
    if not url:
        return "", ""
    u = urlparse(url)
    teile = [unquote(t) for t in u.path.strip("/").split("/") if t]
    if u.netloc.endswith("github.com") and len(teile) >= 2:
        repo = teile[1]
        rest = teile[4:] if len(teile) > 4 and teile[2] in ("blob", "tree") else []
        if teile[2:3] == ["blob"] and rest:
            return "\n".join(["Repository " + repo] + ["Ordner " + o for o in rest[:-1]]), rest[-1]
        return "\n".join(["Repository " + repo] + ["Ordner " + o for o in rest]), ""
    return "", ""   # nur GitHub-Links werden zerlegt, Kurzlinks wie bycs.link bleiben ohne Ort


def qr_svg(url: str) -> str:
    import segno
    return segno.make(url, error="m").svg_inline(omitsize=True, border=1, dark="#1d1d1f")


def code_zeilen(quelltext: str, sprache: str) -> list[str]:
    from pygments import lex
    from pygments.lexers import get_lexer_by_name, TextLexer
    from pygments.token import STANDARD_TYPES

    try:
        lexer = get_lexer_by_name(sprache or "text", stripnl=False, ensurenl=False)
    except Exception:
        lexer = TextLexer()
    zeilen = [""]
    for typ, wert in lex(quelltext.rstrip("\n"), lexer):
        kurz = STANDARD_TYPES.get(typ)
        while kurz is None and typ.parent is not None:
            typ = typ.parent
            kurz = STANDARD_TYPES.get(typ)
        stuecke = wert.split("\n")
        for i, s in enumerate(stuecke):
            if i:
                zeilen.append("")
            if s:
                e = html.escape(s)
                zeilen[-1] += f'<span class="t-{kurz}">{e}</span>' if kurz else e
    return zeilen


class Bilder:
    def __init__(self, breite: int, hoehe: int) -> None:
        self.breite, self.hoehe = breite, hoehe
        self.daten: dict[str, str] = {}
        self.ids: dict[Path, str] = {}
        self.bytes = 0

    def einbetten(self, pfad: Path) -> str:
        pfad = pfad.resolve()
        if pfad in self.ids:
            return self.ids[pfad]
        bild = Image.open(pfad)
        bild.load()
        if bild.mode not in ("RGB", "RGBA"):
            bild = bild.convert("RGBA" if "A" in bild.getbands() or bild.mode == "P" else "RGB")
        bild.thumbnail((self.breite, self.hoehe), Image.LANCZOS)
        puffer = io.BytesIO()
        bild.save(puffer, "WEBP", quality=88, method=5)
        roh = puffer.getvalue()
        self.bytes += len(roh)
        bid = f"b{len(self.ids) + 1}"
        self.ids[pfad] = bid
        self.daten[bid] = "data:image/webp;base64," + base64.b64encode(roh).decode("ascii")
        return bid


# ---------------------------------------------------------------------------------------------- Bausteine aufbereiten

def baustein_aufbereiten(b: dict, ort: str, ctx: dict) -> dict:
    """Prüft einen Baustein und ergänzt Felder, die der Browser braucht (Bild-ID, Code-HTML, QR-SVG …)."""
    bericht: Bericht = ctx["bericht"]
    if not isinstance(b, dict) or "baustein" not in b:
        bericht.f(ort, "Baustein ohne Feld `baustein`")
        return {"baustein": "neu", "name": "?"}
    b = dict(b)
    art = b["baustein"]
    if art not in TAFEL_BAUSTEINE | SCHUELER_BAUSTEINE | {"auftrag"}:
        bericht.w(ort, f"unbekannter Baustein `{art}`: wird als Platzhalter gezeigt")
    elif art not in UMGESETZT and art not in SCHUELER_BAUSTEINE:
        bericht.h(ort, f"Baustein `{art}` noch nicht umgesetzt: Platzhalter")

    if art == "bild" or (art == "zeichnen" and isinstance(b.get("hintergrund"), dict) and "bild" in b["hintergrund"]):
        datei = b.get("datei") if art == "bild" else b["hintergrund"]["bild"]
        pfad = datei_finden(datei, ort, ctx)
        if pfad:
            bid = ctx["bilder"].einbetten(pfad)
            if art == "bild":
                b["bild_id"] = bid
            else:
                b["hintergrund"] = dict(b["hintergrund"], bild_id=bid)
    elif art == "code":
        quelltext = b.get("quelltext")
        if quelltext is None and b.get("datei"):
            pfad = datei_finden(b["datei"], ort, ctx)
            quelltext = pfad.read_text(encoding="utf-8") if pfad else ""
        quelltext = quelltext or ""
        b["zeilen_html"] = code_zeilen(quelltext, b.get("sprache", "python"))
        laengste = max((len(z) for z in quelltext.rstrip("\n").split("\n")), default=0)
        if laengste > 72:
            bericht.w(ort, f"längste Codezeile hat {laengste} Zeichen: bei 20 pt evtl. zu breit, `ansichten` oder Umbruch prüfen")
        if len(b["zeilen_html"]) > 18 and not b.get("ansichten"):
            bericht.w(ort, f"{len(b['zeilen_html'])} Zeilen ohne `ansichten`: passt nicht auf eine Tafel, bitte teilen")
        for feld in ("fehler", "probelauf", "nebeneinander"):
            if b.get(feld):
                bericht.h(ort, f"code.{feld} noch nicht umgesetzt")
        for m in b.get("marken") or []:
            if not 1 <= int(m.get("zeile", 0)) <= len(b["zeilen_html"]):
                bericht.f(ort, f"Marke auf Zeile {m.get('zeile')} gibt es nicht")
        b.pop("quelltext", None)
    elif art == "qr":
        if not b.get("url"):
            bericht.f(ort, "qr ohne url")
        else:
            b["svg"] = qr_svg(b["url"])
    elif art == "einbetten":
        pfad = datei_finden(b.get("datei"), ort, ctx)
        if pfad:
            if pfad.suffix.lower() not in (".html", ".htm"):
                bericht.f(ort, "einbetten: nur .html-Dateien")
            else:
                b["html_einbettung"] = pfad.read_text(encoding="utf-8", errors="replace")
                rel = Path(os.path.relpath(pfad.parent, ctx["ordner"])).as_posix()
                b["basis"] = (rel + "/") if rel != "." else ""
                b["name"] = pfad.name
                if len(b["html_einbettung"]) > 3_000_000:
                    bericht.w(ort, f"einbetten: {pfad.name} ist {len(b['html_einbettung']) / 1e6:.1f} MB groß")
                bericht.h(ort, f"einbetten: {pfad.name} läuft nur auf der Anzeige, nicht in der Vorschau, und wird nicht als PNG gesichert")
    elif art == "folie":
        b["html"] = markdown_zu_html(b.get("markdown", ""))
    elif art == "auftrag":
        if not b.get("text"):
            bericht.f(ort, "auftrag ohne text")
        elif len(re.findall(r"[.!?](\s|$)", b["text"].strip())) > 1:
            bericht.w(ort, "Auftrag hat mehr als einen Satz")
        if b.get("sozialform") and b["sozialform"] not in SOZIALFORMEN:
            bericht.w(ort, f"Sozialform `{b['sozialform']}` unbekannt (EA, PA, GA, Plenum)")
        material = []
        for m in b.get("material") or []:
            if isinstance(m, str):
                material.append({"text": m})
            else:
                eintrag = {"text": m.get("text", m.get("url", ""))}
                ort, datei = ort_und_datei(m.get("url", ""))
                eintrag["ort"] = m.get("ort", ort)
                eintrag["datei"] = m.get("datei", datei)
                if m.get("url"):
                    eintrag["url"] = m["url"]
                    if m.get("qr"):
                        eintrag["svg"] = qr_svg(m["url"])
                material.append(eintrag)
        b["material"] = material
    elif art == "ergebnis":
        von = b.get("von")
        b["von"] = von if isinstance(von, list) else [von]
        ctx["verweise"].append((ort, "ergebnis.von", b["von"]))
    elif art == "sql":
        if b.get("datenbank"):
            pfad = datei_finden(b["datenbank"], ort, ctx)
            if pfad:
                roh = pfad.read_bytes()
                if not roh.startswith(b"SQLite format 3\x00"):
                    bericht.f(ort, f"sql: {b['datenbank']} ist keine SQLite-Datenbank")
                else:
                    b["db_b64"] = base64.b64encode(roh).decode("ascii")
                    if len(roh) > 5_000_000:
                        bericht.w(ort, f"sql: Datenbank ist {len(roh) / 1e6:.1f} MB groß")
        elif not b.get("schema"):
            bericht.w(ort, "sql ohne datenbank und schema: leere Datenbank")
        b["beispiele"] = [x if isinstance(x, dict) else {"abfrage": str(x)} for x in (b.get("beispiele") or [])]
        for x in b["beispiele"]:
            if not x.get("abfrage"):
                bericht.f(ort, "sql.beispiele: Eintrag ohne abfrage")
        ctx["sql"] = True
    if art in ("vorhersage", "hotspot", "ordnen", "fehlerzeile") and b.get("aufloesen_in"):
        ctx["verweise"].append((ort, "aufloesen_in", [b["aufloesen_in"]]))
    if art == "auftrag":
        auftrag_methoden(b, ort, bericht)
    if art in SCHUELER_BAUSTEINE and art not in SCHUELER_UMGESETZT:
        bericht.h(ort, f"Schüler-Baustein `{art}` noch nicht umgesetzt")
    if art == "wortwolke":
        if not b.get("frage"):
            bericht.f(ort, "wortwolke ohne frage")
        b["max_woerter"] = max(1, min(3, int(b.get("max_woerter") or 1)))
    elif art == "zielscheibe":
        dim = b.get("dimensionen") or ZIEL_DIMENSIONEN
        if len(dim) > 6:
            bericht.w(ort, "zielscheibe: höchstens 6 dimensionen, der Rest fällt weg")
        b["dimensionen"] = [str(x) for x in dim[:6]]
    elif art == "exit":
        b.setdefault("offen", "Was war heute am unklarsten?")
        b["optionen"] = b.get("optionen") or []
        if b["optionen"] and not b.get("frage"):
            bericht.f(ort, "exit mit optionen, aber ohne frage")
        if b.get("loesung") is not None and b["loesung"] not in b["optionen"]:
            bericht.f(ort, "loesung ist keine der optionen")
    elif art == "hotspot":
        hotspot_aufbereiten(b, ort, ctx)
    elif art == "ordnen":
        ordnen_aufbereiten(b, ort, ctx)
    elif art == "fehlerzeile":
        quelltext = b.get("quelltext")
        if quelltext is None and b.get("datei"):
            pfad = datei_finden(b["datei"], ort, ctx)
            quelltext = pfad.read_text(encoding="utf-8") if pfad else ""
        zeilen = (quelltext or "").rstrip("\n").split("\n")
        if not quelltext:
            bericht.f(ort, "fehlerzeile ohne quelltext")
        b["zeilen"] = [z[:160] for z in zeilen]
        b["zeilen_html"] = code_zeilen(quelltext or "", b.get("sprache", "python"))
        if len(zeilen) > 40:
            bericht.f(ort, "fehlerzeile: höchstens 40 Zeilen")
        loesung = b.get("loesung")
        for z in ([loesung] if isinstance(loesung, int) else loesung or []):
            if not isinstance(z, int) or not 1 <= z <= len(zeilen):
                bericht.f(ort, f"fehlerzeile.loesung: Zeile {z} gibt es nicht")
        if loesung is None:
            bericht.w(ort, "fehlerzeile ohne loesung (Zeilennummer)")
        b.pop("quelltext", None)
    if art in ("abstimmung", "vorhersage"):
        if not b.get("optionen"):
            bericht.f(ort, f"{art} ohne optionen")
        if b.get("loesung") is not None and b["loesung"] not in (b.get("optionen") or []):
            bericht.f(ort, "loesung ist keine der optionen")
        if b.get("kennung") not in (None, "geraet", "team"):
            bericht.w(ort, f"kennung `{b['kennung']}` unbekannt (geraet, team)")
        if "sicherheit" in b and not isinstance(b["sicherheit"], bool):
            bericht.w(ort, "sicherheit: true oder false")
    return b


def auftrag_methoden(b: dict, ort: str, bericht: Bericht) -> None:
    """auftrag.phasen (Sozialformen nacheinander), auftrag.rollenwechsel_min, auftrag.aufgaben"""
    phasen = b.get("phasen")
    if phasen:
        sauber = []
        for i, p in enumerate(phasen):
            if not isinstance(p, dict) or p.get("sozialform") not in SOZIALFORMEN:
                bericht.f(ort, f"phasen[{i + 1}]: sozialform EA, PA, GA oder Plenum fehlt")
                continue
            if not isinstance(p.get("min"), (int, float)) or p["min"] <= 0:
                bericht.f(ort, f"phasen[{i + 1}]: min fehlt")
                continue
            sauber.append({"sozialform": p["sozialform"], "min": p["min"], "text": p.get("text", "")})
        b["phasen"] = sauber
        summe = sum(p["min"] for p in sauber)
        if b.get("dauer_min") and b["dauer_min"] != summe:
            bericht.w(ort, f"dauer_min {b['dauer_min']} passt nicht zur Summe der Phasen ({summe}): Summe gilt")
        b["dauer_min"] = summe
    if b.get("rollenwechsel_min") is not None and not isinstance(b["rollenwechsel_min"], (int, float)):
        bericht.f(ort, "rollenwechsel_min muss eine Zahl sein")
    if b.get("aufgaben") is not None:
        if not isinstance(b["aufgaben"], list) or not b["aufgaben"]:
            bericht.f(ort, "aufgaben: Liste, z. B. [A1, A2, A3]")
        else:
            b["aufgaben"] = [str(a)[:30] for a in b["aufgaben"][:12]]


def hotspot_aufbereiten(b: dict, ort: str, ctx: dict) -> None:
    """Bild fürs Board (eingebettet wie bild) und kleiner fürs Handy (geht beim Freigeben an den Server)."""
    bericht: Bericht = ctx["bericht"]
    if not b.get("frage"):
        bericht.f(ort, "hotspot ohne frage")
    datei = b.get("bild") or ctx.get("schritt_bild")
    if not datei:
        bericht.f(ort, "hotspot ohne bild (oder Bild im tafel-Baustein desselben Schritts)")
        return
    pfad = datei_finden(datei, ort, ctx)
    if not pfad:
        return
    b["bild_id"] = ctx["bilder"].einbetten(pfad)
    bild = Image.open(pfad)
    bild.load()
    b["verhaeltnis"] = round(bild.height / bild.width, 4)
    if bild.mode not in ("RGB", "RGBA"):
        bild = bild.convert("RGB")
    bild.thumbnail((900, 900), Image.LANCZOS)
    for qualitaet in (75, 60, 45):
        puffer = io.BytesIO()
        bild.save(puffer, "WEBP", quality=qualitaet, method=5)
        if len(puffer.getvalue()) < 450_000:
            break
    b["handy_bild"] = "data:image/webp;base64," + base64.b64encode(puffer.getvalue()).decode("ascii")
    l = b.get("loesung")
    if l is not None:
        if not isinstance(l, dict) or not all(isinstance(l.get(k), (int, float)) and 0 <= l[k] <= 1 for k in ("x", "y")):
            bericht.f(ort, "hotspot.loesung: {x: 0..1, y: 0..1, r: 0..1} (Anteil der Bildbreite)")
        else:
            l.setdefault("r", 0.06)
            l["verhaeltnis"] = b["verhaeltnis"]


def ordnen_aufbereiten(b: dict, ort: str, ctx: dict) -> None:
    """Zeilen in richtiger Reihenfolge → gemischt fürs Handy. mischung[k] = Platz der k-ten gemischten Zeile im Original."""
    import random
    bericht: Bericht = ctx["bericht"]
    zeilen = b.get("zeilen")
    if zeilen is None and b.get("quelltext"):
        zeilen = [z for z in b["quelltext"].rstrip("\n").split("\n") if z.strip()]
    zeilen = [str(z).rstrip() for z in (zeilen or [])]
    if len(zeilen) < 3:
        bericht.f(ort, "ordnen: mindestens 3 Zeilen (zeilen: oder quelltext:)")
    if len(zeilen) > 20:
        bericht.f(ort, "ordnen: höchstens 20 Zeilen")
    if len(set(zeilen)) != len(zeilen):
        bericht.w(ort, "ordnen: gleiche Zeilen kommen doppelt vor, dann zählt nur eine Reihenfolge als richtig")
    mischung = list(range(len(zeilen)))
    zufall = random.Random("ordnen:" + str(ctx.get("schritt_id", "")))
    for _ in range(20):
        zufall.shuffle(mischung)
        if len(zeilen) < 2 or mischung != sorted(mischung):
            break
    b["zeilen"] = zeilen
    b["mischung"] = mischung
    b["gemischt"] = [zeilen[i] for i in mischung]
    b.pop("quelltext", None)


def begriffe_lesen(ordner: Path) -> list[dict]:
    """BEGRIFFE.md im Stundenordner: Zeilen „- **Begriff** (englisch) — Erklärung“, Folgezeilen eingerückt."""
    datei = ordner / "BEGRIFFE.md"
    if not datei.exists():
        return []
    eintraege = []
    for zeile in datei.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\s*[-*]\s+\*\*(.+?)\*\*\s*(\([^)]*\))?\s*[—–:-]?\s*(.*)$", zeile)
        if m:
            begriff = m.group(1).replace("`", "").strip()
            eintraege.append({"begriff": begriff, "erklaerung": m.group(3).strip()})
        elif eintraege and zeile.startswith(("  ", "\t")) and zeile.strip():
            eintraege[-1]["erklaerung"] += " " + zeile.strip()
    for e in eintraege:
        e["erklaerung"] = TRENNER.sub(", ", e["erklaerung"]).replace("`", "")
    return eintraege


def datei_finden(datei: str | None, ort: str, ctx: dict) -> Path | None:
    bericht: Bericht = ctx["bericht"]
    if not datei:
        bericht.f(ort, "Feld `datei` fehlt")
        return None
    pfad = (ctx["ordner"] / datei).resolve()
    if not pfad.exists():
        bericht.f(ort, f"Datei nicht gefunden: {datei}")
        return None
    try:
        pfad.relative_to(ctx["fachordner"])
    except ValueError:
        bericht.w(ort, f"{datei} liegt außerhalb des Fachordners")
    return pfad


# ---------------------------------------------------------------------------------------------- Stunde

def fachordner_finden(roh: dict, ordner: Path) -> Path:
    """Fachordner: Feld `fachordner` im Kopf (relativ zum Stundenordner), sonst der nächste Ordner nach oben
    mit „Tafel starten.bat“ oder „stundenplan.json“, sonst der Elternordner des Stundenordners."""
    if roh.get("fachordner"):
        return (ordner / roh["fachordner"]).resolve()
    for o in [ordner, *ordner.parents]:
        if (o / "Tafel starten.bat").exists() or (o / "stundenplan.json").exists():
            return o.resolve()
    return ordner.parent.resolve()


def stunde_aufbereiten(roh: dict, ordner: Path, bericht: Bericht, bildbreite: int, server: str = STANDARD_SERVER) -> tuple[dict, dict]:
    ctx = {"bericht": bericht, "ordner": ordner, "fachordner": fachordner_finden(roh, ordner),
           "bilder": Bilder(bildbreite, round(bildbreite * 9 / 16)), "verweise": []}
    if roh.get("format") != "tafelstunde/0":
        bericht.w("Kopf", f"format ist `{roh.get('format')}`, erwartet `tafelstunde/0`")
    kopf = roh.get("stunde") or {}
    for feld in ("fach", "titel", "dauer"):
        if not kopf.get(feld):
            bericht.f("stunde", f"Feld `{feld}` fehlt")
    anzeigen = roh.get("anzeigen") or {"Board": "geteilt"}
    if any(k in ("tafel", "auftrag") for k in anzeigen):
        bericht.f("anzeigen", "alte Form {tafel: Board}: seit Änderung 1 je Anzeige, z. B. {Board: geteilt}")
    for name, wert in anzeigen.items():
        if wert not in ANSICHTEN:
            bericht.f("anzeigen", f"{name}: Ansicht `{wert}` unbekannt")

    schritte = []
    ids = set()
    for i, s in enumerate(roh.get("schritte") or []):
        ort = f"Schritt {i + 1} ({s.get('id', '?')})"
        if not s.get("id"):
            bericht.f(ort, "Feld `id` fehlt")
        elif s["id"] in ids:
            bericht.f(ort, "id doppelt")
        ids.add(s.get("id"))
        if not isinstance(s.get("soll_min"), (int, float)):
            bericht.f(ort, "soll_min fehlt oder ist keine Zahl")
        n = {k: s.get(k) for k in ("id", "titel", "abschnitt", "soll_min", "ausgeblendet", "pruefpunkt", "kuerzen", "bei_wegfall", "zeige", "regie", "methoden")}
        if n["methoden"] is not None:
            liste = n["methoden"] if isinstance(n["methoden"], list) else list(n["methoden"])
            for x in liste:
                if x not in SCHRITT_METHODEN:
                    bericht.f(ort, f"methoden: `{x}` unbekannt ({', '.join(sorted(SCHRITT_METHODEN))})")
            n["methoden"] = [x for x in liste if x in SCHRITT_METHODEN]
        ctx["schritt_id"] = s.get("id", "")
        t0 = s.get("tafel")
        ctx["schritt_bild"] = t0.get("datei") if isinstance(t0, dict) and t0.get("baustein") == "bild" else None
        n["titel"] = n["titel"] or n["id"]
        n["soll_min"] = n["soll_min"] or 0
        n["regie"] = n["regie"] or {}
        if n["kuerzen"] not in (None, "ja", "nein", "nie"):
            bericht.w(ort, f"kuerzen `{n['kuerzen']}` unbekannt (ja, nein, nie)")
        for name, wert in (n["zeige"] or {}).items():
            if name not in anzeigen:
                bericht.w(ort, f"zeige: Anzeige `{name}` steht nicht im Kopf")
            if wert not in ANSICHTEN:
                bericht.f(ort, f"zeige: Ansicht `{wert}` unbekannt")
        if s.get("tafel"):
            t = s["tafel"]
            reiter = t["reiter"] if isinstance(t, dict) and "reiter" in t else [t]
            n["tafel"] = {"reiter": [baustein_aufbereiten(r, f"{ort} tafel" + (f" Reiter {j + 1}" if len(reiter) > 1 else ""), ctx)
                                     for j, r in enumerate(reiter)]}
        if s.get("auftrag"):
            n["auftrag"] = baustein_aufbereiten(s["auftrag"], f"{ort} auftrag", ctx)
        if s.get("schueler"):
            n["schueler"] = baustein_aufbereiten(s["schueler"], f"{ort} schueler", ctx)
        unbekannt = set(s) - set(n) - {"tafel", "auftrag", "schueler", "schritt_id"}
        for k in unbekannt:
            bericht.w(ort, f"Feld `{k}` unbekannt, wird ignoriert")
        if not s.get("tafel") and not s.get("auftrag") and not any(v == "extern" for v in (n["zeige"] or {}).values()):
            bericht.h(ort, "weder tafel noch auftrag: Anzeige zeigt die Stundenkarte")
        schritte.append(n)

    schueler_ids = {s["id"] for s in schritte if s.get("schueler")}
    for ort, feld, ziele in ctx["verweise"]:
        for z in ziele:
            if z not in ids:
                bericht.f(ort, f"{feld}: Schritt `{z}` gibt es nicht")
            elif feld == "ergebnis.von" and z not in schueler_ids:
                bericht.f(ort, f"{feld}: Schritt `{z}` hat keinen Schüler-Baustein")

    aktiv = sum(s["soll_min"] for s in schritte if not s.get("ausgeblendet"))
    reserve = sum(s["soll_min"] for s in schritte if s.get("ausgeblendet"))
    dauer = kopf.get("dauer") or 0
    text = f"{len(schritte)} Schritte, Soll aktiv {aktiv} min von {dauer} min, Reserve {reserve} min"
    (bericht.w if aktiv != dauer else bericht.h)("Zeit", text)
    if ctx["bilder"].bytes:
        bericht.h("Bilder", f"{len(ctx['bilder'].ids)} Bilder, {ctx['bilder'].bytes / 1e6:.1f} MB eingebettet")

    begriffe = roh.get("begriffe") or begriffe_lesen(ordner)
    if isinstance(begriffe, list):
        begriffe = [x if isinstance(x, dict) else {"begriff": str(x), "erklaerung": ""} for x in begriffe]
    if begriffe:
        bericht.h("Begriffe", f"{len(begriffe)} Begriffe für Energizer (Wer bin ich?, Begriffe-Blitz)")
    energizer = []
    for i, e in enumerate(roh.get("energizer") or []):
        if not isinstance(e, dict) or not e.get("titel") or not e.get("text"):
            bericht.f("energizer", f"Eintrag {i + 1}: titel und text nötig")
            continue
        energizer.append({"titel": e["titel"], "text": e["text"], "dauer": e.get("dauer", 2), "begriff": bool(e.get("begriff"))})

    daten = {"format": roh.get("format"), "stunde": kopf, "anzeigen": anzeigen,
             "server": roh.get("server", server),
             "ablaufleiste": bool(roh.get("ablaufleiste")), "schritte": schritte,
             "begriffe": begriffe, "energizer": energizer, "mit_sql": bool(ctx.get("sql"))}
    return daten, ctx["bilder"].daten


def html_bauen(daten: dict, bilder: dict) -> str:
    vorlage = (APP / "vorlage.html").read_text(encoding="utf-8")
    css = (APP / "stil.css").read_text(encoding="utf-8")
    js = "\n\n".join(f"/* ===== {d} ===== */\n" + (APP / d).read_text(encoding="utf-8") for d in JS_REIHENFOLGE)

    def json_sicher(obj) -> str:
        return json.dumps(obj, ensure_ascii=False, default=str).replace("</", "<\\/")

    titel = f"{daten['stunde'].get('fach', '')} {daten['stunde'].get('nr', '')}: {daten['stunde'].get('titel', '')}".replace("\n", " ")
    zusatz = ""
    if daten.get("mit_sql"):   # sql.js nur, wenn die Stunde einen sql-Baustein hat (rund 1 MB)
        wasm = base64.b64encode((APP / "lib" / "sql-wasm.wasm").read_bytes()).decode("ascii")
        zusatz = ("<script>\n" + (APP / "lib" / "sql-wasm.js").read_text(encoding="utf-8").replace("</script", "<\\/script") + "\n</script>\n"
                  + '<script id="sql-wasm" type="application/json">"' + wasm + '"</script>\n')
    vorlage = vorlage.replace("<!--__ZUSATZ__-->", zusatz)
    return (vorlage.replace("__TITEL__", html.escape(titel))
            .replace("/*__CSS__*/", css)
            .replace("__DATEN__", json_sicher(daten))
            .replace("__BILDER__", json_sicher(bilder))
            .replace("/*__JS__*/", js))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Tafel.yaml → Tafel.html")
    ap.add_argument("yaml", type=Path)
    ap.add_argument("-o", "--ausgabe", type=Path)
    ap.add_argument("--bildbreite", type=int, default=1920)
    ap.add_argument("--nur-pruefen", action="store_true", help="nur prüfen, nichts schreiben")
    ap.add_argument("--server", default=STANDARD_SERVER, help="Adresse des Workers für die Handys ('' = ohne)")
    a = ap.parse_args(argv)

    roh = umbrechen(yaml.safe_load(a.yaml.read_text(encoding="utf-8")))
    bericht = Bericht()
    daten, bilder = stunde_aufbereiten(roh, a.yaml.parent.resolve(), bericht, a.bildbreite, a.server)

    for titel, liste in (("FEHLER", bericht.fehler), ("Warnung", bericht.warnungen), ("Hinweis", bericht.hinweise)):
        for z in liste:
            print(f"{titel}: {z}")
    if bericht.fehler:
        print(f"\n{len(bericht.fehler)} Fehler, nichts geschrieben.")
        return 1
    if a.nur_pruefen:
        print("\nGeprüft, keine Fehler.")
        return 0
    ziel = a.ausgabe or a.yaml.with_name("Tafel.html")
    ziel.write_text(html_bauen(daten, bilder), encoding="utf-8")
    print(f"\nGeschrieben: {ziel} ({ziel.stat().st_size / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
