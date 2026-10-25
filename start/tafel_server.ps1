# Tafel-Server: zeigt die Tafel-Dateien dieses Fachordners unter http://localhost:8765
#
# Warum: Edge und Chrome erlauben "Fensterverwaltung" (Board auf den Tafel-Monitor, Vollbild)
# nur für richtige Adressen, nicht für Dateien (file://). Über localhost merkt sich der Browser
# die Erlaubnis dauerhaft. Alles bleibt auf diesem Rechner, nur 127.0.0.1, nichts geht ins Netz.
#
# Start: Doppelklick auf "Tafel starten.bat" im selben Ordner. Das kleine Fenster offen lassen,
# Schließen beendet den Server. Läuft er schon, öffnet ein zweiter Start nur den Browser.
# Läuft mit Windows PowerShell 5.1 und PowerShell 7.

param([int]$Port = 8765, [switch]$OhneBrowser)

$ErrorActionPreference = 'Stop'
$Wurzel = Split-Path -Parent $MyInvocation.MyCommand.Path
$Adresse = "http://localhost:$Port/"

function Browser-Oeffnen {
  if ($OhneBrowser) { return }
  try { Start-Process "msedge" $Adresse; return } catch { }
  try { Start-Process "microsoft-edge:$Adresse"; return } catch { }
  Start-Process $Adresse
}

# Läuft schon ein Server? Dann nur den Browser öffnen.
try {
  $probe = New-Object System.Net.Sockets.TcpClient
  $probe.Connect('127.0.0.1', $Port)
  $probe.Close()
  Browser-Oeffnen
  exit
} catch { }

$Typen = @{
  '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.md' = 'text/plain; charset=utf-8'
  '.txt' = 'text/plain; charset=utf-8'; '.yaml' = 'text/plain; charset=utf-8'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.gif' = 'image/gif'
  '.svg' = 'image/svg+xml'; '.webp' = 'image/webp'; '.pdf' = 'application/pdf'
}

function Html-Text([string]$t) { return [System.Net.WebUtility]::HtmlEncode($t) }

