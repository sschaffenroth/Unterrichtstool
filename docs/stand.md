# Tafelsystem: Stand und Auftrag „Stunde schreiben“

Stand 25.10.2026, Änderung 1 (Meldung SYS), Abspieler 0.1 · Stundenformat `tafelstunde/0` (Entwurf) · Repo `sschaffenroth/Unterrichtstool`
Was sich geändert hat und die Antworten auf Meldungen: **Teil 4**.
Konzept: `claude/Tafelsystem_Konzept_und_Steckbrief_Vorlage.md` im Projekt

> **Für den Fach-Chat:** Du schreibst eine Stunde im Format aus Teil 2. Du baust **keinen Code am
> Werkzeug**. Das macht der Werkzeug-Chat. Lies zuerst Teil 1, damit du weißt, was es schon gibt
> und was nicht.

---

## Teil 1 · Was das Werkzeug heute kann

**Erster Abspieler (Version 0.1, 25.10.2026).** Aus `Tafel.yaml` baut der Werkzeug-Chat eine
`Tafel.html` daneben. Sie läuft offline in Chrome oder Edge.

| Was | Stand |
|---|---|
| Bauskript | prüft `Tafel.yaml` (Bausteine, Felder, Verweise, Pfade, Zeitsumme) und baut `Tafel.html` |
| Regie | Ablauf mit Soll/Ist, Prognose, Notizen, Zähler, Handzeichen, Reiter, Marken, Countdown, Ergebnis aufs Board, Signal bei Soll-Ende, Zeiten als JSON sichern. Auf dem Laptop oder als Schublade über dem Board |
| Anzeigen | `geteilt`, `tafel`, `auftrag`, `extern`, `schwarz`, Ablaufleiste. Zweites Fenster auf zweitem Bildschirm, abgeglichen ohne Netz |
| Fenster und Monitore | Regie zeigt, welche Fenster offen sind, öffnet/schließt/verschiebt sie. Monitor fest zuordnen (Chrome/Edge, gilt je Laptop für alle Stunden). Board geht ohne Antippen ins Vollbild auf seinem Monitor (Hauptfenster), Regie dann als eigenes Fenster. Karte „Überwachen“ mit allen Ansichten und der Handy-Sicht |
| Sicherung | aktuelle Ansicht als PNG (Regie, 📷 am Board), alle Folien als PNG oder PDF, lokal in einem gewählten Ordner oder im Download-Ordner |
| Bausteine **fertig** | `titel`, `bild`, `folie`, `qr`, `uhr`, `schwarz`, `auftrag` (Countdown, Material mit QR), `code` (Marken, Teile), `zeichnen` (Raster/Bild, Stift, Rückgängig, PNG), `ergebnis` |
| Bausteine **Platzhalter** | `zuordnen`, `beschriften`, `urteilen`, `codestreifen`, `testfaelle`, `partner`, `kette`, `grafik`, `brett`, `sql`, `neu`. `code`: `fehler`, `probelauf`, `nebeneinander` fehlen |
| Schüler-Handys | Worker im Repo (`worker/`): Raum mit 4-stelligem Code, Anmelde-QR und Link auf der Tafel (Auftragsleiste und groß), Schüler-Seite am Handy oder PC. `abstimmung` und `vorhersage` mit Freigabe aus der Regie, `mehrfach`, `kennung: team`. Handy-Stimmen und Handzeichen werden zusammengezählt. Raum löscht sich nach 4 Wochen. `formular`, `feedback`, `fragen` noch nicht |
| Handy-Begleitseite | zeigt immer den aktuellen Schritt: Abschnitt, Titel, Auftrag mit Countdown, Material mit Ort, Dateiname und Link. Freigegebene Frage erscheint obendrüber. Nie Notizen oder Lösungen |
| Start | `Tafel starten.bat` + `tafel_server.ps1` im Fachordner: lokaler Server auf localhost, Stundenauswahl. Nötig in Edge für Monitor-Zuordnung |
| Regie auf dem Handy | nur auf demselben Rechner wie das Board (kein Netz-Abgleich) |
| Prototyp KIG ES 06 | läuft: Tafeldatei offline (Spielbrett, Kette, Zuordnen, Vorhersage, Formular, Zeitplan, PNG) + Abstimmungs-Worker auf Cloudflare (QR, `/lehrer`). Fachgebunden, noch nicht im Repo |
| Tafel-Apps GP DS 05 bis 07 | laufen als einzelne HTML-Dateien in `Lernhilfen/`. Noch nicht im Repo |
| Schüler-Handy | nur über den ES-06-Worker (Abstimmung, Zuordnen, Formular) |
| Stunden im Format | SYS DS 06 (27.10.), `KI_Systementwicklung\06_2026-10-27_Merkmale_vor_DeepLearning\Tafel.yaml` |

