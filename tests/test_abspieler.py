"""Browser-Test für Bauskript und Abspieler (Playwright, Chromium, file://).

Aufruf:  python -m pytest tests/  oder  python tests/test_abspieler.py
Benötigt: pip install pytest playwright pyyaml pillow pygments segno && python -m playwright install chromium
"""
from __future__ import annotations

import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

WURZEL = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WURZEL / "build"))
import bauen  # noqa: E402

BEISPIEL = WURZEL / "tests" / "beispiel" / "06_Stunde" / "Tafel.yaml"


def bauen_beispiel(ziel: Path) -> None:
    assert bauen.main([str(BEISPIEL), "-o", str(ziel), "--server", ""]) == 0


def test_pruefung_findet_fehler(tmp_path: Path) -> None:
    kaputt = tmp_path / "Tafel.yaml"
    kaputt.write_text(
        "format: tafelstunde/0\nstunde: {fach: T, titel: X, dauer: 5}\nanzeigen: {tafel: Board}\n"
        "schritte:\n  - id: a\n    soll_min: 5\n    tafel: {baustein: bild, datei: fehlt.png}\n"
        "    schueler: {baustein: abstimmung, frage: f, optionen: [x], loesung: y}\n",
        encoding="utf-8")
    assert bauen.main([str(kaputt), "--nur-pruefen"]) == 1


