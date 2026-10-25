@echo off
rem Tafel starten: lokaler Server fuer die Tafel-Dateien dieses Ordners, dann Edge mit der Stundenauswahl.
rem Das kleine Fenster offen lassen. Schliessen beendet den Server.
start "Tafel-Server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tafel_server.ps1"
