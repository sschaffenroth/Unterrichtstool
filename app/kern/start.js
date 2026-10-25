/* Start: Rolle aus der Adresse lesen.
   …/Tafel.html            → Regie (Laptop)
   …/Tafel.html#anzeige=X  → Anzeige X (Board, Beamer …), Regie hinter ☰ */
"use strict";

(function start() {
  const m = /anzeige=([^&]+)/.exec(location.hash);
  if (m) {
    const name = decodeURIComponent(m[1]);
    anzeigeStarten(name);
    if (window.opener) {
      partnerVerbinden(window.opener);
      // erster Tipp aufs Board schaltet Vollbild ein (Browser verlangt eine Berührung)
      addEventListener("pointerdown", () => { if (!document.fullscreenElement) vollbild(); }, { once: true });
    }
  } else {
    regieStarten();
  }
})();
