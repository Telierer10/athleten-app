# selfATHLETE 🤾

Meine eigene App für **Schule, Training und Körper**, alles an einem Ort.
Gebaut im November 2026 in meinem Schülerpraktikum, mit reinem HTML, CSS und JavaScript. Es gibt kein Framework und keinen Build-Schritt.

👉 **Online:** https://telierer10.github.io/athleten-app

---

## Was die App kann

| Tab | Funktionen |
|---|---|
| 🏠 **Heute** | Begrüßung, „Als Nächstes“, Erinnerungen (Schlaf, Training eintragen, Sicherung), To-dos und Geburtstage, Wasser, Supplements, Tagesplan, fällige Aufgaben, Vorschau auf morgen |
| 📝 **Aufgaben** | 📚 Hausaufgaben mit Fach-Chips · ✅ To-dos mit Uhrzeit · 🎂 Geburtstage, beides mit **📅 In Kalender** (iPhone-Wecker) |
| 🤾 **Training** | Einheiten und Spiele eintragen (Gefühl, Energie, Tore, Assists), Statistik, Form-Kurve, Tore-Diagramm |
| 💧 **Körper** | Wasser (Vollbild mit Wellen-Simulation), Schlaf, Supplements mit 🔥 Serie, 🩹 Schmerz-Check am Körper |
| 📅 **Plan** | Wochenplan (Schule, Training, Physio, Spiele …) |
| ⚙️ **Einstellungen** | Name, Hell/Dunkel, Ziele, **Sicherung exportieren/importieren**, alles löschen |

---

## Auf dem iPhone installieren

1. In **Safari** die Seite öffnen: `telierer10.github.io/athleten-app`
2. Unten auf **Teilen** (□↑) tippen, dann **„Zum Home-Bildschirm“** wählen
3. Danach startet die App ohne Adressleiste und läuft auch **offline**.

⚠️ **Wichtig:** Safari und die App auf dem Home-Bildschirm haben **getrennte Speicher**.
Hast du schon Daten in Safari eingetragen, mach in Safari ⚙️ → **Exportieren** und in der installierten App ⚙️ → **Importieren**.

## Meine Daten sichern 💾

Alle Daten liegen **nur auf dem Gerät** (im `localStorage` des Browsers). Es gibt keine Cloud.
- Ungefähr **einmal pro Woche** ⚙️ → **Exportieren**, die Datei in iCloud oder „Dateien“ speichern. Die App erinnert mich daran auf „Heute“.
- Neues Handy? Dort einfach ⚙️ → **Importieren**.

---

## Welche Datei macht was?

```
athleten-app/
├── index.html            Gerüst: Tab-Leiste + lädt alle Dateien
├── manifest.json         App-Name + Icon (zum Installieren)
├── sw.js                 Service Worker: macht die App offline-fähig
├── icons/                App-Icons
├── css/style.css         das ganze Aussehen (Farben ganz oben in :root)
└── js/
    ├── hilfen.js         kleine Helfer (Datum, Uhrzeit, sicher() gegen Code im Text)
    ├── speicher.js       Speicher.laden() / Speicher.speichern()
    ├── plan.js           Wochenplan + Termin-ARTEN
    ├── aufgaben.js       Hausaufgaben + FAECHER-Liste
    ├── erinnerungen.js   To-dos, Geburtstage, Kalender-Datei (.ics)
    ├── training.js       Training & Spiele + Diagramme
    ├── wassersimulation.js  die Wellen-Physik (Canvas)
    ├── wasser.js         Wasser-Karte + Vollbild
    ├── schlaf.js         Schlaf
    ├── supplements.js    Supplements + Serie
    ├── schmerz.js        Schmerz-Check (Körper als SVG)
    ├── koerper.js        setzt den Tab „Körper“ zusammen
    ├── einstellungen.js  Einstellungen, Export/Import
    ├── heute.js          die Startseite
    └── app.js            startet alles, wechselt die Tabs
```

