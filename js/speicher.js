// =====================================================================
// speicher.js – merkt sich deine Daten im Browser (localStorage).
//
// localStorage ist wie ein kleiner Notizblock IM Browser auf DEINEM Gerät.
// Die Daten bleiben, auch wenn du die App schließt – aber sie werden an
// keinen Server geschickt. Niemand außer dir sieht sie.
// =====================================================================

const SPEICHER_PRAEFIX = "athleten-app:";

const Speicher = {
  // Etwas laden. Gibt es noch nichts, kommt "standard" zurück.
  laden(schluessel, standard) {
    try {
      const text = localStorage.getItem(SPEICHER_PRAEFIX + schluessel);
      return text === null ? standard : JSON.parse(text);
    } catch (fehler) {
      return standard;
    }
  },

  // Etwas speichern. JSON.stringify macht aus Listen/Objekten einen Text.
  speichern(schluessel, wert) {
    try {
      localStorage.setItem(SPEICHER_PRAEFIX + schluessel, JSON.stringify(wert));
    } catch (fehler) {
      alert("Speichern hat nicht geklappt. Ist der Speicher voll oder privat-Modus aktiv?");
    }
  },
};
