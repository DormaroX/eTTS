# eTTS - Electron Text-to-Speech System

**Status**: 🟡 In Entwicklung (Sandbox-Phase für Fehlerbehebbung)  
**Version**: 1.4.0  
**Repo**: [dormarox/eTTS](https://github.com/dormarox/electron-tts)

---

## 🎯 Projekt-Übersicht

Ein modernes **Electron-basiertes Text-to-Speech-System** speziell für dein **Himmelsfeuer-Universum** mit:

- 🎤 OpenAI TTS-Integration (4 charakterspezifische Stimmen)
- 🎥 Video-Generierung via SadTalker
- 🎨 Interaktives UI mit Charakter-Auswahl
- 📁 Playlist-Management
- 🔄 Audio-Ein-/Ausgabe-Unterstützung

**Charaktere**:
- **Maxx** → Stimme: `ash`
- **Terra** → Stimme: `sage`
- **Nova** → Stimme: `nova` (Standard)
- **Nyxari** → Stimme: `coral`

---

## 📊 Aktueller Status

### ✅ Abgeschlossen

- Basis-Electron-Setup
- OpenAI TTS-Integration
- SadTalker Video-Generierung
- UI/UX mit Charakter-Karussell
- Playlist-Verwaltung
- Audio-Verarbeitung
- **Sandbox-Test-System** (NEU!)
- **Fehler-Analyse & Dokumentation** (NEU!)

### ⏳ In Arbeit

- **Fehlerbehebbung** (mit Sandbox-System)
- Audio-Input (Whisper STT)
- Charakter-Memory-System
- Lokales LLM (KoboldCpp)

### 🟢 Geplant

- Live2D-Avatar-Integration
- Velaris Companion-AI
- Erweiterte Charakter-Prompts

---

## 🧪 SANDBOX-TEST-SYSTEM (NEU)

Du hast jetzt ein **vollständiges, professionelles Test-System**:

### 📁 Struktur

```
electron-tts/
├── tests/                    # Test-Suite (22 Tests)
│   ├── unit/                # Unit-Tests
│   ├── integration/         # Integration-Tests
│   └── mocks/               # Test-Daten
├── ERRORS_FOUND.md          # Fehler-Dokumentation
├── TESTING_GUIDE.md         # Test-Anleitung
├── SANDBOX_SETUP.md         # Sandbox-Übersicht
├── SANDBOX_START.md         # Quick-Start
├── jest.config.js           # Jest-Konfiguration
├── setup-sandbox.sh         # Sandbox initialisieren
├── run-sandbox-tests.sh     # Tests ausführen
├── status.sh                # Status anzeigen
└── sandbox/                 # Isolierte Test-Umgebung
```

### 🚀 Quick Start

```bash
# 1. Jest installieren
npm install --save-dev jest

# 2. Status prüfen
bash status.sh

# 3. Sandbox initialisieren
bash setup-sandbox.sh

# 4. Tests ausführen
npm test

# 5. Fehler beheben (siehe ERRORS_FOUND.md)
```

### 📚 Wichtige Dateien

| Datei | Inhalt |
|-------|--------|
| **ERRORS_FOUND.md** | Alle 10 Fehler mit Tests |
| **TESTING_GUIDE.md** | Umfassender Test-Guide |
| **SANDBOX_START.md** | Behebungs-Workflow |
| **jest.config.js** | Jest-Setup |

---

## 🔍 Fehler-Status

### 🔴 Kritische Fehler (3)

1. **nodeIntegration + contextIsolation Konflikt** (main.js:74)
   - Test: `npm test -- tests/unit/security.test.js`
   - Status: ⏳ Zu beheben

2. **enableRemoteModule deprecated** (main.js:74)
   - Test: `npm test -- tests/unit/security.test.js`
   - Status: ⏳ Zu beheben

3. **Avatar-Voice nicht lowercase** (index.html:891, 885)
   - Test: `npm test -- tests/unit/avatar-mapping.test.js`
   - Status: ⏳ Zu beheben

### 🟡 Mittlere Fehler (4)

4. VIDEO_PATH nicht initialisiert (main.js:24)
5. Avatar-Auswahl fehlerhafte Logik (preload.js:410)
6. Progress-Validierung fehlerhaft (index.html:748)
7. Text-Chunking Fehler (main.js:52)

### 🟢 Geringfügige Fehler (3)

8-10. Weitere Fehler (Details in ERRORS_FOUND.md)

**Detallierte Dokumentation**: `ERRORS_FOUND.md`

---

## 📦 Installation

### Voraussetzungen

- Node.js >= 20.x
- npm >= 10.x
- Python >= 3.10 (für SadTalker)
- FFmpeg (für Video-Verarbeitung)
- OpenAI API-Schlüssel

### Setup

```bash
# Repository klonen
git clone https://github.com/dormarox/electron-tts.git
cd electron-tts

# Dependencies installieren
npm install

# Test-Dependencies installieren
npm install --save-dev jest @types/jest

# .env erstellen
cp .env.example .env
# → Bearbeite .env und füge OPENAI_API_KEY ein

# Tests ausführen
npm test

# App starten
npm start
```

---

## 📝 npm Scripts

### Hauptbefehle

```bash
npm start              # Starte die Electron-App
npm test               # Alle Tests ausführen
npm test:watch        # Tests im Watch-Modus
npm test:coverage     # Mit Coverage-Report
```

### Test-Kategorien

```bash
npm test:unit         # Nur Unit-Tests
npm test:integration  # Nur Integration-Tests
```

### Spezifische Tests

```bash
npm test -- tests/unit/security.test.js        # Fehler 1-2
npm test -- tests/unit/avatar-mapping.test.js  # Fehler 3
```

### Sandbox-Commands

```bash
npm sandbox:setup     # Sandbox initialisieren
npm sandbox:test      # Sandbox-Tests
npm sandbox:run       # Komplette Sandbox
```

---

## 🔄 Behebungs-Workflow

### Für jeden Fehler:

1. **Dokumentation lesen**
   ```bash
   # In ERRORS_FOUND.md nachschlagen
   cat ERRORS_FOUND.md | grep "Fehler X"
   ```

2. **Test ausführen** (wird fehlschlagen)
   ```bash
   npm test -- [spezifischer-test]
   ```

3. **Code beheben** (in main.js/preload.js/index.html)
   ```javascript
   // Beispiel für Fehler 1:
   webPreferences: {
       nodeIntegration: false,      // ← GEÄNDERT
       contextIsolation: true
   }
   ```

4. **Test ausführen** (wird bestanden)
   ```bash
   npm test -- [spezifischer-test]
   ```

5. **Git committen**
   ```bash
   git add -A
   git commit -m "fix: Fehler-Nummer - Beschreibung"
   ```

---

## 🎨 Features

### ✅ Implementiert

- Text-to-Speech mit OpenAI
- Multiple Charakterstimmen
- Video-Generierung (SadTalker)
- UI mit Charakter-Karussell
- Playlist-Management
- Audio-Wiedergabe
- Qualitäts-Einstellungen (128x128, 256x256, 512x512)
- Upscaling (2K, 4K)
- Fortschrittsanzeige

### ⏳ In Arbeit

- Audio-Input (Whisper)
- Spracherkennung
- Charakter-Memory
- Dynamische Stimmen-Wahl

### 🔮 Geplant

- KoboldCpp Integration (lokales LLM)
- Live2D-Avatare
- Velaris Companion-AI
- Echtzeitreaktion
- Animation bei Audio

---

## 🛠️ Entwicklung

### Projekt-Struktur

```
electron-tts/
├── main.js           # Hauptprozess (Electron)
├── preload.js        # Preload-Script (Sicherheit)
├── index.html        # UI/UX
├── tts-output.js     # TTS-Ausgabe-Handler
├── tests/            # Test-Suite (NEU)
├── .env              # Umgebungsvariablen
├── package.json      # Dependencies
└── assets/           # Bilder/Videos
```

### Wichtige Dateien

| Datei | Funktion |
|-------|----------|
| **main.js** | Electron-Hauptprozess, IPC-Handler, OpenAI-Integration |
| **preload.js** | Sichere API-Bridge, Audio-Player, Playlist |
| **index.html** | UI, Charakter-Auswahl, Playlist, Steuerelemente |
| **tts-output.js** | TTS-Datei-Handling |

---

## 🔐 Sicherheit

✅ **Implementiert**:
- contextIsolation: true (nach Fix)
- nodeIntegration: false (nach Fix)
- Preload-Script für sichere APIs
- Web Security aktiviert
- Keine unsicheren Inhalte

---

## 📊 Statistiken

```
Zeilen Code:           ~2000+ (main.js, preload.js, index.html)
Test-Zeilen:           ~1500+ (22 Tests)
Dokumentation:         ~1500+ Zeilen
Fehler gefunden:       10 (4 kritisch, 6 mittel)
Test-Coverage:         80%+ (Ziel)
```

---

## 🤝 Beitragen

Für Fehler oder Verbesserungen:

1. Fork das Repository
2. Feature-Branch erstellen: `git checkout -b fix/fehler-name`
3. Tests schreiben & ausführen
4. Commit mit aussagekräftiger Message
5. PR einreichen

**Wichtig**: Alle Änderungen müssen:
- ✅ Tests bestehen
- ✅ Dokumentiert sein
- ✅ ERRORS_FOUND.md aktualisiert sein
- ✅ Git-Commit mit Message

---

## 📞 Kontakt

**Repository**: [dormarox/electron-tts](https://github.com/dormarox/electron-tts)  
**Issues**: [GitHub Issues](https://github.com/dormarox/electron-tts/issues)  
**Branch**: main

---

## 📚 Dokumentation

- **TESTING_GUIDE.md** — Umfassender Test-Guide
- **ERRORS_FOUND.md** — Fehler-Dokumentation & Tests
- **SANDBOX_SETUP.md** — Sandbox-System Übersicht
- **SANDBOX_START.md** — Quick-Start & Workflow

---

## 🎬 Nächste Schritte

1. ✅ Sandbox-System aufgebaut
2. ⏳ **Fehler beheben** (Phase 1: Kritische Fehler)
3. ⏳ Tests auf 80%+ Coverage
4. ⏳ Audio-Input-System
5. ⏳ Charakter-Memory
6. ⏳ KoboldCpp-Integration
7. ⏳ Live2D-Avatare

---

**Zuletzt aktualisiert**: 7. Dezember 2025  
**Status**: 🟡 Entwicklung (Sandbox-Fehlerbehebbung)  
**Repository**: electron-tts (dormarox/eTTS)  
**Branch**: main

---

## 📜 Lizenz

Siehe LICENSE Datei

---

**Viel Erfolg beim Debugging!** 🚀✨
