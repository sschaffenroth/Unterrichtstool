"""Browser-Test für das Methoden-Menü und die neuen Handy-Bausteine.

Läuft gegen einen nachgebauten Server (tests/testserver.mjs führt worker/index.js mit Speicher-Attrappe aus).
Jedes Handy bekommt einen eigenen Browser-Kontext (eigener Speicher, eigene Geräte-Kennung).

Aufruf:  python -m pytest tests/test_methoden.py     Benötigt zusätzlich Node.js.
"""
from __future__ import annotations

import json
import socket
import subprocess
import sys
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

WURZEL = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WURZEL / "build"))
import bauen  # noqa: E402

BEISPIEL = WURZEL / "tests" / "beispiel" / "07_Methoden" / "Tafel.yaml"


@pytest.fixture(scope="module")
def server():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    prozess = subprocess.Popen(["node", str(WURZEL / "tests" / "testserver.mjs"), str(port)], stdout=subprocess.PIPE, text=True)
    assert prozess.stdout.readline().startswith("bereit")
    yield f"http://127.0.0.1:{port}"
    prozess.terminate()


def test_pruefung_neuer_bausteine(tmp_path: Path) -> None:
    """Das Bauskript prüft die neuen Felder und bereitet sie auf."""
    roh = bauen.umbrechen(__import__("yaml").safe_load(BEISPIEL.read_text(encoding="utf-8")))
    bericht = bauen.Bericht()
    daten, _ = bauen.stunde_aufbereiten(roh, BEISPIEL.parent, bericht, 800, "")
    assert not bericht.fehler, bericht.fehler
    s = {x["id"]: x for x in daten["schritte"]}
    o = s["ordnen"]["schueler"]
    assert [o["zeilen"][i] for i in o["mischung"]] == o["gemischt"] and o["gemischt"] != o["zeilen"]
    assert s["praxis"]["auftrag"]["dauer_min"] == 7 and s["praxis"]["methoden"] == ["hilfe", "tempo"]
    assert s["bild"]["schueler"]["handy_bild"].startswith("data:image/webp")
    assert s["sql"]["tafel"]["reiter"][0]["db_b64"]
    assert [b["begriff"] for b in daten["begriffe"]] == ["Maske", "Schwelle", "append"]
    assert daten["mit_sql"]
    kaputt = tmp_path / "Tafel.yaml"
    kaputt.write_text("format: tafelstunde/0\nstunde: {fach: T, titel: X, dauer: 1}\nschritte:\n  - id: a\n    soll_min: 1\n"
                      "    methoden: [quatsch]\n    auftrag: {baustein: auftrag, text: x, phasen: [{sozialform: XY, min: 1}]}\n"
                      "    schueler: {baustein: fehlerzeile, frage: f, quelltext: 'a', loesung: 5}\n", encoding="utf-8")
    assert bauen.main([str(kaputt), "--nur-pruefen"]) == 1


