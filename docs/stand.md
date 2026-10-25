# Tafelsystem: Stand und Auftrag „Stunde schreiben“

Stand 25.10.2026 · Stundenformat `tafelstunde/0` (Entwurf) · Repo `sschaffenroth/Unterrichtstool`
Konzept: `claude/Tafelsystem_Konzept_und_Steckbrief_Vorlage.md` im Projekt

> **Für den Fach-Chat:** Du schreibst eine Stunde im Format aus Teil 2. Du baust **keinen Code am
> Werkzeug**. Das macht der Werkzeug-Chat. Lies zuerst Teil 1, damit du weißt, was es schon gibt
> und was nicht.

---

## Teil 1 · Was das Werkzeug heute kann

**Ehrlich gesagt: noch fast nichts.** Das Werkzeug steht am Anfang.

| Was | Stand |
|---|---|
| Repository | Grundgerüst mit Ordnern, Konzept, Anforderungskatalog. **Keine Funktion.** |
| Stundenformat | Entwurf `tafelstunde/0` (Teil 2). Noch kein Bauskript, das es liest |
| Tafel, Auftrag, Regie | geplant (Stufe 1). Heute nicht nutzbar |
| Prototyp KIG ES 06 | läuft: Tafeldatei offline (Spielbrett, Kette, Zuordnen, Vorhersage, Formular, Zeitplan, PNG) + Abstimmungs-Worker auf Cloudflare (QR, `/lehrer`). Fachgebunden, noch nicht im Repo |
| Tafel-Apps GP DS 05 bis 07 | laufen als einzelne HTML-Dateien in `Lernhilfen/`. Noch nicht im Repo |
| Schüler-Handy | nur über den ES-06-Worker (Abstimmung, Zuordnen, Formular) |

**Was das für dich heißt:**

- Die Stunde, die du jetzt schreibst, **läuft noch nicht im Werkzeug**. Sie ist der Pilot und der
  Testfall, an dem Stufe 1 und 2 gebaut werden.
- Bereite den Unterricht deshalb **wie gewohnt** vor (PowerPoint, Tafel-Apps, Druck). Die
  Stunden-Datei kommt dazu, sie ersetzt noch nichts.
- Je genauer die Datei ist, desto schneller wird sie lauffähig.

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
anzeigen:                  # Standard-Zuweisung, in der Regie änderbar
  tafel: Board
  auftrag: Beamer
```

### 2.2 Schritte

```yaml
schritte:
  - id: einstieg-impuls        # eindeutig, klein, mit Bindestrich
    titel: Einstieg            # erscheint in der Regie
    soll_min: 3
    ausgeblendet: false        # true = Reserve/Ausweichweg, erst in der Regie einschalten
    pruefpunkt: false          # true = hier prüft der Notausstieg-Assistent den Verzug
    kuerzen: nein              # ja | nein | nie   (nie = Sicherung, Abnahme, Exit-Ticket)
    bei_wegfall: naechste_stunde   # hausaufgabe | naechste_stunde  (nur bei kuerzen: ja)
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

**Mehrere Reiter** auf der Tafel:

```yaml
    tafel:
      reiter:
        - { titel: "Kommentare beurteilen", baustein: urteilen, … }
        - { titel: "Fehler finden", baustein: code, … }
```

### 2.3 Bausteine und ihre Felder

Alles, was Lösung ist, steht in Feldern namens `loesung`, `erwartet` oder `begruendung`. Das
Bauskript entfernt sie später aus der Schülerfassung. **Keine Schülernamen in die Datei.**

**Hilfsansichten**

| Baustein | Felder |
|---|---|
| `titel` | `text`, `untertitel` |
| `schwarz` | – |
| `uhr` | `dauer_min` (nur Dauer, nie Uhrzeit) |
| `qr` | `url`, `text` |
| `bild` | `datei`, `frage` (im Band), `alt` |
| `folie` | `markdown` (kurzer Text, selten nötig) |

**Auftrag**

| Baustein | Felder |
|---|---|
| `auftrag` | `text` (genau **ein** Satz, kein Code), `sozialform` (EA, PA, GA, Plenum), `dauer_min`, `material` (Liste), `abgabe` |

**Tafel-Bausteine**

| Baustein | Felder |
|---|---|
| `code` | `datei` oder `quelltext`, `sprache`, `ansichten` (Zeilenbereiche, z. B. `[[1,17],[18,34]]`), `marken` (Liste `{zeile, label, einblenden}`), `fehler` (`{zeile, ersetzen_durch, einfuegen_nach}`), `probelauf` (`{eingaben: [{id, eingabe, erwartet}], variable}`), `nebeneinander` (zweite Datei) |
| `zuordnen` | `begriffe`, `ziele`, `loesung` (`{begriff: ziel}`) |
| `beschriften` | `datei`/`quelltext`, `stellen` (`{nr, zeile, text}` oder `{nr, zeilen: [von, bis]}`), `begriffe` (Überzählige erlaubt), `loesung` (`{nr: begriff}`), `begruendung` |
| `urteilen` | `datei`/`quelltext`, `urteile` (feste Liste), `elemente` (`{zeile, text, loesung, begruendung}`) |
| `codestreifen` | `zonen`, `streifen` (`{text, loesung: {zone, einrueckung}}`), `fallen` (Streifen, die nicht hineingehören), `pruefstreifen` |
| `testfaelle` | `faelle` (`{id, eingabe, erwartet}`) |
| `partner` | `modus` (paare, gruppen). Namen kommen lokal vom Board, nicht aus der Datei |
| `kette`, `grafik`, `brett` | wie im Prototyp ES 06. Felder noch nicht festgelegt: Inhalt unter `entwurf:` frei beschreiben |

**Schüler-Bausteine** (unter `schueler:`)

| Baustein | Felder |
|---|---|
| `abstimmung` | `frage`, `optionen` |
| `vorhersage` | `frage`, `optionen`, `loesung` |
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
