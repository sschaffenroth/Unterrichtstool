# Unterricht steuern mit der Tafelanwendung — technische Integration

Stand 25.10.2026 · Entwurf zur Entscheidung, noch nichts davon gebaut.

**Ziel:** Eine Anwendung, mit der Schaffi den Unterricht aller Fächer führt. Sie bedient mehrere
Bildschirme (Board, Beamer, zweiter Monitor) und hat eine eigene **Regie-Ansicht** auf Laptop, Tablet
oder Handy. Dort legt die Lehrkraft fest, welcher Bildschirm was im Vollbild zeigt. Die Handys der
Klasse bleiben über die Abstimmung angebunden. Grundlage ist das, was für KIG ES 06 schon läuft.

---

## 1 · Was es heute schon gibt

| Baustein | Wo | Was er kann |
|---|---|---|
| Tafeldatei je Stunde | `KI2_KI_Gesellschaft/Lernhilfen/_bau_tafel/` → `build.py` → eine HTML-Datei | Läuft offline, ohne Installation. Bildschirmfolge (`stunde.js`), Spielbrett, Grafiken, Rätsel. Zuordnen, Formular, Zeitplan, Sichern als PNG |
| Abstimmungs-Worker | Cloudflare Worker + D1, `abstimmung.s-schaffenroth.workers.dev` | QR-Abstimmung, Zuordnen, Formulare, Zeitpläne, Lehreransicht `/lehrer` |
| Stundenplan | `_Stundenplan/build.py` → Artifact, eine `stundenplan.json` je Fach | Termine, Verlaufspläne, Einarbeitung, Begriffe, Notizen |
| Druck | `_Stundenplan/material.py` | Markdown → Word/PowerPoint in der Schulvorlage |
| Schülermaterial | `_Stundenplan/schueler_repo.py` | Klassen-Repository |

Die Tafeldatei ist schon heute **eine Datei mit Zustand im Browser**. Die Bildschirmfolge ist
deklarativ beschrieben (Typ, Titel, Sollzeit, Inhalt), gezeichnet wird über `RENDER[typ]`. Auf
diesem Muster baut alles Weitere auf.

---

## 2 · Zielbild: eine Datei, drei Rollen

Dieselbe HTML-Datei wird in drei Rollen geöffnet:

| Rolle | Aufruf | Gerät | Inhalt |
|---|---|---|---|
| **Anzeige** | `…html#anzeige=A` | Board, Beamer, Zweitmonitor — im Vollbild | genau eine Ansicht, ohne Bedienleiste |
| **Regie** | `…html#regie` | Lehrer-Laptop, Tablet oder Handy | alle Anzeigen als Miniatur. Weiter und zurück, Notizen, Zeitplan, Abstimmung steuern, Lehreransicht |
| **Schüler** | QR-Code → Worker-Seite | Handys | wie heute: abstimmen, zuordnen, Formular |

**Ansichten**, die eine Anzeige zeigen kann:

- ein Bildschirm der Stunde (auch ein anderer als der aktuelle, etwa die Problemkette als
  stehendes Tafelbild auf dem Zweitmonitor),
- QR-Code groß,
- Uhr oder Countdown,
- Ergebnisse (Balken, Formular-Antworten),
- Merkbild oder Denkwerkzeug,
- Bild oder PDF-Seite,
- schwarz („Augen nach vorn“).

**Beispiel ES 06 mit zwei Bildschirmen:**

| Anzeige | zeigt |
|---|---|
| Board | Spielbrett und Vorhersagen |
| Beamer | Problemkette als stehendes Tafelbild, bei Abstimmungen der große QR-Code |
| Regie (Laptop) | Notiz, Zeitplan, Stimmenzahl, nächste Aktion |

---

## 3 · Synchronisation — zwei Stufen

### Stufe A: ein Rechner, mehrere Bildschirme (offline)

Board und Beamer hängen am selben PC. Die Regie öffnet die Anzeige-Fenster selbst:

- **Fenster platzieren:** Die Window Management API (`window.getScreenDetails()`) liefert die
  angeschlossenen Bildschirme. Die Regie öffnet je Bildschirm ein Fenster mit
  `window.open(…, "anzeige-A", "left=…,top=…")` und schaltet es mit
  `element.requestFullscreen({ screen })` auf den richtigen Bildschirm.
  - Nur Chrome und Edge.
  - Der Browser fragt einmal nach der Erlaubnis „Fensterverwaltung“.
  - Vollbild braucht einen Klick in der Regie.
- **Nachrichten:** `postMessage` über die Fensterreferenz aus `window.open`. Das funktioniert auch
  bei `file://`, braucht keinen Server und kein Netz. `BroadcastChannel` ist die Alternative, ist bei
  `file://` aber unsicher — nur als Rückfall.
