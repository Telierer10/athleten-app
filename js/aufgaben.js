// =====================================================================
// aufgaben.js – deine Hausaufgaben.
// Jede Aufgabe: { id, fach, text, faellig: "2026-11-12", erledigt: true/false }
// =====================================================================

// Vorschläge für das Fach-Feld. Fehlt eins? Einfach ergänzen!
const FAECHER = ["Mathe", "Deutsch", "Englisch", "Französisch", "Latein", "Spanisch",
  "Biologie", "Chemie", "Physik", "Geschichte", "Erdkunde", "Politik/SoWi",
  "Informatik", "Kunst", "Musik", "Religion", "Sport"];

function ladeAufgaben() {
  return Speicher.laden("aufgaben", []);
}

function speichereAufgaben(aufgaben) {
  Speicher.speichern("aufgaben", aufgaben);
}

// Offene Aufgaben, die früheste zuerst
function offeneAufgaben() {
  return ladeAufgaben()
    .filter((a) => !a.erledigt)
    .sort((a, b) => a.faellig.localeCompare(b.faellig));
}

// Wie viele Aufgaben sind heute/morgen fällig oder schon überfällig? (für das rote Badge)
function dringendeAnzahl() {
  return offeneAufgaben().filter((a) => tageBis(a.faellig) <= 1).length;
}

// HTML für EINE Aufgabe. Wird auch von der Heute-Ansicht benutzt.
function aufgabeHtml(a) {
  const tage = tageBis(a.faellig);
  let klasse = "";
  if (!a.erledigt && tage < 0) klasse = "ueberfaellig";
  else if (!a.erledigt && tage <= 1) klasse = "bald";

  return `
    <li class="zeile aufgabe ${a.erledigt ? "erledigt" : ""}">
      <button class="haken" data-haken="${a.id}" aria-label="Erledigt">${a.erledigt ? "✓" : ""}</button>
      <div class="zeile-text">
        <strong>${sicher(a.fach)}</strong>
        <span class="aufgabe-text">${sicher(a.text)}</span>
      </div>
      <span class="faellig ${klasse}">${faelligText(a.faellig)}</span>
      <button class="loeschen" data-aufgabe-loeschen="${a.id}" aria-label="Löschen">✕</button>
    </li>`;
}

// Macht die Haken- und Löschen-Knöpfe in einem Bereich klickbar
function verbindeAufgabenKnoepfe(bereich) {
  bereich.querySelectorAll("[data-haken]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      const aufgaben = ladeAufgaben();
      const aufgabe = aufgaben.find((a) => a.id === knopf.dataset.haken);
      aufgabe.erledigt = !aufgabe.erledigt;            // umschalten: erledigt <-> offen
      aufgabe.erledigtAm = aufgabe.erledigt ? heuteText() : null;
      speichereAufgaben(aufgaben);
      aktualisieren();
    });
  });

  bereich.querySelectorAll("[data-aufgabe-loeschen]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      const rest = ladeAufgaben().filter((a) => a.id !== knopf.dataset.aufgabeLoeschen);
      speichereAufgaben(rest);
      aktualisieren();
    });
  });
}

// Eine Gruppe ("Morgen", "Später", ...) – leere Gruppen werden weggelassen
function aufgabenGruppe(titel, liste) {
  if (liste.length === 0) return "";
  return `
    <h3 class="gruppe">${titel} <span class="anzahl">${liste.length}</span></h3>
    <ul class="karte liste">${liste.map(aufgabeHtml).join("")}</ul>`;
}

// ---------- Die Ansicht "Aufgaben" ----------

function zeigeAufgaben(inhalt) {
  const offen = offeneAufgaben();
  const erledigt = ladeAufgaben()
    .filter((a) => a.erledigt)
    .sort((a, b) => (b.erledigtAm || "").localeCompare(a.erledigtAm || ""))
    .slice(0, 20); // nur die letzten 20 anzeigen

  const ueberfaellig = offen.filter((a) => tageBis(a.faellig) < 0);
  const heute = offen.filter((a) => tageBis(a.faellig) === 0);
  const morgen = offen.filter((a) => tageBis(a.faellig) === 1);
  const spaeter = offen.filter((a) => tageBis(a.faellig) > 1);

  const fachVorschlaege = FAECHER.map((f) => `<option value="${f}">`).join("");

  inhalt.innerHTML = `
    <header class="kopf">
      <h1>Aufgaben</h1>
      <p class="unterzeile">${offen.length === 0 ? "Alles erledigt. Stark! 💪" : `${offen.length} offen`}</p>
    </header>

    <form class="karte formular" id="aufgabe-form">
      <input id="a-fach" list="faecher" placeholder="Fach" required maxlength="30">
      <datalist id="faecher">${fachVorschlaege}</datalist>
      <input id="a-text" placeholder="Was ist zu tun?" required maxlength="120">
      <label class="feld-label">Fällig am <input type="date" id="a-faellig" value="${plusTage(heuteText(), 1)}" required></label>
      <button class="knopf" type="submit">Hinzufügen</button>
    </form>

    ${aufgabenGruppe("Überfällig", ueberfaellig)}
    ${aufgabenGruppe("Heute", heute)}
    ${aufgabenGruppe("Morgen", morgen)}
    ${aufgabenGruppe("Später", spaeter)}

    ${erledigt.length > 0 ? `
      <details class="erledigt-bereich">
        <summary class="gruppe">Erledigt <span class="anzahl">${erledigt.length}</span></summary>
        <ul class="karte liste">${erledigt.map(aufgabeHtml).join("")}</ul>
        <button class="knopf knopf-leise" id="erledigte-loeschen">Erledigte löschen</button>
      </details>` : ""}
  `;

  inhalt.querySelector("#aufgabe-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const aufgaben = ladeAufgaben();
    aufgaben.push({
      id: neueId(),
      fach: inhalt.querySelector("#a-fach").value.trim(),
      text: inhalt.querySelector("#a-text").value.trim(),
      faellig: inhalt.querySelector("#a-faellig").value,
      erledigt: false,
      erledigtAm: null,
    });
    speichereAufgaben(aufgaben);
    aktualisieren();
  });

  const loeschenKnopf = inhalt.querySelector("#erledigte-loeschen");
  if (loeschenKnopf) {
    loeschenKnopf.addEventListener("click", () => {
      speichereAufgaben(ladeAufgaben().filter((a) => !a.erledigt));
      aktualisieren();
    });
  }

  verbindeAufgabenKnoepfe(inhalt);
}
