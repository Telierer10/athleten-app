// =====================================================================
// heute.js – die Startseite: "Was steht heute an?"
// Sie sammelt Infos aus dem Plan und den Aufgaben.
// =====================================================================

// HTML für einen Termin in der Zeitleiste.
// "minutenJetzt" = aktuelle Uhrzeit in Minuten, -1 = keine Zeit-Markierung (z. B. für morgen)
function terminHtml(t, minutenJetzt) {
  const art = ARTEN[t.art] || ARTEN.sonstiges;
  const von = zeitAlsMinuten(t.von);
  const bis = t.bis ? zeitAlsMinuten(t.bis) : von + 60; // ohne Endzeit: 1 Stunde annehmen

  let status = "";
  if (minutenJetzt >= 0 && minutenJetzt >= bis) status = "vorbei";
  else if (minutenJetzt >= 0 && minutenJetzt >= von) status = "jetzt";

  return `
    <li class="termin ${status}" style="--farbe:${art.farbe}">
      <span class="termin-zeit">${t.von}${t.bis ? "–" + t.bis : ""}</span>
      <span class="termin-titel">${art.icon} ${sicher(t.titel)}</span>
      ${status === "jetzt" ? `<span class="jetzt-label">Jetzt</span>` : ""}
    </li>`;
}

