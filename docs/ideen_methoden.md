# Ideensammlung: digitale Methoden für das Tafelsystem

Stand 25.10.2026. Recherche zu digitalen Unterrichtsmethoden und Werkzeugen (Wooclap, Classroomscreen,
Oncoo, frag.jetzt, Particify, ByCS) und zur Forschung in der Informatikdidaktik (Peer Instruction, PRIMM,
Parsons-Aufgaben, Live Coding, Pair Programming). Dazu je Idee: was sie bringt, wie sie ins Tafelsystem
passt, wie viel Arbeit sie ist.

**Grundsatz:** Fremde Werkzeuge nicht einbinden, sondern die Methode nachbauen. Gründe: keine Konten, keine
Namen, alles läuft über den eigenen Raum (Worker) und die Regie, Ergebnisse landen im Befund. Wer ein
fremdes Werkzeug trotzdem nutzt, kann es per QR-Code verlinken.

Aufwand: **S** unter einer Sitzung, **M** eine Sitzung, **L** mehrere Sitzungen.
Bezug zu `docs/anforderungen.md` in eckigen Klammern.

---

## 1. Schnell gebaut, großer Nutzen

| Idee | Was passiert | Warum | Fächer | Aufwand |
|---|---|---|---|---|
| **Peer Instruction** (zweimal abstimmen) | Frage, alle stimmen ab. Nachbarn mit anderer Antwort überzeugen sich gegenseitig, dann zweite Abstimmung. Board zeigt erste und zweite Runde nebeneinander | gut belegte Methode (Mazur). Diskussion lohnt sich, wenn in der ersten Runde etwa 35 bis 70 % richtig liegen. Die Regie kann genau das anzeigen: „jetzt diskutieren lassen“ oder „gleich auflösen“ | alle, besonders GP, DB, SYS | S |
| **Sicherheit zur Antwort** | zur Abstimmung ein zweiter Tipp: „sicher“ oder „geraten“. Regie zeigt „falsch, aber sicher“ getrennt | macht Fehlvorstellungen sichtbar, die eine reine Mehrheitsanzeige verdeckt | alle | S |
| **Fortschritt melden** | in der Arbeitsphase hakt jedes Team am Handy ab: A1 fertig, A2 fertig, T1 bis T6 bestanden. Regie zeigt Balken je Aufgabe | ersetzt die Strichlisten für den Befund [R7], füttert den Notausstieg [R8] mit echten Zahlen statt Bauchgefühl | GP, ET1, SYS, DB | S |
| **Hilfe-Ampel** | Team setzt am Handy grün, gelb oder rot, mit Platznummer. Regie zeigt eine Warteschlange „wer braucht Hilfe, seit wann“ | Helfersystem ohne Hand heben; die Lehrkraft sieht, wo es hängt [I4, I6] | Praxisphasen GP, ET1, SYS | S |
| **Zahl schätzen** | Frage mit Zahl als Antwort, Board zeigt die Verteilung als Histogramm, dann Auflösung | passt zu Vorhersagen mit Messwerten („Wie viele Umrisse findet Otsu?“, „Wie viele Zeilen liefert der JOIN?“) | SYS, DB, ET1 | S |
| **Meinungsbarometer** | Schieberegler „stimme zu“ bis „stimme nicht zu“, vor und nach der Debatte. Board zeigt beide Verteilungen | macht Meinungswandel sichtbar, ohne dass jemand sich vor der Klasse festlegen muss | KIG, Deutsch | S |
| **Exit-Ticket und Muddiest Point** | Stundenabschluss am Handy: eine Kontrollfrage, dazu „Was war heute am unklarsten?“ (Freitext) oder 3-2-1. Nur in der Regie, Lehrkraft markiert richtig/falsch | gängige formative Diagnose; die unklarsten Punkte steuern die nächste Stunde [I3, E2] | alle | M |
| **Rollenwechsel beim Pair Programming** | `auftrag` mit `rollenwechsel_min: 10`: Board zeigt Fahrer und Navigator, gibt beim Wechsel ein Signal | Pair Programming lebt vom regelmäßigen Tausch der Rollen, das vergisst man in der Arbeitsphase leicht | GP, ET1, SYS | S |

## 2. Mittlerer Aufwand, passt besonders gut zu unseren Fächern

