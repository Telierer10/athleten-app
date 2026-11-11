// =====================================================================
// app.js – der "Dirigent". Startet die App und wechselt zwischen den Tabs.
// Diese Datei wird als LETZTE geladen, weil sie alle anderen braucht.
// =====================================================================

const inhalt = document.querySelector("#inhalt");

// Platzhalter für Ansichten, die noch gebaut werden
function zeigeBald(titel, icon, wann) {
  return (bereich) => {
    bereich.innerHTML = `
      <header class="kopf"><h1>${titel}</h1></header>
      <div class="karte bald">
        <p class="bald-icon">${icon}</p>
        <p>Kommt ${wann}!</p>
      </div>`;
  };
}

// Welcher Tab zeigt welche Ansicht? Neue Ansicht = neue Zeile hier + Knopf in index.html
const ANSICHTEN = {
  heute: zeigeHeute,
  aufgaben: zeigeAufgaben,
  training: zeigeBald("Training & Spiele", "🤾", "am Donnerstag"),
  schlaf: zeigeBald("Schlaf", "😴", "am Donnerstag"),
  plan: zeigePlan,
};

let aktuelleAnsicht = "heute";

// Zu einem Tab wechseln
function zeigeAnsicht(name) {
  aktuelleAnsicht = name;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("aktiv", tab.dataset.ansicht === name);
  });
  aktualisieren();
  window.scrollTo(0, 0);
}

// Aktuelle Ansicht neu zeichnen (nach jeder Änderung aufrufen)
function aktualisieren() {
  ANSICHTEN[aktuelleAnsicht](inhalt);

  // Rotes Badge am Aufgaben-Tab
  const badge = document.querySelector("#badge-aufgaben");
  const anzahl = dringendeAnzahl();
  badge.textContent = anzahl;
  badge.hidden = anzahl === 0;
}

// Klicks auf die Tab-Leiste
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => zeigeAnsicht(tab.dataset.ansicht));
});

// Jede Minute die Heute-Ansicht auffrischen, damit "Jetzt" und "in X Min." stimmen
setInterval(() => {
  if (aktuelleAnsicht === "heute") aktualisieren();
}, 60 * 1000);

// Los geht's!
zeigeAnsicht("heute");
