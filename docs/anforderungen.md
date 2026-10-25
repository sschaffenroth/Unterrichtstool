# Anforderungskatalog

Stand 25.10.2026 · gesammelt aus den Steckbriefen in `docs/steckbriefe/`.
Neue Steckbriefe werden hier eingearbeitet: vorhandene Zeile ergänzen (Quelle, Priorität) statt
doppelt anlegen. Priorität: **H** unverzichtbar für den Start · **M** wäre schön · **N** später.

| Quelle | Steckbrief |
|---|---|
| GP | Grundlagen der Programmierung, KI 1 (`steckbriefe/GP.md`), Meldung 25.10. zu DS 07 (Projekt: `claude/Tafelsystem_Meldung_GP.md`) |
| KIG | Prototyp ES 06 (`konzept_tafelsteuerung_v0.md`) |
| SYS | Meldung 25.10.2026 zu DS 06, KI 2. Jahr (Projekt: `claude/Tafelsystem_Meldung_SYS.md`). Raum: ein Board, kein Beamer, Schul-PCs |

---

## Rollen und Anzeigen

| ID | Anforderung | Quelle | Prio | Stufe |
|---|---|---|---|---|
| R1 | Rollen Tafel, Auftrag, Regie in einer Anwendung, Zuweisung Ansicht → Anzeige in der Regie | KIG, GP | H | 1 |
| R2 | Offline-Einzeldatei je Stunde, läuft ohne Netz und ohne Installation | KIG, GP | H | 1 |
| R3 | Regie: Ablauf mit Soll, Ist, Verzug. Uhrzeit nur in der Regie | GP | H | 1 |
| R4 | Regie: Notizen je Schritt (erwartete Antwort, „Wenn es stockt“, Einwände, Kontrollfragen) | GP | H | 1 |
| R5 | Regie: Miniaturen, Umschalten je Anzeige, Ansicht „schwarz“ | KIG, GP | H | 1 |
| R6 | Regie: Reiter und Aktionen der Tafel-Bausteine fernsteuern | GP | M | 2 |
| R7 | Regie: Zähler und Strichlisten für den Befund | GP | M | 2 |
| R8 | Regie: Notausstieg-Assistent (−10/−20/−30 an Prüfpunkten, Rest automatisch umplanen) | GP | M | 2 |
| R9 | Regie: kurzfristige Änderung (Text, Dauer, Reihenfolge), Rückschreiben in die Quelle | GP | M | 3 |
| R10 | Mehrere Geräte: Tablet als Regie, Raumcode. Für SYS (Regie am Laptop oder Handy, nur ein Board) früher nötig | KIG, SYS | M | 3 |
| R12 | Einzelanzeige: Ansicht `geteilt` (Tafel groß + Auftragsleiste mit Countdown), Zuweisung je physischer Anzeige im Kopf, Abweichung je Schritt (`zeige`) | SYS | H | 1 |
| R13 | Ansicht `extern`: Board zeigt fremden Eingang, Werkzeug läuft weiter, Signal (Ton/Vibration) am Regie-Gerät bei Soll-Ende | SYS | H | 1 |
| R14 | Abschnitte je Schritt, Ablaufleiste auf der Tafel (ersetzt Agendafolien) | SYS | M | 2 |
| R11 | Mehrere Lehrkräfte je Fach | GP (offen) | N | – |

## Stundenformat und Verwaltung