| Idee | Was passiert | Warum | Fächer | Aufwand |
|---|---|---|---|---|
| **Auf dem Bild tippen** (Hotspot) | Bild am Handy, jeder tippt eine Stelle an. Board zeigt alle Tipps als Punktwolke über dem Bild | Bildverarbeitung ist Sehen: „Wo ist die Kante?“, „Wo scheitert die Maske?“ Auch Schaltpläne in ET1 („Wo misst du die Spannung?“) | SYS, ET1 | M |
| **Codezeilen ordnen** (Parsons am Handy) | Zeilen in die richtige Reihenfolge ziehen, Board zeigt, wie viele richtig liegen und wo es hakt | Parsons-Aufgaben sind gut untersucht. Wichtig: **ohne Ablenkzeilen** üben, die senken laut Studie die Erfolgsquote um 26 % und kosten Zeit, ohne beim Transfer zu helfen. Passt zum geplanten `codestreifen` [B6] | GP, ET1, DB (SQL-Klauseln) | M |
| **Fragen-Wand** | Schüler stellen anonym Fragen, andere geben Daumen hoch. Regie gibt Fragen fürs Board frei | wie frag.jetzt oder Particify, aber im eigenen Raum; holt Fragen der Stilleren nach vorn [B13] | alle | M |
| **Kartenabfrage mit Clustern** | jeder schickt kurze Karten, Lehrkraft schiebt sie an der Tafel zu Gruppen | wie Oncoo; Einstieg und Sicherung in KIG und Deutsch, Anforderungen sammeln in SYS | KIG, Deutsch, SYS | M |
| **Code-Galerie** | Teams geben ein kurzes Codestück ab. Regie wählt zwei, das Board zeigt sie anonym nebeneinander zum Vergleich | Code-Review und „Vorstellen“ ohne Laptop-Umstecken; passt zu GP Code-Review und Abnahme [B9] | GP, ET1 | M |
| **SQL live im Browser** | `sql`-Baustein mit sql.js (SQLite im Browser, offline, rund 1 MB): Abfrage an der Tafel tippen, Ergebnis als Tabelle | DB braucht kein externes Programm am Board. Live Coding steigert laut Studie vor allem die Beteiligung; mit Vorhersage davor wird es PRIMM [B12] | DB | M |

## 3. Groß, später

| Idee | Warum später | Fächer | Aufwand |
|---|---|---|---|
| **Python live im Browser** (Pyodide) | rund 10 MB und mehr, offline schwer. Für den Probelauf reicht das Vorrechnen beim Bauen [B21] | GP, SYS | L |
| **Gemeinsame Zeichenfläche** (Handy zeichnet auf die Tafel) | technisch machbar, aber Moderation nötig; ByCS Board kann Ähnliches | SYS, ET1 | L |
| **Lautstärke-Ampel** über das Mikrofon | nett, aber Mikrofon im Klassenzimmer braucht Klärung mit der Datenschutzbeauftragten | alle | S |
| **H5P-Inhalte einbetten** | eigene H5P-Aufgaben lassen sich als HTML exportieren und mit `einbetten` zeigen, ohne Rückmeldung an die Regie | alle | S, wenn nur zeigen |

## 4. PRIMM als Stundenmuster für die Programmierfächer

PRIMM (Predict, Run, Investigate, Modify, Make) ist ein erprobtes Muster für den Einstieg in Programme:
erst lesen und vorhersagen, dann schreiben. Laut Forschung brauchen Anfänger etwa 50 % Treffsicherheit beim
Nachverfolgen von Code, bevor sie verlässlich selbst schreiben. Die Bausteine gibt es fast alle:

| Phase | Baustein im Tafelsystem |
|---|---|
| Predict | `vorhersage` am Handy, mit Peer Instruction und Sicherheit |
| Run | `code.probelauf` [B21] |
| Investigate | `code.marken`, Hotspot im Code, `beschriften` [B7] |
| Modify | `auftrag` mit Fortschritt melden und Rollenwechsel |
| Make | `auftrag`, Code-Galerie, `testfaelle` [B9] |

Die Stundenschemata von GP und ET1 folgen schon diesem Bogen. Vorschlag: PRIMM in der Steckbrief-Vorlage als
Muster anbieten, damit die Fach-Chats die Bausteine danach anordnen.

## 5. Vorgemerkt (Entscheidung Lehrkraft, 25.10.2026)

