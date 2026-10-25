# Steckbrief: Grundlagen der Programmierung (GP)

Stand 25.10.2026 · zum Konzept „Tafelsystem für den Unterricht“ Version 0.1
Grundlage: die Stunden GP DS 05 bis DS 07 (Listen, Funktionen, Anmeldung/Kommentare), ihre
Stundenverläufe, Generatoren und Tafel-Apps, das Stundenschema ab DS 06 (Bausteine 64 bis 89 im
Doppelfach-Dokument). Wo ich etwas nicht weiß, steht es unter „Offene Fragen“.

Abschnitt 11 sammelt Anforderungen, die über die Bausteine hinausgehen. Erst damit ließe sich eine
GP-Stunde komplett im Werkzeug halten, also Tafel, Folien und Verwaltung.

---

## 1 · Rahmen

| Punkt | Angabe |
|---|---|
| Klasse / Schulart | KI 1, Fachschule Angewandte KI, 1. Jahr, 10 Schüler (DS 03 bis 05: 7) |
| Stunden pro Woche, Länge | Mi 5./6. Stunde, 90 min (Schaffi). Mo bei Kollinger, ohne Lernsituation |
| Raum: Bildschirme | Raum 123: Touch-Board + Beamer (Folien), Whiteboard, magnetische Wand mit Projektboard. Keine Dokumentenkamera |
| Rechner am Board, Browser | unbekannt (siehe Offene Fragen). Die Tafel-Apps laufen heute als HTML-Datei ohne Netz |
| Schüler-Geräte | eigene Laptops (Python, VS Code, git). Handys vermutlich vorhanden, bisher nicht genutzt |
| Netz im Raum | unbekannt. Alles Heutige läuft offline, nur GitHub braucht Netz |
| Bisheriges Material | `stunde_texte.py` als einzige Textquelle · Folien per `05_Folien_*.py` (python-pptx, `Vorlage_KI.pptx`) · Heft Infoblatt + Arbeitsblatt per `10_Infoblatt_Arbeitsblatt.py` (docx) · Exit-Ticket (docx) · Wandkarten per `06_Wandkarten.py` · Tafel-Apps `Lernhilfen/<thema>/tafel_*.html` (aus `_quelle/` per `build.py`) · Übungsblatt, Hausaufgabe als Markdown im Klassen-Repository · `00_Stundenverlauf.md` · UVP als LaTeX · `stundenplan.json` |

## 2 · Was im Unterricht typischerweise passiert

- **Unterrichtsformen:** stiller Impuls mit Bild · Zielführungsgespräch mit engen Fragen · Infoblatt
  lesen und markieren (EA) · Theorieaufgabe oder Planen auf Papier (PA) · Sicherung gemeinsam am
  Touch-Board · Programmieren am eigenen Laptop im eigenen Skript (EA) · Code-Review mit getauschtem
  Code · Vorstellen am Beamer · Abnahme am Objekt · Exit-Ticket.
- **Tafel heute:** je Sicherung eine Tafel-App mit Reitern. Begriffe zuordnen, Kommentare beurteilen,
  Codestreifen in Zonen ziehen und ausführen, Code mit Marken, Fehler zeigen und beheben,
  Probelauf mit Variablenanzeige. Kamera-Knopf speichert die Sicherung als PNG. Partner auslosen
  als Show.
- **Projektboard:** bleibt analog an der Wand (Offen · In Arbeit · Fertig · Das merken wir uns,
  Karte „Unsere Herausforderung“ mit Bild, Plakat mit Magnet). Der Betreuer will analoge Sicherung.
- **Wo es heute hakt:**
  - Wechsel PowerPoint ↔ Tafel-App ↔ Schülerlaptop am Beamer kostet Zeit.
  - Die Sicherung dauert länger (gewollt, die Diskussion ist gut). Dann fehlt hinten Zeit, der
    Notausstieg wird im Kopf entschieden.
  - Code auf Folien war zu klein (25.10.).
  - Stunden ändern sich kurzfristig. Jede Änderung muss in Folien, Heft, App, Stundenverlauf und
    Stundenplan nachgezogen werden.
  - Befund nach der Stunde bleibt oft offen (Zählungen fehlen).

## 3 · Typische Stunden als Ablauf

### Stunde: DS 07 · Die Anmeldung: Kommentare und Docstrings · Mi 28.10.2026

