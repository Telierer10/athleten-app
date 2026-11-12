// =====================================================================
// schmerz.js – der Schmerz-Check im Tab "Körper".
// Ein Körper (vorne + hinten) als SVG-Grafik. Körperteil antippen,
// Stufe 1–5 und Datum wählen, speichern.
// Jeder Eintrag: { id, teil: "vorne-knie-r", stufe: 3, datum: "2026-11-12" }
// =====================================================================

// Wie lange ein Schmerz auf dem Körper farbig angezeigt wird (danach gilt er als "vorbei")
const SCHMERZ_TAGE = 14;

const SCHMERZ_STUFEN = ["leicht", "spürbar", "deutlich", "stark", "sehr stark"];
const SCHMERZ_FARBEN = ["#ffd60a", "#ffb020", "#ff8a1f", "#ff5a2e", "#ff2d55"];

// ---------- Die Körper-Grafik ----------
// Jede Form gibt es einmal. Formen mit "paar: true" gibt es links UND rechts –
// die rechte Hälfte wird einfach gespiegelt (x → 200 - x).
// e = Ellipse [Mitte x, Mitte y, Radius x, Radius y]   r = Rechteck [x, y, Breite, Höhe]
const KOERPER_FORMEN = [
  { k: "kopf",          e: [100, 34, 21, 25] },
  { k: "hals",          r: [90, 58, 20, 15] },
  { k: "rumpf-oben",    r: [70, 75, 60, 51], rund: 14 },
  { k: "rumpf-unten",   r: [74, 128, 52, 42], rund: 10 },
  { k: "becken",        r: [72, 172, 56, 30], rund: 12 },
  { k: "schulter",      e: [58, 85, 14, 12], paar: true },
  { k: "oberarm",       r: [42, 99, 18, 44], paar: true },
  { k: "ellenbogen",    e: [51, 152, 10, 9], paar: true },
  { k: "unterarm",      r: [40, 163, 17, 40], paar: true },
  { k: "hand",          e: [48, 215, 10, 13], paar: true },
  { k: "oberschenkel",  r: [73, 204, 25, 68], paar: true },
  { k: "knie",          e: [86, 286, 13, 13], paar: true },
  { k: "unterschenkel", r: [77, 301, 18, 64], paar: true },
  { k: "sprunggelenk",  e: [86, 375, 11, 9], paar: true },
  { k: "fuss",          e: [86, 396, 15, 8], paar: true },
];

// Die gleiche Form heißt vorne und hinten anders (z. B. Knie ↔ Kniekehle).
// Fehlt dir ein Name oder passt einer nicht? Hier ändern!
const KOERPER_NAMEN = {
  vorne: {
    "kopf": "Kopf", "hals": "Hals", "rumpf-oben": "Brust", "rumpf-unten": "Bauch",
    "becken": "Hüfte / Leiste", "schulter": "Schulter", "oberarm": "Oberarm",
    "ellenbogen": "Ellenbogen", "unterarm": "Unterarm", "hand": "Hand / Handgelenk",
    "oberschenkel": "Oberschenkel", "knie": "Knie", "unterschenkel": "Schienbein",
    "sprunggelenk": "Sprunggelenk", "fuss": "Fuß",
  },
  hinten: {
    "kopf": "Hinterkopf", "hals": "Nacken", "rumpf-oben": "Oberer Rücken",
    "rumpf-unten": "Unterer Rücken", "becken": "Gesäß", "schulter": "Schulter hinten",
    "oberarm": "Trizeps", "ellenbogen": "Ellenbogen", "unterarm": "Unterarm",
    "hand": "Handgelenk", "oberschenkel": "Oberschenkel hinten", "knie": "Kniekehle",
    "unterschenkel": "Wade", "sprunggelenk": "Achillessehne", "fuss": "Ferse",
  },
};

// Was gerade ausgewählt ist (bleibt erhalten, wenn die Ansicht neu gezeichnet wird)
let schmerzSeite = "vorne";   // "vorne" oder "hinten"
let schmerzTeil = null;       // z. B. "vorne-knie-r"

// ---------- Daten ----------

function ladeSchmerzen() {
  return Speicher.laden("schmerzen", []);
}

// Aus "vorne-knie-r" wird "Knie rechts"
function teilName(teil) {
  const [seite, ...rest] = teil.split("-");
  let k = rest.join("-");
  let lr = "";
  if (k.endsWith("-r")) { lr = " rechts"; k = k.slice(0, -2); }
  if (k.endsWith("-l")) { lr = " links"; k = k.slice(0, -2); }
  return KOERPER_NAMEN[seite][k] + lr;
}

