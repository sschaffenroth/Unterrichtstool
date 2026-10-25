# Tafelsystem: Stand und Auftrag „Stunde schreiben“

Stand 25.10.2026, Änderung 3 (Methoden-Menü, Fach-Chats bauen selbst), Abspieler 0.3
Stundenformat `tafelstunde/0` (Entwurf), Repo `sschaffenroth/Unterrichtstool`
Was sich geändert hat und die Antworten auf Meldungen: **Teil 4**.
Konzept: `claude/Tafelsystem_Konzept_und_Steckbrief_Vorlage.md` im Projekt

> **Für den Fach-Chat:** Du schreibst eine Stunde im Format aus Teil 2 und **baust die `Tafel.html`
> selbst** (Teil 6): Du weißt am besten, was die Stunde braucht und wie es aussehen soll. Am Code des
> Werkzeugs (`app/`, `worker/`, `build/`) änderst du nichts; fehlt ein Baustein, baust du ihn als eigene
> Seite für `einbetten` (Teil 6.3) und meldest ihn (Teil 3). Lies zuerst Teil 1, damit du weißt, was es
> schon gibt.

---

## Teil 1 · Was das Werkzeug heute kann

**Abspieler 0.3 (25.10.2026).** Aus `Tafel.yaml` baut das Bauskript eine `Tafel.html` daneben
(Teil 6). Sie läuft offline in Chrome oder Edge.

| Was | Stand |
|---|---|
| Bauskript | prüft `Tafel.yaml` (Bausteine, Felder, Verweise, Pfade, Zeitsumme) und baut `Tafel.html` |
| Regie | Ablauf mit Soll/Ist, Prognose, Notizen, Zähler, Handzeichen, Reiter, Marken, Countdown, Ergebnis aufs Board, Signal bei Soll-Ende, Zeiten als JSON sichern. Auf dem Laptop oder als Schublade über dem Board |
| Anzeigen | `geteilt`, `tafel`, `auftrag`, `extern`, `schwarz`, Ablaufleiste. Zweites Fenster auf zweitem Bildschirm, abgeglichen ohne Netz |
| Fenster und Monitore | Regie zeigt, welche Fenster offen sind, öffnet/schließt/verschiebt sie. Monitor fest zuordnen (Chrome/Edge, gilt je Laptop für alle Stunden). Board geht ohne Antippen ins Vollbild auf seinem Monitor (Hauptfenster), Regie dann als eigenes Fenster. Karte „Überwachen“ mit allen Ansichten und der Handy-Sicht |
| Sicherung | aktuelle Ansicht als PNG (Regie, 📷 am Board), alle Folien als PNG oder PDF, lokal in einem gewählten Ordner oder im Download-Ordner |
| Bausteine **fertig** | `titel`, `bild`, `folie`, `qr`, `uhr`, `schwarz`, `auftrag` (Countdown, Material mit QR, **Phasen**, **Rollenwechsel**, **Aufgabenliste**), `code` (Marken neben der Zeile oder als Codezeile, Teile, Schrift füllt die Fläche), `folie` (aufdecken, Schrift passt sich an), `zeichnen` (Raster/Bild, Stift, Rückgängig, PNG), `ergebnis` (für alle Schüler-Bausteine), `einbetten` (eigene HTML-Seiten als Reiter), **`sql`** (SQLite live an der Tafel, offline) |
| Bausteine **Platzhalter** | `zuordnen`, `beschriften`, `urteilen`, `codestreifen`, `testfaelle`, `partner`, `kette`, `grafik`, `brett`, `neu`. `code`: `fehler`, `probelauf`, `nebeneinander` fehlen |
| Schüler-Handys | Worker im Repo (`worker/`): Raum mit 4-stelligem Code, Anmelde-QR und Link auf der Tafel, Schüler-Seite am Handy oder PC. Freigabe aus der Regie. Fertig: `abstimmung` und `vorhersage` (`mehrfach`, `kennung: team`, **`sicherheit`**), **`wortwolke`**, **`zielscheibe`**, **`exit`**, **`hotspot`**, **`ordnen`**, **`fehlerzeile`**. Handy-Stimmen und Handzeichen werden zusammengezählt. Raum löscht sich nach 4 Wochen. `formular`, `feedback`, `fragen` noch nicht |
| **Methoden-Menü** | Karte „Methoden“ in der Regie, spontan startbar: Energizer, Think-Pair-Share, 1-2-4-Alle, Rollenwechsel, Hilfe-Ampel, Fortschritt, Lerntempoduett, Helfersystem, Wortwolke, Zielscheibe, Exit-Ticket. Je Methode: groß aufs Board, klein in die Leiste unten links oder aus. Siehe 2.5 |
| Handy-Begleitseite | zeigt immer den aktuellen Schritt: Abschnitt, Titel, Auftrag mit Countdown, Material mit Ort, Dateiname und Link. Freigegebene Frage erscheint obendrüber. Nie Notizen oder Lösungen |
| Start | `Tafel starten.bat` + `tafel_server.ps1` im Fachordner: lokaler Server auf localhost, Stundenauswahl. Nötig in Edge für Monitor-Zuordnung |
| Regie auf dem Handy | nur auf demselben Rechner wie das Board (kein Netz-Abgleich) |
| Prototyp KIG ES 06 | läuft: Tafeldatei offline (Spielbrett, Kette, Zuordnen, Vorhersage, Formular, Zeitplan, PNG) + Abstimmungs-Worker auf Cloudflare (QR, `/lehrer`). Fachgebunden, noch nicht im Repo |
| Tafel-Apps GP DS 05 bis 07 | laufen als einzelne HTML-Dateien in `Lernhilfen/`. Noch nicht im Repo |
| Stunden im Format | SYS DS 06 (27.10.), `KI_Systementwicklung\06_2026-10-27_Merkmale_vor_DeepLearning\Tafel.yaml` |

