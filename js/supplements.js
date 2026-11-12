// =====================================================================
// supplements.js – Nahrungsergänzung abhaken (z. B. Kreatin, Vitamin D, Magnesium).
// Liste:      [ { id, name, menge } ]
// Einnahmen:  { "2026-11-12": [ id, id, ... ] }  – welche an welchem Tag genommen wurden
// =====================================================================

function ladeSupplements() {
  return Speicher.laden("supplements", []);
}

function ladeEinnahmen() {
  return Speicher.laden("einnahmen", {});
}

function istGenommen(id, datum) {
  return (ladeEinnahmen()[datum] || []).includes(id);
}

// Heute genommen <-> nicht genommen
function einnahmeUmschalten(id) {
  const einnahmen = ladeEinnahmen();
  const heute = heuteText();
  const liste = einnahmen[heute] || [];
  einnahmen[heute] = liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];
  Speicher.speichern("einnahmen", einnahmen);
}

// Wie viele Tage am Stück? Zählt ab heute rückwärts.
// Wurde es heute noch nicht genommen, zählt die Serie ab gestern (sie ist ja noch nicht gerissen).
function serie(id) {
  let tag = istGenommen(id, heuteText()) ? heuteText() : plusTage(heuteText(), -1);
  let anzahl = 0;
  while (istGenommen(id, tag)) {
    anzahl++;
    tag = plusTage(tag, -1);
  }
  return anzahl;
}

function offeneSupplementsHeute() {
  return ladeSupplements().filter((s) => !istGenommen(s.id, heuteText()));
}

// Eine Zeile in der Liste
function supplementHtml(s, mitLoeschen) {
  const genommen = istGenommen(s.id, heuteText());
  const tage = serie(s.id);
  return `
    <li class="zeile aufgabe ${genommen ? "erledigt" : ""}">
      <button class="haken" data-supplement="${s.id}" aria-label="Genommen">${genommen ? "✓" : ""}</button>
      <div class="zeile-text">
        <strong>${sicher(s.name)}</strong>
        ${s.menge ? `<span class="aufgabe-text">${sicher(s.menge)}</span>` : ""}
      </div>
      ${tage >= 2 ? `<span class="serie">🔥 ${tage} Tage</span>` : ""}
      ${mitLoeschen ? `<button class="loeschen" data-supplement-loeschen="${s.id}" aria-label="Löschen">✕</button>` : ""}
    </li>`;
}

// ---------- Bereich "Supplements" auf der Körper-Seite ----------

function supplementsBereichHtml() {
  const liste = ladeSupplements();
  const genommen = liste.filter((s) => istGenommen(s.id, heuteText())).length;

  return `
    <h3 class="gruppe">Supplements ${liste.length ? `<span class="anzahl">${genommen}/${liste.length} heute</span>` : ""}</h3>
    ${liste.length
      ? `<ul class="karte liste">${liste.map((s) => supplementHtml(s, true)).join("")}</ul>`
      : `<div class="karte"><p class="leer">Noch nichts eingetragen. Unter 18? Sprich Supplements wie Kreatin vorher mit Eltern, Trainer oder Arzt ab.</p></div>`}

    <form class="karte formular abstand-oben" id="supplement-form">
      <div class="zwei-spalten">
        <input name="name" placeholder="Name (z. B. Vitamin D)" required maxlength="30">
        <input name="menge" placeholder="Menge (z. B. 1 Tablette)" maxlength="30">
      </div>
      <button class="knopf" type="submit">Hinzufügen</button>
    </form>`;
}

// Macht Haken + Löschen klickbar (auf "Heute" und "Körper")
function verbindeSupplements(bereich) {
  bereich.querySelectorAll("[data-supplement]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      einnahmeUmschalten(knopf.dataset.supplement);
      aktualisieren();
    });
  });

  bereich.querySelectorAll("[data-supplement-loeschen]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      if (!confirm("Dieses Supplement löschen?")) return;
      const rest = ladeSupplements().filter((s) => s.id !== knopf.dataset.supplementLoeschen);
      Speicher.speichern("supplements", rest);
      aktualisieren();
    });
  });

  const formular = bereich.querySelector("#supplement-form");
  if (formular) {
    formular.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(formular);
      const liste = ladeSupplements();
      liste.push({ id: neueId(), name: f.get("name").trim(), menge: f.get("menge").trim() });
      Speicher.speichern("supplements", liste);
      aktualisieren();
    });
  }
}