| Schritt | Min | Tafel (Baustein) | Auftrag (Baustein) | Schüler-Handy (Baustein) | Regie braucht |
|---|---|---|---|---|---|
| Einstieg: stiller Impuls | 3 | bild: Probelauf, Lena Huber hat Startnummer 1 und 3, Frage im Band | uhr (nur Dauer) | – | Notiz: erwartete Antwort, „Wenn es stockt“ |
| Einstieg: Code | 4 | code: `anmeldung.py`, 34 Zeilen, ≥ 20 pt, geteilt in 2 Ansichten | titel: „Wo steckt der Fehler?“ | – | Einwände mit Antwort (Tabelle) |
| Einstieg: Thema, Ziel | 3 | titel: Thema ans Whiteboard (analog) | auftrag: Herausforderung + Ziel | – | Haken „Karte hängt“ |
| Infoblatt | 7 | schwarz | auftrag: EA, 7 min | – | Countdown |
| Theoriesicherung | 5+ | urteilen (neu): Kommentare beurteilen, Vergleichen mit Begründung | auftrag: Plenum | vorhersage (optional) | Kontrollfragen mit erwarteter Antwort · Sicherung als PNG |
| Planen | 18 | partner (neu): Paare auslosen | auftrag: PA, 18 min | – | Notiz: Frage an den Tischen |
| Teilzielsicherung | 7 | code mit Marken, Musterkommentare einblenden, Fehler zeigen/beheben, Probelauf | auftrag: Plenum | – | Kontrollfragen · **Notausstieg prüfen** |
| Durchführen | 25 | qr: Klassen-Repository | auftrag: EA, 25 min, A1/A2 | fragen (optional) | Hilfe-Liste, Zeit |
| Code-Review, Austausch | 7 | – | auftrag: PA | – | – |
| Vorstellen | 3 | Schülerlaptop am Beamer (extern) | testfaelle (neu): T3, T5 als Soll | – | Strichliste |
| Reflektieren, Abnahme | 5 | testfaelle: T1 bis T6 abhaken | auftrag: Plenum | – | Zähler „wie viele haben T1 bis T6“ |
| Exit-Ticket | 3 | – | auftrag: EA, 3 min | formular (optional, sonst Papier) | Ergebnis nur Regie |
| Hausaufgabe | 0 | – | auftrag: Abgabe 11.11., QR | – | – |

### Stunde: DS 06 · Funktionen · Mi 21.10.2026 (Muster des Stundenschemas)

| Schritt | Min | Tafel (Baustein) | Auftrag (Baustein) | Schüler-Handy (Baustein) | Regie braucht |
|---|---|---|---|---|---|
| Einstieg | 10 | bild: Lena (17) auf dem Kinderpodest, Vorwissen (drei Wertungen) auf der Ansicht | auftrag: Ziel | – | Einwände (Variable/Liste statt Funktion) |
| Infoblatt | 7 | schwarz | auftrag: EA, 7 min | – | Countdown |
| Theorieaufgabe | 8 | – | auftrag: EA, a) markieren und benennen, b) Ausgabe voraussagen | – | – |
| Zwischensicherung | 5+ | beschriften (neu): Teile einer Funktion benennen · code: zwei Programme parallel ausführen | auftrag: Plenum | vorhersage: „Was gibt das aus?“ | Kontrollfrage Reihenfolge · PNG |
| Planen | 10 | – | auftrag: PA, P1/P2, Ausgabe als Vorbild | – | – |
| Teilzielsicherung | 5 | codestreifen (neu): Streifen in Zonen, ▶ ausführen | auftrag: Plenum | – | Prüffrage `None` ohne `return` · **Notausstieg** |
| Durchführen | 25 | – | auftrag: EA, A1 `wertung`, A2 Startliste | – | – |
| Bewerten | 12 | – | auftrag: PA, dann Plenum | – | – |
| Reflektieren | 8 | – | auftrag: Plenum, „Das merken wir uns“ | feedback (optional) | – |

## 4 · Benötigte Bausteine