**Was das für dich heißt:**

- Stunden aus den fertigen Bausteinen laufen. Wo ein Platzhalter steht, bleibt die bisherige
  Lösung (PowerPoint, Tafel-App) als Rückfall bereit.
- Die PowerPoint bleibt vorerst Notfallfassung. Probelauf am Board vor der ersten echten Stunde.
- Du baust die Stunde selbst (Teil 6) und legst sie ab (Teil 5). Fehler im Prüfbericht behebst du in
  der `Tafel.yaml`; was das Werkzeug nicht kann, meldest du (Teil 3).
- Methoden aus dem Menü (2.5) musst du nicht planen. Planst du eine fest ein, nimm die Felder aus 2.2 und 2.3.

---

## Teil 2 · Stundenformat `tafelstunde/0`

Eine Datei `Tafel.yaml` im Stundenordner (`NN_JJJJ-MM-TT_Thema/Tafel.yaml`). Bilder und
Code-Dateien werden **relativ zum Stundenordner** angegeben, nicht hineinkopiert.

### 2.1 Kopf

```yaml
format: tafelstunde/0
stunde:
  fach: GP                 # Kürzel wie im Stundenplan
  nr: 7                    # DS-Nummer bzw. Stundennummer
  titel: "Die Anmeldung: Kommentare und Docstrings"
  datum: 2026-10-28
  dauer: 90
  klasse: KI 1
  ziel: "…"                # ein Satz, wie auf der Auftragsansicht
  herausforderung: "…"     # falls das Fach mit Lernsituation arbeitet
anzeigen:                  # je physischer Anzeige: was sie standardmäßig zeigt
  Board: tafel             # Raum mit Board + Beamer (z. B. GP Raum 123)
  Beamer: auftrag
# Raum mit nur einem Board (z. B. SYS):
# anzeigen:
#   Board: geteilt
ablaufleiste: false        # true = schmale Leiste mit den Abschnitten, aktueller hervorgehoben
```

**Was eine Anzeige zeigen kann** (Wert in `anzeigen` und in `zeige`):

| Wert | Bedeutung |
|---|---|
| `tafel` | der Tafel-Baustein des Schritts, ganze Fläche |
| `auftrag` | die Auftragsansicht des Schritts, ganze Fläche |
| `geteilt` | Tafel-Baustein groß, daneben/darunter eine schmale **Auftragsleiste** (Piktogramm + Sozialform, Countdown, der Auftragssatz, Material). Für Räume mit nur einer Anzeige |
| `extern` | die Anzeige zeigt einen fremden Eingang (Laptop per HDMI). Das Werkzeug läuft weiter, Countdown nur in der Regie, Signal am Regie-Gerät bei Soll-Ende. Umschalten des Eingangs macht die Lehrkraft am Board |
| `schwarz` | schwarz |

Hat ein Schritt nur `tafel` oder nur `auftrag`, zeigt `geteilt` einfach diesen einen Teil groß.

Zusätzlich im Kopf (beides freiwillig):

```yaml
begriffe:                  # für die Energizer „Wer bin ich?“ und „Begriffe-Blitz“
  - { begriff: Maske, erklaerung: "Bild aus zwei Werten" }   # ohne Angabe: BEGRIFFE.md im Stundenordner
energizer:                 # eigene Energizer, stehen im Menü vor den mitgelieferten
  - { titel: "Pixel-Pantomime", text: "…", dauer: 2, begriff: true }
```

### 2.2 Schritte