def test_abspieler(tmp_path: Path) -> None:
    datei = tmp_path / "Tafel.html"
    bauen_beispiel(datei)
    url = datei.as_uri()
    fehler: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        kontext = browser.new_context(viewport={"width": 1400, "height": 900})
        regie = kontext.new_page()
        regie.on("pageerror", lambda e: fehler.append(f"regie: {e}"))
        regie.goto(url)
        assert "Beispielstunde" in regie.text_content("h1")

        # Board aus der Regie öffnen: neues Fenster, verbunden über postMessage
        with regie.expect_popup() as info:
            regie.get_by_role("button", name="Fenster öffnen").click()
        board = info.value
        board.on("pageerror", lambda e: fehler.append(f"board: {e}"))
        board.wait_for_selector(".buehne")
        assert board.locator(".b-titel h1").text_content() == "Beispiel"

        # Weiter in der Regie → Board zeigt geteilt: Bild + Auftragsleiste mit Countdown und QR
        regie.get_by_role("button", name="Stunde starten").click()
        regie.locator(".schritt-steuerung .weiter").click()
        board.wait_for_selector(".flaeche.geteilt")
        assert board.locator(".b-bild .z1").text_content() == "Was ist das?"
        assert board.locator(".auftrag .material-eintrag .qr svg").count() == 1
        board.wait_for_function("document.querySelector('.auftrag .countdown').textContent.startsWith('0:5')")

        # Handzeichen in der Regie zählen
        regie.locator(".zaehler-zeile", has_text="orange").get_by_role("button", name="+").click()
        regie.locator(".zaehler-zeile", has_text="orange").get_by_role("button", name="+").click()

        # Extern: Board zeigt den Hinweis, Reserve ist ausgeblendet und wird übersprungen
        regie.locator(".schritt-steuerung .weiter").click()
        board.wait_for_selector(".buehne.extern")
        assert "Weiter: Code" in regie.locator(".schritt-steuerung .weiter").text_content()

        # Code: Marke am Board antippen → Erklärung in Regie-Vorschau und Board
        regie.locator(".schritt-steuerung .weiter").click()
        board.wait_for_selector(".code-raster")
        board.get_by_role("button", name="eins").click()
        board.wait_for_selector(".erklaerung")
        regie.wait_for_function("document.body.textContent.includes('Marken 1/2')")
        regie.get_by_role("button", name="Nächste: drei").click()
        board.wait_for_function("document.querySelectorAll('.erklaerung').length === 2")

        # Reiter wechseln am Board → Zeichnen, ein Strich, Rückgängig
        board.locator(".reiterleiste button", has_text="Rechnen").click()
        canvas = board.locator(".b-zeichnen canvas")
        canvas.wait_for()
        box = canvas.bounding_box()
        board.mouse.move(box["x"] + 100, box["y"] + 300)
        board.mouse.down()
        board.mouse.move(box["x"] + 300, box["y"] + 320, steps=5)
        board.mouse.up()
        regie.wait_for_function("Z.striche['code:1'] && Z.striche['code:1'].length === 1")
        board.get_by_title("Rückgängig").click()
        regie.wait_for_function("Z.striche['code:1'].length === 0")

        # Ergebnis der Vorhersage mit Lösung (aufgelöst in „code“, also danach sichtbar)
        regie.locator(".schritt-steuerung .weiter").click()
        board.wait_for_selector(".balken-zeile.loesung")
        assert board.locator(".balken-zeile.loesung .zahl").text_content() == "2"

        # Platzhalter für nicht umgesetzte Bausteine
        board.locator(".reiterleiste button", has_text="Neu").click()
        board.wait_for_selector(".b-platzhalter")

        # Schwarz per Taste B
        board.keyboard.press("b")
        board.wait_for_selector(".buehne.schwarz")

        # Fensterverwaltung: Board steht als offen in der Liste
        regie.wait_for_selector(".fenster-zeile .fenster-status.offen")

        # Sicherung: diese Ansicht als PNG (ohne Ordner → Download)
        board.keyboard.press("b")
        board.wait_for_selector(".buehne:not(.schwarz)")
        with regie.expect_download() as d:
            regie.get_by_role("button", name="Diese Ansicht als PNG").click()
        einzel = d.value
        assert einzel.suggested_filename.startswith("Sicherung_") and einzel.suggested_filename.endswith(".png")
        png = tmp_path / einzel.suggested_filename
        einzel.save_as(png)
        from PIL import Image
        assert Image.open(png).size == (1920, 1080)

        # alle Folien: Start, Tipp, Code (3 Reiter), Ende (3 Reiter); Referat ist extern, Reserve aus
        dateien = []
        regie.on("download", lambda dl: dateien.append(dl.suggested_filename))
        regie.get_by_role("button", name="Alle Folien als PNG").click()
        regie.wait_for_function("document.querySelector('[data-sicherung]').textContent.includes('Folien gesichert')", timeout=60000)
        regie.wait_for_timeout(500)
        assert len(dateien) == 8, dateien
        assert dateien[0] == "01_Start.png", dateien

        # Fenster schließen aus der Regie
        regie.locator(".fenster-zeile").get_by_role("button", name="Schließen").click()
        regie.wait_for_selector(".fenster-zeile .fenster-status:not(.offen)")

        # Zustand übersteht Neuladen
        regie.reload()
        regie.wait_for_selector(".eintrag.aktiv")
        assert "Ende" in regie.locator(".eintrag.aktiv").text_content()

        # Schmal (Handy als Regie): eine Spalte, nichts läuft seitlich über
        handy = browser.new_page(viewport={"width": 390, "height": 800})
        handy.goto(url)
        breite = handy.evaluate("document.documentElement.scrollWidth")
        assert breite <= 400, breite
        browser.close()
    assert not fehler, fehler