| Baustein | vorhanden/neu | Wofür in GP | Priorität |
|---|---|---|---|
| `auftrag` | teilweise | jede Auftragsfolie: ein Satz, Sozialform als Piktogramm und Wort, Dauer, kein Code | hoch |
| `code` | neu | Programm zeigen, ausführen, Marken, Kommentare einblenden, Fehler zeigen/beheben, Probelauf | hoch |
| `bild` | neu | stiller Impuls mit Frage im Band, keine Antwort | hoch |
| `titel` | vorhanden | Folientitel, Leitfrage | hoch |
| `uhr` | teilweise | Countdown nach Dauer, Zeitwächter stellt ihn | hoch |
| `qr` | teilweise | Klassen-Repository (`bycs.link/gdpgit`), Lernhilfen | hoch |
| `zuordnen` | vorhanden | Begriffe den Teilen zuordnen (DS 06, DS 05) | hoch |
| `vorhersage` | vorhanden | „Was gibt das Programm aus?“, dann ausführen | mittel |
| `zeichnen` | teilweise | Sicherung als PNG (Kamera-Knopf) | hoch |
| `formular` | vorhanden | Exit-Ticket am Handy (Alternative zu Papier) | niedrig |
| `fragen` | neu | Hilfe-Meldung im Durchführen | niedrig |
| `feedback` | neu | Stundenabschluss | niedrig |
| `folie` | neu | Hausaufgabe, Titel, seltene Textfolien | mittel |
| `schwarz` | teilweise | Beamer aus, während gelesen wird | mittel |
| `codestreifen` | neu | Planen-Sicherung DS 05/06 | hoch |
| `urteilen` | neu | Kommentare beurteilen (DS 07) | mittel |
| `beschriften` | neu | Teile im Code benennen (DS 06, ET1 07) | hoch |
| `testfaelle` | neu | Abnahme am Objekt | hoch |
| `partner` | neu | Paare auslosen | hoch |
| `kette`, `grafik`, `brett`, `sql`, `abstimmung` | vorhanden/neu | in GP bisher nicht gebraucht | niedrig |

### Neue Bausteine im Detail

- **`code`** (Programm an der Tafel)
  - zeigt: Code mit Zeilennummern wie im Editor, Syntaxfarben, mindestens 20 pt. Lange Programme
    werden auf mehrere Ansichten geteilt, nie verkleinert. Nummer und Code auf einer Höhe.
  - Marken (D, 1 bis 4) neben Zeilen. Antippen blendet den hinterlegten Docstring oder Kommentar
    grün im Code ein.
  - „Fehler zeigen“ markiert eine Zeile, „Fehler beheben“ streicht sie und fügt die richtige an
    anderer Stelle ein (Diff im Code). „Fehler wieder einbauen“, „Alles zurück“.
  - ▶ Probelauf: feste Testeingaben (T1 bis T5) laufen durch, rechts Konsole und Anzeige einer
    Variablen (z. B. die Liste `angemeldet` nach jedem Läufer). Zeilen der Ausgabe rot/grün.
  - Zwei Programme nebeneinander ausführen (DS 06).
  - Bedienung an der Tafel: Touch, große Ziele.
  - Schüler-Teil: nein.
  - Beispiel: `Lernhilfen/anmeldung/tafel_kommentare.html`, Reiter 2.
  - Offen: echtes Python im Browser (Pyodide) oder simulierte Ausführung wie heute.
- **`codestreifen`**
  - zeigt: Zonen (vor · in · nach der Schleife, Funktion · Hauptprogramm) und Codestreifen, darunter
    Fallen.
  - Bedienung: Streifen in Zonen ziehen, Einrückung per Zone, ▶ ausführen. Die Ausgabe zeigt, ob es
    stimmt. Kein „Prüfen“-Knopf.
  - Lehrkraft kann einen Prüffragen-Streifen einschieben („Was gibt das Programm jetzt aus?“).
  - Beispiel: `Lernhilfen/funktionen/tafel_planen.html` (DS 06).
- **`beschriften`**
  - zeigt: Code mit nummerierten Kästen (genau dieser Teil der Zeile) und Klammern (ganze Zeilen),
    daneben ein Stapel Begriffe. Übrig gebliebene Begriffe sind gewollt.
  - Bedienung: Begriff auf Nummer ziehen, Prüfen, Begründung einblenden.
  - Beispiel: DS 06 `tafel_aufbau.html`, ET1 07 `tafel_schleifen.html`.
