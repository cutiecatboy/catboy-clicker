# Catboy Clicker – Projektplan

## Projektziel

Catboy Clicker ist ein kleines Idle-Game mit Next.js, in dem Spielende Fisch-Snacks sammeln, Upgrades kaufen und neue Catboys sowie Skins freischalten.

**Technologie-Stack**

- Next.js mit App Router
- TypeScript
- Tailwind CSS
- React State für den Spielzustand
- `localStorage` zum Speichern des Spielstands
- Optional später: kleine Soundeffekte und zusätzliche Animationen

## 1. Spielkonzept und Core Loop

Der Spieler startet mit einem Catboy und **0 Fisch-Snacks**. Jeder Klick auf den Catboy bringt Snacks. Diese werden für Upgrades ausgegeben, die weitere Klicks verstärken oder automatisch Snacks pro Sekunde erzeugen.

Der grundlegende Spielablauf:

1. Catboy anklicken.
2. Fisch-Snacks sammeln.
3. Upgrades kaufen.
4. Mehr Snacks pro Klick oder pro Sekunde verdienen.
5. Neue Inhalte freischalten und den Fortschritt ausbauen.

## 2. Entwicklungsphasen

### Phase 1: Projekt aufsetzen

- [ ] Next.js-Projekt mit TypeScript, App Router und Tailwind CSS erstellen.
- [ ] Entwicklungsserver starten und prüfen, ob die Anwendung läuft.
- [ ] Grundlegende Seitenstruktur einrichten.

Setup:

```bash
npx create-next-app@latest catboy-clicker --yes
cd catboy-clicker
npm run dev
```

Die Anwendung ist standardmäßig unter `http://localhost:3000` erreichbar.

**Ergebnis:** Ein startendes Next.js-Projekt als Grundlage für das Spiel.

### Phase 2: Core Gameplay

- [ ] Klickbaren Catboy-Charakter implementieren.
- [ ] Bei jedem Klick Snacks vergeben.
- [ ] Aktuellen Snack-Vorrat in der UI anzeigen.
- [ ] Upgrade-Shop mit kaufbaren Verbesserungen erstellen.
- [ ] Prüfen, ob genügend Snacks für einen Kauf vorhanden sind.
- [ ] Automatisches Einkommen pro Sekunde implementieren.
- [ ] Klickstärke und passives Einkommen anhand gekaufter Upgrades berechnen.

**Ergebnis:** Eine funktionierende Spielschleife, bei der Snacks gesammelt und in Fortschritt investiert werden.

### Phase 3: Anime-Design und UI

- [ ] Responsives Layout für Desktop und Smartphone erstellen.
- [ ] Dunkle Oberfläche mit Lila- und Rosatönen gestalten.
- [ ] Großen Catboy-Avatar prominent in der Mitte platzieren.
- [ ] Upgrade-Shop in übersichtliche Karten aufteilen.
- [ ] Klick-Feedback mit schwebenden `+1`-Zahlen oder Partikeleffekten hinzufügen.
- [ ] Statusanzeigen für Snack-Vorrat, Klickstärke und Einkommen einbauen.
- [ ] Hover-, Fokus- und Disabled-Zustände für interaktive Elemente gestalten.

**Ergebnis:** Eine stimmige, gut bedienbare Oberfläche mit sichtbarem Feedback für Aktionen.

### Phase 4: Speichern und Spielstand

- [ ] Spielstand automatisch in `localStorage` speichern.
- [ ] Gespeicherten Spielstand beim Laden wiederherstellen.
- [ ] Aktuelle Snacks und insgesamt verdiente Snacks speichern.
- [ ] Gekaufte Upgrades und freigeschaltete Inhalte speichern.
- [ ] Zeitstempel der letzten Speicherung speichern.
- [ ] Reset-Funktion mit Bestätigung ergänzen.
- [ ] Ungültige oder fehlende Speicherdaten sicher behandeln.
- [ ] Zugriff auf `localStorage` ausschließlich im Browser ausführen.

**Ergebnis:** Der Fortschritt bleibt nach einem Neuladen der Seite erhalten.

### Phase 5: Testen und veröffentlichen

- [ ] Prüfen, dass ohne ausreichende Snacks kein Upgrade gekauft werden kann.
- [ ] Prüfen, dass jeder Kauf den korrekten Preis abzieht.
- [ ] Prüfen, dass Klickstärke und passives Einkommen korrekt aktualisiert werden.
- [ ] Prüfen, dass der Spielstand nach einem Neuladen korrekt wiederhergestellt wird.
- [ ] Oberfläche auf kleinen und großen Bildschirmen testen.
- [ ] Bewegungen und Soundeffekte optional abschaltbar machen.
- [ ] Produktions-Build ausführen.
- [ ] Anwendung bei Bedarf beispielsweise auf Vercel bereitstellen.

Build überprüfen:

```bash
npm run build
```

