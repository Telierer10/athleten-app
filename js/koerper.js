// =====================================================================
// koerper.js – der Tab "Körper": Wasser, Schlaf und Supplements auf einer Seite.
// Die einzelnen Bereiche kommen aus wasser.js, schlaf.js und supplements.js.
// =====================================================================

let zieleOffen = false; // merkt sich, ob "Ziele anpassen" aufgeklappt war

function zeigeKoerper(inhalt) {
  inhalt.innerHTML = `
    <header class="kopf">
      <h1>Körper</h1>
      <p class="unterzeile">Trinken, schlafen, regenerieren.</p>
    </header>

    ${wasserKarteHtml()}

    ${schlafBereichHtml()}

    ${supplementsBereichHtml()}

    <details class="ziele">
      <summary class="gruppe">Ziele anpassen</summary>
      <div class="karte formular">
        <label class="feld-label">Wasser pro Tag (ml)
          <input type="number" id="ziel-wasser" min="500" max="6000" step="250" value="${wasserZiel()}">
        </label>
        <label class="feld-label">Schlaf pro Nacht (Std.)
          <input type="number" id="ziel-schlaf" min="5" max="12" step="0.5" value="${schlafZiel()}">
        </label>
      </div>
    </details>
  `;

  verbindeWasser(inhalt);
  verbindeSchlaf(inhalt);
  verbindeSupplements(inhalt);

  // Nach dem Neuzeichnen soll "Ziele anpassen" offen bleiben, wenn es offen war
  const ziele = inhalt.querySelector(".ziele");
  ziele.open = zieleOffen;
  ziele.addEventListener("toggle", () => { zieleOffen = ziele.open; });

  inhalt.querySelector("#ziel-wasser").addEventListener("change", (e) => {
    Speicher.speichern("wasserZiel", Number(e.target.value) || WASSER_STANDARD_ZIEL);
    aktualisieren();
  });
  inhalt.querySelector("#ziel-schlaf").addEventListener("change", (e) => {
    Speicher.speichern("schlafZiel", Number(e.target.value) || SCHLAF_STANDARD_ZIEL);
    aktualisieren();
  });
}