- **`urteilen`**
  - zeigt: Programm mit Kommentaren. Je Kommentar ein Urteil aus einer festen Liste (hilft · nutzlos
    · falsch · gehört als Docstring). „Vergleichen“ zeigt die Begründung. Rechts Kontrollfragen.
  - Beispiel: DS 07 `tafel_kommentare.html`, Reiter 1.
- **`testfaelle`**
  - zeigt: Tabelle Eingabe · erwartete Ausgabe (T1 bis T6). Klasse hakt ab, während ein Schüler sein
    Programm am Beamer startet.
  - Regie: Zähler „Wie viele haben T1 bis T6 / A1 / A2?“ für den Befund.
- **`partner`**
  - zeigt: Show mit Countdown, Scheinwerfer, rollenden Namen. Abwesende antippen, ungerade Zahl gibt
    eine Dreiergruppe, eine Person ziehen. Variante: zwei Gruppen von Hand einteilen (ET1 for/while).
  - Daten: Namensliste der Klasse (`namen.js`). Bleibt lokal, siehe Abschnitt 7.

## 5 · Schüler-Interaktion

| Art | Wann in der Stunde | Ergebnis soll … |
|---|---|---|
| Vorhersage „Was gibt das aus?“ | Zwischensicherung | anonym, gesammelt an der Tafel (ersetzt Handzeichen, Kriterium z. B. 6 von 7) |
| Exit-Ticket | Reflektieren, 3 min | anonym, nur Regie. Lehrkraft markiert in der Auswertung richtig/falsch |
| Hilfe melden | Durchführen | nur Regie, mit Platznummer statt Name (Vorschlag) |
| Feedback | Stundenende | anonym, nur Auswertung (Vorschlag, bisher nicht genutzt) |
| Sicherung | Theorie- und Teilzielsicherung | bleibt an der Tafel, keine Handys. Die Klasse diskutiert vorn |

Das Programmieren selbst bleibt auf den Laptops in VS Code und git. Das Werkzeug ersetzt das nicht.

## 6 · Regie-Ansicht: was die Lehrkraft sehen und tun will

- Ablauf mit Soll-Dauer, Ist-Zeit und Verzug in Minuten. Zeitwächter-Name.
- **Notausstieg-Assistent:** An den zwei Prüfpunkten (nach Theoriesicherung, nach
  Teilzielsicherung) zeigt die Regie den Verzug und bietet −10 / −20 / −30 an. Ein Klick plant die
  restlichen Schritte um: gekürzt wird in Durchführen und Bewerten gemeinsam, Abnahme (3 min) und
  Exit-Ticket (3 bis 5 min) bleiben immer, die Sicherung wird nie gekürzt. Was wegfällt, wandert
  automatisch in „Hausaufgabe“ oder „nächste Stunde“.
- Je Schritt die Notizen aus dem Stundenverlauf: Impuls, erwartete Antwort, „Wenn es stockt“,
  Einwände mit Antwort, Kontroll- und Prüffragen mit erwarteter Antwort.
- Miniaturen von Tafel und Auftrag, Umschalten pro Anzeige, Ansicht „schwarz“.
- Reiter der Tafel-Bausteine fernsteuern (z. B. Reiter 2 öffnen, Marke antippen).
- Zähler und Strichlisten für den Befund: Paare mit gefundenem Fehler, Abnahme T1 bis T6, A1, A2,
  Exit-Ticket richtig, genommener Notausstieg, Karten auf Fertig.
- Schnelle Änderung kurz vor der Stunde (Auftragstext, Dauer, Reihenfolge) direkt in der Regie, die
  in die Quelle zurückgeschrieben wird.

## 7 · Daten und Datenschutz

- **Namensliste** für `partner`: nur lokal am Board-Rechner, nie im Worker, nie im Repository.
  Abwesende werden nicht gespeichert.
- **Exit-Ticket und Vorhersagen:** anonym, nur Zählung. Speicherdauer bis zum Befund, dann löschen
  (Vorschlag: 4 Wochen).
- **Sicherungsbilder** (PNG) enthalten keine Namen. Sie gehen über die Positivliste ins
  Klassen-Repository.
- **Prüfungsbezug:** Schulaufgabe Mo 16.11. bei Kollinger. Keine Antworten im Werkzeug dürfen zur
  Note führen.
- **Schülerfassung** ohne Notizen, Lösungen, Einwände und Folien. Lösungen erst nach der Wartefrist.

## 8 · Material-Quellen