| ID | Anforderung | Quelle | Prio | Stufe |
|---|---|---|---|---|
| S1 | Eine Quelle je Stunde erzeugt Tafel, Auftrag, Regie, Druck (Heft, Exit-Ticket, Wandkarten), Stundenverlauf, `stundenplan.json` | GP | H | 2 |
| S2 | Aufträge wortgleich auf Anzeige und Blatt | GP | H | 2 |
| S3 | Ausgeblendete Schritte (Reserve, Ausweichweg) | GP | M | 2 |
| S4 | Mehrere Fassungen einer Stunde mit Grund | GP | N | 3 |
| S5 | Handänderungen an Druckdateien schützen (`_neu` statt überschreiben) | GP | H | 2 |
| S6 | Stundenordner-Konvention `NN_JJJJ-MM-TT_Thema`, Umplanen verschiebt nach `_Archiv` | GP | M | 2 |
| S7 | Abgleich mit dem Teams-Ordner der Lehrkräfte | GP | N | – |
| S8 | Veröffentlichung: Positivliste + Skript fürs Klassen-Repository, Wartefrist für Lösungen, Werkzeug pusht nicht | GP | M | 3 |
| S9 | Prüfungen beim Bauen: keine Lösung auf Schüler-Anzeigen, Stilregeln, Testfälle gegen Musterlösung | GP | M | 3 |
| S10 | UVP-Export (Verlaufsplan, ZFG-Tabelle, Kontrollfragen, Bilder) für `uvp-erstellen` | GP | M | 3 |
| S11 | Übernahme vorhandener Quellen (`stunde_texte.py`, `_quelle/*.src.html`, `00_Stundenverlauf.md`, SYS: python-pptx-Folien, `07_grafiken.py`) | GP, SYS | H | 2 |
| S12 | Pfade relativ zum Stundenordner, `../` innerhalb des Fachordners, Bauskript bettet ein | SYS | H | 2 |
| S13 | Fachordner = Ordner mit `Tafel starten.bat`/`stundenplan.json` oder Feld `fachordner` | GP | H | 2 ✓ |
| S14 | Notausstieg: `mindest_min`, `ersetzt`, `wegfall_text` | GP | M | 3 |
| S15 | Kein Umbrechen in Programmtext und erwarteten Ausgaben | GP | H | 2 ✓ |

## Darstellung und Bedienung (alle Bausteine)

| ID | Anforderung | Quelle | Prio | Stufe |
|---|---|---|---|---|
| D1 | Auftragsansicht nach festem Muster: Titel, Piktogramm + Sozialform, Dauer, ein Satz | GP | H | 2 |
| D2 | Mindestschrift 20 pt für Code, teilen statt verkleinern, Warnung beim Bauen | GP | H | 2 |
| D3 | Corporate Design der Schule | GP | M | 2 |
| D4 | Mehrere Reiter je Tafel-Baustein, jeder Baustein darf Reiter sein | GP, SYS | H | 2 |
| D5 | Rückgängig und „Alles zurück“ in jedem Baustein | GP | H | 2 |
| D6 | Große Touch-Ziele, Container-Einheiten, Kontrolle auf 390 px | GP | H | 1 |
| D7 | PNG-Sicherung je Ansicht direkt in den Stundenordner mit festem Dateinamen | KIG, GP | H | 2 |
| D8 | PowerPoint-Export als Notfallfassung | GP | M | 3 |
| D9 | Automatischer Browser-Test je Baustein (Playwright) | GP | H | 1 |

## Bausteine

| ID | Baustein | Quelle | Prio | Stufe |
|---|---|---|---|---|
| B1 | `auftrag` mit Countdown, Material als Link mit QR-Code | KIG, GP, SYS | H | 2 |
| B2 | `code`: Editor-Ansicht, Marken (Erklärung auf Tipp neben der Zeile, nacheinander), Fehler zeigen/beheben, Probelauf mit Konsole und Variablen, zwei Programme | GP, SYS | H | 2 |
| B3 | `bild` mit Frage und Untertitel im Band, dunkler Schleier | GP, SYS | H | 2 |
| B4 | `titel`, `qr`, `uhr`, `schwarz` | KIG, GP | H | 1 |
| B5 | `zuordnen`, `vorhersage`, `kette`, `grafik`, `brett`, `formular`, `abstimmung` (aus ES 06) | KIG | H | 1 |
| B6 | `codestreifen` | GP | M | 2 |
| B7 | `beschriften` | GP | M | 2 |
| B8 | `urteilen` | GP | M | 3 |
| B9 | `testfaelle` mit Zähler in der Regie | GP | M | 3 |
| B10 | `partner` (Namensliste nur lokal) | GP | M | 3 |
| B11 | `folie` (Markdown) | KIG, GP | M | 2 |
| B12 | `sql` | KIG | – | 3 |
| B13 | `fragen`, `feedback` | GP | N | 4 |
| B14 | `ergebnis`: Ergebnis früherer Schüler-Schritte auf der Tafel, mehrere nebeneinander | SYS | H | 2 |
| B15 | `zeichnen`: Hintergrund Bild oder Zahlenraster (z. B. 3 × 3-Kern), Zellen beschreibbar, Freihand. In SYS Kurzarbeitsstoff (Faltung, Gewichtssumme) | SYS, GP | H | 2 |
| B16 | `vorhersage`: Auflösung in einem späteren Schritt (`aufloesen_in`) | SYS | M | 2 |
| B17 | `einbetten`: vorhandene HTML-Datei als Reiter, Zustand bleibt (Übergang) | GP | H | 2 ✓ |
| B18 | `folie`: Schrift passt sich an, `aufdecken` Absatz für Absatz | GP | H | 2 ✓ |
| B19 | `code.marken als: zeile` (Docstring/Kommentar als Codezeile), Schrift füllt die Fläche | GP | H | 2 ✓ |
| B20 | `code.fehler` (zeigen, beheben, wieder einbauen) | GP | H | 3 |
| B21 | `code.probelauf`: Bauskript rechnet mit echtem Python vor, Abspieler spielt ab, Variable je Läufer | GP | H | 3 |

