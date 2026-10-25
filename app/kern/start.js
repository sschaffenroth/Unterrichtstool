/* Start: Rolle aus der Adresse lesen.
   …/Tafel.html            → Regie (Laptop)
   …/Tafel.html#anzeige=X  → Anzeige X (Board, Beamer …), Regie hinter ☰ */
"use strict";

(function start() {
  const m = /anzeige=([^&]+)/.exec(location.hash);
  if (m) {
    const name = decodeURIComponent(m[1]);
    const a = /ansicht=([a-z]+)/.exec(location.hash);
    START_NAME = name;
    START_ANSICHT = a ? a[1] : null;
    anzeigeStarten(name);
    anzeigeFensterMelden(name);
    if (!window.opener) abholenStarten();   // Board läuft allein: es spricht selbst mit dem Server
    if (window.opener) {
      partnerVerbinden(window.opener, name);
      // erster Tipp aufs Board schaltet Vollbild ein (Browser verlangt eine Berührung)
      addEventListener("pointerdown", () => { if (!document.fullscreenElement) vollbild(); }, { once: true });
    }
  } else {
    regieStarten();
    abholenStarten();
    bildschirmeLaden(false);
  }
})();