**Was das für dich heißt:**

- Stunden aus den fertigen Bausteinen laufen. Wo ein Platzhalter steht, bleibt die bisherige
  Lösung (PowerPoint, Tafel-App) als Rückfall bereit.
- Die PowerPoint bleibt vorerst Notfallfassung. Probelauf am Board vor der ersten echten Stunde.
- Bauen lässt du die Stunde vom Werkzeug-Chat („Tafel.yaml für DS xx ist fertig“). Die Prüfmeldungen
  des Bauskripts bekommst du zurück.

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
| `folie` | `markdown` (kurzer Text, selten nötig) |

**Auftrag**

| Baustein | Felder |
|---|---|
| `auftrag` | `text` (genau **ein** Satz, kein Code), `sozialform` (EA, PA, GA, Plenum), `dauer_min`, `material` (Liste: Text oder `{text, url, ort, datei, qr}`. Bei GitHub-Links werden `ort` (Repository › Ordner) und `datei` automatisch abgeleitet und angezeigt. QR-Code nur mit `qr: true`. Die Handy-Begleitseite zeigt die Links anklickbar), `abgabe` |

**Tafel-Bausteine**

| Baustein | Felder |
|---|---|
| `code` | `datei` oder `quelltext`, `sprache`, `ansichten` (Zeilenbereiche, z. B. `[[1,17],[18,34]]`), `marken` (Liste `{zeile, label, einblenden}`: `einblenden` ist der Erklärtext. Er erscheint **erst auf Tipp**, neben der Zeile, Marken in Listenreihenfolge nacheinander), `fehler` (`{zeile, ersetzen_durch, einfuegen_nach}`), `probelauf` (`{eingaben: [{id, eingabe, erwartet}], variable}`), `nebeneinander` (zweite Datei) |
| `zuordnen` | `begriffe`, `ziele`, `loesung` (`{begriff: ziel}`) |
| `beschriften` | `datei`/`quelltext`, `stellen` (`{nr, zeile, text}` oder `{nr, zeilen: [von, bis]}`), `begriffe` (Überzählige erlaubt), `loesung` (`{nr: begriff}`), `begruendung` |
| `urteilen` | `datei`/`quelltext`, `urteile` (feste Liste), `elemente` (`{zeile, text, loesung, begruendung}`) |
| `codestreifen` | `zonen`, `streifen` (`{text, loesung: {zone, einrueckung}}`), `fallen` (Streifen, die nicht hineingehören), `pruefstreifen` |
| `testfaelle` | `faelle` (`{id, eingabe, erwartet}`) |
| `partner` | `modus` (paare, gruppen). Namen kommen lokal vom Board, nicht aus der Datei |
| `zeichnen` | `hintergrund` (`{bild: datei}` oder `{raster: [[1,0,-1],[2,0,-2],[1,0,-1]], titel: "Kern"}`, auch als Liste mehrerer Raster nebeneinander), `raster_zellen_beschreibbar` (true = in Zellen tippen und Zahl schreiben). Freihand-Stift, Rückgängig und PNG-Sicherung hat jeder Baustein |
| `kette`, `grafik`, `brett` | wie im Prototyp ES 06. Felder noch nicht festgelegt: Inhalt unter `entwurf:` frei beschreiben |

**Schüler-Bausteine** (unter `schueler:`)

| Baustein | Felder |
|---|---|
| `abstimmung` | `frage`, `optionen`, `mehrfach` (true = mehrere Optionen wählbar, Balken je Option), `kennung` (`geraet` Standard, oder `team`: die Seite fragt einmal nach der Teamnummer, eine Stimme je Team, neue Stimme ersetzt die alte) |
| `vorhersage` | `frage`, `optionen`, `loesung`, `aufloesen_in` (Schritt-ID, in der aufgelöst wird; ohne Angabe im selben Schritt), `kennung` wie oben |
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

### 2.4 Regeln (gelten in allen Fächern)

- Auftrag: ein Satz, Sozialform, Dauer. Kein Code auf der Auftragsansicht.
- Auf Schüler-Anzeigen nur Dauer, nie Uhrzeit.
- Code mindestens 20 pt: lange Programme über `ansichten` teilen, nie verkleinern.
- Keine Lösung auf Schüler-Anzeigen, nur in `loesung`/`erwartet`/`begruendung`.
- Keine Namen von Schülern. Kein Ergebnis aus dem Werkzeug führt zu einer Note.
- Texte so, wie sie im Unterricht stehen sollen. Die Datei ist die Quelle, auch fürs Heft.

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

## Teil 4 · Änderungen und Antworten auf Meldungen

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