// Der neueste Eintrag pro Körperteil aus den letzten 14 Tagen → { "vorne-knie-r": eintrag, ... }
function aktuelleSchmerzen() {
  const aktuell = {};
  ladeSchmerzen()
    .filter((s) => -tageBis(s.datum) < SCHMERZ_TAGE && tageBis(s.datum) <= 0)
    .sort((a, b) => a.datum.localeCompare(b.datum))  // alt → neu, der neueste gewinnt
    .forEach((s) => { aktuell[s.teil] = s; });
  return aktuell;
}

// ---------- Zeichnen ----------

// Eine Form als SVG-Element. spiegeln = die rechte Hälfte der Grafik
function formSvg(form, spiegeln) {
  if (form.e) {
    const [cx, cy, rx, ry] = form.e;
    return `<ellipse cx="${spiegeln ? 200 - cx : cx}" cy="${cy}" rx="${rx}" ry="${ry}"`;
  }
  const [x, y, b, h] = form.r;
  const rund = form.rund ?? Math.min(b, h) / 2;   // ohne Angabe: Kapsel-Form
  return `<rect x="${spiegeln ? 200 - x - b : x}" y="${y}" width="${b}" height="${h}" rx="${rund}"`;
}

function koerperSvg(seite, aktuell) {
  const teile = [];
  KOERPER_FORMEN.forEach((form) => {
    if (!form.paar) {
      teile.push({ id: `${seite}-${form.k}`, html: formSvg(form, false) });
      return;
    }
    // Von VORNE siehst du die rechte Körperseite links im Bild – von HINTEN ist es umgekehrt.
    const linksImBild = seite === "vorne" ? "r" : "l";
    const rechtsImBild = seite === "vorne" ? "l" : "r";
    teile.push({ id: `${seite}-${form.k}-${linksImBild}`, html: formSvg(form, false) });
    teile.push({ id: `${seite}-${form.k}-${rechtsImBild}`, html: formSvg(form, true) });
  });

  const formen = teile.map((t) => {
    const s = aktuell[t.id];
    const farbe = s ? `style="fill:${SCHMERZ_FARBEN[s.stufe - 1]}"` : "";
    const klasse = `koerperteil${t.id === schmerzTeil ? " gewaehlt" : ""}${s ? " schmerzt" : ""}`;
    return `${t.html} class="${klasse}" ${farbe} data-teil="${t.id}"><title>${teilName(t.id)}</title></${t.html.startsWith("<rect") ? "rect" : "ellipse"}>`;
  }).join("");

  // Kleine Hilfe: R und L, damit man weiß, welche Seite welche ist
  const links = seite === "vorne" ? "R" : "L";
  const rechts = seite === "vorne" ? "L" : "R";
  return `
    <svg class="koerper" viewBox="0 0 200 410" role="img" aria-label="Körper von ${seite}">
      <text x="14" y="24" class="koerper-seite">${links}</text>
      <text x="186" y="24" class="koerper-seite" text-anchor="end">${rechts}</text>
      ${formen}
    </svg>`;
}