```yaml
schritte:
  - id: einstieg-impuls        # eindeutig, klein, mit Bindestrich
    titel: Einstieg            # erscheint in der Regie
    abschnitt: "Kantenbild und Gewichtssumme"   # für Ablaufleiste und Regie, ersetzt Agendafolien
    soll_min: 3
    zeige: { Board: extern }   # nur wenn abweichend von `anzeigen` im Kopf
    ausgeblendet: false        # true = Reserve/Ausweichweg, erst in der Regie einschalten
    pruefpunkt: false          # true = hier prüft der Notausstieg-Assistent den Verzug
    kuerzen: nein              # ja = Notausstieg kürzt hier zuerst
                               # nein = nur, wenn die ja-Schritte nicht reichen
                               # nie = Notausstieg kürzt oder streicht hier nie
    bei_wegfall: naechste_stunde   # hausaufgabe | naechste_stunde  (bei kuerzen: ja oder nein)
    tafel:    { baustein: …, … }   # was die Touch-Tafel zeigt (oder weglassen)
    auftrag:  { baustein: …, … }   # was die Auftragsansicht zeigt
    schueler: { baustein: …, … }   # was die Handys tun (oder weglassen)
    methoden: [hilfe, tempo]   # Methoden, die mit dem Schritt starten und enden: hilfe (Ampel),
                               # fortschritt (abhaken), tempo (Lerntempoduett), helfer (Helfersystem).
                               # Aufgaben kommen aus auftrag.aufgaben
    regie:
      notiz: "…"
      erwartet: "…"                # erwartete Antwort
      wenn_es_stockt: "…"
      einwaende:
        - { einwand: "…", antwort: "…" }
      kontrollfragen:
        - { frage: "…", antwort: "…" }
      zaehler: ["Paare mit gefundenem Fehler"]   # Strichlisten für den Befund
```

**Mehrere Reiter** auf der Tafel. Jeder Baustein darf ein Reiter sein, auch `qr`, `folie`, `bild`:

```yaml
    tafel:
      reiter:
        - { titel: "Kommentare beurteilen", baustein: urteilen, … }
        - { titel: "Fehler finden", baustein: code, … }
```

### 2.3 Bausteine und ihre Felder

Alles, was Lösung ist, steht in Feldern namens `loesung`, `erwartet` oder `begruendung`. Das
Bauskript entfernt sie später aus der Schülerfassung. **Keine Schülernamen in die Datei.**

**Fachordner** ist der nächste Ordner nach oben mit `Tafel starten.bat` oder `stundenplan.json`
(GP: `KI_GrundlagenProgrammierung`, auch wenn die Stunden in `Stunden/` liegen), oder das Feld
`fachordner` im Kopf (relativ zum Stundenordner).

**Pfade** (`datei`) sind relativ zum Stundenordner. `../` ist erlaubt, solange der Pfad im Ordner des
Fachs bleibt, z. B. `../05_2026-10-20_…/grafiken/kanten.png`. Das Bauskript bettet die Datei ein.

**Hilfsansichten**

| Baustein | Felder |
|---|---|
| `titel` | `text`, `untertitel` |
| `schwarz` | – |
| `uhr` | `dauer_min` (nur Dauer, nie Uhrzeit) |
| `qr` | `url`, `text` |
| `bild` | `datei`, `frage` (Band, Zeile 1), `untertitel` (Band, Zeile 2), `schleier` (dunkler Schleier für Lesbarkeit, Standard `true`, wenn `frage` gesetzt), `alt` |
| `ergebnis` | `von` (Schritt-ID oder Liste von Schritt-IDs → nebeneinander). Zeigt das Ergebnis eines früheren Schüler-Schritts (Balken, Antworten) auf der Tafel |
| `folie` | `markdown`. Schrift passt sich der Textmenge an (`groesse: normal` schaltet das ab). `aufdecken: true`: Absätze und Listenpunkte nacheinander, Tipp auf die Folie oder Regie „Nächster Absatz“ (z. B. Kontrollfrage, dann Antwort) |
| `einbetten` | `datei` (eine vorhandene .html-Datei im Fachordner, z. B. eine alte Tafel-App). Läuft als Reiter auf der Anzeige und behält ihren Zustand, solange die Stunde läuft. In der Vorschau und in der PNG-Sicherung nur ein Platzhalter. Übergang, bis die Bausteine fertig sind |

**Auftrag**

| Baustein | Felder |
|---|---|
| `auftrag` | `text` (genau **ein** Satz, kein Code), `sozialform` (EA, PA, GA, Plenum), `dauer_min`, `material` (Liste: Text oder `{text, url, ort, datei, qr}`. Bei GitHub-Links werden `ort` (Repository, Ordner) und `datei` automatisch abgeleitet und angezeigt. QR-Code nur mit `qr: true`. Die Handy-Begleitseite zeigt die Links anklickbar), `abgabe`, `phasen` (Liste `{sozialform, min, text}`: Sozialformen nacheinander, z. B. Think-Pair-Share; Countdown und Piktogramm wechseln von selbst, Signal beim Wechsel, `dauer_min` ist dann die Summe), `rollenwechsel_min` (Pair Programming: Board ruft alle n Minuten „Rollen tauschen!“), `rollen` (Standard `[Fahrer, Navigator]`), `aufgaben` (z. B. `[A1, A2, A3]`, zum Abhaken am Handy bei `methoden: [fortschritt]`, `tempo`, `helfer`) |