- **Rückfall ohne API:** Je Bildschirm eine Verknüpfung auf dem Board-PC, etwa
  `msedge --kiosk "file:///…/22_Tafel.html#anzeige=B" --window-position=1920,0`.
  Die Anzeige meldet sich dann bei der Regie an.

### Stufe B: mehrere Geräte (Tablet als Regie, Board-PC als Anzeige)

Hier braucht es einen Vermittler im Netz. Der Worker ist schon da:

- **Echtzeit:** Ein Cloudflare **Durable Object** je Raum hält eine WebSocket-Verbindung zu Regie
  und Anzeigen. Laut Cloudflare gibt es Durable Objects mit SQLite-Speicher auch im Free-Plan; vor
  dem Bau prüfen.
- **Rückfall:** Abfrage alle 1–2 s über D1 — das macht die Abstimmung heute schon so.
- **Koppeln:** Die Anzeige zeigt einen vierstelligen Raumcode, die Regie gibt ihn ein. Kein Konto,
  kein Passwort auf dem Board.
- **Ohne Netz:** Die Anzeige bleibt bedienbar (Pfeiltasten, Touch) — wie heute.

---

## 4 · Was am Code umgebaut werden muss

1. **Zustand an einer Stelle.**
   - Heute liegt der Zustand verteilt in globalen Variablen (`SI`, `SF`, `SV_`, `ABST`, `ZEIT`).
   - Neu: ein Objekt `ZUSTAND = { stunde, anzeigen: { A: {ansicht, bildschirm, schritt…}, B: … },
     abstimmung, zeit }`.
   - Jede Aktion (weiter, auflösen, Karte tippen) wird zu einer Nachricht `{ typ, … }`. Die Regie
     erzeugt sie, alle Fenster wenden sie gleich an und zeichnen neu.
   - Dann zeigen Board und Regie zwingend dasselbe.
2. **Zeichnen nur aus dem Zustand.**
   - `RENDER[typ](bildschirm, zustand, rolle)`. Die Rolle entscheidet: Anzeige ohne Notiz und Knöpfe,
     Regie mit Miniatur und Steuerung.
   - Die heutige Bedienung direkt am Board (Touch) bleibt: Sie erzeugt dieselben Nachrichten.
3. **Bausteine statt Fach-Code.** Die Bildschirmtypen werden eine Bibliothek, die alle Fächer nutzen:

   | Baustein | heute | neu für |
   |---|---|---|
   | `titel`, `kette`, `auftrag` (Uhr), `formular`, `vorhersage`, `zuordnen`, `grafik` | ES 06 | alle Fächer |
   | `folie` (Markdown mit Bild) | — | Input in allen Fächern; Quelle wie `01_Folien.md` |
   | `code` (Syntax-Hervorhebung, schrittweise aufdecken) | — | GdP, ET1, SYS |
   | `sql` (Abfrage live im Browser über sql.js, Ergebnis als Tabelle) | — | Datenbanken |
   | `brett` (Spielbrett) | ES 06 | Lernsituationen mit Rollen, z. B. Kaminkehrerlauf |

4. **Eine Stunde = eine Datei im Stundenordner.**
   - Zum Beispiel `25_Tafel.js` mit der Bildschirmfolge, so wie heute `stunde.js`.
   - Ein `build.py` im `_Stundenplan` baut daraus `25_Tafel.html`. Das ist ein einziges gemeinsames
     Bauskript statt eines je Fach (heute liegt es in KIG/Lernhilfen).
   - `stundenplan.json` kennt die Datei schon über `dateien`.
5. **Lehrer-Schlüssel je Fach** in einer Datei außerhalb der Quellen, eingelesen beim Bauen.
   - Build-Schalter `--schueler` erzeugt eine Fassung ohne Schlüssel, Regie und Notizen. Nur diese
     darf in den Schülerkanal oder ins Klassen-Repository.

---

## 5 · Hosting und Verteilung

| Weg | Vorteil | Nachteil |
|---|---|---|
| **Datei auf jedem Gerät** (OneDrive/Teams synchronisiert) | offline, keine Freigabe nötig | Regie auf dem Tablet braucht die Datei auch dort |
| **Cloudflare Pages** mit Zugangsschutz (Cloudflare Access) | ein Link für alle Geräte, immer aktuell | Netz nötig; Schulfilter prüfen; einmal anmelden |

**Empfehlung:**

- Stufe A mit der Datei auf dem Board-PC — das reicht für den Großteil des Unterrichts.
- Pages erst, wenn die Regie wirklich vom Tablet laufen soll.