| Nr | Idee | für | ID |
|---|---|---|---|
| 1 | Fortschritt melden und Hilfe-Ampel | alle Praxisphasen | I7, I8 |
| 3 | Sicherheit zur Antwort | alle | I9 |
| 4 | Exit-Ticket mit Muddiest Point | alle | I3 |
| 5 | Rollenwechsel beim Pair Programming | GP, ET1, SYS | B22 |
| SYS | Auf dem Bild tippen (Hotspot) | SYS, später ET1 | I10 |
| GP, ET1 | Codezeilen ordnen am Handy (ohne Ablenkzeilen) | GP, ET1 | I11 |
| DB | SQL live im Browser (sql.js) | DB | B12 |

Peer Instruction (zweimal abstimmen) ist **nicht** vorgemerkt.

## 6. Großer Katalog: Methoden und Werkzeuge, nach Phase

Vorbilder: Mentimeter, Wooclap, Oncoo, Kahoot und Gimkit, Plickers, Classroomscreen, Nearpod und Pear Deck,
Liberating Structures, klassische kooperative Methoden und Energizer. Spalte „im Tafelsystem“: was es dafür braucht.
✓ = geht heute schon, **neu** = neuer Baustein oder neue Funktion.

### Einstieg und Aktivierung

| Methode | Vorbild | im Tafelsystem | Fächer | Aufwand |
|---|---|---|---|---|
| Wortwolke | Mentimeter, Wooclap | **neu** `wortwolke`: Handy schickt 1 bis 3 Wörter, Tafel zeigt sie groß nach Häufigkeit, Lehrkraft blendet einzelne aus | alle, Einstieg KIG, Deutsch | M |
| Verdeckte Schätzung | Mentimeter „Who will win?“ | `vorhersage` mit verdeckten Balken, Enthüllung per Regie (fast ✓) | SYS, DB, ET1 | S |
| Stiller Bildimpuls | | `bild` mit Frage im Band ✓ | alle | ✓ |
| Vier Ecken | analog | **neu** `ecken`: Tafel zeigt Aussage und vier Raumecken A bis D groß, Regie zählt Personen je Ecke | KIG, Deutsch | S |
| Blitzlicht, Daumenprobe, fünf Finger | analog, Mentimeter Skala | **neu** `skala` am Handy, Tafel zeigt Verteilung | alle | S |
| Rätsel, Mystery | Prototyp ES 06 | `einbetten` ✓, später eigener Baustein | KIG | M |

### Erarbeitung und Kooperation

| Methode | Vorbild | im Tafelsystem | Fächer | Aufwand |
|---|---|---|---|---|
| Think-Pair-Share, 1-2-4-All | Liberating Structures | **neu** `phasen` im `auftrag`: allein 1 min, zu zweit 2 min, zu viert 4 min, alle. Tafel wechselt Sozialform, Piktogramm und Countdown von selbst | alle | S |
| Lerntempoduett, Bushaltestelle | Oncoo | Wer fertig ist, meldet am Handy (baut auf I7). Die Tafel bildet sofort Paare: „Platz 3 trifft Platz 7 an der Haltestelle“ | GP, ET1, DB, SYS | M |
| Helfersystem | Oncoo | Handy: „kann helfen bei A1“ oder „brauche Hilfe bei A1“. Regie und Tafel bringen beide zusammen (baut auf I8) | Praxisphasen | M |
| Placemat | Oncoo | **neu**: jedes Gruppenmitglied schreibt am Handy in sein Feld, die Gruppe einigt sich auf die Mitte, Tafel zeigt alle Mitten | KIG, Deutsch, SYS | L |
| Gruppenpuzzle, Expertenrunde | analog | `partner` mit Stamm- und Expertengruppen, Tafel zeigt, wer wohin geht (Platznummern, keine Namen) | alle | S |
| Kugellager, Speed-Dating | analog | **neu** `runden`: Tafel zeigt Frage der Runde und Countdown, Signal zum Weiterrücken | Deutsch, KIG, Wiederholung | S |
| Gallery Walk, Markt der Möglichkeiten | analog | Plakate oder Code am Handy fotografieren und hochladen, Tafel zeigt Galerie, alle vergeben Sterne | alle | M |
| 25/10 Crowd Sourcing, Lawinendiskussion | Liberating Structures | Ideen am Handy sammeln, danach jede Idee bewerten, Tafel zeigt die besten fünf | KIG, SYS | M |
| Stille Diskussion | analog | Fragen-Wand mit Antworten (siehe Teil 2) | KIG, Deutsch | M |

### Üben und Wiederholen

