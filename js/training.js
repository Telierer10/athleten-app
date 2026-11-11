// =====================================================================
// training.js – dein Trainings- und Spieltagebuch mit Statistiken.
// Jede Einheit: { id, datum, art, dauer, gefuehl (1–5), energie (1–5), notiz,
//                 nur bei Spielen: gegner, wir, die, tore, assists }
// =====================================================================

const EINHEIT_ARTEN = {
  training: { name: "Training", icon: "🤾" },
  spiel:    { name: "Spiel",    icon: "🏆" },
  athletik: { name: "Athletik", icon: "💪" },
};

// Skalen von 1 bis 5 (Position 0 = Wert 1)
const GEFUEHLE = ["😫", "😕", "😐", "🙂", "🤩"];
const ENERGIE = ["🪫", "😮‍💨", "😐", "💪", "⚡"];

function ladeEinheiten() {
  return Speicher.laden("einheiten", []);
}

function speichereEinheiten(einheiten) {
  Speicher.speichern("einheiten", einheiten);
}

// Neueste zuerst
function einheitenNeuesteZuerst() {
  return ladeEinheiten().sort((a, b) => b.datum.localeCompare(a.datum) || b.id.localeCompare(a.id));
}

// Was ist heute laut Plan dran? Davon hängt ab, was im Formular vorausgewählt ist.
function vorgeschlageneArt() {
  const arten = termineAm(heuteText()).map((t) => t.art);
  if (arten.includes("spiel")) return "spiel";
  if (arten.includes("physio")) return "athletik";
  return "training";
}

// Zahl aus einem Formularfeld holen – leeres Feld = null
function zahlOderNull(wert) {
  return wert === "" || wert === null ? null : Number(wert);
}

// ---------- Statistiken ----------

function berechneStatistik(einheiten) {
  const montag = montagDieserWoche();
  const vor30Tagen = plusTage(heuteText(), -30);

  const dieseWoche = einheiten.filter((e) => e.datum >= montag).length;

  const letzte30 = einheiten.filter((e) => e.datum >= vor30Tagen);
  const schnittGefuehl = letzte30.length
    ? letzte30.reduce((summe, e) => summe + e.gefuehl, 0) / letzte30.length
    : null;

  const spiele = einheiten.filter((e) => e.art === "spiel");
  const tore = spiele.reduce((summe, e) => summe + (e.tore || 0), 0);

  // Bilanz: nur Spiele, bei denen ein Ergebnis eingetragen ist
  let siege = 0, unentschieden = 0, niederlagen = 0;
  spiele.forEach((e) => {
    if (e.wir === null || e.die === null || e.wir === undefined || e.die === undefined) return;
    if (e.wir > e.die) siege++;
    else if (e.wir === e.die) unentschieden++;
    else niederlagen++;
  });

  return { dieseWoche, schnittGefuehl, tore, anzahlSpiele: spiele.length, siege, unentschieden, niederlagen };
}

// ---------- Diagramme (selbst gezeichnet als SVG) ----------
// SVG = "Bilder aus Code": Linien, Kreise und Rechtecke mit Koordinaten.
// viewBox legt unser Koordinatensystem fest, der Browser skaliert es passend.

const DIAGRAMM = { breite: 340, hoehe: 150, links: 22, rechts: 10, oben: 14, unten: 22 };

