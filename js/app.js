// =====================================================================
// app.js – der "Dirigent". Startet die App und wechselt zwischen den Tabs.
// Diese Datei wird als LETZTE geladen, weil sie alle anderen braucht.
// =====================================================================

const inhalt = document.querySelector("#inhalt");

// Welcher Tab zeigt welche Ansicht? Neue Ansicht = neue Zeile hier + Knopf in index.html
const ANSICHTEN = {
  heute: zeigeHeute,
  aufgaben: zeigeAufgaben,
  training: zeigeTraining,
  koerper: zeigeKoerper,
  plan: zeigePlan,
  einstellungen: zeigeEinstellungen, // kein eigener Tab – erreichbar über ⚙️ auf "Heute"
};

let aktuelleAnsicht = "heute";
let vorherigeAnsicht = "heute"; // wohin "‹ Zurück" in den Einstellungen führt

// Zu einem Tab wechseln
function zeigeAnsicht(name) {
  if (name !== aktuelleAnsicht) vorherigeAnsicht = aktuelleAnsicht;
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
wendeDesignAn();
zeigeAnsicht("heute");

// Service Worker starten (macht die App offline-fähig, siehe sw.js).
// Klappt nur über https:// (GitHub Pages), nicht beim Öffnen als Datei – das ist okay.
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js");
}

// Den Browser bitten, unsere Daten NICHT automatisch zu löschen, wenn der Speicher knapp wird
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist();
}
