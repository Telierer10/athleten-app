// =====================================================================
// koerper.js – der Tab "Körper": Wasser, Schlaf und Supplements auf einer Seite.
// Die einzelnen Bereiche kommen aus wasser.js, schlaf.js und supplements.js.
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
  `;

  verbindeWasser(inhalt);
  verbindeSchlaf(inhalt);
  verbindeSupplements(inhalt);
}
