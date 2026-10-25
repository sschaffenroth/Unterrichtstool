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
    "kern/anzeige.js",
    "kern/regie.js",
    "kern/start.js",
]

TAFEL_BAUSTEINE = {"titel", "bild", "folie", "qr", "schwarz", "uhr", "code", "zeichnen", "ergebnis",
                   "zuordnen", "beschriften", "urteilen", "codestreifen", "testfaelle", "partner",
                   "kette", "grafik", "brett", "sql", "neu"}
UMGESETZT = {"titel", "bild", "folie", "qr", "schwarz", "uhr", "code", "zeichnen", "ergebnis", "auftrag"}
SCHUELER_BAUSTEINE = {"abstimmung", "vorhersage", "formular", "feedback", "fragen"}
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
                if m.get("url"):
                    eintrag["url"] = m["url"]
                    eintrag["svg"] = qr_svg(m["url"])
                material.append(eintrag)
        b["material"] = material
    elif art == "ergebnis":
        von = b.get("von")
        b["von"] = von if isinstance(von, list) else [von]
        ctx["verweise"].append((ort, "ergebnis.von", b["von"]))
    elif art == "vorhersage" and b.get("aufloesen_in"):
        ctx["verweise"].append((ort, "aufloesen_in", [b["aufloesen_in"]]))
    if art in ("abstimmung", "vorhersage"):
        if not b.get("optionen"):
            bericht.f(ort, f"{art} ohne optionen")
        if b.get("loesung") is not None and b["loesung"] not in (b.get("optionen") or []):
            bericht.f(ort, "loesung ist keine der optionen")
        if b.get("kennung") not in (None, "geraet", "team"):
            bericht.w(ort, f"kennung `{b['kennung']}` unbekannt (geraet, team)")
    return b


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

def stunde_aufbereiten(roh: dict, ordner: Path, bericht: Bericht, bildbreite: int, server: str = STANDARD_SERVER) -> tuple[dict, dict]:
    ctx = {"bericht": bericht, "ordner": ordner, "fachordner": ordner.parent.resolve(),
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
        n = {k: s.get(k) for k in ("id", "titel", "abschnitt", "soll_min", "ausgeblendet", "pruefpunkt", "kuerzen", "bei_wegfall", "zeige", "regie")}
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
        unbekannt = set(s) - set(n) - {"tafel", "auftrag", "schueler"}
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

    daten = {"format": roh.get("format"), "stunde": kopf, "anzeigen": anzeigen,
             "server": roh.get("server", server),
             "ablaufleiste": bool(roh.get("ablaufleiste")), "schritte": schritte}
    return daten, ctx["bilder"].daten


def html_bauen(daten: dict, bilder: dict) -> str:
    vorlage = (APP / "vorlage.html").read_text(encoding="utf-8")
    css = (APP / "stil.css").read_text(encoding="utf-8")
    js = "\n\n".join(f"/* ===== {d} ===== */\n" + (APP / d).read_text(encoding="utf-8") for d in JS_REIHENFOLGE)

    def json_sicher(obj) -> str:
        return json.dumps(obj, ensure_ascii=False, default=str).replace("</", "<\\/")

    titel = f"{daten['stunde'].get('fach', '')} {daten['stunde'].get('nr', '')} · {daten['stunde'].get('titel', '')}"
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

    roh = yaml.safe_load(a.yaml.read_text(encoding="utf-8"))
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