**Tafel-Bausteine**

| Baustein | Felder |
|---|---|
| `code` | `datei` oder `quelltext`, `sprache`, `ansichten` (Zeilenbereiche, z. B. `[[1,17],[18,34]]`), `marken` (Liste `{zeile, label, einblenden, als, position}`: `einblenden` erscheint **erst auf Tipp**, Marken der Reihe nach. `als: notiz` (Standard) neben der Zeile, `als: zeile` als grüne Codezeile im Programm mit Einrückung, `position: vor | nach`, Standard „nach“ bei Docstrings, sonst „vor“. `einblenden` gilt als Lösungsfeld). Die Schrift wächst, bis der Code die Fläche füllt, `fehler` (`{zeile, ersetzen_durch, einfuegen_nach}`), `probelauf` (`{eingaben: [{id, eingabe, erwartet}], variable}`), `nebeneinander` (zweite Datei) |
| `zuordnen` | `begriffe`, `ziele`, `loesung` (`{begriff: ziel}`) |
| `beschriften` | `datei`/`quelltext`, `stellen` (`{nr, zeile, text}` oder `{nr, zeilen: [von, bis]}`), `begriffe` (Überzählige erlaubt), `loesung` (`{nr: begriff}`), `begruendung` |
| `urteilen` | `datei`/`quelltext`, `urteile` (feste Liste), `elemente` (`{zeile, text, loesung, begruendung}`) |
| `codestreifen` | `zonen`, `streifen` (`{text, loesung: {zone, einrueckung}}`), `fallen` (Streifen, die nicht hineingehören), `pruefstreifen` |
| `testfaelle` | `faelle` (`{id, eingabe, erwartet}`) |
| `partner` | `modus` (paare, gruppen). Namen kommen lokal vom Board, nicht aus der Datei |
| `zeichnen` | `hintergrund` (`{bild: datei}` oder `{raster: [[1,0,-1],[2,0,-2],[1,0,-1]], titel: "Kern"}`, auch als Liste mehrerer Raster nebeneinander), `raster_zellen_beschreibbar` (true = in Zellen tippen und Zahl schreiben). Freihand-Stift, Rückgängig und PNG-Sicherung hat jeder Baustein |
| `sql` | `datenbank` (SQLite-Datei im Fachordner, wird eingebettet) oder `schema` (SQL-Text, der die Tabellen anlegt und füllt), `abfrage` (steht beim Start im Eingabefeld), `beispiele` (Liste `{titel, abfrage}`: Knöpfe, die eine Abfrage laden und ausführen), `max_zeilen` (Standard 50). An der Tafel tippen und „Ausführen“ (Strg + Enter); Tabellen-Knöpfe zeigen `SELECT *`. „Zurücksetzen“ stellt die Datenbank wieder her. Die Handys sehen Abfrage und Ergebnis als Text |
| `kette`, `grafik`, `brett` | wie im Prototyp ES 06. Felder noch nicht festgelegt: Inhalt unter `entwurf:` frei beschreiben |

**Schüler-Bausteine** (unter `schueler:`)

