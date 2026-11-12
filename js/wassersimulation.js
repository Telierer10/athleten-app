// =====================================================================
// wassersimulation.js – echte Wasserwellen auf einem <canvas>.
//
// SO FUNKTIONIERT ES (Prinzip aus der Spiele-Programmierung):
// Der Bildschirm wird in ein Raster aus kleinen Feldern geteilt. Jedes Feld hat
// eine "Höhe" (wie hoch das Wasser dort gerade ist). In jedem Bild (60× pro Sekunde)
// schaut jedes Feld auf seine 4 Nachbarn und bewegt sich in deren Richtung.
// Dadurch wandert eine Störung (dein Finger) als Welle nach außen – genau wie echtes Wasser.
//
// Zum Zeichnen: Wo das Wasser schräg ist (Wellenflanke), wird es heller oder dunkler.
// Das sieht dann aus wie Licht, das sich auf Wellen spiegelt.
// =====================================================================

function starteWasserSimulation(canvas) {
  const SKALA = 3;          // 1 Rasterfeld = 3×3 Bildschirmpunkte (spart Rechenleistung)
  const DAEMPFUNG = 0.975;  // wie schnell Wellen auslaufen (1 = nie, 0.9 = sehr schnell)
  const LICHT = 3;          // wie stark Wellen glänzen

  const ctx = canvas.getContext("2d");
  let breite, hoehe, jetzt, vorher, bild;
  let pegel = 0;            // aktuelle Wasserhöhe in Prozent (0–100), gleitet zum Ziel
  let zielPegel = 0;
  let laeuft = true;
  let letzterTropfen = 0;

  // Farben: oben dunkle Tiefe, unten (dein getrunkenes Wasser) leuchtendes Blau.
  // Jeweils [Rot, Grün, Blau] für oben und unten im Bereich – dazwischen wird gemischt.
  const TIEFE = [[43, 42, 143], [9, 7, 38]];
  const WASSER = [[75, 85, 255], [28, 19, 168]];

  function groesseAnpassen() {
    breite = Math.max(1, Math.ceil(canvas.clientWidth / SKALA));
    hoehe = Math.max(1, Math.ceil(canvas.clientHeight / SKALA));
    canvas.width = breite;
    canvas.height = hoehe;
    jetzt = new Float32Array(breite * hoehe);    // Höhen in diesem Bild
    vorher = new Float32Array(breite * hoehe);   // Höhen im letzten Bild
    bild = ctx.createImageData(breite, hoehe);
  }

  // Einen "Tropfen" an Bildschirm-Position x/y fallen lassen
  function tropfen(x, y, radius, staerke) {
    const rect = canvas.getBoundingClientRect();
    const cx = Math.floor((x - rect.left) / SKALA);
    const cy = Math.floor((y - rect.top) / SKALA);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = cx + dx, py = cy + dy;
        if (px < 1 || py < 1 || px >= breite - 1 || py >= hoehe - 1) continue;
        const abstand = Math.sqrt(dx * dx + dy * dy);
        if (abstand > radius) continue;
        // in der Mitte am stärksten, zum Rand hin weich auslaufend
        vorher[py * breite + px] += staerke * Math.cos((abstand / radius) * Math.PI / 2);
      }
    }
  }

  function farbeZwischen(a, b, anteil) {
    return [
      a[0] + (b[0] - a[0]) * anteil,
      a[1] + (b[1] - a[1]) * anteil,
      a[2] + (b[2] - a[2]) * anteil,
    ];
  }

  function bildBerechnen() {
    // 1) Wellen-Physik: neue Höhe = Durchschnitt der Nachbarn × 2 − alte Höhe
    for (let y = 1; y < hoehe - 1; y++) {
      for (let x = 1; x < breite - 1; x++) {
        const i = y * breite + x;
        const neu = (jetzt[i - 1] + jetzt[i + 1] + jetzt[i - breite] + jetzt[i + breite]) / 2 - vorher[i];
        vorher[i] = neu * DAEMPFUNG;
      }
    }
    [jetzt, vorher] = [vorher, jetzt]; // Puffer tauschen: "neu" wird zu "jetzt"

    // 2) Pegel gleitet sanft zum Ziel (sieht aus wie einlaufendes Wasser)
    pegel += (zielPegel - pegel) * 0.05;
    const pegelZeile = hoehe * (1 - pegel / 100);

    // 3) Zeichnen: Grundfarbe je Zeile + Lichtreflex je nach Wellen-Schräge
    const pixel = bild.data;
    for (let y = 0; y < hoehe; y++) {
      const imWasser = y >= pegelZeile;
      const anteil = imWasser
        ? (y - pegelZeile) / Math.max(1, hoehe - pegelZeile)
        : y / Math.max(1, pegelZeile);
      const grund = imWasser
        ? farbeZwischen(WASSER[0], WASSER[1], anteil)
        : farbeZwischen(TIEFE[0], TIEFE[1], anteil);

      for (let x = 0; x < breite; x++) {
        const i = y * breite + x;
        let licht = 0;
        if (x > 0 && x < breite - 1 && y > 0 && y < hoehe - 1) {
          // Schräge der Welle: Unterschied zwischen links/rechts und oben/unten
          licht = ((jetzt[i - 1] - jetzt[i + 1]) + (jetzt[i - breite] - jetzt[i + breite])) * LICHT;
        }
        const p = i * 4;
        pixel[p] = grund[0] + licht;          // Werte über 255 schneidet der Browser automatisch ab
        pixel[p + 1] = grund[1] + licht;
        pixel[p + 2] = grund[2] + licht * 0.6 + Math.abs(licht) * 0.4;
        pixel[p + 3] = 255;
      }
    }
    ctx.putImageData(bild, 0, 0);
    return pegelZeile * SKALA; // Pegel in Bildschirmpunkten (für die Wellen-Linie oben)
  }

  // ---------- Steuerung von außen ----------
  const steuerung = {
    // Wohin soll der Wasserstand? (0–100 %)
    setzePegel(prozent) { zielPegel = prozent; },
    // Finger/Maus bewegt sich → kleine Wellen
    streichen(x, y) { tropfen(x, y, 3, 18); },
    // Antippen → großer Tropfen
    tippen(x, y) { tropfen(x, y, 6, 70); },
    // Animation stoppen (beim Schließen)
    stoppen() { laeuft = false; window.removeEventListener("resize", groesseAnpassen); },
    // Wird bei jedem Bild mit der Pegel-Höhe aufgerufen (für Wellen-SVG + Blasen)
    beiPegel: null,
  };

  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function schleife(zeit) {
    if (!laeuft) return;
    // Ab und zu ein zufälliger kleiner Tropfen, damit das Wasser "lebt"
    if (!ruhig && zeit - letzterTropfen > 900) {
      letzterTropfen = zeit;
      const rect = canvas.getBoundingClientRect();
      tropfen(rect.left + Math.random() * rect.width, rect.top + rect.height * (0.3 + Math.random() * 0.7), 2, 8);
    }
    const pegelPx = bildBerechnen();
    if (steuerung.beiPegel) steuerung.beiPegel(pegelPx);
    requestAnimationFrame(schleife);
  }

  groesseAnpassen();
  window.addEventListener("resize", groesseAnpassen);
  requestAnimationFrame(schleife);
  return steuerung;
}