| Quelle | Format | Soll übernommen werden als |
|---|---|---|
| `stunde_texte.py` (Aufträge, Ziel, Herausforderung, Testfälle, Stellen, Kontrollfragen, Notizen) | Python-Konstanten | Stunden-Datei (A3): `auftrag`, `testfaelle`, Regie-Notizen. Einzige Quelle bleibt erhalten |
| `05_Folien_*.py` | python-pptx | `auftrag`, `bild`, `code`, `titel`, `qr`. PowerPoint nur noch als Druck- und Notfallfassung |
| `Lernhilfen/<thema>/_quelle/*.src.html` + `gemeinsam.js/css` | HTML/JS | `code`, `codestreifen`, `beschriften`, `urteilen`, `partner` |
| `anmeldung.py` usw. | Python | `code` (liest die Datei, Zeilennummern wie im Editor) |
| `Bilder/*.png/jpg` (ComfyUI, Konsolenbilder) | Bild | `bild` |
| `00_Stundenverlauf.md` (ZFG-Tabelle, Kontrollfragen, Notausstiege, Befund) | Markdown | Regie-Notizen, Notausstiege, Befund-Formular |
| `10_Infoblatt_Arbeitsblatt.py`, `06_Wandkarten.py`, Exit-Ticket | docx/pptx | bleiben Druck. Werden aus derselben Stunden-Datei erzeugt |
| `20_Uebungsblatt.md`, `30_Hausaufgabe.md` | Markdown | bleiben im Klassen-Repository, `qr` verweist darauf |
| `stundenplan.json` | JSON | Export aus der Stunden-Datei (Thema, Details, Ablauf, Material, Positivliste) |

## 9 · Prioritäten

1. **Unverzichtbar für den Start:** `auftrag` (Piktogramm, Wort, Dauer, Countdown), `code` mit
   Probelauf und Marken, `bild`, Sicherung als PNG, Zuweisung Tafel/Beamer, Regie mit Notizen und
   Ist-Zeit, Offline-Einzeldatei. Die Tafel-Apps von DS 05 bis 07 müssen ohne Verlust laufen.
2. **Wäre schön:** Notausstieg-Assistent, `codestreifen`, `beschriften`, `urteilen`, `partner`,
   `testfaelle` mit Zähler, Vorhersage per Handy, Befund-Formular mit Export in den Stundenverlauf.
3. **Später:** `fragen`, `feedback`, Exit-Ticket am Handy, echtes Python im Browser, Tablet als Regie.

## 10 · Offene Fragen

- Hängen Touch-Board und Beamer in Raum 123 am selben Rechner? Welcher Browser?
- Netz in Raum 123 und Schulfilter für `workers.dev`?
- Dürfen die Schüler im Unterricht ihre Handys nutzen? Oder Laptop-Browser als Schüler-Gerät?
- Wie kommt der Schülerlaptop für Vorstellen und Abnahme auf den Beamer (HDMI-Umschalter, Bildschirm
  teilen)? Kann das Werkzeug die Testfälle daneben zeigen?
- Exit-Ticket: Papier behalten (analog, Betreuer) oder Handy?
- Echtes Python (Pyodide, ca. 10 MB, offline schwierig) oder simulierte Ausführung je Programm?
- Nutzen Kollinger und Weber das Werkzeug auch? Dann braucht es mehrere Lehrkräfte je Fach.
- Wie viel analog muss für die Lehrprobe bleiben (Projektboard, Whiteboard, Karten)?

---

## 11 · Anforderungen über das Konzept hinaus (damit eine GP-Stunde komplett im Werkzeug läuft)

### Folien ersetzen

| # | Anforderung | Warum |
|---|---|---|
| F1 | Auftragsansicht nach festem Muster: Titel, Piktogramm + Sozialform als Wort, Dauer, genau ein Auftragssatz. Kein Code, keine Unteraufträge | Bausteine 66, 78e. Heute in `auftragsfolie()` |
| F2 | Nur Dauer, nie Uhrzeit auf Schüler-Anzeigen. Uhrzeiten nur in der Regie | Baustein 55d |
| F3 | Mindestschrift 20 pt für Code und Ausgaben, Teilen statt Verkleinern. Prüfung beim Bauen (Warnung, wenn etwas überläuft) | Baustein 89 |
| F4 | Corporate Design der Schule (Logo TSNM, Farben aus `Vorlage_KI.pptx`), Folientitel mit oranger Linie | Wiedererkennung, UVP |
| F5 | Jede Ansicht als PNG exportierbar (UVP Anhang B, Bild für die Wandkarte) | heute `soffice` + `pdftoppm` |
| F6 | PowerPoint-Export als Notfallfassung und für Kollegen | Raumwechsel, Ausfall |
| F7 | Ausgeblendete Schritte (Reserve, Ausweichweg) | DS 05 Folie 11 |