**Reihenfolge:** In `index.html` werden die Dateien von oben nach unten geladen. `app.js` kommt **immer zuletzt**, weil es alle anderen braucht.

---

## So baue ich eine neue Funktion ein

**Beispiel: neuer Bereich „Verletzungen“**

1. Neue Datei `js/verletzungen.js` anlegen. Darin stehen:
   - `ladeVerletzungen()` → `Speicher.laden("verletzungen", [])`
   - eine Funktion, die HTML baut (`verletzungenHtml()`)
   - eine Funktion, die Knöpfe verbindet (`verbindeVerletzungen(bereich)`)
2. In `index.html` die Datei **vor** `app.js` einbinden: `<script src="js/verletzungen.js"></script>`
3. In `sw.js` die Datei zur Liste `DATEIEN` hinzufügen und den Cache-Namen hochzählen (`selfathlete-v2`)
4. Anzeigen lassen, z. B. in `koerper.js`
5. Nach jeder Änderung die Daten mit `Speicher.speichern(...)` speichern und dann `aktualisieren()` aufrufen, damit die Ansicht neu gezeichnet wird.

**Ein ganz neuer Tab?** → in `app.js` bei `ANSICHTEN` eine Zeile ergänzen und in `index.html` einen Knopf in der `<nav class="tabbar">` hinzufügen.

**Kleine Sachen zum Anpassen:**
- Fächer → `FAECHER` in `js/aufgaben.js`
- Termin-Arten (z. B. Mountainbike 🚵) → `ARTEN` in `js/plan.js`
- Körperteil-Namen → `KOERPER_NAMEN` in `js/schmerz.js`
- Farben → ganz oben in `css/style.css`
- Wasser-Physik → `DAEMPFUNG`, `LICHT` in `js/wassersimulation.js`

### Testen
- Am PC: `index.html` doppelklicken. Mit **F12** öffnen sich die Entwicklerwerkzeuge: Unter **Konsole** stehen Fehler, unter **Anwendung → Lokaler Speicher** die Daten.
- Immer auch **auf dem Handy** testen! Falls eine Änderung nicht ankommt: einen privaten Tab öffnen oder ein paar Minuten warten (Cache).

### Hochladen
```
git add .
git commit -m "Was ich geändert habe"
git push
```
Nach ca. 1 Minute ist die neue Version online.

---

## Ideen für später 💡
- 🤒 **Krank-Tage** eintragen (und dann automatisch kein Training erwartet)
- 🔁 To-dos, die sich **wiederholen** (z. B. jeden Sonntag Tasche packen)
- 📈 Schmerz-Verlauf als Diagramm
- 🏋️ Trainingsplan mit Übungen und Gewichten
- 🔔 Echte Push-Nachrichten (dafür bräuchte man einen Server, z. B. Firebase)

---

## Kostenlose Werkzeuge für zu Hause

| Werkzeug | Wofür | Kosten |
|---|---|---|
| **VS Code** (code.visualstudio.com) | Code schreiben | kostenlos |
| **Git** (git-scm.com) | Versionen speichern | kostenlos |
| **GitHub** + **GitHub Pages** | Code online sichern + Website hosten | kostenlos |
| **GitHub Copilot Free** (in VS Code) | KI-Hilfe direkt beim Programmieren | kostenlos (begrenzt) |
| **GitHub Student Developer Pack** (education.github.com) | Copilot Pro + viele Tools gratis | kostenlos für Schüler (mit Schulnachweis) |
| **ChatGPT** / **Gemini** (Free) | Fragen stellen, Fehler erklären lassen | kostenlos |

**Ehrlich gesagt:** Claude Code, mit dem ich die App im Praktikum gebaut habe, braucht ein Anthropic-Konto. Das gibt es erst **ab 18**. Für zu Hause ist **VS Code + GitHub Copilot** die beste kostenlose Alternative.

**Tipp für die Arbeit mit KI:** Erst selbst überlegen, dann fragen. Lass dir den Code **erklären** und kopier ihn nicht nur. Danach immer testen.

---

*Gebaut von Tom · 2026*
