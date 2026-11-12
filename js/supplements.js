// =====================================================================
// supplements.js – Nahrungsergänzung abhaken (z. B. Kreatin, Vitamin D, Magnesium).
// Liste:      [ { id, name, menge, notiz, haeufigkeit, tage, proWoche } ]
//   haeufigkeit: "taeglich"  → jeden Tag
//                "tage"      → an bestimmten Wochentagen, z. B. tage: [1, 3, 5] = Mo, Mi, Fr
//                "woche"     → X-mal pro Woche, egal wann, z. B. proWoche: 3
// Einnahmen:  { "2026-11-12": [ id, id, ... ] }  – welche an welchem Tag genommen wurden
// =====================================================================

function ladeSupplements() {
  // Ältere Einträge ohne Häufigkeit gelten als "täglich"
  return Speicher.laden("supplements", []).map((s) => ({ haeufigkeit: "taeglich", ...s }));
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

// Wie oft diese Woche (seit Montag) schon genommen?
function anzahlDieseWoche(id) {
  let anzahl = 0;
  for (let tag = montagDieserWoche(); tag <= heuteText(); tag = plusTage(tag, 1)) {
    if (istGenommen(id, tag)) anzahl++;
  }
  return anzahl;
}

// Ist das Supplement an diesem Tag "dran"?
function istGeplantAm(s, datum) {
  if (s.haeufigkeit === "tage") return (s.tage || []).includes(textAlsDatum(datum).getDay());
  return true; // täglich – und "pro Woche" kann man jeden Tag nehmen
}

// Soll es heute auf der Startseite stehen?
function istHeuteOffen(s) {
  if (istGenommen(s.id, heuteText())) return false;
  if (s.haeufigkeit === "woche") return anzahlDieseWoche(s.id) < (s.proWoche || 1);
  return istGeplantAm(s, heuteText());
}

// 🔥 Serie: wie viele GEPLANTE Tage am Stück genommen? (nicht für "pro Woche")
// Tage, an denen es gar nicht dran ist, werden übersprungen.
function serie(s) {
  if (s.haeufigkeit === "woche") return 0;
  let tag = heuteText();
  // Heute noch nicht genommen? Dann zählt die Serie ab gestern (sie ist ja noch nicht gerissen).
  if (!istGenommen(s.id, tag)) tag = plusTage(tag, -1);
  let anzahl = 0;
  for (let schutz = 0; schutz < 400; schutz++) {   // "schutz" verhindert eine Endlos-Schleife
    if (istGeplantAm(s, tag)) {
      if (!istGenommen(s.id, tag)) break;
      anzahl++;
    }
    tag = plusTage(tag, -1);
  }
  return anzahl;
}

function offeneSupplementsHeute() {
  return ladeSupplements().filter(istHeuteOffen);
}

// "täglich" / "Mo, Mi, Fr" / "3× pro Woche (1/3)"
function haeufigkeitText(s) {
  if (s.haeufigkeit === "tage") {
    return TAGE_REIHENFOLGE.filter((t) => (s.tage || []).includes(t)).map((t) => WOCHENTAGE_KURZ[t]).join(", ") || "keine Tage gewählt";
  }
  if (s.haeufigkeit === "woche") return `${s.proWoche}× pro Woche (${anzahlDieseWoche(s.id)}/${s.proWoche})`;
  return "täglich";
}

// Eine Zeile in der Liste
function supplementHtml(s, mitLoeschen) {
  const genommen = istGenommen(s.id, heuteText());
  const tage = serie(s);
  const info = [s.menge, haeufigkeitText(s)].filter(Boolean).map(sicher).join(" · ");
  return `
    <li class="zeile aufgabe ${genommen ? "erledigt" : ""}">
      <button class="haken" data-supplement="${s.id}" aria-label="Genommen">${genommen ? "✓" : ""}</button>
      <div class="zeile-text">
        <strong>${sicher(s.name)}</strong>
        <span class="aufgabe-text">${info}</span>
        ${s.notiz ? `<span class="notiz">${sicher(s.notiz)}</span>` : ""}
      </div>
      ${tage >= 2 ? `<span class="serie">🔥 ${tage}</span>` : ""}
      ${mitLoeschen ? `<button class="loeschen" data-supplement-loeschen="${s.id}" aria-label="Löschen">✕</button>` : ""}
    </li>`;
}

// ---------- Bereich "Supplements" auf der Körper-Seite ----------

function supplementsBereichHtml() {
  const liste = ladeSupplements();
  const heuteDran = liste.filter((s) => istGeplantAm(s, heuteText()) || istGenommen(s.id, heuteText()));
  const genommen = liste.filter((s) => istGenommen(s.id, heuteText())).length;

  const tagKnoepfe = TAGE_REIHENFOLGE.map((t) => `
    <input type="checkbox" name="tage" value="${t}" id="sup-tag-${t}">
    <label for="sup-tag-${t}">${WOCHENTAGE_KURZ[t]}</label>`).join("");

  return `
    <h3 class="gruppe">Supplements ${liste.length ? `<span class="anzahl">${genommen}/${heuteDran.length} heute</span>` : ""}</h3>
    ${liste.length
      ? `<ul class="karte liste">${liste.map((s) => supplementHtml(s, true)).join("")}</ul>`
      : `<div class="karte"><p class="leer">Noch nichts eingetragen. Unter 18? Sprich Supplements wie Kreatin vorher mit Eltern, Trainer oder Arzt ab.</p></div>`}

    <form class="karte formular abstand-oben" id="supplement-form">
      <div class="zwei-spalten">
        <input name="name" placeholder="Name (z. B. Vitamin D)" required maxlength="30">
        <input name="menge" placeholder="Menge (z. B. 1 Tablette)" maxlength="30">
      </div>
      <input name="notiz" placeholder="Beschreibung (optional), z. B. morgens zum Frühstück" maxlength="80">

      <div class="segment">
        <input type="radio" name="haeufigkeit" value="taeglich" id="hf-taeglich" checked>
        <label for="hf-taeglich">Täglich</label>
        <input type="radio" name="haeufigkeit" value="tage" id="hf-tage">
        <label for="hf-tage">Bestimmte Tage</label>
        <input type="radio" name="haeufigkeit" value="woche" id="hf-woche">
        <label for="hf-woche">Pro Woche</label>
      </div>

      <!-- erscheint nur bei "Bestimmte Tage" (siehe CSS) -->
      <div class="nur-tage tag-auswahl">${tagKnoepfe}</div>
      <!-- erscheint nur bei "Pro Woche" -->
      <label class="feld-label nur-woche">Wie oft pro Woche?
        <input type="number" name="proWoche" min="1" max="7" value="2">
      </label>

      <button class="knopf" type="submit">Hinzufügen</button>
    </form>`;
}

// Macht Haken + Löschen + Formular klickbar (auf "Heute" und "Körper")
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
  if (!formular) return;
  formular.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(formular);
    const haeufigkeit = f.get("haeufigkeit");
    const tage = f.getAll("tage").map(Number);   // getAll: alle angehakten Tage
    if (haeufigkeit === "tage" && tage.length === 0) {
      alert("Bitte wähle mindestens einen Tag aus.");
      return;
    }
    const liste = ladeSupplements();
    liste.push({
      id: neueId(),
      name: f.get("name").trim(),
      menge: f.get("menge").trim(),
      notiz: f.get("notiz").trim(),
      haeufigkeit,
      tage: haeufigkeit === "tage" ? tage : [],
      proWoche: haeufigkeit === "woche" ? Math.min(7, Math.max(1, Number(f.get("proWoche")) || 1)) : null,
    });
    Speicher.speichern("supplements", liste);
    aktualisieren();
  });
}
