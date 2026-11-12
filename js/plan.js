// =====================================================================
// plan.js – dein Wochenplan (Schule, Training, Physio, Spiele).
// Jeder Wochentag hat eine Liste von Terminen.
// =====================================================================

// Die Arten von Terminen – mit Symbol und Farbe.
// Neue Art gewünscht? Einfach hier eine Zeile hinzufügen!
const ARTEN = {
  schule:    { name: "Schule",          icon: "📚", farbe: "var(--blau)" },
  training:  { name: "Training",        icon: "🤾", farbe: "var(--orange)" },
  physio:    { name: "Physio/Athletik", icon: "💪", farbe: "var(--gruen)" },
  spiel:     { name: "Spiel",           icon: "🏆", farbe: "var(--rot)" },
  sonstiges: { name: "Sonstiges",       icon: "📌", farbe: "var(--grau)" },
};

// Reihenfolge der Tage in der Anzeige: Montag zuerst (0 = Sonntag in JavaScript)
const TAGE_REIHENFOLGE = [1, 2, 3, 4, 5, 6, 0];

// Der Startplan beim allerersten Öffnen. Uhrzeiten bitte in der App anpassen!
function standardPlan() {
  const termin = (art, titel, von, bis) => ({ id: neueId(), art, titel, von, bis });
  return {
    0: [],
    1: [termin("schule", "Schule", "08:00", "13:15"), termin("training", "Handballtraining", "18:00", "19:30")],
    2: [termin("schule", "Schule", "08:00", "16:00"), termin("physio", "Physio / Athletik", "17:30", "18:30")],
    3: [termin("schule", "Schule", "08:00", "13:15"), termin("training", "Handballtraining", "18:00", "19:30")],
    4: [termin("schule", "Schule", "08:00", "16:00"), termin("training", "Handballtraining", "18:00", "19:30")],
    5: [termin("schule", "Schule", "08:00", "13:15")],
    6: [termin("spiel", "Handballspiel", "15:00", "17:00")],
  };
}

function ladePlan() {
  let plan = Speicher.laden("plan", null);
  if (plan === null) {
    plan = standardPlan();
    Speicher.speichern("plan", plan);
  }
  return plan;
}

// Alle Termine an einem Datum, nach Uhrzeit sortiert
function termineAm(datumText) {
  const wochentag = textAlsDatum(datumText).getDay();
  const termine = ladePlan()[wochentag] || [];
  return [...termine].sort((a, b) => a.von.localeCompare(b.von));
}

// ---------- Die Ansicht "Plan" ----------

function zeigePlan(inhalt) {
  const plan = ladePlan();

  const artOptionen = Object.entries(ARTEN)
    .map(([schluessel, art]) => `<option value="${schluessel}">${art.icon} ${art.name}</option>`)
    .join("");
  const tagOptionen = TAGE_REIHENFOLGE
    .map((tag) => `<option value="${tag}">${WOCHENTAGE[tag]}</option>`)
    .join("");

  // Für jeden Tag eine Karte mit seinen Terminen
  const tagKarten = TAGE_REIHENFOLGE.map((tag) => {
    const termine = [...(plan[tag] || [])].sort((a, b) => a.von.localeCompare(b.von));
    const zeilen = termine.length === 0
      ? `<li class="leer">Frei 🌲</li>`
      : termine.map((t) => {
          const art = ARTEN[t.art] || ARTEN.sonstiges;
          return `
            <li class="zeile" style="--farbe:${art.farbe}">
              <span class="punkt"></span>
              <span class="zeile-text">${art.icon} ${sicher(t.titel)}</span>
              <span class="zeile-zeit">${t.von}${t.bis ? "–" + t.bis : ""}</span>
              <button class="loeschen" data-tag="${tag}" data-id="${t.id}" aria-label="Löschen">✕</button>
            </li>`;
        }).join("");
    return `
      <h3 class="gruppe">${WOCHENTAGE[tag]}</h3>
      <ul class="karte liste">${zeilen}</ul>`;
  }).join("");

  inhalt.innerHTML = `
    <header class="kopf">
      <h1>Wochenplan</h1>
      <p class="unterzeile">Dein fester Ablauf jede Woche.</p>
    </header>

    <h3 class="gruppe">Termin hinzufügen</h3>
    <form class="karte formular" id="termin-form">
      <div class="zwei-spalten">
        <select id="t-tag">${tagOptionen}</select>
        <select id="t-art">${artOptionen}</select>
      </div>
      <input id="t-titel" placeholder="Titel (z. B. Handballtraining)" maxlength="40">
      <div class="zwei-spalten">
        <label class="feld-label">von <input type="time" id="t-von" required></label>
        <label class="feld-label">bis <input type="time" id="t-bis"></label>
      </div>
      <button class="knopf" type="submit">Hinzufügen</button>
    </form>

    ${tagKarten}

    <button class="knopf knopf-leise" id="plan-zuruecksetzen">Plan auf Start zurücksetzen</button>
  `;

  // --- Was passiert bei Klicks/Eingaben? ---

  inhalt.querySelector("#termin-form").addEventListener("submit", (e) => {
    e.preventDefault(); // verhindert, dass die Seite neu lädt
    const tag = inhalt.querySelector("#t-tag").value;
    const art = inhalt.querySelector("#t-art").value;
    const titel = inhalt.querySelector("#t-titel").value.trim() || ARTEN[art].name;
    const von = inhalt.querySelector("#t-von").value;
    const bis = inhalt.querySelector("#t-bis").value;

    const neuerPlan = ladePlan();
    neuerPlan[tag] = neuerPlan[tag] || [];
    neuerPlan[tag].push({ id: neueId(), art, titel, von, bis });
    Speicher.speichern("plan", neuerPlan);
    aktualisieren();
  });

  inhalt.querySelectorAll(".loeschen").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      const neuerPlan = ladePlan();
      const tag = knopf.dataset.tag;
      neuerPlan[tag] = neuerPlan[tag].filter((t) => t.id !== knopf.dataset.id);
      Speicher.speichern("plan", neuerPlan);
      aktualisieren();
    });
  });

  inhalt.querySelector("#plan-zuruecksetzen").addEventListener("click", () => {
    if (confirm("Wirklich den ganzen Plan auf den Start zurücksetzen?")) {
      Speicher.speichern("plan", standardPlan());
      aktualisieren();
    }
  });
}
