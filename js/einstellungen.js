// =====================================================================
// einstellungen.js – Name, Design, Ziele und deine Daten (sichern/übertragen).
// Erreichbar über das ⚙️ oben rechts auf "Heute".
// =====================================================================

const APP_VERSION = "1.0";

// ---------- Design: hell, dunkel oder automatisch (wie das Gerät) ----------

function designWahl() {
  return Speicher.laden("design", "auto");
}

function wendeDesignAn() {
  const wahl = designWahl();
  const geraetDunkel = matchMedia("(prefers-color-scheme: dark)").matches;
  const dunkel = wahl === "dunkel" || (wahl === "auto" && geraetDunkel);
  document.documentElement.dataset.theme = dunkel ? "dunkel" : "hell";
}

// Wenn das Gerät von hell auf dunkel wechselt (z. B. abends automatisch), mitwechseln
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", wendeDesignAn);

// ---------- Daten sichern & übertragen ----------

// Alle Daten der App aus dem localStorage einsammeln
function alleDaten() {
  const daten = {};
  for (let i = 0; i < localStorage.length; i++) {
    const schluessel = localStorage.key(i);
    if (schluessel.startsWith(SPEICHER_PRAEFIX)) {
      daten[schluessel.slice(SPEICHER_PRAEFIX.length)] = JSON.parse(localStorage.getItem(schluessel));
    }
  }
  return daten;
}

// Export: alles als Datei herunterladen (z. B. in "Dateien" auf dem iPhone)
function exportiereDaten() {
  const paket = {
    app: "selfATHLETE",
    version: 1,
    exportiertAm: new Date().toISOString(),
    daten: alleDaten(),
  };
  // Ein "Blob" ist eine Datei, die nur im Arbeitsspeicher existiert
  const datei = new Blob([JSON.stringify(paket, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(datei);
  link.download = `selfATHLETE-backup-${heuteText()}.json`;
  link.click();                                   // Download starten
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Import: Datei einlesen und ALLE Daten damit ersetzen
function importiereDaten(datei) {
  const leser = new FileReader();
  leser.onload = () => {
    let paket;
    try {
      paket = JSON.parse(leser.result);
    } catch (fehler) {
      alert("Diese Datei konnte nicht gelesen werden.");
      return;
    }
    if (!paket || paket.app !== "selfATHLETE" || typeof paket.daten !== "object") {
      alert("Das ist keine selfATHLETE-Sicherung.");
      return;
    }
    const vom = new Date(paket.exportiertAm).toLocaleString("de-DE");
    if (!confirm(`Sicherung vom ${vom} laden?\n\nAchtung: Alle Daten auf diesem Gerät werden dadurch ersetzt.`)) return;

    loescheAlleDaten();
    Object.entries(paket.daten).forEach(([schluessel, wert]) => Speicher.speichern(schluessel, wert));
    wendeDesignAn();
    alert("Fertig! Deine Daten sind da. 💪");
    zeigeAnsicht("heute");
  };
  leser.readAsText(datei);
}

function loescheAlleDaten() {
  Object.keys(alleDaten()).forEach((schluessel) => localStorage.removeItem(SPEICHER_PRAEFIX + schluessel));
}

// ---------- Die Ansicht "Einstellungen" ----------

function zeigeEinstellungen(inhalt) {
  const wahl = designWahl();
  const designKnopf = (wert, text) => `
    <input type="radio" name="design" value="${wert}" id="design-${wert}" ${wahl === wert ? "checked" : ""}>
    <label for="design-${wert}">${text}</label>`;

  inhalt.innerHTML = `
    <button class="zurueck-knopf" id="einstellungen-zurueck">‹ Zurück</button>
    <header class="kopf">
      <h1>Einstellungen</h1>
    </header>

    <h3 class="gruppe">Profil</h3>
    <div class="karte formular">
      <label class="feld-label">Dein Name
        <input id="name-feld" value="${sicher(Speicher.laden("name", "Tom"))}" placeholder="Vorname" maxlength="30">
      </label>
    </div>

    <h3 class="gruppe">Design</h3>
    <div class="karte formular">
      <div class="segment" id="design-wahl">
        ${designKnopf("auto", "Automatisch")}
        ${designKnopf("hell", "☀️ Hell")}
        ${designKnopf("dunkel", "🌙 Dunkel")}
      </div>
      <p class="hinweis">„Automatisch“ richtet sich nach deinem Gerät.</p>
    </div>

    <h3 class="gruppe">Ziele</h3>
    <div class="karte formular">
      <label class="feld-label">💧 Wasser pro Tag (ml)
        <input type="number" id="ziel-wasser" min="500" max="6000" step="250" value="${wasserZiel()}">
      </label>
      <label class="feld-label">😴 Schlaf pro Nacht (Std.)
        <input type="number" id="ziel-schlaf" min="5" max="12" step="0.5" value="${schlafZiel()}">
      </label>
    </div>

    <h3 class="gruppe">Deine Daten</h3>
    <div class="karte formular">
      <p class="hinweis">
        Deine Daten liegen nur auf diesem Gerät – auf keinem Server.
        Mit einer Sicherung kannst du sie aufheben oder auf ein anderes Gerät übertragen
        (z. B. vom Laptop aufs iPhone).
      </p>
      <button class="knopf" id="export-knopf">📤 Sicherung herunterladen</button>
      <label class="knopf knopf-zweit" for="import-datei">📥 Sicherung laden</label>
      <input type="file" id="import-datei" accept=".json,application/json" hidden>
    </div>

    <button class="knopf knopf-leise" id="alles-loeschen">Alle Daten löschen</button>

    <p class="ueber">
      <span class="wortmarke-klein">self<span class="verlauf-text">ATHLETE</span></span><br>
      Version ${APP_VERSION} · gebaut von ${sicher(Speicher.laden("name", "Tom"))} 💪
    </p>
  `;

  inhalt.querySelector("#einstellungen-zurueck").addEventListener("click", () => zeigeAnsicht(vorherigeAnsicht));

  inhalt.querySelector("#name-feld").addEventListener("change", (e) => {
    Speicher.speichern("name", e.target.value.trim() || "Tom");
  });

  inhalt.querySelectorAll("#design-wahl input").forEach((knopf) => {
    knopf.addEventListener("change", () => {
      Speicher.speichern("design", knopf.value);
      wendeDesignAn();
    });
  });

  inhalt.querySelector("#ziel-wasser").addEventListener("change", (e) => {
    Speicher.speichern("wasserZiel", Number(e.target.value) || WASSER_STANDARD_ZIEL);
  });
  inhalt.querySelector("#ziel-schlaf").addEventListener("change", (e) => {
    Speicher.speichern("schlafZiel", Number(e.target.value) || SCHLAF_STANDARD_ZIEL);
  });

  inhalt.querySelector("#export-knopf").addEventListener("click", exportiereDaten);
  inhalt.querySelector("#import-datei").addEventListener("change", (e) => {
    if (e.target.files[0]) importiereDaten(e.target.files[0]);
    e.target.value = ""; // damit man dieselbe Datei nochmal wählen kann
  });

  inhalt.querySelector("#alles-loeschen").addEventListener("click", () => {
    if (!confirm("Wirklich ALLE Daten löschen? Das kann man nicht rückgängig machen.")) return;
    if (!confirm("Ganz sicher? Tipp: Vorher eine Sicherung herunterladen.")) return;
    loescheAlleDaten();
    wendeDesignAn();
    zeigeAnsicht("heute");
  });
}
