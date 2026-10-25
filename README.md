# Unterrichtstool

Tafelsystem für den Unterricht an der Technikerschule: Touch-Tafel, Auftragsansicht,
Regie für die Lehrkraft und Schüler-Interaktion per QR-Code, für jede Stunde jedes Fachs.

**Stand:** Abspieler 0.3. Aus einer `Tafel.yaml` entsteht eine HTML-Datei, die offline läuft: Regie, Board
mit Ansichten geteilt/tafel/auftrag/extern/schwarz, Bausteine titel, bild, folie, qr, auftrag (mit Phasen und
Rollenwechsel), code (mit Marken), zeichnen, ergebnis, einbetten, sql. Handys melden sich per QR-Code oder Link an
(Worker unter `worker/`): Abstimmung, Vorhersage (mit „sicher / geraten“), Wortwolke, Zielscheibe, Exit-Ticket,
Hotspot, Codezeilen ordnen, Fehlerzeile. Methoden-Menü in der Regie: Energizer, Think-Pair-Share, 1-2-4-Alle,
Rollenwechsel, Hilfe-Ampel, Fortschritt, Lerntempoduett, Helfersystem, Wortwolke, Zielscheibe, Exit-Ticket.

Stunden bauen die Fach-Chats selbst (`docs/stand.md` Teil 6).

## Stunde bauen

```
pip install pyyaml pillow pygments segno
python build/bauen.py PFAD/ZUM/Stundenordner/Tafel.yaml
```

Prüft die Datei und schreibt `Tafel.html` daneben. Nur prüfen: `--nur-pruefen`.

## Bedienung

| Was | Wie |
|---|---|
| Starten | `start/Tafel starten.bat` und `start/tafel_server.ps1` einmal in den Fachordner kopieren. Doppelklick auf „Tafel starten“: lokaler Server auf `http://localhost:8765`, Edge zeigt die Stundenauswahl. Nötig, damit Edge „Fensterverwaltung“ erlaubt (bei `file://` gibt es keine Berechtigungen) |
| Regie | Stunde in der Auswahl anklicken (oder `Tafel.html` direkt öffnen, dann ohne Monitor-Zuordnung) |
| Fenster öffnen | „Fenster öffnen“ (oder automatisch bei „Stunde starten“). Ist dem Board ein anderer Monitor zugeordnet, geht dieses Fenster dort ins Vollbild und die Regie öffnet sich als eigenes Fenster auf dem Laptop |
| Board beenden, verschieben | in „Fenster und Monitore“: „Beenden“ (Hauptfenster wird wieder Regie), Monitor wechseln, „Vollbild“ |
| Überwachen | Karte „Überwachen“: Alle, je Anzeige, Handys (was die Schüler sehen, mit Anmelde-QR) |
| Fenster fest einem Monitor zuordnen | „Monitore erkennen“, einmal „Fensterverwaltung“ erlauben, je Fenster Monitor wählen. Gilt auf diesem Laptop für alle Stunden |
| zusätzliches Fenster | „+ Fenster“, z. B. „Monitor 2“ mit Ansicht auftrag |
| nur ein Rechner am Board | „Hier Board zeigen“, Regie dann hinter ☰ (oder Taste R) |
| weiter / zurück | Pfeiltasten, Bild↑/Bild↓ (Presenter), Leertaste, Knöpfe ‹ › |
| Board schwarz | Taste B |
| Vollbild | Taste F oder ⛶ |
| Handys anmelden | „Stunde starten“ legt den Raum an, „Anmelde-QR aufs Board“ zeigt QR und Link groß |
| Frage auf die Handys | in der Regie „Für Handys freigeben“, schließt beim Weitergehen |
| Ansicht sichern | „Diese Ansicht als PNG“ in der Regie, 📷 oder Taste S am Board |
| alle Folien sichern | „Alle Folien als PNG“ (Unterordner `Folien_…`) oder „Alle Folien als PDF“ (Druckfenster) |
| Ablageordner | „Ordner wählen“, z. B. den Stundenordner. Ohne Ordner: Download-Ordner |
| Zeiten, Zähler, Stimmen sichern | „Zeiten sichern“ (JSON, mit Handy-Antworten, Exit-Texten, Energizern, Praxisphase) |
| Methode spontan starten | Karte „Methoden“: Methode antippen, Einstellungen, „Starten“. Laufende Methode: Board groß, klein (Leiste unten links) oder aus, „Beenden“ |
| SQL an der Tafel | Abfrage tippen, „Ausführen“ oder Strg + Enter, Beispiel- und Tabellen-Knöpfe, „Zurücksetzen“ |

Der Zustand bleibt beim Neuladen erhalten (Browser-Speicher). „Zurücksetzen“ löscht ihn.

## Server

`worker/index.js` mit einem Durable Object je Raum (SQLite, Free-Plan). Push auf `main` veröffentlicht
ihn unter `https://unterrichtstool.s-schaffenroth.workers.dev`. Lokal: `npx wrangler dev`.
Andere Adresse beim Bauen: `--server URL`, ohne Handys: `--server ""`.

## Tests

```
pip install pytest playwright && python -m playwright install chromium
python -m pytest tests/
```

`tests/test_methoden.py` braucht Node.js: `tests/testserver.mjs` führt den Worker lokal mit nachgebautem Speicher
aus, die Handys sind echte Browser-Seiten.

## Dokumente

| Datei | Inhalt |
|---|---|
| [`docs/konzept.md`](docs/konzept.md) | Konzept (Teil A) und Steckbrief-Vorlage für weitere Fächer (Teil B) |
| [`docs/stand.md`](docs/stand.md) | aktueller Stand und Stundenformat `tafelstunde/0` für Fach-Chats |
| [`docs/ideen_methoden.md`](docs/ideen_methoden.md) | Ideensammlung: digitale Methoden, die noch passen würden |
| [`docs/anforderungen.md`](docs/anforderungen.md) | alle Anforderungen mit ID, Quelle, Priorität und Stufe |
| [`docs/steckbriefe/`](docs/steckbriefe/) | Steckbriefe je Fach |
| [`docs/konzept_tafelsteuerung_v0.md`](docs/konzept_tafelsteuerung_v0.md) | erster Entwurf zur Tafelsteuerung (Prototyp ES 06) |

## Aufbau

```
app/kern/        Zustand, Nachrichten, Synchronisation, Methoden (methoden.js)
app/lib/         qrcode, html-to-image, sql.js (MIT, nur eingebettet, wenn eine Stunde `sql` nutzt)
app/bausteine/   je Baustein: Darstellung + Schüler-Teil
worker/          Cloudflare Worker: API, Abstimmung, Echtzeit-Raum
build/           Bauskript: Stunde → Einzeldatei (offline) oder Web-Fassung
tests/           Tests mit simuliertem Server und simulierter Uhr
public/          was Cloudflare ausliefert
```

## Auslieferung

Push auf `main` → Cloudflare baut und veröffentlicht (`wrangler.jsonc`).

## Was nicht hierher gehört

Stunden-Dateien mit Notizen und Lösungen, Namenslisten, Lehrer-Schlüssel. Die bleiben im
Stundenordner bzw. als Secret im Worker.