Dokumentation: [Next.js – Deploying](https://nextjs.org/docs/app/getting-started/deploying)

**Ergebnis:** Eine stabile erste Version, die lokal oder online gespielt werden kann.

## 3. Upgrade-System

Für die erste Version reichen vier Upgrades. Die folgenden Werte sind Startwerte und können beim Testen angepasst werden.

| Upgrade | Basispreis | Effekt |
|---|---:|---|
| Paw Training | 15 Snacks | +1 Snack pro Klick |
| Automatic Feeder | 50 Snacks | +1 Snack pro Sekunde |
| Neko Assistant | 250 Snacks | +5 Snacks pro Sekunde |
| Golden Bell | 500 Snacks | +5 Snacks pro Klick |

Jeder weitere Kauf eines Upgrades wird teurer. Eine mögliche Preisformel:

```ts
const cost = Math.floor(baseCost * 1.18 ** owned);
```

- `baseCost` ist der Basispreis des Upgrades.
- `owned` ist die Anzahl der bereits gekauften Exemplare.
- `1.18` ist der Preissteigerungsfaktor und kann für die Spielbalance angepasst werden.

**Wichtig:** Klickstärke und Einkommen sollten aus den gekauften Upgrades berechnet werden. Vermeide mehrere voneinander unabhängige Zustände, die dieselben Werte speichern und dadurch auseinanderlaufen könnten.

## 4. Empfohlene Projektstruktur

```text
catboy-clicker/
├── public/
│   ├── images/
│   │   ├── catboy-idle.png
│   │   └── catboy-happy.png
│   └── sounds/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── GameHeader.tsx
│   │   ├── CatboyButton.tsx
│   │   ├── ResourceDisplay.tsx
│   │   ├── UpgradeShop.tsx
│   │   └── UpgradeCard.tsx
│   ├── lib/
│   │   ├── game.ts
│   │   └── save.ts
│   └── types/
│       └── game.ts
└── package.json
```

### Zuständigkeiten der Dateien

- `GameHeader.tsx`: Spieltitel und allgemeine Navigation oder Statusinfos.
- `CatboyButton.tsx`: Klick-Interaktion, Charakter und Animationen.
- `ResourceDisplay.tsx`: Snack-Vorrat, Snacks pro Klick und Snacks pro Sekunde.
- `UpgradeShop.tsx`: Liste der verfügbaren Upgrades.
- `UpgradeCard.tsx`: Preis, Effekt und Kaufaktion eines Upgrades.
- `game.ts`: Spielregeln, Preise, Upgrade-Effekte und Berechnungen.
- `save.ts`: Laden und Speichern des Spielstands.
- `game.ts` im Typordner gibt es nicht; TypeScript-Typen für den Zustand gehören in `types/game.ts`.

Da die Spieloberfläche interaktiv ist, benötigen zustandsverändernde Komponenten gegebenenfalls die Direktive `"use client"`. Der Zugriff auf `localStorage` darf erst im Browser stattfinden, nicht während des serverseitigen Renderings.

## 5. Datenmodell für den Spielstand

Ein möglicher minimaler Spielzustand:

```ts
export type GameState = {
  snacks: number;
  totalSnacksEarned: number;
  upgradesOwned: Record<string, number>;
  unlockedCharacters: string[];
  unlockedSkins: string[];
  lastSavedAt: number;
};
```

Die Upgrade-Definitionen sollten getrennt vom aktuellen Spielstand gehalten werden. So können Preise und Effekte zentral verwaltet werden.

## 6. Release-Checkliste

### Core Gameplay

- [ ] Catboy anklicken und Snacks erhalten.
- [ ] Upgrade-Shop mit vier Upgrades.
- [ ] Automatisches Einkommen berechnen.

### Oberfläche

- [ ] Responsives Layout.
- [ ] Klick-Animationen und unmittelbares Feedback.
- [ ] Snack-Anzeige und Upgrade-Preise.

### Spielstand

- [ ] Spielstand automatisch speichern.
- [ ] Spielstand nach dem Neuladen wiederherstellen.
- [ ] Spielstand sicher zurücksetzen.

## 7. Ideen für Version 2.0

Diese Funktionen kommen erst dazu, wenn der Kern stabil ist:

- **Offline-Fortschritt:** Snacks für eine begrenzte Abwesenheitszeit vergeben, beispielsweise maximal acht Stunden.
- **Catboy-Sammlung:** Weitere Charaktere, Skins und Animationen freischalten.
- **Achievements:** Belohnungen für Klick-Meilensteine und Gesamtverdienst.
- **Prestige-System:** Fortschritt zurücksetzen und dafür dauerhafte Boni erhalten.
- **Tägliche Belohnungen:** Kleine Belohnungen für wiederkehrende Spieler.
- **Soundeffekte:** Dezente Klick- und Upgrade-Sounds mit einer Option zum Stummschalten.

## 8. Empfohlene Reihenfolge

1. **Zuerst spielbar machen:** Ein Catboy, Snacks und ein Upgrade.
2. **Spielmechaniken vervollständigen:** Alle vier Upgrades und passives Einkommen.
3. **Spielstand integrieren:** Speichern und Wiederherstellen testen.
4. **UI aufwerten:** Farben, Animationen und mobile Darstellung.
5. **Testen und veröffentlichen:** Erst nach erfolgreichem Produktions-Build.

Das wichtigste Ziel für die erste Version ist ein kleines, vollständiges und stabiles Spiel. Neue Charaktere und aufwendige Effekte können später folgen.