function schmerzKarteHtml() {
  const aktuell = aktuelleSchmerzen();
  const alle = ladeSchmerzen().sort((a, b) => b.datum.localeCompare(a.datum));

  // Formular nur, wenn ein Körperteil angetippt wurde
  let formular = `<p class="leer koerper-hinweis">👆 Tippe auf die Stelle, die wehtut.</p>`;
  if (schmerzTeil) {
    const verlauf = alle.filter((s) => s.teil === schmerzTeil).slice(0, 5);
    formular = `
      <form class="formular schmerz-form" id="schmerz-form">
        <div class="schmerz-titel">
          <strong>${teilName(schmerzTeil)}</strong>
          <button type="button" class="loeschen" id="schmerz-abbrechen" aria-label="Auswahl aufheben">✕</button>
        </div>
        <p class="frage">Wie stark tut es weh?</p>
        <div class="skala schmerz-skala">${SCHMERZ_STUFEN.map((name, i) => `
          <input type="radio" name="stufe" value="${i + 1}" id="stufe-${i + 1}" required>
          <label for="stufe-${i + 1}" style="--stufe:${SCHMERZ_FARBEN[i]}"><b>${i + 1}</b><small>${name}</small></label>`).join("")}
        </div>
        <label class="feld-label">Datum <input type="date" name="datum" value="${heuteText()}" max="${heuteText()}" required></label>
        <button class="knopf" type="submit">Speichern</button>
        ${verlauf.length ? `
          <p class="frage">Bisher</p>
          <ul class="liste schmerz-verlauf">${verlauf.map(eintragHtml).join("")}</ul>` : ""}
      </form>`;
  }

  // Liste aller aktuellen Schmerzen (letzte 14 Tage)
  const aktuelleListe = Object.values(aktuell).sort((a, b) => b.stufe - a.stufe);

  return `
    <h3 class="gruppe">Schmerz-Check</h3>
    <div class="karte schmerz-karte">
      <div class="segment segment-2">
        <input type="radio" name="koerper-seite" id="ks-vorne" value="vorne" ${schmerzSeite === "vorne" ? "checked" : ""}>
        <label for="ks-vorne">Vorne</label>
        <input type="radio" name="koerper-seite" id="ks-hinten" value="hinten" ${schmerzSeite === "hinten" ? "checked" : ""}>
        <label for="ks-hinten">Hinten</label>
      </div>
      ${koerperSvg(schmerzSeite, aktuell)}
      ${formular}
      ${aktuelleListe.length && !schmerzTeil ? `
        <p class="frage">Aktuell (letzte ${SCHMERZ_TAGE} Tage)</p>
        <ul class="liste schmerz-verlauf">${aktuelleListe.map((s) => eintragHtml(s, true)).join("")}</ul>` : ""}
    </div>`;
}

// Eine Zeile: farbiger Punkt, Stufe, Datum, Löschen
function eintragHtml(s, mitName) {
  return `
    <li class="zeile schmerz-zeile">
      <span class="schmerz-punkt" style="background:${SCHMERZ_FARBEN[s.stufe - 1]}">${s.stufe}</span>
      <div class="zeile-text">
        <strong>${mitName ? teilName(s.teil) : SCHMERZ_STUFEN[s.stufe - 1]}</strong>
        <span>${mitName ? SCHMERZ_STUFEN[s.stufe - 1] + " · " : ""}${kurzesDatum(s.datum)}</span>
      </div>
      <button type="button" class="loeschen" data-schmerz-loeschen="${s.id}" aria-label="Löschen">✕</button>
    </li>`;
}

// ---------- Klicks verbinden ----------

function verbindeSchmerz(bereich) {
  const box = bereich.querySelector("#schmerz-bereich");
  if (!box) return;

  // Nur den Schmerz-Bereich neu zeichnen (nicht die ganze Seite → kein Springen)
  const neuZeichnen = () => {
    box.innerHTML = schmerzKarteHtml();
    verbindeSchmerz(bereich);
  };

  box.querySelectorAll('input[name="koerper-seite"]').forEach((knopf) => {
    knopf.addEventListener("change", () => {
      schmerzSeite = knopf.value;
      schmerzTeil = null;
      neuZeichnen();
    });
  });

  box.querySelectorAll(".koerperteil").forEach((teil) => {
    teil.addEventListener("click", () => {
      // Nochmal auf das gleiche Teil tippen = Auswahl aufheben
      schmerzTeil = schmerzTeil === teil.dataset.teil ? null : teil.dataset.teil;
      neuZeichnen();
    });
  });

  const abbrechen = box.querySelector("#schmerz-abbrechen");
  if (abbrechen) abbrechen.addEventListener("click", () => { schmerzTeil = null; neuZeichnen(); });

  box.querySelectorAll("[data-schmerz-loeschen]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      if (!confirm("Diesen Eintrag löschen?")) return;
      Speicher.speichern("schmerzen", ladeSchmerzen().filter((s) => s.id !== knopf.dataset.schmerzLoeschen));
      neuZeichnen();
    });
  });

  const formular = box.querySelector("#schmerz-form");
  if (formular) {
    formular.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(formular);
      const datum = f.get("datum");
      // Pro Körperteil und Tag nur EIN Eintrag: alten Eintrag ersetzen
      const schmerzen = ladeSchmerzen().filter((s) => !(s.teil === schmerzTeil && s.datum === datum));
      schmerzen.push({ id: neueId(), teil: schmerzTeil, stufe: Number(f.get("stufe")), datum });
      Speicher.speichern("schmerzen", schmerzen);
      schmerzTeil = null;
      neuZeichnen();
    });
  }
}