# Startseite: alle Stunden mit Tafel.html, neueste oben, die nächste Stunde hervorgehoben
function Startseite {
  $heute = (Get-Date).ToString('yyyy-MM-dd')
  $dateien = Get-ChildItem -Path $Wurzel -Recurse -Filter 'Tafel.html' -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\(_to_delete|_alt|_Archiv)\\' -and $_.FullName -notmatch '/(_to_delete|_alt|_Archiv)/' } |
    Sort-Object { $_.Directory.Name } -Descending
  $naechste = $dateien | Where-Object { $_.Directory.Name -match '^\d+_(\d{4}-\d{2}-\d{2})' -and $Matches[1] -ge $heute } | Select-Object -Last 1
  $zeilen = foreach ($d in $dateien) {
    $rel = $d.FullName.Substring($Wurzel.Length).TrimStart('\', '/') -replace '\\', '/'
    $teile = $rel.Split('/') | ForEach-Object { [Uri]::EscapeDataString($_) }
    $href = '/' + ($teile -join '/')
    $name = $d.Directory.Name
    $klasse = if ($naechste -and $d.FullName -eq $naechste.FullName) { ' class="naechste"' } else { '' }
    "<li$klasse><a href=""$href"">$(Html-Text $name)</a><span>$($d.LastWriteTime.ToString('dd.MM. HH:mm'))</span></li>"
  }
  if (-not $zeilen) { $zeilen = '<li>Keine Tafel.html in diesem Ordner gefunden.</li>' }
  $titel = Html-Text (Split-Path -Leaf $Wurzel)
  return @"
<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tafel · $titel</title><style>
body{margin:0;font-family:"Segoe UI",system-ui,sans-serif;background:#f4f3ef;color:#1d1d1f}
main{max-width:760px;margin:0 auto;padding:24px 16px}
h1{margin:0 0 4px;border-bottom:4px solid #e8730c;padding-bottom:6px;display:inline-block}
p{color:#6b6b70}ul{list-style:none;padding:0}
li{background:#fff;border:1px solid #dcd9d2;border-radius:10px;margin:8px 0;display:flex;justify-content:space-between;align-items:center}
li a{flex:1;padding:14px 16px;color:#1d1d1f;text-decoration:none;font-weight:600}
li span{color:#6b6b70;font-size:13px;padding-right:16px}
li.naechste{border:2px solid #e8730c;background:#fdf0e4}
li.naechste a::after{content:"  · nächste Stunde";color:#e8730c;font-weight:400}
</style></head><body><main><h1>$titel</h1>
<p>Stunde wählen. Der Server läuft, solange das kleine PowerShell-Fenster offen ist.</p>
<ul>$($zeilen -join "`n")</ul></main></body></html>
"@
}

function Antwort($stream, [int]$code, [string]$text, [string]$typ, [long]$laenge) {
  $kopf = "HTTP/1.1 $code $text`r`nContent-Type: $typ`r`nContent-Length: $laenge`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n"
  $b = [System.Text.Encoding]::ASCII.GetBytes($kopf)
  $stream.Write($b, 0, $b.Length)
}
function Text-Antwort($stream, [int]$code, [string]$status, [string]$html, [bool]$mitInhalt) {
  $b = [System.Text.Encoding]::UTF8.GetBytes($html)
  Antwort $stream $code $status 'text/html; charset=utf-8' $b.Length
  if ($mitInhalt) { $stream.Write($b, 0, $b.Length) }
}

$Listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
$Listener.Start()
$host.UI.RawUI.WindowTitle = "Tafel-Server $Adresse"
Write-Host "Tafel-Server läuft: $Adresse"
Write-Host "Ordner: $Wurzel"
Write-Host "Dieses Fenster offen lassen. Schließen beendet den Server."
Browser-Oeffnen

while ($true) {
  $client = $Listener.AcceptTcpClient()
  try {
    $client.ReceiveTimeout = 1500
    $client.SendTimeout = 15000
    $stream = $client.GetStream()
    $leser = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
    $zeile = $leser.ReadLine()
    if (-not $zeile) { continue }
    while ($true) { $h = $leser.ReadLine(); if ($h -eq $null -or $h -eq '') { break } }
    $teile = $zeile.Split(' ')
    $methode = $teile[0]
    $mitInhalt = ($methode -ne 'HEAD')
    if ($methode -ne 'GET' -and $methode -ne 'HEAD') { Text-Antwort $stream 405 'Method Not Allowed' 'nur GET' $mitInhalt; continue }
    $pfad = [Uri]::UnescapeDataString(($teile[1] -split '\?')[0])
    if ($pfad -eq '/' -or $pfad -eq '') { Text-Antwort $stream 200 'OK' (Startseite) $mitInhalt; continue }
    $voll = [System.IO.Path]::GetFullPath((Join-Path $Wurzel ($pfad.TrimStart('/'))))
    if (Test-Path -LiteralPath $voll -PathType Container) { $voll = Join-Path $voll 'Tafel.html' }
    $innen = $voll.StartsWith($Wurzel, [System.StringComparison]::OrdinalIgnoreCase)
    if (-not $innen -or -not (Test-Path -LiteralPath $voll -PathType Leaf)) { Text-Antwort $stream 404 'Not Found' 'nicht gefunden' $mitInhalt; continue }
    $endung = [System.IO.Path]::GetExtension($voll).ToLower()
    $typ = $Typen[$endung]
    if (-not $typ) { $typ = 'application/octet-stream' }
    $datei = [System.IO.File]::OpenRead($voll)
    try {
      Antwort $stream 200 'OK' $typ $datei.Length
      if ($mitInhalt) { $datei.CopyTo($stream) }
    } finally { $datei.Close() }
  } catch {
    # abgebrochene Verbindung, Vorab-Verbindung des Browsers ohne Anfrage: ignorieren
  } finally {
    $client.Close()
  }
}