| Baustein | Felder |
|---|---|
| `abstimmung` | `frage`, `optionen`, `loesung` (freiwillig), `mehrfach` (true = mehrere Optionen wählbar, Balken je Option), `kennung` (`geraet` Standard, oder `team`: die Seite fragt einmal nach der Teamnummer, eine Stimme je Team, neue Stimme ersetzt die alte), `sicherheit` (true = Handy fragt zusätzlich „sicher“ oder „geraten“; Balken zeigen den sicheren Anteil dunkel, die Regie „falsch, aber sicher“. Ohne das Feld kann die Regie es vor der Freigabe ankreuzen) |
| `vorhersage` | `frage`, `optionen`, `loesung`, `aufloesen_in` (Schritt-ID, in der aufgelöst wird; ohne Angabe im selben Schritt), `kennung`, `sicherheit` wie oben |
| `wortwolke` | `frage`, `max_woerter` (1 bis 3). Tafel: Wörter nach Häufigkeit; die Regie blendet einzelne Wörter aus |
| `zielscheibe` | `frage` (freiwillig), `dimensionen` (bis 6 Aussagen, Standard: verstanden, allein anwenden, Tempo, mitgemacht). Handy: je Aussage 0 bis 4. Tafel: Punkte und Mittelwert, Mitte heißt „trifft voll zu“ |
| `exit` | `offen` (Standard „Was war heute am unklarsten?“), dazu freiwillig eine Kontrollfrage: `frage`, `optionen`, `loesung`. Tafel zeigt nur die Zahl der Abgaben; die Texte sieht nur die Regie, die Lehrkraft markiert sie (richtig, falsch, nächste Stunde aufgreifen). Alles landet im Befund |
| `hotspot` | `frage`, `bild` (Datei; ohne Angabe das Bild aus `tafel` desselben Schritts), `loesung` (`{x, y, r}` als Anteil von Breite/Höhe, `r` Radius als Anteil der Breite), `aufloesen_in`. Handy: auf die Stelle tippen. Tafel: Punktwolke über dem Bild, Lösungskreis erst auf Knopfdruck oder in `aufloesen_in` |
| `ordnen` | `frage`, `quelltext` (Zeilen in **richtiger** Reihenfolge, leere Zeilen fallen weg) oder `zeilen` (Liste), `aufloesen_in`. 3 bis 20 Zeilen, ohne Ablenkzeilen. Das Bauskript mischt. Handy: Zeilen der Reihe nach antippen. Tafel: wie viele ganz richtig, je Platz der Anteil richtig, mit Lösung die Zeilen |
| `fehlerzeile` | `frage`, `quelltext` oder `datei`, `sprache`, `loesung` (Zeilennummer oder Liste), `aufloesen_in`. Handy: Zeile antippen. Tafel: Code mit Häufigkeit je Zeile, Lösungszeile grün auf Knopfdruck |
| `formular` | `fragen` (Liste), Hinweis „ohne Namen“ kommt automatisch |
| `feedback` | `skala` (z. B. 1–5), `freitext` (ja/nein) |
| `fragen` | – |

**Passt nichts?**

```yaml
    tafel:
      baustein: neu
      name: vorschlag-name
      beschreibung: "Was er zeigt, was man antippt, was passiert."
      entwurf: { … }   # Inhalte so, wie du sie dir vorstellst
```

Und in die Meldung (Teil 3) eintragen.

Ergebnisse aller Schüler-Bausteine zeigt die Regie unter „Steuerung, Ergebnis zeigen“ groß auf dem Board
oder ein Reiter `ergebnis` mit `von:`. Lösungen von `vorhersage`, `hotspot`, `ordnen` und `fehlerzeile` erscheinen
erst in `aufloesen_in` (ohne Angabe: in späteren Schritten) oder wenn die Lehrkraft „Lösung zeigen“ tippt.

### 2.5 Methoden-Menü (spontan, nicht in der Datei)

Die Regie hat eine Karte „Methoden“. Alles darin läuft ohne Eintrag in der `Tafel.yaml`. Plane es nur ein, wenn
es fester Teil der Stunde ist (dann mit den Feldern oben).

| Methode | was passiert | Handy |
|---|---|---|
| Energizer | 1 bis 3 min Bewegung oder Spiel mit Anleitung und Countdown; zählt nicht zur Schrittzeit. Mit Begriff aus `BEGRIFFE.md` („Wer bin ich?“) oder Code-Golf-Aufgabe | nein |
| Think-Pair-Share, 1-2-4-Alle | Frage eintippen, Phasen laufen mit Countdown und Signal ab | Begleitseite zeigt die Phase |
| Rollenwechsel | alle n Minuten „Rollen tauschen!“ groß am Board | nein |
| Hilfe-Ampel | Handy: Platznummer, grün „läuft“, gelb „Frage“, rot „hänge fest“, dazu die Aufgabe. Regie: Warteschlange mit Wartezeit, „erledigt“ | ja |
| Fortschritt | Handy: Aufgaben abhaken. Regie und Board: Balken je Aufgabe | ja |
| Lerntempoduett | wer eine Aufgabe abhakt, bekommt den nächsten mit derselben Aufgabe als Partner (Tafel und Handy zeigen „Platz 3 und Platz 7, Haltestelle A1“) | ja |
| Helfersystem | wer fertig ist, setzt „ich helfe gern“; wer rot oder gelb meldet, bekommt einen Helfer, der die Aufgabe schon hat | ja |
| Wortwolke, Zielscheibe, Exit-Ticket | wie die Schüler-Bausteine oben, Frage spontan eintippen; Exit-Ticket kann eine Abstimmung der Stunde als Kontrollfrage übernehmen | ja |

Platznummern stehen am Platz, Namen gibt es nirgends.

### 2.4 Regeln (gelten in allen Fächern)

