// =====================================================================
// sw.js – der "Service Worker". Ein kleines Programm, das der Browser
// im Hintergrund laufen lässt. Es sitzt zwischen App und Internet:
//
//   App fragt nach einer Datei  →  Service Worker  →  Internet
//                                        ↓ (kein Internet?)
//                                  Kopie aus dem Cache
//
// Strategie "Netzwerk zuerst": Mit Internet bekommst du IMMER die neueste
// Version (kein Cache-Ärger mehr). Ohne Internet nimmt er die letzte Kopie.
// =====================================================================

const CACHE = "selfathlete-v1";

// Diese Dateien werden schon beim ersten Öffnen gespeichert → App klappt offline.
// Neue JS-Datei gebaut? Hier ergänzen!
const DATEIEN = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css",
  "icons/icon-192.png",
  "icons/apple-touch-icon.png",
  "js/hilfen.js", "js/speicher.js", "js/plan.js", "js/aufgaben.js", "js/erinnerungen.js",
  "js/training.js", "js/wassersimulation.js", "js/wasser.js", "js/schlaf.js",
  "js/supplements.js", "js/schmerz.js", "js/koerper.js", "js/einstellungen.js",
  "js/heute.js", "js/app.js",
];

// 1. Installieren: alle Dateien in den Cache legen
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(DATEIEN)));
  self.skipWaiting(); // neue Version sofort benutzen
});

// 2. Aktivieren: alte Caches (z. B. "selfathlete-v0") aufräumen
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// 3. Jede Anfrage: erst Internet, sonst Cache
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((antwort) => {
        // Frische Kopie für später merken (auch die Google-Schriften)
        const kopie = antwort.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
