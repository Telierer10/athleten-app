// =====================================================================
// wasser.js – wie viel hast du heute getrunken?
// Gespeichert pro Tag: { "2026-11-12": [ { id, ml, zeit }, ... ] }
// =====================================================================

const WASSER_STANDARD_ZIEL = 2500; // ml pro Tag – in "Körper → Ziele" änderbar
const BADEWANNE_ML = 150000;      // eine volle Badewanne ≈ 150 Liter

function ladeWasser() {
  return Speicher.laden("wasser", {});
}

function wasserZiel() {
  return Speicher.laden("wasserZiel", WASSER_STANDARD_ZIEL);
}

// Summe an einem Tag in ml
function wasserAm(datum) {
  return (ladeWasser()[datum] || []).reduce((summe, e) => summe + e.ml, 0);
}

function jetztZeit() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function wasserHinzufuegen(ml) {
  const wasser = ladeWasser();
  const heute = heuteText();
  wasser[heute] = wasser[heute] || [];
  wasser[heute].push({ id: neueId(), ml, zeit: jetztZeit() });
  Speicher.speichern("wasser", wasser);
}

// Letzten Eintrag von heute zurücknehmen (falls man sich vertippt hat)
function wasserRueckgaengig() {
  const wasser = ladeWasser();
  const heute = heuteText();
  if (wasser[heute] && wasser[heute].length > 0) {
    wasser[heute].pop();
    Speicher.speichern("wasser", wasser);
  }
}

// Alles, was du jemals eingetragen hast + das erste Datum
function wasserGesamt() {
  const wasser = ladeWasser();
  const tage = Object.keys(wasser).filter((tag) => wasser[tag].length > 0).sort();
  const ml = tage.reduce((summe, tag) => summe + wasserAm(tag), 0);
  return { ml, seit: tage[0] || heuteText() };
}

function mlText(ml) {
  return ml.toLocaleString("de-DE");
}

// ---------- Kleine Wasser-Karte (für "Heute" und "Körper") ----------

function wasserKarteHtml() {
  const ml = wasserAm(heuteText());
  const ziel = wasserZiel();
  const prozent = Math.min(100, (ml / ziel) * 100);
  return `
    <div class="karte wasser-karte" data-wasser-oeffnen role="button" tabindex="0" aria-label="Wasser im Vollbild öffnen">
      <div class="wasser-karte-fuellung" style="height:${prozent}%"></div>
      <div class="wasser-karte-inhalt">
        <p class="wasser-karte-titel">💧 Wasser ${ml >= ziel ? "· Ziel erreicht! 🎉" : ""}</p>
        <p class="wasser-karte-zahl">${mlText(ml)} <span>/ ${mlText(ziel)} ml</span></p>
        <div class="fortschritt"><div style="width:${prozent}%"></div></div>
      </div>
      <div class="wasser-knoepfe">
        <button data-wasser-plus="250">+250</button>
        <button data-wasser-plus="500">+500</button>
      </div>
    </div>`;
}

function verbindeWasser(bereich) {
  bereich.querySelectorAll("[data-wasser-plus]").forEach((knopf) => {
    knopf.addEventListener("click", (e) => {
      e.stopPropagation(); // sonst würde auch die Karte "angeklickt" und das Vollbild öffnen
      wasserHinzufuegen(Number(knopf.dataset.wasserPlus));
      aktualisieren();
    });
  });
  bereich.querySelectorAll("[data-wasser-oeffnen]").forEach((karte) => {
    karte.addEventListener("click", oeffneWasserVollbild);
    karte.addEventListener("keydown", (e) => { if (e.key === "Enter") oeffneWasserVollbild(); });
  });
}

// ---------- Vollbild: der ganze Bildschirm ist ein Glas ----------

