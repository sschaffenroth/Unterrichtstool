# Tafelsystem für den Unterricht: Konzept und Anforderungs-Steckbrief

Stand 25.10.2026 · Version 0.2 · Grundlage: Prototyp KIG ES 06 (Tafeldatei + Abstimmungs-Worker),
Steckbrief GP (`docs/steckbriefe/GP.md`). Alle Anforderungen mit Nummer: `docs/anforderungen.md`.

> **Für andere Chats:** Dieses Dokument beschreibt ein geplantes Werkzeug. Du sollst **nichts bauen**.
> Lies Teil A, um das System zu verstehen. Fasse dann die Anforderungen deines Fachs oder deiner
> Stunden mit der Vorlage in **Teil B** zusammen. Gib das Ergebnis als einen Markdown-Block zurück.
> Halte dich an die Begriffe aus Teil A, damit alle Steckbriefe zusammengeführt werden können.

---

# Teil A · Konzept

## A1 · Ziel in einem Satz

Ein Werkzeug, mit dem die Lehrkraft **jede Stunde jedes Fachs** führt: Es füllt die Touch-Tafel
mit interaktivem Material, zeigt Arbeitsaufträge auf einem eigenen Bildschirm, bindet die Handys
der Klasse ein (Abstimmen, Fragen, Feedback) und gibt der Lehrkraft eine Regie-Ansicht, in der sie
den Ablauf überwacht und festlegt, welcher Bildschirm was zeigt.

## A2 · Rollen und Ansichten

Eine Anwendung, mehrere Rollen. Jede Rolle ist dieselbe Web-Anwendung mit anderer Adresse.

| Rolle | Gerät | Aufgabe |
|---|---|---|
| **Tafel** | interaktives Board in der Mitte (Touch) | das Arbeitsmaterial der Stunde: Tafelbild, Spielbrett, Grafik, Code, SQL, Zuordnen. Wird angefasst. |
| **Auftrag** | Beamer oder Zweitmonitor | der aktuelle Arbeitsauftrag: Aufgabe, Sozialform, Zeit (Countdown), Material, Abgabe. Ersetzt die PowerPoint-Folien. Kann auch QR-Code oder Ergebnisse groß zeigen. |
| **Regie** | Lehrer-Laptop, Tablet oder Handy | Ablauf der Stunde mit Soll-/Ist-Zeit und Verzug, Notizen je Schritt (erwartete Antwort, „Wenn es stockt“, Einwände, Kontrollfragen), nächster Schritt, Miniaturen aller Bildschirme, Zuweisung „welcher Bildschirm zeigt was“, Reiter der Tafel fernsteuern, Abstimmungen starten/schließen, Live-Ergebnisse, Zähler und Strichlisten für den Befund, **Notausstieg-Assistent** (siehe A7). Uhrzeiten nur hier, nie auf Schüler-Anzeigen. |
| **Schüler** | Handys der Klasse (QR-Code) | abstimmen, Frage beantworten, zuordnen, Formular, Feedback, Frage stellen. Ohne Konto, ohne Namen. |
| **Auswertung** | Lehrer-Rechner, nach der Stunde | Ergebnisse, Zeitverlauf, Feedback je Fach und Datum. Export, Löschen. |

Zuweisung ist frei: Jeder Bildschirm (Anzeige A, B, C …) kann jede **Ansicht** zeigen —
ein Bildschirm der Stunde, Arbeitsauftrag, QR-Code, Ergebnisse, Uhr/Countdown, Bild/PDF-Seite,
schwarz. Die Lehrkraft schaltet in der Regie um, oder der Ablauf der Stunde schaltet automatisch.

**Räume mit nur einer Anzeige** (z. B. SYS: ein Board, kein Beamer): Ansicht `geteilt` zeigt den
Tafel-Baustein groß und daneben eine schmale Auftragsleiste mit Countdown. Ansicht `extern` heißt:
Das Board zeigt einen fremden Eingang (Laptop per HDMI). Die Regie zählt weiter und gibt bei
Soll-Ende ein Signal. Die Regie liegt dann auf Laptop oder Handy. Format: `docs/stand.md`, Teil 2.

## A3 · Die Stunde als Daten