---

## 6 · Auswertung und Anbindung an den Stundenplan

- **Zeitpläne** (Soll/Ist je Bildschirm) und **Formular-Antworten** liegen beim Worker. Die
  Lehreransicht zeigt sie je Fach und Datum.
- **Rückblick im Stundenplan:**
  - Das Stundenplan-Artifact kann den Worker nicht direkt abfragen.
  - Der Weg ist ein Export aus `/lehrer` als JSON. Ein `build.py`-Schritt trägt daraus je Termin
    „gehalten bis Bildschirm …, +4 min in Zug 2“ in die Notiz ein.
- **Gesicherte Tafelbilder** (PNG) gehen nach `_Druck/Tafelbilder/`. Zum Austeilen oder für den
  Klassenkanal.

---

## 7 · Datenschutz und Sicherheit

- **Handys:** Gespeichert wird nur eine zufällige Geräte-Kennung und die Antwort, keine Namen und
  keine IP-Adressen.
- **Formulare:** In Formularfeldern können Schüler trotzdem Namen schreiben. Darauf hinweisen
  („ohne Namen“ steht schon da). Die Texte liegen bei Cloudflare.
- **Vor dem Einsatz in mehreren Fächern** einmal mit der/dem Datenschutzbeauftragten der Schule
  klären. Dabei auch: wie lange gespeichert wird; eine Lösch-Funktion je Fach in `/lehrer` ist
  einzuplanen.
- **Lehrer-Schlüssel:**
  - Nie in Schülerdateien.
  - Bei Verdacht wechseln: neuer Schlüssel im Worker, neu bauen.
  - Je Fach ein eigener Schlüssel, damit ein Leck nicht alles öffnet.
- **Board-PC:** Kein angemeldetes Konto in der Anzeige. Die Regie-Rolle nur auf dem eigenen Gerät.

---

## 8 · Fahrplan

| Stufe | Inhalt | Aufwand (grob) | Voraussetzung |
|---|---|---|---|
| **1** | Zustand zentral, Regie und Anzeige in derselben Datei, `postMessage`, Fenster auf Bildschirme verteilen. Pilot: KIG ES 06 auf Board und Beamer | 1–2 Arbeitssitzungen | Board-PC mit Chrome oder Edge, zweiter Bildschirm |
| **2** | Bausteinbibliothek nach `_Stundenplan/tafel/`, gemeinsamer Build, Stundendatei im Stundenordner. Je eine Pilotstunde in DB (`sql`) und GdP (`code`), dazu `folie` aus `01_Folien.md` | 2–3 Sitzungen | Entscheidung, welche Stunden zuerst |
| **3** | Mehrere Geräte: Durable Object mit WebSocket, Raumcode. Regie auf Tablet oder Handy | 1–2 Sitzungen | Free-Plan prüfen, Schulnetz-Test |
| **4** | Auswertung: Lehreransicht je Fach, JSON-Export, Rückblick im Stundenplan, Lösch-Funktion | 1 Sitzung | — |

**Vor Stufe 1 klären:**

1. Welche Rechner und Bildschirme stehen in den Räumen (Board allein oder Board plus Beamer)?
   Welcher Browser, welche Version?
2. Darf auf dem Board-PC eine Verknüpfung mit Kiosk-Start angelegt werden?
3. Lässt das Schulnetz `workers.dev` durch (Test mit der Abstimmung am 26.10.)?

---

## 9 · Risiken

- **Browser:** Die Window Management API gibt es nur in Chromium. Auf anderen Browsern bleibt die
  Verknüpfung je Bildschirm.
- **Netz:** Fällt es aus, laufen Regie und Anzeige auf einem Rechner weiter (Stufe A). Abstimmung und
  Mehrgeräte-Betrieb fallen auf Handzeichen und Bedienung am Board zurück.
- **Wartung:** Ein System, eine Person. Deshalb gehören dazu: ein Bauskript, eine Bibliothek, Tests
  mit simuliertem Server und simulierter Uhr (gibt es schon: `ab_test2.py`, `zeit_test.py`) und
  eine kurze Bedienungsanleitung im README.
- **Umfang:** Der Nutzen entsteht in Stufe 1 und 2. Stufe 3 und 4 nur, wenn sie im Alltag fehlen.

---

### Quellen zur Technik

- Window Management API: [MDN — Using the Window Management API](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API/Using) · [Chrome Developers — Window Management](https://developer.chrome.com/articles/window-management)
- Durable Objects: [Cloudflare — Pricing](https://developers.cloudflare.com/durable-objects/platform/pricing) · [Release Notes](https://developers.cloudflare.com/durable-objects/release-notes/)
