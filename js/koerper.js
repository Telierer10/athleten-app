// =====================================================================
// koerper.js – der Tab "Körper": Wasser, Schlaf, Supplements und Schmerz-Check.
// Die einzelnen Bereiche kommen aus wasser.js, schlaf.js, supplements.js und schmerz.js.
// Die Ziele (Wasser/Schlaf) stellt man in den Einstellungen ein.
// =====================================================================

function zeigeKoerper(inhalt) {
  inhalt.innerHTML = `
    <header class="kopf">
      <h1>Körper</h1>
      <p class="unterzeile">Trinken, schlafen, regenerieren.</p>
    </header>

    ${wasserKarteHtml()}

    ${schlafBereichHtml()}

    ${supplementsBereichHtml()}

    <div id="schmerz-bereich">${schmerzKarteHtml()}</div>
  `;

  verbindeWasser(inhalt);
  verbindeSchlaf(inhalt);
  verbindeSupplements(inhalt);
  verbindeSchmerz(inhalt);
}