Eine Stunde ist **keine Folienpräsentation**, sondern ein **Ablauf aus Schritten**. Jeder Schritt
sagt, was auf welcher Anzeige erscheint und was die Schüler auf dem Handy tun können.

```yaml
stunde:
  fach: KIG
  titel: ES 06 – Wer haftet, wenn die KI irrt?
  datum: 2026-10-26
  dauer: 90
schritte:
  - id: einstieg
    titel: Einstieg
    soll_min: 5
    tafel:   { baustein: titel, text: "Wer haftet?" }
    auftrag: { baustein: auftrag, text: "Notiert eine Vermutung.", sozialform: EA, zeit: 3 }
    schueler: { baustein: abstimmung, frage: "Wer haftet?", optionen: [Hersteller, Betreiber, Nutzer] }
    notiz: "Nicht auflösen, Ergebnis stehen lassen."
  - id: erarbeitung
    titel: Spielbrett
    soll_min: 25
    tafel:   { baustein: brett, … }
    auftrag: { baustein: auftrag, text: "…", sozialform: GA, zeit: 20 }
```

Gleiche Quelle für alles: Daraus entstehen Tafel, Auftrag, Regie, Schüler-Seite, Druckfassung
(Heft, Exit-Ticket, Wandkarten als Word/PowerPoint), Stundenverlauf-Abschnitte und der Eintrag in
`stundenplan.json`. Aufträge stehen wortgleich auf Anzeige und Blatt.

Ergänzungen aus GP:

- Ein Schritt kann **ausgeblendet** sein (Reserve, Ausweichweg) und wird erst in der Regie eingeschaltet.
- Ein Schritt trägt Kennzeichen für den Notausstieg: `pruefpunkt`, `kuerzbar`, `nie_kuerzen`,
  `ziel_bei_wegfall: hausaufgabe | naechste_stunde`.
- Eine Stunde kann mehrere **Fassungen** haben (Fassung 1 bis 3, je mit kurzem Grund).
- Die Stunden-Datei ist Daten (YAML/JSON), damit Web-Anwendung **und** die Python-Generatoren sie
  lesen. Heutige Quellen wie `stunde_texte.py` werden in dieses Format überführt.

## A4 · Baustein-Bibliothek

Alles, was eine Ansicht zeigen kann, ist ein **Baustein**. Neue Fächer bringen höchstens neue
Bausteine mit, nie eigenen Sondercode.

| Baustein | Anzeige | Zweck | Status |
|---|---|---|---|
| `titel` | Tafel/Auftrag | Überschrift, Leitfrage | vorhanden (ES 06) |
| `folie` | Tafel/Auftrag | Markdown mit Bild, schrittweise aufdecken | neu |
| `auftrag` | Auftrag | Aufgabe, Sozialform, Countdown, Material, Abgabe | teilweise (Uhr) |
| `kette` | Tafel | Ursache-Wirkung-Kette / stehendes Tafelbild | vorhanden |
| `grafik` | Tafel | Diagramm, Schaubild | vorhanden |
| `zuordnen` | Tafel + Schüler | Karten zuordnen, an der Tafel oder am Handy | vorhanden |
| `vorhersage` | Tafel + Schüler | Vermutung abgeben, später auflösen | vorhanden |
| `brett` | Tafel | Spielbrett mit Rollen/Figuren | vorhanden |
| `formular` | Schüler → Tafel | Freitext-Antworten, gesammelt angezeigt | vorhanden |
| `abstimmung` | Schüler → Tafel | QR-Abstimmung, Balken live | vorhanden |
| `feedback` | Schüler | Stundenabschluss: Skala + Freitext | neu |
| `fragen` | Schüler → Regie | Schüler stellen anonym Fragen, Lehrkraft gibt frei | neu |
| `code` | Tafel | Code wie im Editor (≥ 20 pt, teilen statt verkleinern), Marken mit eingeblendeten Kommentaren, Fehler zeigen/beheben, Probelauf mit Testeingaben, Konsole und Variablenanzeige, zwei Programme nebeneinander | neu (GP, ET1, SYS) |
| `codestreifen` | Tafel | Codestreifen in Zonen ziehen (vor/in/nach Schleife, Funktion/Hauptprogramm), ▶ ausführen, Fallen | neu (GP) |
| `beschriften` | Tafel | Begriffe auf nummerierte Kästen/Klammern im Code ziehen, prüfen, Begründung | neu (GP, ET1) |
| `urteilen` | Tafel | je Element ein Urteil aus fester Liste, „Vergleichen“ zeigt Begründung | neu (GP) |
| `testfaelle` | Tafel + Regie | Tabelle Eingabe/erwartete Ausgabe zum Abhaken, Zähler in der Regie | neu (GP) |
| `partner` | Tafel | Paare/Gruppen auslosen als Show, Abwesende antippen. Namensliste nur lokal | neu (GP) |
| `sql` | Tafel | Abfrage live im Browser (sql.js), Ergebnis als Tabelle | neu (DB) |
| `zeichnen` | Tafel | freie Zeichenfläche, Sichern als PNG | teilweise (PNG) |
| `bild` / `pdf` | Tafel/Auftrag | Bild oder PDF-Seite | neu |
| `uhr` / `schwarz` / `qr` | jede | Hilfsansichten | teilweise |