def test_board_im_hauptfenster(tmp_path: Path) -> None:
    """Zwei Monitore (nachgestellt): „Fenster öffnen“ macht das Hauptfenster zum Board im Vollbild
    und öffnet die Regie als eigenes Fenster. „Beenden“ in der Regie macht es wieder zur Regie."""
    datei = tmp_path / "Tafel.html"
    bauen_beispiel(datei)
    fehler: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        haupt = browser.new_page(viewport={"width": 1400, "height": 900})
        haupt.on("pageerror", lambda e: fehler.append(f"haupt: {e}"))
        haupt.goto(datei.as_uri())
        haupt.evaluate("""() => {
            BILDSCHIRME = [
              { label: 'Laptop', left: 1920, top: 0, width: 1400, height: 900, availLeft: 1920, availTop: 0, availWidth: 1400, availHeight: 860, isPrimary: true },
              { label: 'Tafel', left: 0, top: 0, width: 1920, height: 1080, availLeft: 0, availTop: 0, availWidth: 1920, availHeight: 1080, isPrimary: false }];
            geraetAendern(g => { g.monitor = { Board: fingerabdruck(BILDSCHIRME[1]) }; });
            document.documentElement.requestFullscreen = () => Promise.resolve();
            neuZeichnen();
        }""")
        assert "öffnet im Vollbild" in haupt.locator(".fenster-zeile").first.text_content()
        with haupt.expect_popup() as info:
            haupt.get_by_role("button", name="Fenster öffnen").click()
        regie = info.value
        regie.on("pageerror", lambda e: fehler.append(f"regie: {e}"))
        haupt.wait_for_function("ROLLE === 'anzeige'")
        regie.wait_for_selector(".schritt-steuerung")
        regie.wait_for_function("document.querySelector('.fenster-zeile .fenster-status.offen') !== null")
        regie.locator(".schritt-steuerung .weiter").click()
        haupt.wait_for_selector(".b-bild")
        # Überwachen: Handys-Tab zeigt die nachgebaute Schüler-Seite
        regie.locator(".karte", has_text="Überwachen").get_by_role("button", name="Handys").click()
        regie.wait_for_selector(".handy.gross")
        # Board beenden → Hauptfenster ist wieder die Regie, Regie-Fenster geht zu
        regie.locator(".fenster-zeile").first.get_by_role("button", name="Beenden").click()
        haupt.wait_for_selector(".regie")
        assert haupt.evaluate("ROLLE") == "regie"
        haupt.wait_for_function("REGIE_FENSTER === null")
        browser.close()
    assert not fehler, fehler


def test_vollbild_abgelehnt_bleibt_regie(tmp_path: Path) -> None:
    """Lehnt der Browser das Vollbild ab, bleibt das Hauptfenster die Regie (kein Board im selben Tab)."""
    datei = tmp_path / "Tafel.html"
    bauen_beispiel(datei)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        haupt = browser.new_page(viewport={"width": 1400, "height": 900})
        meldungen: list[str] = []
        haupt.on("dialog", lambda d: (meldungen.append(d.message), d.dismiss()))
        haupt.goto(datei.as_uri())
        haupt.evaluate("""() => {
            BILDSCHIRME = [
              { label: 'Laptop', left: 0, top: 0, width: 1400, height: 900, availLeft: 0, availTop: 0, availWidth: 1400, availHeight: 860, isPrimary: true },
              { label: 'Tafel', left: 1400, top: 0, width: 1920, height: 1080, availLeft: 1400, availTop: 0, availWidth: 1920, availHeight: 1080, isPrimary: false }];
            geraetAendern(g => { g.monitor = { Board: fingerabdruck(BILDSCHIRME[1]) }; });
            document.documentElement.requestFullscreen = () => Promise.reject(new TypeError('Permissions check failed'));
            neuZeichnen();
        }""")
        haupt.get_by_role("button", name="Fenster öffnen").click()
        haupt.wait_for_timeout(800)
        assert haupt.evaluate("ROLLE") == "regie"
        assert meldungen and "nicht im Vollbild" in meldungen[0], meldungen
        assert any("Vollbild abgelehnt" in z for z in haupt.evaluate("protokoll()"))
        browser.close()


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as t:
        test_pruefung_findet_fehler(Path(t))
        test_abspieler(Path(t))
        test_board_im_hauptfenster(Path(t))
        test_vollbild_abgelehnt_bleibt_regie(Path(t))
    print("alle Tests bestanden")
