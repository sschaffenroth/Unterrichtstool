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

## 5. Vorschlag für die Reihenfolge

1. **Fortschritt melden** und **Hilfe-Ampel**: helfen in jeder Praxisphase, liefern Zahlen für Befund und Notausstieg.
2. **Peer Instruction** mit **Sicherheit**: kleine Erweiterung von `abstimmung`/`vorhersage`, große Wirkung.
3. **Exit-Ticket mit Muddiest Point**.
4. **Codezeilen ordnen** am Handy, zusammen mit `codestreifen` an der Tafel.
5. **Hotspot** auf Bildern, zuerst für SYS.
6. **SQL live** für DB.

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
- ByCS-Dienste: [Kultusministerium Bayern, BayernCloud Schule](https://www.km.bayern.de/schule-digital/software-und-hardware-ausstattung/bycs.html)
