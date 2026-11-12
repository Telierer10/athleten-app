// =====================================================================
// schlaf.js – wie lange und wie gut hast du geschlafen?
// Ein Eintrag pro Nacht: { id, datum (der MORGEN), bett: "22:30", auf: "06:45", qualitaet: 1–5 }
// =====================================================================

const SCHLAF_STANDARD_ZIEL = 9; // Stunden – für Jugendliche werden meist 8–10 Std. empfohlen
const SCHLAF_QUALITAET = ["😫", "😕", "😐", "🙂", "😴"];

function ladeSchlaf() {
  return Speicher.laden("schlaf", []);
}

function schlafZiel() {
  return Speicher.laden("schlafZiel", SCHLAF_STANDARD_ZIEL);
}

// Schlafdauer in Minuten. Klappt auch über Mitternacht:
// 22:30 → 06:45  =  (405 − 1350 + 1440) % 1440  =  495 Min. = 8 Std. 15 Min.
function schlafDauer(eintrag) {
  const minuten = (zeitAlsMinuten(eintrag.auf) - zeitAlsMinuten(eintrag.bett) + 1440) % 1440;
  return minuten === 0 ? 1440 : minuten;
}

function schlafAm(datum) {
  return ladeSchlaf().find((e) => e.datum === datum) || null;
}

// Die letzten 7 Nächte (ältester Tag zuerst), fehlende Nächte = null
function letzteSiebenNaechte() {
  const heute = heuteText();
  const naechte = [];
  for (let i = 6; i >= 0; i--) {
    const datum = plusTage(heute, -i);
    naechte.push({ datum, eintrag: schlafAm(datum) });
  }
  return naechte;
}

// ---------- Diagramm: Stunden pro Nacht + gestrichelte Ziel-Linie ----------

function schlafDiagramm() {
  const naechte = letzteSiebenNaechte();
  const ziel = schlafZiel();
  const { breite, hoehe, links, rechts, oben, unten } = DIAGRAMM; // aus training.js
  const innenBreite = breite - links - rechts;
  const innenHoehe = hoehe - oben - unten;
  const maxStunden = Math.max(ziel + 1, 11);
  const grundlinie = oben + innenHoehe;
  const y = (stunden) => grundlinie - (stunden / maxStunden) * innenHoehe;
  const platz = innenBreite / 7;
  const balkenBreite = Math.min(26, platz - 8);

  const balken = naechte.map((n, i) => {
    const mitte = links + i * platz + platz / 2;
    const tag = `<text class="achse" x="${mitte}" y="${hoehe - 4}" text-anchor="middle">${WOCHENTAGE_KURZ[textAlsDatum(n.datum).getDay()]}</text>`;
    if (!n.eintrag) return tag;
    const stunden = schlafDauer(n.eintrag) / 60;
    return `
      <g class="balken-gruppe">
        <title>${kurzesDatum(n.datum)}: ${dauerText(schlafDauer(n.eintrag))} (${n.eintrag.bett}–${n.eintrag.auf})</title>
        <rect class="trefferflaeche" x="${links + i * platz}" y="${oben}" width="${platz}" height="${innenHoehe}"></rect>
        <path class="balken" d="${balkenPfad(mitte - balkenBreite / 2, y(stunden), balkenBreite, grundlinie - y(stunden), 4)}"></path>
      </g>${tag}`;
  }).join("");

  return `
    <svg class="diagramm" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="Schlafdauer der letzten 7 Nächte">
      <line class="grundlinie" x1="${links}" x2="${breite - rechts}" y1="${grundlinie}" y2="${grundlinie}"></line>
      ${balken}
      <line class="ziel-linie" x1="${links}" x2="${breite - rechts}" y1="${y(ziel)}" y2="${y(ziel)}"></line>
      <text class="achse" x="${breite - rechts}" y="${y(ziel) - 5}" text-anchor="end">Ziel ${zahlText(ziel)} Std.</text>
    </svg>`;
}

// ---------- Bereich "Schlaf" auf der Körper-Seite ----------

function schlafBereichHtml() {
  const heute = schlafAm(heuteText());
  const ziel = schlafZiel() * 60;
  const mitDaten = letzteSiebenNaechte().filter((n) => n.eintrag);
  const schnitt = mitDaten.length
    ? mitDaten.reduce((s, n) => s + schlafDauer(n.eintrag), 0) / mitDaten.length
    : null;

  let letzteNacht = `<p class="leer">Noch nicht eingetragen – wie hast du heute Nacht geschlafen?</p>`;
  if (heute) {
    const dauer = schlafDauer(heute);
    const differenz = dauer - ziel;
    const vergleich = differenz >= 0
      ? "Ziel erreicht ✅"
      : `${dauerText(-differenz)} unter deinem Ziel`;
    letzteNacht = `
      <p class="kachel-zahl">${dauerText(dauer)}</p>
      <p class="kachel-info">${heute.bett}–${heute.auf} · ${SCHLAF_QUALITAET[heute.qualitaet - 1]} · ${vergleich}</p>`;
  }

  return `
    <h3 class="gruppe">Schlaf</h3>
    <div class="kacheln kacheln-2">
      <div class="karte kachel"><p class="kachel-titel">Letzte Nacht</p>${letzteNacht}</div>
      <div class="karte kachel">
        <p class="kachel-titel">Ø 7 Tage</p>
        <p class="kachel-zahl">${schnitt === null ? "–" : dauerText(Math.round(schnitt))}</p>
        <p class="kachel-info">${mitDaten.length} von 7 Nächten eingetragen</p>
      </div>
    </div>

    <div class="karte abstand-oben">${schlafDiagramm()}</div>

    <form class="karte formular abstand-oben" id="schlaf-form">
      <div class="zwei-spalten">
        <label class="feld-label">Ins Bett <input type="time" name="bett" value="${heute ? heute.bett : "22:30"}" required></label>
        <label class="feld-label">Auf <input type="time" name="auf" value="${heute ? heute.auf : "06:30"}" required></label>
      </div>
      <label class="feld-label">Morgen vom <input type="date" name="datum" value="${heuteText()}" max="${heuteText()}" required></label>
      <p class="frage">Wie gut hast du geschlafen?</p>
      ${skalaHtml("qualitaet", SCHLAF_QUALITAET)}
      <button class="knopf" type="submit">${heute ? "Aktualisieren" : "Speichern"}</button>
    </form>`;
}

function verbindeSchlaf(bereich) {
  const formular = bereich.querySelector("#schlaf-form");
  if (!formular) return;

  // Bei schon vorhandenem Eintrag die Qualität vorauswählen
  const heute = schlafAm(heuteText());
  if (heute) formular.querySelector(`#qualitaet-${heute.qualitaet}`).checked = true;

  formular.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(formular);
    const datum = f.get("datum");
    // Pro Nacht nur EIN Eintrag: alten Eintrag für dieses Datum ersetzen
    const schlaf = ladeSchlaf().filter((s) => s.datum !== datum);
    schlaf.push({
      id: neueId(),
      datum,
      bett: f.get("bett"),
      auf: f.get("auf"),
      qualitaet: Number(f.get("qualitaet")),
    });
    Speicher.speichern("schlaf", schlaf);
    aktualisieren();
  });
}