def test_methoden(tmp_path: Path, server: str) -> None:
    datei = tmp_path / "Tafel.html"
    assert bauen.main([str(BEISPIEL), "-o", str(datei), "--server", server]) == 0
    fehler: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        kontext = browser.new_context(viewport={"width": 1500, "height": 950})
        regie = kontext.new_page()
        regie.on("pageerror", lambda e: fehler.append(f"regie: {e}"))
        regie.goto(datei.as_uri())
        with regie.expect_popup() as info:
            regie.get_by_role("button", name="Fenster öffnen").click()
        board = info.value
        board.on("pageerror", lambda e: fehler.append(f"board: {e}"))
        board.wait_for_selector(".buehne")
        regie.get_by_role("button", name="Stunde starten").click()
        regie.wait_for_function("Z.raum")
        code = regie.evaluate("Z.raum.code")

        def handy():
            h = browser.new_context(viewport={"width": 390, "height": 800}).new_page()
            h.on("pageerror", lambda e: fehler.append(f"handy: {e}"))
            h.goto(f"{server}/{code}")
            return h

        def menue(titel: str):
            regie.locator(".methode-knopf", has_text=titel).click()
            return regie.locator(".methode-einstellung")

        def aktiv(titel: str):
            return regie.locator(".methode-aktiv", has_text=titel)

        # Energizer mit Begriff aus BEGRIFFE.md, zählt nicht zur Schrittzeit
        e = menue("Energizer")
        e.locator("select").select_option(label="Wer bin ich? (3 min)")
        e.get_by_role("button", name="Starten").click()
        board.wait_for_selector(".m-energizer .methode-begriff")
        assert board.locator(".methode-begriff").text_content() in ("Maske", "Schwelle", "append")
        regie.evaluate("Z.methoden.energizer.abStunde -= 60000")   # eine Minute Energizer nachstellen
        aktiv("Energizer").get_by_role("button", name="Beenden").click()
        board.wait_for_selector(".m-energizer", state="detached")
        assert regie.evaluate("Z.einschuebe.length") == 1

        # Think-Pair-Share: Phasen am Board, nächste Phase aus der Regie
        e = menue("Think-Pair-Share")
        e.locator('[data-feld="phasen_impuls"]').fill("Warum scheitert die feste Schwelle?")
        e.get_by_role("button", name="Starten").click()
        board.wait_for_selector(".phasen-leiste .phase.aktiv")
        assert "Einzelarbeit" in board.locator(".phase-wort").text_content()
        aktiv("Phasen").get_by_role("button", name="nächste Phase").click()
        board.wait_for_function("document.querySelector('.phase-wort').textContent === 'Partnerarbeit'")
        aktiv("Phasen").get_by_role("button", name="Beenden").click()

        # Rollenwechsel: nach Ablauf erscheint das Signal am Board
        e = menue("Rollenwechsel")
        e.locator('[data-feld="rollen_min"]').fill("2")
        e.get_by_role("button", name="Starten").click()
        board.wait_for_selector(".methode-chip:has-text('Rollenwechsel')")
        regie.evaluate("tun('methodeAendern', {art: 'rollen', teil: {uhr: {basis: 120500, seit: Date.now()}}})")
        board.wait_for_selector(".rollen-blitz")
        aktiv("Rollenwechsel").get_by_role("button", name="Beenden").click()

        # Helfersystem und Lerntempoduett: drei Handys mit Platznummer
        e = menue("Helfersystem")
        e.locator('[data-feld="aufgaben"]').fill("A1, A2")
        e.get_by_role("button", name="Starten").click()
        menue("Lerntempoduett").get_by_role("button", name="Starten").click()
        h3, h7, h9 = handy(), handy(), handy()
        for h, platz in ((h3, 3), (h7, 7), (h9, 9)):
            h.wait_for_selector("#praxis:not([hidden]) input.team")
            h.locator("#praxis input.team").fill(str(platz))
            h.locator("#praxis input.team").blur()
            h.wait_for_selector("#praxis .aufgaben")
        for h in (h3, h7):
            h.locator("#praxis .aufgaben label", has_text="A1").click()
        h7.locator("#praxis .option", has_text="helfe gern").click()
        h9.locator("#praxis .ampel button.rot").click()
        h9.locator("#praxis select").select_option("A1")
        regie.wait_for_function("Z.methoden.tempo.paare.length === 1 && Z.methoden.helfer.paare.length === 1", timeout=15000)
        assert regie.evaluate("JSON.stringify(Z.methoden.tempo.paare.map(p => [p.a, p.b, p.aufgabe]))") == '[[3,7,"A1"]]'
        assert regie.evaluate("JSON.stringify(Z.methoden.helfer.paare.map(p => [p.a, p.b]))") == "[[7,9]]"
        h3.wait_for_selector(".partner:has-text('Platz 7')", timeout=8000)
        h9.wait_for_selector(".partner:has-text('Platz 7 kommt')", timeout=8000)
        board.wait_for_selector(".methode-chip:has-text('3 + 7 (A1)')")
        aktiv("Hilfe-Ampel").get_by_role("button", name="groß").click()
        board.wait_for_selector(".hilfe-eintrag.rot:has-text('Platz 9')")
        aktiv("Hilfe-Ampel").get_by_role("button", name="erledigt").click()
        regie.wait_for_function("Z.methoden.helfer.paare.length === 0", timeout=8000)
        aktiv("Fortschritt").get_by_role("button", name="Beenden").click()   # beendet Duett und Helfer mit
        regie.wait_for_function("!Z.methoden.tempo && !Z.methoden.helfer && !Z.methoden.fortschritt")

        # Wortwolke: Wort am Handy, an der Tafel, in der Regie ausblendbar
        e = menue("Wortwolke")
        e.locator('[data-feld="wolke_frage"]').fill("Ein Wort zur Kante")
        e.get_by_role("button", name="Starten").click()
        h3.wait_for_selector("h1:has-text('Ein Wort zur Kante')", timeout=8000)
        h3.locator("input.text").first.fill("Gradient")
        h3.get_by_role("button", name="Senden").click()
        h3.wait_for_selector(".ok")
        board.wait_for_selector(".wolke-wort:has-text('Gradient')", timeout=8000)
        aktiv("Wortwolke").locator(".wolke-regie button", has_text="Gradient").click()
        board.wait_for_selector(".wolke-wort", state="detached")

        # Zielscheibe: Werte am Handy, Punkte an der Tafel
        menue("Zielscheibe").get_by_role("button", name="Starten").click()
        h7.wait_for_selector(".regler", timeout=8000)
        for regler in h7.locator(".regler").all():
            regler.locator("button").nth(4).click()
        h7.get_by_role("button", name="Senden").click()
        h7.wait_for_selector(".ok")
        board.wait_for_function("document.querySelectorAll('.zielscheibe circle[fill=\"#2b5cab\"]').length === 4", timeout=8000)

        # Exit-Ticket mit Kontrollfrage: Board zeigt nur die Zahl, Regie die Texte zum Markieren
        e = menue("Exit-Ticket")
        e.locator("select").select_option("abst")
        e.get_by_role("button", name="Starten").click()
        h3.wait_for_selector("textarea.text", timeout=8000)
        h3.locator(".option", has_text="3").first.click()
        h3.locator("textarea.text").fill("Warum Otsu besser ist")
        h3.get_by_role("button", name="Senden").click()
        h3.wait_for_selector(".ok")
        regie.wait_for_selector(".exit-text:has-text('Warum Otsu')", timeout=8000)
        regie.locator(".exit-text button[title*='aufgreifen']").click()
        regie.wait_for_selector(".exit-text.aufgreifen")
        board.wait_for_selector(".m-frage .methode-zahl:has-text('1 Antwort')")
        assert board.locator(".m-frage .balken-zeile").count() == 0
        aktiv("Exit-Ticket").get_by_role("button", name="Beenden").click()

        h = handy()
        weiter = lambda: regie.locator(".schritt-steuerung .weiter").click()   # noqa: E731
        freigeben = lambda: regie.get_by_role("button", name="Für Handys freigeben").last.click()   # noqa: E731
        ergebnis = lambda name: regie.locator(".karte", has_text="Steuerung").get_by_role("button", name=name, exact=True).click()   # noqa: E731

        # Abstimmung mit „sicher / geraten“
        weiter()
        freigeben()
        h.wait_for_selector(".sicher", timeout=8000)
        h.locator(".option", has_text="4").click()
        h.locator(".sicher button", has_text="sicher").first.click()
        h.get_by_role("button", name="Senden").click()
        h.wait_for_selector(".ok")
        regie.wait_for_function("document.body.textContent.includes('falsch, aber sicher: ')", timeout=8000)
        ergebnis("Abstimmung")
        board.wait_for_selector(".sicher-anteil")

        # Hotspot: Tipp aufs Bild, Lösungskreis auf Knopfdruck
        weiter()
        freigeben()
        h.wait_for_selector(".hotspot img", timeout=8000)
        box = h.locator(".hotspot img").bounding_box()
        h.mouse.click(box["x"] + box["width"] * 0.52, box["y"] + box["height"] * 0.48)
        h.get_by_role("button", name="Senden").click()
        h.wait_for_selector(".ok")
        regie.wait_for_function("(Z.online.antworten.bild || []).length === 1", timeout=8000)
        ergebnis("Hotspot")
        board.wait_for_selector(".hotspot-punkt")
        assert board.locator(".hotspot-loesung").count() == 0
        regie.get_by_role("button", name="Lösung zeigen").click()
        board.wait_for_selector(".hotspot-zahl:has-text('im Kreis: 1')")

        # Praxisphase aus der Tafel.yaml: Phasen im Auftrag, Rollenwechsel, Ampel und Duett starten von selbst
        weiter()
        board.wait_for_selector(".auftrag-phasen")
        regie.wait_for_function("Z.methoden.hilfe && Z.methoden.tempo && Z.methoden.rollen")
        assert "Phase 1 von 3" in board.locator(".auftrag .dauer").text_content()
        regie.locator(".karte", has_text="Steuerung").get_by_role("button", name="nächste Phase").click()
        board.wait_for_function("document.querySelector('.auftrag .dauer').textContent.includes('Phase 2')")
        h.wait_for_selector(".auftrag .phase:has-text('Phase 2 von 3')", timeout=8000)

        # Codezeilen ordnen
        weiter()
        regie.wait_for_function("!Z.methoden.tempo && !Z.methoden.rollen && !!Z.methoden.hilfe")   # Methoden des Schritts enden, die spontan gestartete Ampel läuft weiter
        freigeben()
        h.wait_for_selector("h1:has-text('Bringt die Zeilen')", timeout=8000)
        for zeile in ["summe = 0", "for x in [1, 2, 3]:", "summe = summe + x", "print(summe)"]:
            h.locator("div:not(.geordnet) > .codezeile:not(.platziert)", has_text=zeile).first.click()
        h.get_by_role("button", name="Senden").click()
        h.wait_for_selector(".ok")
        regie.wait_for_function("(Z.online.antworten.ordnen || []).length === 1", timeout=8000)
        ergebnis("Ordnen")
        board.wait_for_selector(".ordnen-kopf:has-text('1 von 1')")

        # Fehlerzeile
        weiter()
        freigeben()
        h.wait_for_selector("h1:has-text('Welche Zeile')", timeout=8000)
        h.locator(".codezeile").nth(1).click()
        h.get_by_role("button", name="Senden").click()
        h.wait_for_selector(".ok")
        regie.wait_for_function("(Z.online.antworten.fehler || []).length === 1", timeout=8000)
        ergebnis("Fehler")
        regie.get_by_role("button", name="Lösung zeigen").click()
        board.wait_for_selector(".fehler-zeile.loesung .zahl:has-text('1')")

        # SQL live: Abfrage, Beispiel, Fehler; Regie-Vorschau rechnet mit
        weiter()
        board.wait_for_selector(".b-sql")
        board.locator(".sql-los").click()
        board.wait_for_selector(".sql-ergebnis td:has-text('Bello')")
        board.locator(".sql-beispiele button", has_text="Zählen").click()
        board.wait_for_function("document.querySelector('.sql-ergebnis th').textContent === 'art'")
        board.locator(".sql-eingabe").fill("INSERT INTO tier (name, art, alter_jahre) VALUES ('Fips', 'Hund', 2);")
        board.locator(".sql-los").click()
        board.wait_for_selector(".leer-hinweis:has-text('Geänderte Zeilen: 1')")
        board.locator(".sql-tabellen button", has_text="tier").click()
        board.wait_for_selector(".sql-ergebnis td:has-text('Fips')")
        regie.wait_for_selector(".vorschau-rahmen .sql-ergebnis td:has-text('Fips')")
        board.locator(".sql-eingabe").fill("SELEC kaputt")
        board.locator(".sql-los").click()
        board.wait_for_selector(".sql-fehler")
        h.wait_for_selector(".tafel .fehler", timeout=8000)

        # Befund enthält Einschübe, Handy-Antworten und Markierungen
        with regie.expect_download() as d:
            regie.get_by_role("button", name="Zeiten sichern").click()
        befund = json.loads(Path(d.value.path()).read_text(encoding="utf-8"))
        assert befund["einschuebe"][0]["titel"] == "Wer bin ich?"
        assert befund["markiert"][0]["marke"] == "aufgreifen"
        assert "ordnen" in befund["handys"]["antworten"]
        browser.close()
    assert not fehler, fehler