function oeffneWasserVollbild() {
  if (document.querySelector("#wasser-vollbild")) return;

  // Luftblasen: zufällige Größe, Position und Geschwindigkeit
  let blasen = "";
  for (let i = 0; i < 18; i++) {
    const groesse = 4 + Math.random() * 14;
    blasen += `<span class="blase" style="
      left:${Math.random() * 100}%;
      width:${groesse}px; height:${groesse}px;
      animation-duration:${5 + Math.random() * 7}s;
      animation-delay:${-Math.random() * 10}s"></span>`;
  }

  const vollbild = document.createElement("div");
  vollbild.id = "wasser-vollbild";
  vollbild.className = "wasser-vollbild";
  vollbild.innerHTML = `
    <div class="wv-wasser" style="height:0%">
      <svg class="wv-welle" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,20 Q150,0 300,20 T600,20 T900,20 T1200,20 V40 H0 Z"></path>
      </svg>
      <svg class="wv-welle wv-welle-hinten" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,20 Q150,0 300,20 T600,20 T900,20 T1200,20 V40 H0 Z"></path>
      </svg>
      <div class="wv-blasen">${blasen}</div>
    </div>

    <button class="wv-schliessen" aria-label="Schließen">✕</button>

    <div class="wv-inhalt">
      <p class="wv-zahl"><span id="wv-ml">0</span>ml</p>
      <p class="wv-wort">Wasser</p>
      <p class="wv-fakt" id="wv-fakt1"></p>
      <p class="wv-text" id="wv-fakt2"></p>
      <div class="wv-knoepfe">
        <button data-wv-plus="250">🥛<span>Glas</span></button>
        <button data-wv-plus="500">🥤<span>Flasche</span></button>
        <button data-wv-plus="750">🫗<span>Groß</span></button>
        <button data-wv-zurueck aria-label="Rückgängig">↶<span>Zurück</span></button>
      </div>
    </div>`;

  document.body.append(vollbild);
  document.body.classList.add("vollbild-offen");

  vollbild.querySelectorAll("[data-wv-plus]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      wasserHinzufuegen(Number(knopf.dataset.wvPlus));
      aktualisiereWasserVollbild();
    });
  });
  vollbild.querySelector("[data-wv-zurueck]").addEventListener("click", () => {
    wasserRueckgaengig();
    aktualisiereWasserVollbild();
  });
  vollbild.querySelector(".wv-schliessen").addEventListener("click", schliesseWasserVollbild);
  document.addEventListener("keydown", vollbildTaste);

  // Kurz warten, damit das Wasser sichtbar von 0 hochsteigt
  requestAnimationFrame(() => requestAnimationFrame(aktualisiereWasserVollbild));
}

function vollbildTaste(e) {
  if (e.key === "Escape") schliesseWasserVollbild();
}

function schliesseWasserVollbild() {
  const vollbild = document.querySelector("#wasser-vollbild");
  if (!vollbild) return;
  document.removeEventListener("keydown", vollbildTaste);
  vollbild.classList.add("schliesst");
  // erst nach der Ausblend-Animation wirklich entfernen
  setTimeout(() => {
    vollbild.remove();
    document.body.classList.remove("vollbild-offen");
    aktualisieren();
  }, 300);
}

function aktualisiereWasserVollbild() {
  const vollbild = document.querySelector("#wasser-vollbild");
  if (!vollbild) return;

  const ml = wasserAm(heuteText());
  const ziel = wasserZiel();
  const prozent = Math.min(100, (ml / ziel) * 100);
  const gesamt = wasserGesamt();

  // Wasserstand: mindestens 6 %, damit man unten immer ein bisschen Wasser sieht
  vollbild.querySelector(".wv-wasser").style.height = `${Math.max(6, prozent)}%`;

  const zahl = vollbild.querySelector("#wv-ml");
  const vorher = Number(zahl.dataset.wert || 0);
  zahl.dataset.wert = ml;
  zaehleHoch(zahl, vorher, ml);
  vollbild.querySelector(".wv-zahl").classList.toggle("lang", ml >= 1000);

  const glaeser = Math.round(ml / 250);
  vollbild.querySelector("#wv-fakt1").textContent = ml >= ziel
    ? `🎉 Tagesziel geschafft! (${mlText(ziel)} ml)`
    : `💧 ${Math.round(prozent)} % deines Tagesziels · ≈ ${glaeser} ${glaeser === 1 ? "Glas" : "Gläser"}`;

  const liter = gesamt.ml / 1000;
  const badewanne = (gesamt.ml / BADEWANNE_ML) * 100;
  vollbild.querySelector("#wv-fakt2").textContent =
    `Seit ${langesDatum(textAlsDatum(gesamt.seit)).split(", ")[1]} hast du mit selfATHLETE ` +
    `${zahlText(liter)} Liter getrunken – das sind ${zahlText(badewanne)} % einer Badewanne. 🛁`;
}

// Zahl schnell hoch- oder runterzählen lassen (Animation)
function zaehleHoch(element, von, bis) {
  const start = performance.now();
  const dauer = 700; // Millisekunden
  function schritt(jetzt) {
    const fortschritt = Math.min(1, (jetzt - start) / dauer);
    const sanft = 1 - Math.pow(1 - fortschritt, 3); // erst schnell, dann langsam
    element.textContent = mlText(Math.round(von + (bis - von) * sanft));
    if (fortschritt < 1) requestAnimationFrame(schritt);
  }
  requestAnimationFrame(schritt);
}