- Auftrag: ein Satz, Sozialform, Dauer. Kein Code auf der Auftragsansicht.
- Auf Schüler-Anzeigen nur Dauer, nie Uhrzeit.
- Code mindestens 20 pt: lange Programme über `ansichten` teilen, nie verkleinern.
- Keine Lösung auf Schüler-Anzeigen, nur in `loesung`/`erwartet`/`begruendung`.
- Keine Namen von Schülern. Kein Ergebnis aus dem Werkzeug führt zu einer Note.
- Texte so, wie sie im Unterricht stehen sollen. Die Datei ist die Quelle, auch fürs Heft.
- **Keine Trennpunkte „·“ und keine Gedankenstriche „—“.** Mehrere Teile einer Antwort oder Zeile mit Zeilenumbruch trennen (in YAML `|` oder `\n`). Das Bauskript wandelt „ · “ und „ — “ sonst selbst in Zeilenumbrüche um.

---

## Teil 3 · Was du zurückgibst

1. **`Tafel.yaml`** für eine Stunde, vollständig: alle Schritte mit Sollzeit, Tafel, Auftrag,
   Schüler (falls genutzt), Regie-Notizen. Lege sie im Stundenordner ab, oder gib sie als Datei
   aus, wenn du den Ordner nicht erreichst.
2. **Meldung** im Projekt unter `claude/Tafelsystem_Meldung_<Fach>.md` (anlegen oder ergänzen,
   nur diese eine Datei):

```markdown
# Meldung <Fach> ans Tafelsystem

## <Datum> · <Stunde>
| Art | Inhalt | Schritt-ID |
|---|---|---|
| Format | Feld fehlt / Feld unklar: … | |
| Baustein | `code` braucht noch … | |
| neu | Baustein „…“, siehe `baustein: neu` | |
| Frage | … | |
```

Was du nicht weißt, schreibst du als Frage. Erfinde keine Felder stillschweigend.

---

## Teil 5 · Ablage (gilt für jeden Chat, der eine Tafel.html baut)

| Datei | lokal | Teams-Vorbereitungsordner des Fachs |
|---|---|---|
| `Tafel.html` | im Stundenordner neben `Tafel.yaml` | im gleichnamigen Stundenordner |
| `Tafel starten.bat`, `tafel_server.ps1`, `Tafel_Anleitung.txt` | im Fachordner | **immer auch** in der Wurzel des Teams-Ordners |

- Die drei Startdateien kommen aus dem Repo (`start/`). Bei jeder neuen Fassung an **beide** Orte legen.
- Teams-Pfade stehen in `_Stundenplan\schuljahr.json` unter `teams`. Nur Lehrkräfte-Ordner (Tafel.html enthält
  Notizen und Lösungen), nie einen Kanal, den Schüler sehen.
- Nach dem Ablegen prüfen, dass an beiden Orten die neue Fassung liegt.

---

## Teil 6 · Selbst bauen (Fach-Chat)

### 6.1 Werkzeug holen und bauen

```bash
git clone https://github.com/sschaffenroth/Unterrichtstool.git    # einmal je Sitzung; danach: git pull
pip install pyyaml pillow pygments segno
python Unterrichtstool/build/bauen.py PFAD/ZUM/Stundenordner/Tafel.yaml
```

- Das Bauskript braucht den **ganzen Stundenordner** (Bilder, Code-Dateien, `BEGRIFFE.md`, Datenbanken) und den
  Fachordner darüber, wenn Pfade mit `../` darauf zeigen. Arbeitest du im Cloud-Container, hole diese Dateien vom
  Laptop, baue dort und lege die `Tafel.html` zurück.
- Ohne Fehler schreibt es `Tafel.html` neben die `Tafel.yaml`. Bei Fehlern schreibt es nichts: Prüfbericht lesen,
  `Tafel.yaml` verbessern, neu bauen. Warnungen und Hinweise prüfen und, wo nötig, beheben.
- Nur prüfen: `--nur-pruefen`. Ohne Handys: `--server ""`.

### 6.2 Prüfen, ablegen, melden

1. `Tafel.html` im Browser öffnen (Regie), einmal durch alle Schritte klicken, Board-Vorschau ansehen.
2. Ablage nach Teil 5: Stundenordner lokal **und** Teams; Startdateien aus `start/` des Repos in Fachordner und
   Teams-Wurzel. An beiden Orten nachsehen.
3. Was fehlte oder hakte: Meldung (Teil 3).

### 6.3 Eigene Seiten für `einbetten`

Braucht die Stunde eine Ansicht, die es als Baustein nicht gibt, baust du sie als **eine** HTML-Datei (z. B.
`Lernhilfen/<Name>.html` oder im Stundenordner) und bindest sie mit `{ baustein: einbetten, datei: … }` als
Reiter ein. Regeln dafür:

- eine Datei, offline, ohne Nachladen aus dem Netz (Bibliotheken einbetten), läuft in Edge und Chrome;
- für Touch gebaut: große Schaltflächen, Schrift mindestens 20 pt auf dem Board, nichts nur per Maus-Hover;
- keine Namen, keine Lösung sichtbar, bevor die Lehrkraft sie aufdeckt;
- keine Trennpunkte „·“ und keine Gedankenstriche „—“;
- ihr Zustand bleibt erhalten, solange die Stunde läuft; die Regie sieht nur einen Platzhalter, die PNG-Sicherung
  nicht den Inhalt.