## Schüler-Interaktion

| ID | Anforderung | Quelle | Prio | Stufe |
|---|---|---|---|---|
| I1 | QR-Abstimmung, Zuordnen, Formular am Handy oder PC-Browser (wie ES 06) | KIG, SYS | H | 1 |
| I5 | `abstimmung` mit Mehrfachauswahl, Balken je Option | SYS | H | 2 |
| I6 | Team-Kennung ohne Namen (`kennung: team`): eine Stimme je Team, neue ersetzt alte. Gleiche Technik für Platznummer bei I4 | SYS, GP | M | 2 |
| I2 | Vorhersage per Handy, gesammelt an der Tafel | GP | M | 3 |
| I3 | Exit-Ticket am Handy, nur Regie, Lehrkraft markiert richtig/falsch | GP | N | 4 |
| I4 | Hilfe melden mit Platznummer | GP | N | 4 |

## Auswertung

| ID | Anforderung | Quelle | Prio | Stufe |
|---|---|---|---|---|
| E1 | Ist-Zeiten je Schritt automatisch, Vergleich mit Soll | KIG, GP | M | 2 |
| E2 | Befund-Formular (Befund · Ebene · Maßnahme · Prüfkriterium) mit Zählern | GP | M | 3 |
| E3 | Export des Befunds in `00_Stundenverlauf.md` und ins Doppelfach-Dokument | GP | M | 3 |
| E4 | Verlauf über mehrere Stunden (Abnahmequote, Notausstiege) | GP | N | 5 |
| E5 | Rückmeldungen von Betreuer und Kollegen je Stunde ablegen | GP | N | 5 |

## Datenschutz

| ID | Anforderung | Quelle | Prio | Stufe |
|---|---|---|---|---|
| P1 | Schüler-Daten nur Geräte-Kennung + Antwort, keine Namen, keine IP | KIG | H | 1 |
| P2 | Namenslisten nur lokal, nie Worker, nie Repository | GP | H | 1 |
| P3 | Kein Ergebnis im Werkzeug führt zu einer Note. Löschen nach Befund (4 Wochen) | GP | H | 3 |
| P4 | Schülerfassung ohne Notizen, Lösungen, Einwände | KIG, GP | H | 1 |
| P5 | Stunden-Dateien mit Notizen/Lösungen nicht im Repository | – | H | 0 |

---

## Offene Fragen (gesammelt)

| Frage | Quelle |
|---|---|
| Hängen Touch-Board und Beamer am selben Rechner? Welcher Browser? (Raum 123) | GP, KIG |
| SYS-Raum: welcher Rechner und Browser am Board? Netz für Regie am Handy? | SYS |
| Netz im Raum, lässt der Schulfilter `workers.dev` durch? | GP, KIG |
| Dürfen Handys genutzt werden, oder Laptop-Browser als Schüler-Gerät? | GP |
| Schülerlaptop auf den Beamer (Umschalter, Bildschirm teilen), Testfälle daneben? | GP |
| Echtes Python im Browser (Pyodide, ~10 MB, offline schwierig) oder simulierte Ausführung? | GP |
| Nutzen Kollegen das Werkzeug mit? | GP |
| Wie viel analog muss für die Lehrprobe bleiben? | GP |