## A5 · Technik

**Ein Git-Repository, von Cloudflare automatisch ausgeliefert.**

```
tafelsystem/                     (GitHub, mit Cloudflare verknüpft)
├─ app/                          Web-Anwendung: Tafel, Auftrag, Regie, Schüler, Auswertung
│  ├─ kern/                      Zustand, Nachrichten, Synchronisation
│  └─ bausteine/                 je Baustein: Darstellung + Schüler-Teil
├─ worker/                       Cloudflare Worker: API, Abstimmung, Echtzeit-Raum
├─ stunden/                      optional: Stunden-Dateien (oder weiter im Stundenordner)
├─ build/                        Bauskript: Stunde → Einzeldatei (offline) oder Web-Fassung
└─ tests/                        simulierter Server, simulierte Uhr (wie ab_test2.py, zeit_test.py)
```

- **Auslieferung:** Push auf `main` → Cloudflare baut und veröffentlicht. Vor dem Bau prüfen, ob
  Workers mit statischen Dateien oder Pages der bessere Weg ist; beide lassen sich mit Git verbinden.
- **Synchronisation:**
  - Ein Rechner mit mehreren Bildschirmen: Fenster per Window Management API verteilen, Nachrichten
    per `postMessage`. Läuft auch ohne Netz.
  - Mehrere Geräte (Tablet als Regie): ein Raum je Stunde im Worker (Durable Object mit WebSocket),
    gekoppelt über einen vierstelligen Raumcode. Rückfall: Abfrage alle 1–2 s.
- **Zustand an einer Stelle:** Jede Aktion ist eine Nachricht (`weiter`, `zeige`, `aufloesen` …).
  Alle Ansichten wenden sie gleich an. Die Bedienung direkt am Board erzeugt dieselben Nachrichten.
- **Offline-Notfall:** Das Bauskript erzeugt zusätzlich eine Einzeldatei je Stunde, die ohne Netz
  läuft (wie heute). Schüler-Interaktion fällt dann auf Handzeichen zurück.
- **Zugang:** Regie und Auswertung hinter Lehrer-Schlüssel oder Cloudflare Access. Schüler-Seiten
  offen, aber nur mit Raumcode erreichbar. Schülerfassung ohne Notizen, Lösungen und Schlüssel.

- **Was ins Repository gehört:** nur die Anwendung (Kern, Bausteine, Worker, Bauskript, Tests).
  Stunden-Dateien mit Notizen und Lösungen bleiben im Stundenordner (OneDrive/Teams) und werden
  beim Bauen eingelesen. Solange das Repository öffentlich ist, gilt das zwingend.

## A6 · Datenschutz

