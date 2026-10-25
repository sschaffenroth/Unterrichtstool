# Unterrichtstool

Tafelsystem für den Unterricht an der Technikerschule: Touch-Tafel, Auftragsansicht,
Regie für die Lehrkraft und Schüler-Interaktion per QR-Code, für jede Stunde jedes Fachs.

**Stand:** erster Abspieler (Version 0.1). Aus einer `Tafel.yaml` entsteht eine HTML-Datei, die
offline läuft: Regie, Board mit Ansichten geteilt/tafel/auftrag/extern/schwarz, Bausteine titel,
bild, folie, qr, auftrag, code (mit Marken), zeichnen, ergebnis. Handys melden sich per
QR-Code oder Link an (Worker unter `worker/`), Abstimmungen gehen zusätzlich per Handzeichen.

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
| Zeiten, Zähler, Stimmen sichern | „Zeiten sichern“ (JSON) |

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

## Dokumente

| Datei | Inhalt |
|---|---|
| [`docs/konzept.md`](docs/konzept.md) | Konzept (Teil A) und Steckbrief-Vorlage für weitere Fächer (Teil B) |
| [`docs/stand.md`](docs/stand.md) | aktueller Stand und Stundenformat `tafelstunde/0` für Fach-Chats |
| [`docs/anforderungen.md`](docs/anforderungen.md) | alle Anforderungen mit ID, Quelle, Priorität und Stufe |
| [`docs/steckbriefe/`](docs/steckbriefe/) | Steckbriefe je Fach |
| [`docs/konzept_tafelsteuerung_v0.md`](docs/konzept_tafelsteuerung_v0.md) | erster Entwurf zur Tafelsteuerung (Prototyp ES 06) |

## Aufbau

```
app/kern/        Zustand, Nachrichten, Synchronisation
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