| Methode | Vorbild | im Tafelsystem | Fächer | Aufwand |
|---|---|---|---|---|
| Quiz in Teams | Kahoot, Gimkit | **neu** `quiz`: Fragenfolge, Teams statt Einzelne, Punkte für richtig statt für schnell. Forschungsnah: Tempo-Punkte belohnen Raten | alle, vor Kurzarbeit und Schulaufgabe | M |
| Tabu, Begriffe erklären | analog | **neu** `begriffe`: Tafel zeigt einen Fachbegriff und verbotene Wörter, Zufall aus `BEGRIFFE.md` des Stundenordners | DB, SYS, GP, alle | S |
| Begriffe-Bingo | analog | Handy zeigt eigene Bingo-Karte aus `BEGRIFFE.md`, Lehrkraft erklärt, Schüler kreuzen an | DB, KIG | M |
| Lückentext | Wooclap | **neu** `luecke` am Handy, Tafel zeigt häufigste Einträge je Lücke | DB (SQL), Deutsch | M |
| Fehlerzeile antippen | Mentimeter „Pin on Image“ für Code | Handy zeigt Code, jeder tippt die Zeile mit dem Fehler, Tafel färbt die Zeilen nach Anzahl | GP, ET1, DB | M |
| Zuordnen, Sortieren | Wooclap, Mentimeter Ranking | `zuordnen` (Prototyp ES 06), Sortieren siehe I11 | alle | M |
| Escape Room | analog | Rätselkette: Teams geben Lösungscodes am Handy ein, Regie sieht, wer wo steht, Tafel zeigt Fortschritt ohne Namen | Wiederholung vor Prüfungen | L |

### Sicherung, Feedback, Reflexion

| Methode | Vorbild | im Tafelsystem | Fächer | Aufwand |
|---|---|---|---|---|
| Zielscheibe | Oncoo | **neu**: am Handy je Dimension ein Regler (z. B. Tempo, Verständnis, Spaß), Tafel zeigt Punkte auf der Zielscheibe | alle, Stundenende | M |
| 2×2-Matrix | Mentimeter | **neu**: jedes Element auf zwei Achsen bewerten (Nutzen und Aufwand, Risiko und Wahrscheinlichkeit) | KIG, SYS | M |
| 100 Punkte verteilen | Mentimeter, Wooclap | **neu**: Prioritäten setzen, Tafel zeigt Balken | KIG, SYS | S |
| What? So what? Now what? | Liberating Structures | `folie` mit `aufdecken` ✓, oder drei Handy-Fragen nacheinander | alle | S |
| Exit-Ticket, Muddiest Point | | vorgemerkt (I3) | alle | M |

### Ohne Handys

| Methode | Vorbild | im Tafelsystem | Aufwand |
|---|---|---|---|
| Handzeichen zählen | | Regie ✓ | ✓ |
| Gedruckte Antwortkarten | Plickers: jede Person hält eine Karte hoch, die Drehung ist die Antwort, das Lehrkräfte-Handy scannt die Klasse | Webcam am Board-PC oder Laptop erkennt die Karten (frei verfügbare Markererkennung im Browser), Ergebnis wie eine Abstimmung. Gut, wenn Handys tabu sind | L |
| Schul-PC als Schülergerät | | Schüler-Seite läuft im Browser ✓ | ✓ |

### Energizer (1 bis 3 Minuten)

Vorschlag: ein Knopf **„Energizer“** in der Regie. Er schiebt einen kurzen Schritt ein (zählt nicht gegen den
Plan) und zeigt an der Tafel Anleitung und Countdown. Eine kleine Sammlung, passend für Erwachsene an der
Technikerschule:

| Energizer | Ablauf |
|---|---|
| Steh auf, wenn … | Fachaussage an der Tafel, wer zustimmt, steht auf. Gleich danach die Auflösung |
| Zählen bis 20 | die Klasse zählt reihum ohne Absprache, sprechen zwei gleichzeitig, beginnt sie von vorn |
| Wer bin ich? | Fachbegriff aus `BEGRIFFE.md` auf der Tafel, eine Person mit dem Rücken zur Tafel fragt mit Ja/Nein-Fragen |
| Schnick-Schnack-Schnuck-Turnier | Verlierer feuert den Sieger an, am Ende stehen zwei Fanblöcke |
| Strecken mit Countdown | 60 Sekunden Bewegung, Tafel zählt runter |
| Code-Golf | kürzestes Programm für eine Mini-Aufgabe, 3 Minuten |

Aufwand für Knopf und Sammlung: S.

### Verlinken statt nachbauen