- Schüler-Handys: nur zufällige Geräte-Kennung und Antwort. Keine Namen, keine IP-Adressen.
- Freitext kann trotzdem Namen enthalten: Hinweis „ohne Namen“ in jedem Formular.
- Speicherdauer festlegen, Löschen je Fach und je Stunde in der Auswertung.
- Vor dem Einsatz in mehreren Fächern mit der/dem Datenschutzbeauftragten klären.
- **Namenslisten** (z. B. für `partner`) nur lokal am Board-Rechner, nie im Worker, nie im Repository.
- Antworten im Werkzeug führen nie zu einer Note. Exit-Ticket und Vorhersagen nur als Zählung,
  löschen nach dem Befund (Vorschlag: 4 Wochen).

## A7 · Querschnitt: gilt für alle Bausteine

Aus dem Steckbrief GP, gilt aber für alle Fächer:

- **Reiter:** Ein Tafel-Baustein darf mehrere Reiter haben. Die Regie wählt den Reiter.
- **Rückgängig** und „Alles zurück“ in jedem Baustein.
- **Sicherung als PNG** je Ansicht, direkt in den Stundenordner (`Sicherung_JJJJ-MM-TT_<Titel>.png`),
  nicht in Downloads. Technisch: Ordner einmal über die File System Access API wählen (Chromium).
- **Lesbarkeit:** Mindestschrift 20 pt für Code und Ausgaben. Das Bauskript warnt, wenn etwas überläuft.
- **Touch:** große Ziele, Skalierung per Container-Einheiten, Kontrolle auch auf 390 px Breite.
- **Auftragsansicht nach festem Muster:** Titel, Piktogramm + Sozialform als Wort, Dauer, genau ein
  Auftragssatz. Nur Dauer, nie Uhrzeit.
- **Corporate Design** der Schule (Logo, Farben aus der PowerPoint-Vorlage).
- **Export:** jede Ansicht als PNG, ganze Stunde als PowerPoint (Notfall, Kollegen), Material für die UVP.
- **Notausstieg-Assistent:** An Prüfpunkten zeigt die Regie den Verzug und bietet −10/−20/−30 an. Ein
  Klick plant den Rest um: gekürzt wird in `kuerzbar`-Schritten, `nie_kuerzen`-Schritte bleiben, was
  wegfällt, wandert nach `ziel_bei_wegfall`.
- **Befund nach der Stunde:** Ist-Zeiten automatisch, Zähler aus der Regie, Formular Befund · Ebene ·
  Maßnahme · Prüfkriterium, Export in den Stundenverlauf.
- **Prüfungen beim Bauen:** keine Lösung auf Schüler-Anzeigen, Stilregeln des Fachs, Testfälle laufen
  gegen die Musterlösung, automatischer Browser-Test je Baustein (Playwright).
- **Handänderungen schützen:** Wurde eine Druckdatei von Hand geändert, wird `_neu` geschrieben statt
  überschrieben.
- **Veröffentlichung:** Das Werkzeug erzeugt Positivliste und Skript für das Klassen-Repository, pusht
  aber nicht selbst.

## A8 · Fahrplan

| Stufe | Inhalt |
|---|---|
| 0 | Repository anlegen, mit Cloudflare verknüpfen, Prototyp ES 06 übernehmen |
| 1 | Zustand zentral, Rollen Tafel/Auftrag/Regie, Bildschirm-Zuweisung, Regie mit Notizen und Ist-Zeit, Offline-Einzeldatei. Pilot ES 06 |
| 2 | Stundenformat (A3), Baustein-Bibliothek, `auftrag` ersetzt PowerPoint, `bild`, `code` mit Probelauf und Marken, PNG-Sicherung. Pilot GP DS 07: die Tafel-Apps DS 05 bis 07 laufen ohne Verlust |
| 3 | Pilotstunden weiterer Fächer nach den Steckbriefen (z. B. `sql`, `code`) |
| 4 | Mehrere Geräte (Raumcode, Tablet als Regie), `feedback`, `fragen` |
| 5 | Auswertung, Export in den Stundenplan, Löschen |

Reihenfolge der Stufen 3–5 richtet sich nach den Steckbriefen.

---

# Teil B · Anforderungs-Steckbrief (Vorlage)

**Anleitung für den Chat:**

1. Nutze, was du über das Fach weißt: Stundenplan, Verlaufspläne, Folien, Arbeitsblätter,
   Gespräche in diesem Chat. Erfinde nichts. Was du nicht weißt, schreibst du unter „Offene Fragen“.
