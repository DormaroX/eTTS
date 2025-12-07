# eTTS Test-Sandbox Dokumentation

## 📋 Übersicht

Das Sandbox-Test-System ermöglicht es, alle Änderungen **sicher zu testen**, bevor sie in die Live-App gehen.

```
electron-tts/
├── tests/                    # Test-Verzeichnis
│   ├── unit/                # Unit-Tests
│   │   ├── avatar-mapping.test.js      # Avatar-Voice-Zuordnung
│   │   ├── text-splitting.test.js      # Text-Chunking
│   │   └── security.test.js            # Security-Konfiguration
│   ├── integration/          # Integration-Tests
│   │   └── ipc-communication.test.js    # IPC-Events
│   ├── mocks/                # Mock-Daten
│   │   └── mock-data.js      # Test-Daten
│   ├── setup.js              # Test-Umgebung
│   └── sandbox-runner.js     # Test-Runner
├── jest.config.js            # Jest-Konfiguration
└── sandbox/                  # Sandbox-Dateien (isoliert)
```

---

## 🧪 Test-Kategorien

### 1. **Unit-Tests** (`tests/unit/`)

Tests für isolierte Funktionen ohne externe Abhängigkeiten:

#### `avatar-mapping.test.js`
- ✓ Stimmen-Zuordnung (Maxx → ash, etc.)
- ✓ Bild-Zuordnung
- ✓ Validierung von Voice-Namen (lowercase)
- ✓ Fehlerbehandlung für ungültige Avatare

#### `text-splitting.test.js`
- ✓ Kurze Texte nicht aufteilen
- ✓ Lange Texte aufteilen
- ✓ Satzaufteilung bei Punkten
- ✓ Kantenfall-Tests (leere Strings, sehr lange Worte)
- ✓ Inhalt-Erhaltung bei Chunks

#### `security.test.js`
- ✓ nodeIntegration/contextIsolation Konflikt-Erkennung
- ✓ enableRemoteModule Deprecation Check
- ✓ Preload Script Validierung
- ✓ Web Security Settings

### 2. **Integration-Tests** (`tests/integration/`)

Tests für Zusammenarbeit zwischen Komponenten:

#### `ipc-communication.test.js`
- ✓ TTS Playback Event Validierung
- ✓ Progress Update Validierung
- ✓ Avatar Selection Format Check
- ✓ File Path Handling

---

## 🚀 Tests ausführen

### Installation

```bash
cd /home/aov/CascadeProjects/electron-tts

# Installiere Jest
npm install --save-dev jest @types/jest

# (Optional) Installiere weitere Test-Tools
npm install --save-dev ts-jest electron-mock
```

### Tests ausführen

```bash
# Alle Tests
npm test

# Nur Unit-Tests
npm test -- tests/unit

# Nur Integration-Tests
npm test -- tests/integration

# Mit Coverage
npm test -- --coverage

# Watch-Modus (Tests bei Datei-Änderungen)
npm test -- --watch

# Spezifischer Test
npm test avatar-mapping.test.js
```

### Test-Bericht generieren

```bash
npm test -- --coverage --json --outputFile=test-results.json
```

---

## 📊 Test-Struktur

### Beispiel: Avatar-Mapping Test

```javascript
describe('Avatar Voice Mapping', () => {
    describe('Stimmen-Zuordnung', () => {
        it('sollte Maxx die Stimme "ash" zuordnen', () => {
            expect(AVATAR_VOICE_MAP['Maxx'].voice).toBe('ash');
        });
    });
});
```

**Beschreibung:**
- `describe()` = Testsuite (z.B. "Avatar Voice Mapping")
- `it()` = Einzelner Test (z.B. "sollte Maxx die Stimme 'ash' zuordnen")
- `expect()` = Assertion (erwartet ein Ergebnis)

---

## 🔄 Workflow: Fehler → Test → Fix → Commit

### Schritt 1: Test schreiben
```javascript
it('sollte Video-Pfad erstellen', () => {
    const videoPath = initializePaths();
    expect(videoPath).toBeDefined();
});
```

### Schritt 2: Test ausführen (wird fehlschlagen)
```bash
npm test video-paths.test.js
# ✗ FAIL: sollte Video-Pfad erstellen
```

### Schritt 3: Fix in main.js schreiben
```javascript
function initializePaths() {
    VIDEO_PATH = path.join(app.getPath('videos'), 'eTTS-Export');
    fs.mkdirSync(VIDEO_PATH, { recursive: true });
    return VIDEO_PATH;
}
```

### Schritt 4: Test ausführen (bestanden)
```bash
npm test video-paths.test.js
# ✓ PASS: sollte Video-Pfad erstellen
```

### Schritt 5: In Git committen
```bash
git add -A
git commit -m "fix: Video-Pfad-Initialisierung in app.whenReady()"
```

---

## 🎯 Test-Abdeckung Ziele

| Komponente | Ziel | Status |
|------------|------|--------|
| Avatar-Mapping | 100% | 🟢 Ready |
| Text-Splitting | 95% | 🟢 Ready |
| Security-Config | 90% | 🟢 Ready |
| IPC-Events | 80% | 🟢 Ready |
| **Gesamt** | **80%** | 🟢 Ready |

---

## 📝 Fehler-Test-Matrix

Diese Matrix zeigt, welche Tests welche Fehler abdecken:

| Fehler | Test | Status |
|--------|------|--------|
| nodeIntegration/contextIsolation Konflikt | `security.test.js` | ✓ |
| enableRemoteModule deprecated | `security.test.js` | ✓ |
| Avatar-Voice Lowercase | `avatar-mapping.test.js` | ✓ |
| Video-Pfad nicht erstellt | TODO | ⏳ |
| Avatar-Auswahl fehlerhafte Logik | `ipc-communication.test.js` | ✓ |
| Progress-Validierung | `ipc-communication.test.js` | ✓ |

---

## 🛡️ Mock-Daten

Alle Tests verwenden vordefinierte Mock-Daten (`tests/mocks/mock-data.js`):

```javascript
{
    AVATAR_VOICE_MAP,      // Avatar-Zuordnungen
    TEST_TEXTS,            // Verschiedene Test-Texte
    TEST_CHARACTERS,       // Test-Charaktere
    MOCK_AUDIO_BUFFER,     // Fake Audio-Daten
    TEST_PATHS,            // Test-Verzeichnisse
    TEST_EVENTS            // Test-Events
}
```

---

## 🔍 Coverage-Bericht

Nach Ausführung mit `--coverage`:

```
======= Coverage summary =======
Statements   : 85.2% ( 120/141 )
Branches     : 78.5% (  65/85 )
Functions    : 90.1% ( 90/100 )
Lines        : 87.3% ( 110/126 )
====================================
```

---

## 🚨 Fehler-Handling

Falls Tests fehlschlagen:

```bash
# Verbose Output
npm test -- --verbose

# Debug Mode
npm test -- --detectOpenHandles

# Spezifischer Test mit Details
npm test -- avatar-mapping.test.js --verbose
```

---

## 📚 Weitere Ressourcen

- [Jest Dokumentation](https://jestjs.io/)
- [Electron Testing Guide](https://www.electronjs.org/docs/tutorial/testing)
- [eTTS Fehler-Dokumentation](./ERRORS_FOUND.md)

---

**Zuletzt aktualisiert**: 7. Dezember 2025  
**Status**: ✅ Test-Sandbox bereit