// Linien-Diagramm für Werte von 1 bis 5 (z. B. "Wie lief's?")
function formDiagramm(einheiten) {
  const daten = einheiten.slice(0, 12).reverse(); // die letzten 12, älteste links
  if (daten.length < 2) {
    return `<p class="leer">Trag mindestens 2 Einheiten ein, dann siehst du hier deine Form-Kurve.</p>`;
  }

  const { breite, hoehe, links, rechts, oben, unten } = DIAGRAMM;
  const innenBreite = breite - links - rechts;
  const innenHoehe = hoehe - oben - unten;
  const x = (i) => links + (i / (daten.length - 1)) * innenBreite;
  const y = (wert) => oben + innenHoehe - ((wert - 1) / 4) * innenHoehe; // 1 unten, 5 oben

  // Hilfslinien für 1, 3 und 5 (dezent)
  const raster = [1, 3, 5].map((w) => `
    <line class="raster" x1="${links}" x2="${breite - rechts}" y1="${y(w)}" y2="${y(w)}"></line>
    <text class="achse" x="${links - 8}" y="${y(w) + 4}" text-anchor="end">${w}</text>`).join("");

  const linie = daten.map((e, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(e.gefuehl)}`).join(" ");

  const punkte = daten.map((e, i) => `
    <g class="punkt-gruppe">
      <title>${kurzesDatum(e.datum)} · ${EINHEIT_ARTEN[e.art].name}: ${GEFUEHLE[e.gefuehl - 1]} ${e.gefuehl}/5</title>
      <circle class="trefferflaeche" cx="${x(i)}" cy="${y(e.gefuehl)}" r="14"></circle>
      <circle class="datenpunkt" cx="${x(i)}" cy="${y(e.gefuehl)}" r="4"></circle>
    </g>`).join("");

  // Nur erstes und letztes Datum beschriften, sonst wird es zu eng
  const ersterTag = daten[0], letzterTag = daten[daten.length - 1];
  const beschriftung = `
    <text class="achse" x="${x(0)}" y="${hoehe - 4}" text-anchor="start">${kurzesDatum(ersterTag.datum)}</text>
    <text class="achse" x="${x(daten.length - 1)}" y="${hoehe - 4}" text-anchor="end">${kurzesDatum(letzterTag.datum)}</text>`;

  return `
    <svg class="diagramm" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="Form-Kurve der letzten ${daten.length} Einheiten">
      ${raster}
      <path class="datenlinie" d="${linie}"></path>
      ${punkte}
      ${beschriftung}
    </svg>`;
}

// Ein Balken mit abgerundeten oberen Ecken (unten gerade, steht auf der Grundlinie)
function balkenPfad(x, y, breite, hoehe, radius) {
  const r = Math.min(radius, breite / 2, hoehe);
  return `M${x},${y + hoehe} V${y + r} Q${x},${y} ${x + r},${y} H${x + breite - r} Q${x + breite},${y} ${x + breite},${y + r} V${y + hoehe} Z`;
}

// Balken-Diagramm: Tore pro Spiel
function toreDiagramm(einheiten) {
  const spiele = einheiten.filter((e) => e.art === "spiel").slice(0, 10).reverse();
  if (spiele.length === 0) {
    return `<p class="leer">Noch keine Spiele eingetragen.</p>`;
  }

  const { breite, hoehe, links, rechts, oben, unten } = DIAGRAMM;
  const innenBreite = breite - links - rechts;
  const innenHoehe = hoehe - oben - unten;
  const maxTore = Math.max(4, ...spiele.map((e) => e.tore || 0));
  const platz = innenBreite / spiele.length;
  const balkenBreite = Math.min(28, platz - 6);
  const grundlinie = oben + innenHoehe;

  const balken = spiele.map((e, i) => {
    const tore = e.tore || 0;
    const h = (tore / maxTore) * innenHoehe;
    const bx = links + i * platz + (platz - balkenBreite) / 2;
    const ergebnis = e.wir !== null && e.die !== null && e.wir !== undefined ? ` (${e.wir}:${e.die})` : "";
    return `
      <g class="balken-gruppe">
        <title>${kurzesDatum(e.datum)} gegen ${sicher(e.gegner || "?")}${ergebnis}: ${tore} Tore</title>
        <rect class="trefferflaeche" x="${links + i * platz}" y="${oben}" width="${platz}" height="${innenHoehe}"></rect>
        ${h > 0 ? `<path class="balken" d="${balkenPfad(bx, grundlinie - h, balkenBreite, h, 4)}"></path>` : ""}
      </g>`;
  }).join("");

  // Nur den besten Wert direkt beschriften
  const bester = spiele.reduce((best, e, i) => ((e.tore || 0) > (spiele[best].tore || 0) ? i : best), 0);
  const besteTore = spiele[bester].tore || 0;
  const label = besteTore > 0 ? `
    <text class="wert" x="${links + bester * platz + platz / 2}" y="${grundlinie - (besteTore / maxTore) * innenHoehe - 5}" text-anchor="middle">${besteTore}</text>` : "";

  return `
    <svg class="diagramm" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="Tore in den letzten ${spiele.length} Spielen">
      <line class="grundlinie" x1="${links}" x2="${breite - rechts}" y1="${grundlinie}" y2="${grundlinie}"></line>
      ${balken}
      ${label}
      <text class="achse" x="${links}" y="${hoehe - 4}" text-anchor="start">${kurzesDatum(spiele[0].datum)}</text>
      ${spiele.length > 1 ? `<text class="achse" x="${breite - rechts}" y="${hoehe - 4}" text-anchor="end">${kurzesDatum(spiele[spiele.length - 1].datum)}</text>` : ""}
    </svg>`;
}

// ---------- Eine Einheit in der Liste ----------

function einheitHtml(e) {
  const art = EINHEIT_ARTEN[e.art];
  let titel = art.name;
  let details = [];
  if (e.art === "spiel") {
    titel = `Spiel gegen ${sicher(e.gegner || "?")}`;
    if (e.wir !== null && e.die !== null && e.wir !== undefined) details.push(`${e.wir}:${e.die}`);
    if (e.tore !== null && e.tore !== undefined) details.push(`${e.tore} ${e.tore === 1 ? "Tor" : "Tore"}`);
    if (e.assists) details.push(`${e.assists} ${e.assists === 1 ? "Assist" : "Assists"}`);
  }
  if (e.dauer) details.push(`${e.dauer} Min.`);

  return `
    <li class="zeile einheit">
      <span class="einheit-icon">${art.icon}</span>
      <div class="zeile-text">
        <strong>${titel}</strong>
        <span class="aufgabe-text">${kurzesDatum(e.datum)}${details.length ? " · " + details.join(" · ") : ""}</span>
        ${e.notiz ? `<span class="notiz">${sicher(e.notiz)}</span>` : ""}
      </div>
      <span class="bewertung" title="Gefühl ${e.gefuehl}/5 · Energie ${e.energie}/5">${GEFUEHLE[e.gefuehl - 1]}</span>
      <button class="loeschen" data-einheit-loeschen="${e.id}" aria-label="Löschen">✕</button>
    </li>`;
}

// Auswahl-Knöpfe für eine Skala von 1 bis 5
function skalaHtml(name, symbole) {
  return `<div class="skala">${symbole.map((s, i) => `
    <input type="radio" name="${name}" value="${i + 1}" id="${name}-${i + 1}" required>
    <label for="${name}-${i + 1}">${s}</label>`).join("")}</div>`;
}

// ---------- Die Ansicht "Training" ----------

function zeigeTraining(inhalt) {
  const einheiten = einheitenNeuesteZuerst();
  const stat = berechneStatistik(einheiten);
  const standardArt = vorgeschlageneArt();

  const artKnoepfe = Object.entries(EINHEIT_ARTEN).map(([schluessel, art]) => `
    <input type="radio" name="art" value="${schluessel}" id="art-${schluessel}" ${schluessel === standardArt ? "checked" : ""}>
    <label for="art-${schluessel}">${art.icon} ${art.name}</label>`).join("");

  inhalt.innerHTML = `
    <header class="kopf">
      <h1>Training &amp; Spiele</h1>
      <p class="unterzeile">${stat.dieseWoche === 1 ? "1 Einheit" : `${stat.dieseWoche} Einheiten`} diese Woche</p>
    </header>

    <div class="kacheln">
      <div class="karte kachel">
        <p class="kachel-titel">Diese Woche</p>
        <p class="kachel-zahl">${stat.dieseWoche}</p>
        <p class="kachel-info">Einheiten</p>
      </div>
      <div class="karte kachel">
        <p class="kachel-titel">Ø Gefühl</p>
        <p class="kachel-zahl">${stat.schnittGefuehl === null ? "–" : zahlText(stat.schnittGefuehl)}</p>
        <p class="kachel-info">letzte 30 Tage${stat.schnittGefuehl === null ? "" : " " + GEFUEHLE[Math.round(stat.schnittGefuehl) - 1]}</p>
      </div>
      <div class="karte kachel">
        <p class="kachel-titel">Tore</p>
        <p class="kachel-zahl">${stat.tore}</p>
        <p class="kachel-info">in ${stat.anzahlSpiele} ${stat.anzahlSpiele === 1 ? "Spiel" : "Spielen"}</p>
      </div>
      <div class="karte kachel">
        <p class="kachel-titel">Bilanz</p>
        <p class="kachel-zahl">${stat.siege}-${stat.unentschieden}-${stat.niederlagen}</p>
        <p class="kachel-info">S · U · N</p>
      </div>
    </div>

    <h3 class="gruppe">Eintragen</h3>
    <form class="karte formular" id="einheit-form">
      <div class="segment">${artKnoepfe}</div>

      <div class="zwei-spalten">
        <label class="feld-label">Datum <input type="date" name="datum" value="${heuteText()}" max="${heuteText()}" required></label>
        <label class="feld-label">Min. <input type="number" name="dauer" min="0" max="600" step="5" placeholder="90"></label>
      </div>

      <!-- Diese Felder erscheinen nur, wenn "Spiel" ausgewählt ist (siehe CSS: .nur-spiel) -->
      <div class="nur-spiel">
        <input name="gegner" placeholder="Gegner" maxlength="40">
        <div class="zwei-spalten">
          <label class="feld-label">Wir <input type="number" name="wir" min="0" max="99"></label>
          <label class="feld-label">Die <input type="number" name="die" min="0" max="99"></label>
        </div>
        <div class="zwei-spalten">
          <label class="feld-label">Tore <input type="number" name="tore" min="0" max="50"></label>
          <label class="feld-label">Assists <input type="number" name="assists" min="0" max="50"></label>
        </div>
      </div>

      <p class="frage">Wie lief's?</p>
      ${skalaHtml("gefuehl", GEFUEHLE)}
      <p class="frage">Wie fit hast du dich gefühlt?</p>
      ${skalaHtml("energie", ENERGIE)}

      <textarea name="notiz" rows="2" maxlength="300" placeholder="Notiz (optional), z. B. Würfe aus dem Rückraum geübt"></textarea>
      <button class="knopf" type="submit">Speichern</button>
    </form>

    <h3 class="gruppe">Deine Form</h3>
    <div class="karte">
      <p class="diagramm-titel">Wie lief's? – letzte Einheiten (1 = 😫, 5 = 🤩)</p>
      ${formDiagramm(einheiten)}
    </div>

    <h3 class="gruppe">Tore pro Spiel</h3>
    <div class="karte">${toreDiagramm(einheiten)}</div>

    <h3 class="gruppe">Verlauf ${einheiten.length ? `<span class="anzahl">${einheiten.length}</span>` : ""}</h3>
    ${einheiten.length === 0
      ? `<div class="karte"><p class="leer">Noch nichts eingetragen. Nach dem nächsten Training geht's los! 💪</p></div>`
      : `<ul class="karte liste">${einheiten.slice(0, 30).map(einheitHtml).join("")}</ul>`}
  `;

  // --- Speichern ---
  inhalt.querySelector("#einheit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    // FormData liest alle Felder mit "name" auf einmal aus
    const f = new FormData(e.target);
    const art = f.get("art");
    const neu = {
      id: neueId(),
      datum: f.get("datum"),
      art,
      dauer: zahlOderNull(f.get("dauer")),
      gefuehl: Number(f.get("gefuehl")),
      energie: Number(f.get("energie")),
      notiz: f.get("notiz").trim(),
    };
    if (art === "spiel") {
      neu.gegner = f.get("gegner").trim();
      neu.wir = zahlOderNull(f.get("wir"));
      neu.die = zahlOderNull(f.get("die"));
      neu.tore = zahlOderNull(f.get("tore"));
      neu.assists = zahlOderNull(f.get("assists"));
    }
    const alle = ladeEinheiten();
    alle.push(neu);
    speichereEinheiten(alle);
    aktualisieren();
  });

  // --- Löschen ---
  inhalt.querySelectorAll("[data-einheit-loeschen]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      if (!confirm("Diesen Eintrag löschen?")) return;
      speichereEinheiten(ladeEinheiten().filter((e) => e.id !== knopf.dataset.einheitLoeschen));
      aktualisieren();
    });
  });
}