2. Ordne jede Idee einem **Baustein aus A4** zu. Passt keiner, beschreibe einen **neuen Baustein**
   in Abschnitt 4 — was er zeigt, was man damit tut, wer ihn bedient.
3. Beschreibe 1–3 **typische Stunden** als Ablauf (Abschnitt 3), nicht alle Stunden.
4. Kurz und konkret. Tabellen statt Fließtext. Ein Markdown-Block als Ergebnis.

```markdown
# Steckbrief: <Fach> (<Kürzel>)

## 1 · Rahmen
| Punkt | Angabe |
|---|---|
| Klasse / Schulart | |
| Stunden pro Woche, Länge | |
| Raum: Bildschirme | z. B. Board allein / Board + Beamer / + Zweitmonitor |
| Rechner am Board, Browser | |
| Schüler-Geräte | Handys / Laptops / keine |
| Netz im Raum | zuverlässig / wackelig / unbekannt |
| Bisheriges Material | z. B. PowerPoint, 01_Folien.md, Arbeitsblätter Word |

## 2 · Was im Unterricht typischerweise passiert
- Unterrichtsformen (Lehrervortrag, Gruppenarbeit, Laborübung, Programmieren am Rechner …)
- Wofür die Tafel heute genutzt wird
- Wo es heute hakt (Wechsel zwischen Programmen, Zeit, Ergebnisse sichern …)

## 3 · Typische Stunden als Ablauf
### Stunde: <Titel / Termin>
| Schritt | Min | Tafel (Baustein) | Auftrag (Baustein) | Schüler-Handy (Baustein) | Regie braucht |
|---|---|---|---|---|---|
| Einstieg | 5 | titel: Leitfrage | auftrag: EA, 3 min | abstimmung: … | Ergebnis live |
| … | | | | | |

## 4 · Benötigte Bausteine
| Baustein | vorhanden/neu | Wofür in diesem Fach | Priorität (hoch/mittel/niedrig) |
|---|---|---|---|

### Neue Bausteine im Detail
- **Name:** …
  - zeigt: …
  - Bedienung an der Tafel: …
  - Schüler-Teil (falls ja): …
  - Beispiel aus einer echten Stunde: …

## 5 · Schüler-Interaktion
| Art | Wann in der Stunde | Ergebnis soll … (anonym/gesammelt/an Tafel/nur Regie) |
|---|---|---|

## 6 · Regie-Ansicht: was die Lehrkraft sehen und tun will
- …

## 7 · Daten und Datenschutz
- Was wird gespeichert, wie lange, wer sieht es?
- Besonderheiten (Prüfungsbezug, Noten, personenbezogene Inhalte)?

## 8 · Material-Quellen
| Quelle | Format | Soll übernommen werden als |
|---|---|---|
| 01_Folien.md | Markdown | folie |

## 9 · Prioritäten
1. Unverzichtbar für den Start: …
2. Wäre schön: …
3. Später: …

## 10 · Offene Fragen
- …

## 11 · Anforderungen über die Bausteine hinaus
Was das Fach braucht, damit eine Stunde komplett im Werkzeug läuft (Folien ersetzen, Tafel,
Verwaltung, Auswertung). Prüfe zuerst `docs/anforderungen.md` bzw. Abschnitt A7 und nenne nur, was
dort fehlt oder für dieses Fach anders sein muss.
| # | Anforderung | Warum |
|---|---|---|
```

---

# Teil C · Begriffe

| Begriff | Bedeutung |
|---|---|
| **Anzeige** | ein physischer Bildschirm (Board, Beamer, Monitor) |
| **Ansicht** | was eine Anzeige gerade zeigt (Schritt, Auftrag, QR, Ergebnisse, Uhr, schwarz) |
| **Rolle** | Tafel, Auftrag, Regie, Schüler, Auswertung |
| **Schritt** | ein Abschnitt im Ablauf einer Stunde, mit Sollzeit |
| **Baustein** | wiederverwendbarer Inhaltstyp (A4) |
| **Raum** | eine laufende Stunde, an die sich Regie, Anzeigen und Schüler koppeln |
| **Regie** | die Steueransicht der Lehrkraft |
