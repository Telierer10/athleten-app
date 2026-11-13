// =====================================================================
// erinnerungen.js – To-dos (mit Uhrzeit) und Geburtstage.
// Sie stehen im Tab "Aufgaben" neben den Schul-Aufgaben (Umschalter oben).
//
// To-do:      { id, text, datum: "2026-11-20", zeit: "17:30" oder "", erledigt }
// Geburtstag: { id, name, datum: "2010-05-14" }   (das Jahr ist fürs Alter)
//
// WECKER: Eine Web-App kann nicht klingeln, wenn sie geschlossen ist.
// Darum gibt es "📅 In Kalender": Die App baut eine .ics-Datei (Kalender-Format,
// das jedes Handy versteht) MIT Alarm. Der iPhone-Kalender erinnert dich dann.
// =====================================================================

// Welcher Bereich im Tab "Aufgaben" gerade offen ist: "schule", "todos" oder "geburtstage"
let aufgabenBereich = "schule";

// ---------- Daten ----------

function ladeTodos() { return Speicher.laden("todos", []); }
function ladeGeburtstage() { return Speicher.laden("geburtstage", []); }

// Offene To-dos, sortiert nach Datum und Uhrzeit
function offeneTodos() {
  return ladeTodos()
    .filter((t) => !t.erledigt)
    .sort((a, b) => (a.datum + (a.zeit || "99")).localeCompare(b.datum + (b.zeit || "99")));
}

// To-dos, die heute dran oder schon überfällig sind (für "Heute" und das Badge)
function todosHeute() {
  return offeneTodos().filter((t) => tageBis(t.datum) <= 0);
}

// Wann ist der NÄCHSTE Geburtstag? Gibt das Datum dieses oder nächstes Jahr zurück.
function naechsterGeburtstag(g) {
  const jahr = new Date().getFullYear();
  let datum = `${jahr}${g.datum.slice(4)}`;          // "2010-05-14" → "2026-05-14"
  if (tageBis(datum) < 0) datum = `${jahr + 1}${g.datum.slice(4)}`;
  return datum;
}

// Geburtstage, nach "wie bald" sortiert, mit Tagen bis dahin und neuem Alter
function geburtstageSortiert() {
  return ladeGeburtstage()
    .map((g) => {
      const naechster = naechsterGeburtstag(g);
      return { ...g, naechster, tage: tageBis(naechster), alter: Number(naechster.slice(0, 4)) - Number(g.datum.slice(0, 4)) };
    })
    .sort((a, b) => a.tage - b.tage);
}

// ---------- Kalender-Datei (.ics) ----------

// "2026-11-20" + "17:30" → "20261120T173000"  (ohne Zeit → "20261120")
function icsZeit(datum, zeit) {
  const d = datum.replaceAll("-", "");
  return zeit ? `${d}T${zeit.replace(":", "")}00` : d;
}

