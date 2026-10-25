/* Baustein zeichnen: Freihand-Stift über einem Hintergrund (Bild oder Zahlenraster).
   Striche liegen im Zustand (Koordinaten 0..1), damit Regie-Vorschau und Board dasselbe zeigen.
   Rückgängig, Löschen, Sichern als PNG. */
"use strict";

const STIFTFARBEN = ["#1d1d1f", "#2b5cab", "#c23b22", "#2f8f4e"];
let stiftfarbe = STIFTFARBEN[0];

BAUSTEINE.zeichnen = (b, ctx) => {
  const schluessel = ctx.schluessel;
  const canvas = el("canvas");
  const wurzel = el("div", { class: "baustein b-zeichnen" }, canvas);
  let hintergrundBild = null;
  if (b.hintergrund && b.hintergrund.bild_id) {
    hintergrundBild = new Image();
    hintergrundBild.onload = () => malen();
    hintergrundBild.src = BILDER[b.hintergrund.bild_id];
  }
  const raster = b.hintergrund && b.hintergrund.raster ? normaleRaster(b.hintergrund) : [];

  function malen(laufend) {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#fff"; g.fillRect(0, 0, r.width, r.height);
    if (hintergrundBild && hintergrundBild.complete) {
      const s = Math.min(r.width / hintergrundBild.width, r.height / hintergrundBild.height);
      const w = hintergrundBild.width * s, h = hintergrundBild.height * s;
      g.drawImage(hintergrundBild, (r.width - w) / 2, (r.height - h) / 2, w, h);
    }
    rasterMalen(g, r.width, r.height, raster);
    const alle = (Z.striche[schluessel] || []).concat(laufend ? [laufend] : []);
    for (const st of alle) {
      g.strokeStyle = st.f; g.lineWidth = st.d * r.width; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath();
      st.p.forEach(([x, y], i) => (i ? g.lineTo(x * r.width, y * r.height) : g.moveTo(x * r.width, y * r.height)));
      if (st.p.length === 1) g.lineTo(st.p[0][0] * r.width + 0.1, st.p[0][1] * r.height);
      g.stroke();
    }
  }

  if (ctx.rolle !== "vorschau") {
    let strich = null;
    const punkt = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height].map((v) => Math.round(v * 10000) / 10000); };
    canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); strich = { f: stiftfarbe, d: 0.004, p: [punkt(e)] }; malen(strich); });
    canvas.addEventListener("pointermove", (e) => { if (!strich) return; strich.p.push(punkt(e)); malen(strich); });
    const ende = () => { if (!strich) return; const s = strich; strich = null; tun("strich", { schluessel, strich: s }); };
    canvas.addEventListener("pointerup", ende);
    canvas.addEventListener("pointercancel", ende);

    wurzel.append(el("div", { class: "zeichen-werkzeug" },
      STIFTFARBEN.map((f) => el("button", { class: "farbe" + (f === stiftfarbe ? " aktiv" : ""), title: "Stiftfarbe", onclick: (e) => {
        stiftfarbe = f;
        for (const k of wurzel.querySelectorAll(".farbe")) k.classList.remove("aktiv");
        e.currentTarget.classList.add("aktiv");
      } }, el("span", { style: "background:" + f }))),
      el("button", { title: "Rückgängig", onclick: () => tun("strichZurueck", { schluessel }) }, "↶"),
      el("button", { title: "Alles löschen", onclick: () => tun("striche_loeschen", { schluessel }) }, "Löschen"),
      el("button", { title: "Als PNG sichern", onclick: () => {
        malen();
        const name = "Sicherung_" + datumHeute() + "_" + String(b.titel || ctx.schritt.titel).replace(/[^\wäöüÄÖÜß-]+/g, "_") + ".png";
        herunterladen(name, canvas.toDataURL("image/png"));
      } }, "PNG")));
  }

  new ResizeObserver(() => malen()).observe(canvas);
  requestAnimationFrame(() => malen());
  return wurzel;
};

function normaleRaster(h) {
  // ein Raster oder eine Liste von Rastern: {raster, titel}
  if (Array.isArray(h.raster) && h.raster.length && Array.isArray(h.raster[0]) && !Array.isArray(h.raster[0][0])) return [{ werte: h.raster, titel: h.titel }];
  return (h.raster || []).map((r) => (Array.isArray(r) ? { werte: r } : { werte: r.raster || r.werte, titel: r.titel }));
}

function rasterMalen(g, breite, hoehe, raster) {
  if (!raster.length) return;
  const zelle = Math.min(breite * 0.07, hoehe * 0.11);
  const abstand = zelle * 1.5;
  const gesamt = raster.reduce((s, r) => s + r.werte[0].length * zelle, 0) + abstand * (raster.length - 1);
  let x = (breite - gesamt) / 2;
  const y = hoehe * 0.16;
  for (const r of raster) {
    const spalten = r.werte[0].length;
    if (r.titel) {
      g.fillStyle = "#1d1d1f"; g.font = `600 ${zelle * 0.42}px "Segoe UI", system-ui, sans-serif`; g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(r.titel, x, y - zelle * 0.35);
    }
    r.werte.forEach((zeile, i) => zeile.forEach((v, j) => {
      g.fillStyle = "#fdf0e4"; g.fillRect(x + j * zelle, y + i * zelle, zelle, zelle);
      g.strokeStyle = "#e8730c"; g.lineWidth = 2; g.strokeRect(x + j * zelle, y + i * zelle, zelle, zelle);
      g.fillStyle = "#1d1d1f"; g.font = `600 ${zelle * 0.45}px Consolas, Menlo, monospace`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(v).replace("-", "−"), x + (j + 0.5) * zelle, y + (i + 0.5) * zelle);
    }));
    x += spalten * zelle + abstand;
  }
}