function zeigeHeute(inhalt) {
  const heute = heuteText();
  const morgen = plusTage(heute, 1);
  const name = Speicher.laden("name", "Tom");
  const minuten = jetztMinuten();

  // Begrüßung passend zur Uhrzeit
  const stunde = new Date().getHours();
  const gruss = stunde < 11 ? "Guten Morgen" : stunde < 18 ? "Hallo" : "Guten Abend";

  const termine = termineAm(heute);
  const termineMorgen = termineAm(morgen);
  const naechster = termine.find((t) => zeitAlsMinuten(t.von) > minuten);
  const dringend = offeneAufgaben().filter((a) => tageBis(a.faellig) <= 1);

  // --- Karte "Als Nächstes" (nur wenn heute noch etwas kommt) ---
  let naechsterHtml = "";
  if (naechster) {
    const art = ARTEN[naechster.art] || ARTEN.sonstiges;
    const bisDahin = zeitAlsMinuten(naechster.von) - minuten;
    naechsterHtml = `
      <div class="karte highlight" style="--farbe:${art.farbe}">
        <p class="highlight-label">Als Nächstes</p>
        <p class="highlight-titel">${art.icon} ${sicher(naechster.titel)}</p>
        <p class="highlight-info">um ${naechster.von} · in ${dauerText(bisDahin)}</p>
      </div>`;
  }

  // --- Erinnerung: Training/Spiel ist vorbei, aber noch nicht eingetragen ---
  const sportVorbei = termine.some((t) =>
    ["training", "spiel", "physio"].includes(t.art) &&
    minuten >= (t.bis ? zeitAlsMinuten(t.bis) : zeitAlsMinuten(t.von) + 60));
  const schonEingetragen = ladeEinheiten().some((e) => e.datum === heute);
  const erinnerungHtml = sportVorbei && !schonEingetragen ? `
    <button class="karte erinnerung" data-gehe="training">
      <span class="erinnerung-icon">🤾</span>
      <span><strong>Wie lief's heute?</strong><br><span class="aufgabe-text">Trag dein Training ein →</span></span>
    </button>` : "";

  // --- Erinnerung: morgens nach dem Schlaf fragen ---
  const schlafErinnerung = stunde < 12 && !schlafAm(heute) ? `
    <button class="karte erinnerung" data-gehe="koerper">
      <span class="erinnerung-icon">😴</span>
      <span><strong>Wie hast du geschlafen?</strong><br><span class="aufgabe-text">Trag deine Nacht ein →</span></span>
    </button>` : "";

  // --- Erinnerung: Daten sichern (wenn die letzte Sicherung über 7 Tage her ist) ---
  const sicherungHtml = sicherungFaellig() ? `
    <button class="karte erinnerung" data-gehe="einstellungen">
      <span class="erinnerung-icon">💾</span>
      <span><strong>Zeit für eine Sicherung</strong><br><span class="aufgabe-text">Exportiere deine Daten in „Dateien“ →</span></span>
    </button>` : "";

  // --- To-dos für heute + Geburtstage in den nächsten 7 Tagen (aus erinnerungen.js) ---
  const todos = todosHeute();
  const todosHtml = todos.length ? `
    <h3 class="gruppe">To-dos heute <span class="anzahl">${todos.length}</span></h3>
    <ul class="karte liste">${todos.map(todoHtml).join("")}</ul>` : "";
  const bald = geburtstageSortiert().filter((g) => g.tage <= 7);
  const geburtstageHtml = bald.length ? `
    <h3 class="gruppe">Geburtstage</h3>
    <ul class="karte liste">${bald.map(geburtstagHtml).join("")}</ul>` : "";

  // --- Supplements, die heute noch fehlen ---
  const offeneSupplements = offeneSupplementsHeute();
  const supplementsHtml = offeneSupplements.length ? `
    <h3 class="gruppe">Heute noch einnehmen</h3>
    <ul class="karte liste">${offeneSupplements.map((s) => supplementHtml(s, false)).join("")}</ul>` : "";

  // --- Zeitleiste für heute ---
  const heuteListe = termine.length === 0
    ? `<p class="leer">Heute steht nichts im Plan. Genieß den freien Tag! 🌲</p>`
    : `<ul class="zeitleiste">${termine.map((t) => terminHtml(t, minuten)).join("")}</ul>`;

  // --- Aufgaben, die heute/morgen fällig sind ---
  const aufgabenHtml = dringend.length === 0
    ? `<p class="leer">Nichts fällig bis morgen ✅</p>`
    : `<ul class="liste">${dringend.map(aufgabeHtml).join("")}</ul>`;

  // --- Vorschau auf morgen (hilft beim Taschepacken) ---
  const morgenListe = termineMorgen.length === 0
    ? `<p class="leer">Morgen ist frei.</p>`
    : `<ul class="zeitleiste">${termineMorgen.map((t) => terminHtml(t, -1)).join("")}</ul>`;

  inhalt.innerHTML = `
    <div class="kopfzeile">
      <p class="wortmarke">self<span class="verlauf-text">ATHLETE</span></p>
      <button class="zahnrad" data-gehe="einstellungen" aria-label="Einstellungen">⚙️</button>
    </div>
    <header class="kopf">
      <p class="datum">${langesDatum(new Date())}</p>
      <h1>${gruss}, <span class="verlauf-text">${sicher(name)}.</span></h1>
    </header>

    ${naechsterHtml}
    ${schlafErinnerung}
    ${erinnerungHtml}
    ${sicherungHtml}

    ${todosHtml}
    ${geburtstageHtml}

    <div class="abstand-oben">${wasserKarteHtml()}</div>

    ${supplementsHtml}

    <h3 class="gruppe">Dein Tag</h3>
    <div class="karte">${heuteListe}</div>

    <h3 class="gruppe">Fällige Aufgaben ${dringend.length ? `<span class="anzahl">${dringend.length}</span>` : ""}</h3>
    <div class="karte" id="heute-aufgaben">
      ${aufgabenHtml}
      <button class="link-knopf" data-gehe="aufgaben">Alle Aufgaben →</button>
    </div>

    <h3 class="gruppe">Morgen · ${WOCHENTAGE[textAlsDatum(morgen).getDay()]}</h3>
    <div class="karte">${morgenListe}</div>
  `;

  verbindeAufgabenKnoepfe(inhalt);
  verbindeErinnerungsKnoepfe(inhalt);
  verbindeWasser(inhalt);
  verbindeSupplements(inhalt);
  inhalt.querySelectorAll("[data-gehe]").forEach((knopf) => {
    knopf.addEventListener("click", () => zeigeAnsicht(knopf.dataset.gehe));
  });
}
