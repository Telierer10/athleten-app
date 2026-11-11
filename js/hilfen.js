// =====================================================================
// hilfen.js – kleine Werkzeuge, die überall in der App gebraucht werden.
// Vor allem: Rechnen mit Datum und Uhrzeit.
// =====================================================================

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const WOCHENTAGE_KURZ = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
                "August", "September", "Oktober", "November", "Dezember"];

// Wir speichern Daten immer als Text "JJJJ-MM-TT", z. B. "2026-11-11".
// Das lässt sich leicht speichern und sortieren.

// Datum-Objekt  ->  "2026-11-11"
function datumAlsText(datum) {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, "0"); // Monate zählen in JS ab 0!
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag}`;
}

// "2026-11-11"  ->  Datum-Objekt
function textAlsDatum(text) {
  const [jahr, monat, tag] = text.split("-").map(Number);
  return new Date(jahr, monat - 1, tag);
}

function heuteText() {
  return datumAlsText(new Date());
}

// plusTage("2026-11-11", 1)  ->  "2026-11-12"
function plusTage(text, anzahl) {
  const datum = textAlsDatum(text);
  datum.setDate(datum.getDate() + anzahl);
  return datumAlsText(datum);
}

// Wie viele Tage bis zu diesem Datum? (0 = heute, 1 = morgen, -1 = gestern)
function tageBis(text) {
  const millisekunden = textAlsDatum(text) - textAlsDatum(heuteText());
  return Math.round(millisekunden / (24 * 60 * 60 * 1000));
}

// Datum-Objekt  ->  "Mittwoch, 11. November"
function langesDatum(datum) {
  return `${WOCHENTAGE[datum.getDay()]}, ${datum.getDate()}. ${MONATE[datum.getMonth()]}`;
}

// Fälligkeitsdatum in Menschensprache: "heute", "morgen", "Freitag", "seit 2 Tagen" ...
function faelligText(text) {
  const tage = tageBis(text);
  const datum = textAlsDatum(text);
  if (tage < -1) return `seit ${-tage} Tagen`;
  if (tage === -1) return "seit gestern";
  if (tage === 0) return "heute";
  if (tage === 1) return "morgen";
  if (tage < 7) return WOCHENTAGE[datum.getDay()];
  return `${WOCHENTAGE_KURZ[datum.getDay()]}, ${datum.getDate()}.${datum.getMonth() + 1}.`;
}

// "2026-11-11"  ->  "Mi, 11.11."
function kurzesDatum(text) {
  const datum = textAlsDatum(text);
  return `${WOCHENTAGE_KURZ[datum.getDay()]}, ${datum.getDate()}.${datum.getMonth() + 1}.`;
}

// Montag der aktuellen Woche als Text
function montagDieserWoche() {
  const tageSeitMontag = (new Date().getDay() + 6) % 7; // Mo=0, Di=1, ... So=6
  return plusTage(heuteText(), -tageSeitMontag);
}

// 4.25  ->  "4,3" (deutsches Komma)
function zahlText(zahl, nachkomma = 1) {
  return zahl.toLocaleString("de-DE", { maximumFractionDigits: nachkomma });
}

// "18:30"  ->  1110 (Minuten seit Mitternacht). Damit kann man Uhrzeiten vergleichen.
function zeitAlsMinuten(zeit) {
  const [stunden, minuten] = zeit.split(":").map(Number);
  return stunden * 60 + minuten;
}

function jetztMinuten() {
  const jetzt = new Date();
  return jetzt.getHours() * 60 + jetzt.getMinutes();
}

// 135  ->  "2 Std. 15 Min."
function dauerText(minuten) {
  const stunden = Math.floor(minuten / 60);
  const rest = minuten % 60;
  if (stunden === 0) return `${rest} Min.`;
  return rest === 0 ? `${stunden} Std.` : `${stunden} Std. ${rest} Min.`;
}

// Eine eindeutige ID für jeden Eintrag, z. B. "lq3k9x2a"
function neueId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// SICHERHEIT: Text, den DU eintippst, wird "entschärft", bevor er in die Seite kommt.
// Sonst könnte z. B. "<b>" im Hausaufgaben-Text die Seite kaputt machen.
function sicher(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