Für Dinge, die woanders schon gut gehen, reicht ein QR-Code oder ein Link im `auftrag`:
ByCS Board, Drive und Kurzlinks (Bayern), TaskCards (Pinnwand), ZUMPad (gemeinsames Schreiben), LearningApps,
eigene H5P-Aufgaben (auch per `einbetten`).

### Nächste Kandidaten nach den vorgemerkten

1. **Think-Pair-Share als `phasen`** im Auftrag: klein, in jeder Stunde nutzbar.
2. **Energizer-Knopf** mit Sammlung.
3. **Tabu und Wer bin ich** aus `BEGRIFFE.md`: das Material gibt es in jedem Stundenordner schon.
4. **Wortwolke**.
5. **Lerntempoduett** und **Helfersystem**, sobald Fortschritt und Hilfe-Ampel (I7, I8) stehen.
6. **Fehlerzeile antippen** für GP und ET1.

## Quellen

- Peer Instruction, Aufgabendesign und 35 bis 70 %: [Bauer 2019, Design von Aufgaben für Peer Instruction](https://www.mathematik.uni-marburg.de/~tbauer/2019-Design-von-Aufgaben-fuer-Peer-Instruction.pdf), [Mazur, Peer Instruction](https://mazur.harvard.edu/presentations/peer-instruction-getting-students-think-class-2)
- PRIMM: [Raspberry Pi Foundation, Quick Read PRIMM](https://static.teachcomputing.org/pedagogy/QR11-PRIMM.pdf)
- Parsons-Aufgaben und Ablenkzeilen: [Distractors in Parsons problems decrease learning efficiency](https://profiles.wustl.edu/en/publications/distractors-in-parsons-problems-decrease-learning-efficiency-for-/)
- Live Coding: [An Empirical Evaluation of Active Live Coding in CS1](https://escholarship.org/uc/item/8bw089g3)
- Pair Programming, Rollen: [University of Edinburgh, Pair Programming](https://pairprogramming.ed.ac.uk/?p=488)
- Fragetypen als Vorbild: [Wooclap Fragetypen](https://www.wooclap.com/de/fragetyp/)
- Oncoo (Kartenabfrage, Placemat, Zielscheibe): [TUM Toolbox Oncoo](https://www.edu.sot.tum.de/fileadmin/w00bed/td/Toolbox/16_Oncoo.pdf)
- Classroomscreen (Timer, Lautstärke, Symbole, Zufall): [TUM Toolbox Classroomscreen](https://www.edu.sot.tum.de/fileadmin/w00bed/td/Toolbox/18_Classroomscreen.pdf)
- Anonyme Fragen: [frag.jetzt an der Universität Innsbruck](https://www.uibk.ac.at/en/ecampus/werkzeuge/frag)
- Mentimeter-Fragetypen: [UTS, Question types in Mentimeter](https://educationexpress.uts.edu.au/collections/engaging-your-audience-with-mentimeter-polls/resources/question-types-in-mentimeter/)
- Oncoo-Methoden: [Oncoo bei tutory](https://www.tutory.de/entdecken/dokument/oncoo.pdf?t=8327), Lerntempoduett: [Lehrerfortbildung BW, Methodenblatt](https://www.lehrerfortbildung-bw.de/st_if/bs/if/unterrichtsgestaltung/methodenblaetter/lerntempoduett.pdf)
- Liberating Structures: [Menü der Liberating Structures](https://www.ismanet.org/pdf/onesource/Liberating_Structures_Menu_Mosley.pdf)
- Präsenzmethoden digital (Fishbowl, Kugellager, Lawinendiskussion, World Café): [FernUni Hagen](https://www.fernuni-hagen.de/zli/blog/aktivierende-praesenzmethoden-ins-digitale-uebersetzt/)
- Gallery Walk: [LMU, Methodenmuster Gallery Walk](https://www.bne-box.lehrerbildung-at-lmu.mzl.lmu.de/wp-content/uploads/2023/12/Methodenmuster-Classroom-Gallery-Walk.pdf)
- Plickers: [outilstice, Plickers](https://outilstice.com/en/plickers-sondez-vos-apprenants-sans-ordinateur/)
- Kahoot und Gimkit: [Gimkit vs Kahoot](https://nibble-app.com/blog/gimkit-vs-kahoot)
- Bewegungspausen: [Betzold, Bewegungspause](https://www.betzold.de/blog/bewegungspause)
- ByCS-Dienste: [Kultusministerium Bayern, BayernCloud Schule](https://www.km.bayern.de/schule-digital/software-und-hardware-ausstattung/bycs.html)