### Tafel

| # | Anforderung | Warum |
|---|---|---|
| T1 | Ein Tafel-Baustein darf mehrere Reiter haben, die Regie wählt den Reiter | alle Tafel-Apps seit DS 06 |
| T2 | Kamera-Knopf je Ansicht: PNG `Sicherung_JJJJ-MM-TT_<Titel>.png` direkt in den Stundenordner, nicht in Downloads | Positivliste `schueler_repo.py` |
| T3 | Rückgängig und „Alles zurück“ in jedem Baustein | Diskussion an der Tafel probiert viel aus |
| T4 | Große Touch-Ziele, Skalierung per Container-Einheiten, läuft auch auf 390 px (Kontrolle am Handy) | Erfahrung DS 06/07 |
| T5 | Automatischer Test je Baustein (Playwright), wie `test_k.py` | Fehler zeigen sich sonst erst am Board |

### Verwaltung

| # | Anforderung | Warum |
|---|---|---|
| V1 | **Eine Quelle je Stunde.** Stunden-Datei erzeugt Tafel, Auftrag, Regie, Heft (docx), Exit-Ticket, Wandkarten, Stundenverlauf-Abschnitte und den Eintrag in `stundenplan.json`. Aufträge wortgleich auf Anzeige und Blatt | Baustein 68 |
| V2 | Handänderungen schützen: Hat die Lehrkraft eine Druckdatei von Hand geändert, wird `_neu` geschrieben statt überschrieben | heute `_ziel()` in allen Generatoren |
| V3 | Veröffentlichung nach Positivliste und Wartefrist: Schülermaterial am Tag der Stunde, Lösungen später. Werkzeug erzeugt die Liste und die `.bat`, pusht selbst nicht | Repo-Regeln, kein Token im Werkzeug |
| V4 | Stundenordner-Konvention `NN_JJJJ-MM-TT_Thema` mit `_Druck`, `_alt`, `UVP`, `Lernhilfen/<thema>`. Umplanen verschiebt in `_Archiv` statt zu löschen | Rechner kann nicht löschen, Kollegen in Teams |
| V5 | Abgleich mit dem Teams-Ordner der Lehrkräfte | Kollinger und Weber arbeiten dort |
| V6 | Mehrere Fassungen einer Stunde (Fassung 1 bis 3) mit kurzem Grund | DS 07 hatte drei |
| V7 | Material-Prüfung beim Bauen: Sie-Form, Stilregel (keine Gedankenstriche, keine Semikolons), keine Lösung auf Schüler-Anzeigen, Testfälle laufen gegen die Musterlösung | Bausteine 68, 88, 24 |
| V8 | UVP-Export: Verlaufsplan, ZFG-Tabelle, Kontrollfragen, Screenshots, Folienbilder für `uvp-erstellen` | Unterrichtsbesuche, Lehrprobe ab 01.12. |

### Auswertung

| # | Anforderung | Warum |
|---|---|---|
| A1 | Ist-Zeiten je Schritt automatisch aus der Regie, Vergleich mit Soll | Notausstiege kalibrieren |
| A2 | Befund-Formular „Nach der Stunde ausfüllen“ mit den Fragen der Stunde, Zählern aus der Regie und dem Muster Befund · Ebene · Maßnahme · Prüfkriterium | Baustein 86 |
| A3 | Export des Befunds in `00_Stundenverlauf.md` und als Stundenblock ins Doppelfach-Dokument | Kanal GP ↔ ET1 |
| A4 | Verlauf über mehrere Stunden: Abnahmequote, Exit-Ticket-Quote, Notausstiege je Stunde | Prüfkriterium der nächsten Stunde |
| A5 | Rückmeldungen von Betreuer und Kollegen wörtlich je Stunde ablegen | Bausteine 31 bis 38, 55 |