Bewährt sich so eine Seite, in die Meldung schreiben: Dann wird daraus ein Baustein für alle Fächer.

---

## Teil 4 · Änderungen und Antworten auf Meldungen

### Änderung 3 · 25.10.2026 · Methoden-Menü, neue Handy-Bausteine, Fach-Chats bauen selbst

- **Fach-Chats bauen ihre `Tafel.html` selbst** (Teil 6) und dürfen eigene Seiten für `einbetten` bauen (6.3).
  Der Werkzeug-Chat ändert nur noch das Werkzeug.
- **Methoden-Menü** in der Regie (2.5): Energizer, Think-Pair-Share, 1-2-4-Alle, Rollenwechsel, Hilfe-Ampel,
  Fortschritt, Lerntempoduett, Helfersystem, Wortwolke, Zielscheibe, Exit-Ticket.
- **Neue Felder:** Schritt `methoden`; `auftrag.phasen`, `auftrag.rollenwechsel_min`, `auftrag.rollen`,
  `auftrag.aufgaben`; Kopf `begriffe`, `energizer`.
- **Neue Schüler-Bausteine:** `wortwolke`, `zielscheibe`, `exit`, `hotspot`, `ordnen`, `fehlerzeile`;
  `abstimmung`/`vorhersage` mit `sicherheit`.
- **`sql` ist fertig:** SQLite im Browser, Datenbank eingebettet, Beispiel-Knöpfe.
- Der Befund („Zeiten sichern“) enthält jetzt auch Handy-Antworten, Exit-Texte mit Markierung, Energizer und
  die Meldungen der Praxisphase.

### Änderung 2 · 25.10.2026 · Meldung GP (DS 07)

**Neu oder geändert:**

| Was | neu |
|---|---|
| `einbetten` | neuer Baustein: alte Tafel-App als Reiter, Zustand bleibt erhalten |
| `folie` | Schrift passt sich an, `aufdecken: true`, `groesse: normal` |
| `code` | Schrift füllt die Fläche (nie unter der Grundgröße), `marken[].als: zeile`, `position` |
| Fachordner | Ordner mit `Tafel starten.bat` oder `stundenplan.json`, oder Feld `fachordner` |
| Umbrechen | nie in `code`, `testfaelle`, `codestreifen`, `beschriften`, `urteilen`, `einbetten`, nie in `erwartet`, `eingabe`, `eingaben`, `probelauf`, `fehler`, `faelle` |
| Material | `ort` und `datei` nur bei GitHub-Links abgeleitet, Kurzlinks bleiben ohne |
| Sicherung | Dateiname `Sicherung_JJJJ-MM-TT_<Titel>.png` (Reiter angehängt), gibt es ihn schon: `_2`, `_3` |

**Antworten auf die Fragen von GP:**

| Frage | Antwort |
|---|---|
| `code.fehler` | Deine Lesart stimmt: Zeile 20 wird durchgestrichen, `ersetzen_durch` erscheint grün nach `einfuegen_nach`, `begruendung` nach „Fehler beheben“. Drei Knöpfe wie beschrieben. **Noch nicht gebaut**, kommt als Nächstes |
| `code.probelauf`, echtes oder simuliertes Python | Weder Pyodide noch ein nachgebautes Python im Browser: Das **Bauskript führt das Programm beim Bauen mit echtem Python aus**, einmal mit und einmal ohne Fehler, mit den Eingaben aus `eingaben`. Es merkt sich Ausgabe und die `variable` nach jedem Läufer. Der Abspieler spielt das ab und färbt gegen `erwartet`. `erwartet_mit_fehler` braucht es nicht. **Noch nicht gebaut** |
| `einblenden` ist Lösung | Ja, gilt ab jetzt als Lösungsfeld (wird in der Schülerfassung entfernt) |
| `urteilen.elemente[].text` | `zeile` reicht, `text` darf fehlen (dann wird der Kommentar aus der Zeile genommen). Baustein noch nicht gebaut |
| `partner`, Namen | `namen.txt` im Fachordner, eine Zeile je Name, nie in der Tafel.html. Der lokale Server liefert sie, nur an den eigenen Rechner. Baustein noch nicht gebaut |
| `testfaelle` | wie beschrieben, `eingabe` darf mehrzeilig sein. Noch nicht gebaut |
| Kontrollfragen aufdecken | `folie` mit `aufdecken: true` |
| Notausstieg mit Ersatzschritt | `ersetzt: [planen, teilzielsicherung]` am ausgeblendeten Schritt wird übernommen |
| `kuerzen: ja` | heißt **kürzen**: bis `mindest_min` (fehlt es, darf bis 0, also gestrichen). `wegfall_text` wird übernommen. Der Assistent selbst ist noch nicht gebaut, die Felder dürfen schon in die Datei |
| `pruefpunkt` | Der Assistent prüft beim **Betreten** des Schritts mit Prüfpunkt |
| Beamer bei Schritten ohne `auftrag` | `zeige: { Beamer: tafel }` ist richtig so, ein eigenes `spiegeln` braucht es nicht |
| Zähler nachtragen | Ja: Die Regie behält alles, auch nach der Stunde. Zähler nachtragen, dann „Zeiten sichern“ |
| Eine Quelle | Vorerst bleibt `stunde_texte.py` die Quelle. Sobald das Bauskript Heft und Exit-Ticket selbst baut (S1), wird `Tafel.yaml` die Quelle. Das steht dann hier unter einer neuen Änderung |
| `soll_min: 0` | erlaubt, bleibt so |
| Board und Beamer am selben Laptop | Board im Vollbild über das Hauptfenster, Beamer als zweites Fenster auf seinem Monitor (ein Tipp für Vollbild). Hängt der Beamer an einem anderen Rechner, braucht es den Netz-Abgleich, der ist noch nicht gebaut |

