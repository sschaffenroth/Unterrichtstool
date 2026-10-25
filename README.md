# Unterrichtstool

Tafelsystem für den Unterricht an der Technikerschule: Touch-Tafel, Auftragsansicht,
Regie für die Lehrkraft und Schüler-Interaktion per QR-Code, für jede Stunde jedes Fachs.

**Stand:** Grundgerüst. Noch keine Funktion, nur Konzept und Ordner.

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
