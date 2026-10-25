# Hinweise für Claude

- Sprache in Code-Kommentaren, Doku und Oberfläche: Deutsch.
- Konzept: `docs/konzept.md`. Anforderungen mit ID: `docs/anforderungen.md`. Bei Änderungen die ID
  im Commit nennen.
- Neue Steckbriefe nach `docs/steckbriefe/<Fach>.md` legen und in `docs/anforderungen.md` einarbeiten
  (vorhandene Zeilen ergänzen, nicht doppeln).
- Nie ins Repository: Stunden-Dateien mit Notizen oder Lösungen, Namenslisten, Lehrer-Schlüssel.
- Die Anwendung muss als Offline-Einzeldatei laufen (Chromium, `file://`). Keine Abhängigkeit, die
  das verhindert.
- Jeder Baustein bekommt einen Browser-Test unter `tests/`.
- Stunden (`Tafel.yaml`, `Tafel.html`) bauen die Fach-Chats selbst nach `docs/stand.md` Teil 6. Hier wird das
  Werkzeug gebaut; neue Felder immer in `docs/stand.md` Teil 2 und Teil 4 beschreiben.
- Ablage: `Tafel.html` in den Stundenordner lokal **und** in den Teams-Ordner des Fachs. Die Startdateien aus
  `start/` (`Tafel starten.bat`, `tafel_server.ps1`, `Tafel_Anleitung.txt`) **immer** in den Fachordner und in die
  Wurzel des Teams-Ordners, bei jeder neuen Fassung an beide Orte. Danach an beiden Orten prüfen.
