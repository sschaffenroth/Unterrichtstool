/* Start: Rolle aus der Adresse lesen.
   …/Tafel.html              → Regie (Hauptfenster). „Fenster öffnen“ macht es zum Board im Vollbild
                               und öffnet die Regie als eigenes Fenster (#regie).
   …/Tafel.html#regie        → Regie neben dem Vollbild-Board
   …/Tafel.html#anzeige=X    → Anzeige X als eigenes Fenster, Regie hinter ☰ */
"use strict";

(function start() {
  tastenEinrichten();
  const m = /anzeige=([^&]+)/.exec(location.hash);
  if (m) {
    const name = decodeURIComponent(m[1]);
    const a = /ansicht=([a-z]+)/.exec(location.hash);
    START_NAME = name;
    START_ANSICHT = a ? a[1] : null;
    anzeigeStarten(name);
    anzeigeFensterMelden(name);
    bildschirmeLaden(false);
    if (!window.opener) abholenStarten();   // Board läuft allein: es spricht selbst mit dem Server
    if (window.opener) {
      partnerVerbinden(window.opener, name);
      // erster Tipp schaltet Vollbild ein (der Browser verlangt eine Berührung)
      addEventListener("pointerdown", () => { if (!document.fullscreenElement) vollbild(); }, { once: true });
    }
  } else if (/^#regie/.test(location.hash) && window.opener) {
    regieStarten("popup");
    partnerVerbinden(window.opener);
    abholenStarten();
    bildschirmeLaden(false);
    regieLageMerken();
  } else {
    if (location.hash) history.replaceState(null, "", location.pathname);
    regieStarten("fenster");
    abholenStarten();
    bildschirmeLaden(false);
  }
})();