// Baut eine .ics-Datei und lädt sie herunter. Auf dem iPhone öffnet sich dann
// "Zum Kalender hinzufügen".  alarme = Minuten relativ zum Start (z. B. -15 = 15 Min. vorher)
function inKalender({ titel, datum, zeit, jaehrlich, alarme }) {
  const ende = zeit
    ? icsZeit(datum, `${String(Math.min(23, Number(zeit.slice(0, 2)) + 1)).padStart(2, "0")}${zeit.slice(2)}`)
    : icsZeit(plusTage(datum, 1));
  const art = zeit ? "" : ";VALUE=DATE";               // ohne Uhrzeit = ganztägig
  const text = titel.replace(/[,;\\]/g, (z) => "\\" + z); // Komma & Co. müssen "maskiert" werden
  const zeilen = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//selfATHLETE//DE",
    "BEGIN:VEVENT",
    `UID:${neueId()}@selfathlete`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART${art}:${icsZeit(datum, zeit)}`,
    `DTEND${art}:${ende}`,
    `SUMMARY:${text}`,
    ...(jaehrlich ? ["RRULE:FREQ=YEARLY"] : []),
    ...alarme.flatMap((min) => [
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${text}`,
      `TRIGGER:${min < 0 ? "-" : ""}PT${Math.abs(min)}M`,
      "END:VALARM",
    ]),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // Kalender-Dateien brauchen Zeilenenden "\r\n" (so steht es im Standard)
  const datei = new Blob([zeilen.join("\r\n")], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(datei);
  link.download = `${titel.replace(/[^\wäöüÄÖÜß -]/g, "").trim() || "termin"}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// ---------- HTML-Bausteine ----------

// Umschalter oben im Tab: Schule | To-dos | Geburtstage
function bereichSchalterHtml() {
  const knopf = (wert, text) => `
    <input type="radio" name="aufgaben-bereich" id="ab-${wert}" value="${wert}" ${aufgabenBereich === wert ? "checked" : ""}>
    <label for="ab-${wert}">${text}</label>`;
  return `<div class="segment abstand-unten">${knopf("schule", "📚 Schule")}${knopf("todos", "✅ To-dos")}${knopf("geburtstage", "🎂 Geburtstage")}</div>`;
}

function verbindeBereichSchalter(inhalt) {
  inhalt.querySelectorAll('input[name="aufgaben-bereich"]').forEach((knopf) => {
    knopf.addEventListener("change", () => { aufgabenBereich = knopf.value; aktualisieren(); });
  });
}

// EIN To-do als Zeile (wird auch auf "Heute" benutzt)
function todoHtml(t) {
  const tage = tageBis(t.datum);
  const klasse = t.erledigt ? "" : tage < 0 ? "ueberfaellig" : tage === 0 ? "bald" : "";
  return `
    <li class="zeile aufgabe ${t.erledigt ? "erledigt" : ""}">
      <button class="haken" data-todo-haken="${t.id}" aria-label="Erledigt">${t.erledigt ? "✓" : ""}</button>
      <div class="zeile-text">
        <strong>${sicher(t.text)}</strong>
        <span class="aufgabe-text">${faelligText(t.datum)}${t.zeit ? ` · ${t.zeit} Uhr` : ""}</span>
      </div>
      ${t.erledigt ? "" : `<button class="kalender-knopf" data-todo-kalender="${t.id}" aria-label="In Kalender">📅</button>`}
      <button class="loeschen" data-todo-loeschen="${t.id}" aria-label="Löschen">✕</button>
    </li>`;
}

function geburtstagHtml(g) {
  const wann = g.tage === 0 ? "🎉 Heute!" : g.tage === 1 ? "Morgen" : `in ${g.tage} Tagen`;
  return `
    <li class="zeile">
      <span class="erinnerung-icon">🎂</span>
      <div class="zeile-text">
        <strong>${sicher(g.name)}</strong>
        <span class="aufgabe-text">${kurzesDatum(g.naechster)} · wird ${g.alter}</span>
      </div>
      <span class="faellig ${g.tage <= 7 ? "bald" : ""}">${wann}</span>
      <button class="kalender-knopf" data-geb-kalender="${g.id}" aria-label="In Kalender">📅</button>
      <button class="loeschen" data-geb-loeschen="${g.id}" aria-label="Löschen">✕</button>
    </li>`;
}

// Knöpfe in To-do- und Geburtstags-Zeilen klickbar machen (auch auf "Heute")
function verbindeErinnerungsKnoepfe(bereich) {
  bereich.querySelectorAll("[data-todo-haken]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      const todos = ladeTodos();
      const todo = todos.find((t) => t.id === knopf.dataset.todoHaken);
      todo.erledigt = !todo.erledigt;
      Speicher.speichern("todos", todos);
      aktualisieren();
    });
  });
  bereich.querySelectorAll("[data-todo-loeschen]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      Speicher.speichern("todos", ladeTodos().filter((t) => t.id !== knopf.dataset.todoLoeschen));
      aktualisieren();
    });
  });
  bereich.querySelectorAll("[data-todo-kalender]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      const t = ladeTodos().find((x) => x.id === knopf.dataset.todoKalender);
      // Mit Uhrzeit: Alarm genau dann. Ohne Uhrzeit: Alarm um 8 Uhr morgens (480 Min. nach Mitternacht).
      inKalender({ titel: t.text, datum: t.datum, zeit: t.zeit, alarme: t.zeit ? [0] : [480] });
    });
  });
  bereich.querySelectorAll("[data-geb-loeschen]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      if (!confirm("Geburtstag löschen?")) return;
      Speicher.speichern("geburtstage", ladeGeburtstage().filter((g) => g.id !== knopf.dataset.gebLoeschen));
      aktualisieren();
    });
  });
  bereich.querySelectorAll("[data-geb-kalender]").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      const g = geburtstageSortiert().find((x) => x.id === knopf.dataset.gebKalender);
      // Jedes Jahr, ganztägig. Alarm: am Vortag 18 Uhr (Geschenk!) und am Tag um 8 Uhr
      inKalender({ titel: `🎂 Geburtstag ${g.name}`, datum: g.naechster, jaehrlich: true, alarme: [-360, 480] });
    });
  });
}

// ---------- Die Bereiche "To-dos" und "Geburtstage" ----------

function zeigeErinnerungen(inhalt) {
  if (aufgabenBereich === "todos") {
    const offen = offeneTodos();
    const erledigt = ladeTodos().filter((t) => t.erledigt).slice(-10).reverse();
    inhalt.innerHTML = `
      <header class="kopf">
        <h1>To-dos</h1>
        <p class="unterzeile">${offen.length === 0 ? "Nichts zu tun. Genieß es! 🌲" : `${offen.length} offen`}</p>
      </header>
      ${bereichSchalterHtml()}
      <form class="karte formular" id="todo-form">
        <input name="text" placeholder="Was musst du machen?" required maxlength="120">
        <div class="zwei-spalten">
          <label class="feld-label">Tag <input type="date" name="datum" value="${heuteText()}" required></label>
          <label class="feld-label">Uhrzeit <input type="time" name="zeit"></label>
        </div>
        <label class="haken-zeile"><input type="checkbox" name="kalender" checked> 📅 Gleich in den iPhone-Kalender (mit Wecker)</label>
        <button class="knopf" type="submit">Hinzufügen</button>
      </form>
      ${offen.length ? `<ul class="karte liste abstand-oben">${offen.map(todoHtml).join("")}</ul>` : ""}
      ${erledigt.length ? `
        <details class="erledigt-bereich">
          <summary class="gruppe">Erledigt <span class="anzahl">${erledigt.length}</span></summary>
          <ul class="karte liste">${erledigt.map(todoHtml).join("")}</ul>
        </details>` : ""}
      <p class="hinweis">💡 Uhrzeit leer lassen = Erinnerung um 8 Uhr morgens.</p>`;

    inhalt.querySelector("#todo-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const todo = { id: neueId(), text: f.get("text").trim(), datum: f.get("datum"), zeit: f.get("zeit"), erledigt: false };
      Speicher.speichern("todos", [...ladeTodos(), todo]);
      if (f.get("kalender")) inKalender({ titel: todo.text, datum: todo.datum, zeit: todo.zeit, alarme: todo.zeit ? [0] : [480] });
      aktualisieren();
    });
  } else {
    const liste = geburtstageSortiert();
    inhalt.innerHTML = `
      <header class="kopf">
        <h1>Geburtstage</h1>
        <p class="unterzeile">${liste.length ? `Als Nächstes: ${sicher(liste[0].name)} (${liste[0].tage === 0 ? "heute" : `in ${liste[0].tage} Tagen`})` : "Nie wieder einen vergessen."}</p>
      </header>
      ${bereichSchalterHtml()}
      <form class="karte formular" id="geb-form">
        <input name="name" placeholder="Name" required maxlength="40">
        <label class="feld-label">Geburtstag <input type="date" name="datum" required></label>
        <label class="haken-zeile"><input type="checkbox" name="kalender" checked> 📅 Jedes Jahr im iPhone-Kalender erinnern</label>
        <button class="knopf" type="submit">Hinzufügen</button>
      </form>
      ${liste.length ? `<ul class="karte liste abstand-oben">${liste.map(geburtstagHtml).join("")}</ul>` : ""}
      <p class="hinweis">💡 Jahr nicht bekannt? Nimm irgendeins – dann stimmt nur das Alter nicht.</p>`;

    inhalt.querySelector("#geb-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const geb = { id: neueId(), name: f.get("name").trim(), datum: f.get("datum") };
      Speicher.speichern("geburtstage", [...ladeGeburtstage(), geb]);
      if (f.get("kalender")) {
        inKalender({ titel: `🎂 Geburtstag ${geb.name}`, datum: naechsterGeburtstag(geb), jaehrlich: true, alarme: [-360, 480] });
      }
      aktualisieren();
    });
  }

  verbindeBereichSchalter(inhalt);
  verbindeErinnerungsKnoepfe(inhalt);
}