**Bis Mittwoch empfohlen:** Teilzielsicherung, Theoriesicherung, Planen und Abnahme als `einbetten`-Reiter mit
den vorhandenen Tafel-Apps, z. B. `{baustein: einbetten, datei: ../../Lernhilfen/anmeldung/tafel_kommentare.html}`.
Dann läuft die Stunde ohne Programmwechsel.

### Änderung 1 · 25.10.2026 · Meldung SYS (DS 06)

**Was sich am Format ändert** (bitte vorhandene `Tafel.yaml` anpassen):

| Was | neu |
|---|---|
| `anzeigen` im Kopf | **umgedreht:** je physischer Anzeige, was sie zeigt (`Board: geteilt`). Die alte Form `{tafel: Board, auftrag: Beamer}` gilt nicht mehr |
| `zeige` je Schritt | neu: weicht ein Schritt vom Kopf ab, z. B. `zeige: { Board: extern }` |
| Ansichten `geteilt`, `extern` | neu (siehe 2.1) |
| `abschnitt` je Schritt, `ablaufleiste` im Kopf | neu, ersetzt Agendafolien |
| `kuerzen` | Bedeutung festgelegt (siehe 2.2) |
| `ergebnis` | neuer Baustein: Ergebnis früherer Schüler-Schritte auf der Tafel |
| `bild` | `untertitel`, `schleier` |
| `auftrag.material` | Einträge mit `url` bekommen einen QR-Code |
| `code.marken` | Erklärung erst auf Tipp, neben der Zeile, nacheinander |
| `zeichnen` | Felder festgelegt (Bild- oder Zahlenraster-Hintergrund) |
| `abstimmung` | `mehrfach`, `kennung: team` |
| `vorhersage` | `aufloesen_in`, `kennung` |
| Reiter | jeder Baustein darf Reiter sein |
| Pfade | `../` innerhalb des Fachordners erlaubt |

**Antworten auf die Fragen von SYS:**

| Frage | Antwort |
|---|---|
| Einzelanzeige, was zeigt das Board? | `anzeigen: { Board: geteilt }` im Kopf, Abweichungen je Schritt mit `zeige`. Die Felder `einzelanzeige` und `board` aus dem Vorschlag braucht es damit nicht |
| `kuerzen: nein` gegen `nie` | Deine Lesart stimmt. `nein` = letzte Reserve, `nie` = nie |
| Referat: `tafel: schwarz` oder eigene Ansicht? | `zeige: { Board: extern }` und `tafel` weglassen. Das Werkzeug zeigt auf dem Board nichts, die Regie zählt weiter und gibt bei Soll-Ende ein Signal |
| Ergebnisse später zeigen | Baustein `ergebnis` mit `von: [gewichtssumme-tipp, p2]` statt `ergebnisvergleich` |
| Schüler-Seite am PC-Browser | Ja. Die Schüler-Seite ist eine normale Webseite und läuft am PC wie am Handy |
| Eine Stimme je Team | `kennung: team`. Teamnummer statt Name, eine Stimme je Team, neue ersetzt alte. Ohne `kennung: team` zählt jedes Gerät, dann bleibt es beim Vertrauen |
| Grafiken aus DS 05 wiederverwenden | Ja, `../` innerhalb des Fachordners ist erlaubt |
| `qr` und `folie` als Reiter | Ja |
| Agenda | `abschnitt` je Schritt, `ablaufleiste: true` im Kopf |
| Material verlinken, QR je Auftrag | Ja, `material: [{text, url}]` |
| `code.marken[].einblenden` | Erklärtext, erscheint auf Tipp neben der Zeile, nacheinander |
