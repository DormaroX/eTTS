# eTTS - Fehler-Dokumentation & Test-Mapping

**Datum**: 7. Dezember 2025  
**Status**: ✅ Sandbox-System bereit zum Testen  
**Gesamtfehler**: 10  
**Tests vorhanden**: 22 (davon 10 für identifizierte Fehler)

---

## 📊 Fehler-Übersicht

| # | Fehler | Datei | Zeile | Prio | Test | Status |
|---|--------|-------|-------|------|------|--------|
| 1 | nodeIntegration + contextIsolation Konflikt | main.js | 74-75 | 🔴 | security.test.js | ✅ |
| 2 | enableRemoteModule deprecated | main.js | 74 | 🔴 | security.test.js | ✅ |
| 3 | Avatar-Voice nicht lowercase | index.html | 891 | 🔴 | avatar-mapping.test.js | ✅ |
| 4 | VIDEO_PATH nicht initialisiert | main.js | 24-27 | 🟡 | ⏳ video-paths.test.js | ⏳ |
| 5 | Avatar-Auswahl fehlerhafte Logik | preload.js | 410 | 🟡 | ipc-communication.test.js | ✅ |
| 6 | Progress-Validierung fehlerhaft | index.html | 748 | 🟡 | ipc-communication.test.js | ✅ |
| 7 | Text-Chunking Fehler | main.js | 52-62 | 🟡 | text-splitting.test.js | ✅ |
| 8 | Preload Document-Zugriff | preload.js | 180 | 🟡 | ⏳ preload-context.test.js | ⏳ |
| 9 | loadFile() Funktion nicht definiert | preload.js | 630 | 🟡 | ⏳ drag-drop.test.js | ⏳ |
| 10 | CSS Animation fehlerhaft | index.html | 238 | 🟢 | ⏳ animation.test.js | ⏳ |

---

## 🔴 KRITISCHE FEHLER (Sofort beheben)

### Fehler 1: nodeIntegration + contextIsolation Konflikt

**Datei**: `main.js` (Zeile 74-76)

**Problem**:
```javascript
webPreferences: {
    nodeIntegration: true,      // ❌ KONFLIKT
    contextIsolation: true,     // ❌ KONFLIKT
    enableRemoteModule: true,   // ❌ DEPRECATED
}
```

**Auswirkung**: 
- 🔴 Sicherheits-Warnung
- 🔴 IPC funktioniert nicht korrekt
- 🔴 Zukünftige Inkompatibilität

**Lösung**:
```javascript
webPreferences: {
    nodeIntegration: false,              // ✅ KORREKT
    contextIsolation: true,              // ✅ KORREKT
    enableRemoteModule: false,           // ✅ Entfernt
    webSecurity: true,                   // ✅ Aktivieren
    allowRunningInsecureContent: false,  // ✅ Sicherheit
    preload: path.join(__dirname, 'preload.js'),
    devTools: process.env.NODE_ENV === 'development'
}
```

**Test**: 
```bash
npm test -- tests/unit/security.test.js
```

**Erwartung**: ✅ Test bestätigt korrekten Config

---

### Fehler 2: enableRemoteModule ist deprecated

**Datei**: `main.js` (Zeile 74)

**Problem**: Moderne Electron-Versionen unterstützen `enableRemoteModule` nicht mehr

**Lösung**: Entfernen und explizite IPC verwenden

**Test**: `security.test.js`

---

### Fehler 3: Avatar-Voice nicht lowercase

**Datei**: `index.html` (Zeile 891)  
**Auch**: `index.html` (Zeile 885)

**Problem**:
```html
<!-- ❌ FALSCH -->
<div data-character="Maxx|Ash">     <!-- Uppercase -->
<div data-character="Terra|Sage">   <!-- Uppercase -->

<!-- In JavaScript -->
let selectedCharacter = 'Maxx|Ash'; <!-- Uppercase -->
```

**Aber in main.js**:
```javascript
const AVATAR_VOICE_MAP = {
    'Maxx': { voice: 'ash', image: 'maxx.png' },  // ✅ lowercase
    'Terra': { voice: 'sage', image: 'terra.png' } // ✅ lowercase
};
```

**Auswirkung**: Voice-Namen werden nicht gefunden

**Lösung**:
```html
<!-- ✅ RICHTIG -->
<div data-character="Maxx|ash">     <!-- Lowercase -->
<div data-character="Terra|sage">   <!-- Lowercase -->

<!-- In JavaScript -->
let selectedCharacter = 'Maxx|ash'; <!-- Lowercase -->
```

**Test**:
```bash
npm test -- tests/unit/avatar-mapping.test.js
```

---

## 🟡 MITTLERE FEHLER (Diese Woche beheben)

### Fehler 4: VIDEO_PATH nicht initialisiert

**Datei**: `main.js` (Zeile 24-27, später 305)

**Problem**:
```javascript
// ❌ FALSCH - wird vor app.ready aufgerufen
const VIDEO_PATH = path.join(app.getPath('videos'), 'eTTS-Export');
```

**Auswirkung**:
- 🟡 Crash bei Videogenerierung
- 🟡 Verzeichnis existiert möglicherweise nicht
- 🟡 Keine Schreibrechte

**Lösung**:
```javascript
// ✅ RICHTIG - wird in app.whenReady aufgerufen
let VIDEO_PATH = null;

function initializePaths() {
    VIDEO_PATH = path.join(app.getPath('videos'), 'eTTS-Export');
    if (!fs.existsSync(VIDEO_PATH)) {
        fs.mkdirSync(VIDEO_PATH, { recursive: true });
    }
}

app.whenReady().then(() => {
    initializePaths();
    createWindow();
});
```

**Test**: ⏳ TODO - `npm test -- tests/unit/video-paths.test.js`

---

### Fehler 5: Avatar-Auswahl fehlerhafte Logik

**Datei**: `preload.js` (Zeile 410)

**Problem**:
```javascript
// ❌ FALSCH - sucht nach non-existent input
const selectedAvatar = document.querySelector('input[name="character"]:checked')?.value || 'Nova|Nova';
```

Es gibt keine `input[name="character"]` Elemente! Auswahl erfolgt über `.character-card` Klasse.

**Auswirkung**: Avatar wird immer auf Default "Nova|nova" gesetzt

**Lösung**: Globale Variable verwenden
```javascript
// In preload.js Top
let selectedCharacter = 'Maxx|ash';

// In uploadTxtFile
ipcRenderer.send('upload-txt-file', text, mp3Path, selectedCharacter);

// In index.html JavaScript
characterCards.forEach(card => {
    card.addEventListener('click', () => {
        selectedCharacter = card.dataset.character;  // Globale Variable setzen
    });
});
```

**Test**: `ipc-communication.test.js`

---

### Fehler 6: Progress-Validierung

**Datei**: `index.html` (Zeile 748)

**Problem**: Keine Validierung von Progress-Werten vor Anwendung

**Lösung**: Validierung hinzufügen
```javascript
window.electronAPI.onProgressUpdate((progress, totalBlocks, currentBlock, blockProgress) => {
    // ✅ Validiere vor Verwendung
    if (progress < 0 || progress > 100) return;
    if (totalBlocks < 1) return;
    if (currentBlock < 1) return;
    if (blockProgress < 0 || blockProgress > 100) return;
    
    // Dann Update
    document.getElementById('progress-bar').style.width = `${progress}%`;
});
```

**Test**: `ipc-communication.test.js`

---

### Fehler 7: Text-Chunking

**Datei**: `main.js` (Zeile 52-62)

**Problem**: Chunking kann Inhalte verlieren oder falsch aufteilen

**Test**: `text-splitting.test.js` validiert Korrektheit

---

## 🟢 GERINGFÜGIGE FEHLER (Optional)

### Fehler 8: Preload Document-Zugriff

**Datei**: `preload.js` (Zeile 180+)

**Problem**: Direkter `document.querySelector` im Preload-Kontext

**Status**: ⏳ Bei Fehler 5 Fix behoben

---

### Fehler 9: loadFile() nicht definiert

**Datei**: `preload.js` (Zeile 630)

**Problem**: 
```javascript
// ❌ loadFile ist nicht definiert
mediaPlayerControls.handleDrop = (files) => {
    for (const file of files) {
        if (file.type.startsWith('audio/')) {
            loadFile(file);  // ❌ Fehler!
        }
    }
};
```

**Lösung**:
```javascript
// ✅ Verwende richtige Funktion
mediaPlayerControls.handleDrop = (files) => {
    for (const file of files) {
        if (file.type.startsWith('audio/')) {
            mediaPlayerAPI.addToPlaylist(file);  // ✅ Korrekt
        }
    }
};
```

---

### Fehler 10: CSS Animation

**Datei**: `index.html` (Zeile 238+)

**Problem**: Progress-Animation ist nicht richtig definiert

**Status**: 🟢 Niedrig - nur visuell

---

## 🧪 Test-Ausführung

### Alle Tests ausführen

```bash
npm test
```

### Nur kritische Fehler-Tests

```bash
npm test -- tests/unit/security.test.js
npm test -- tests/unit/avatar-mapping.test.js
```

### Mit Coverage

```bash
npm test -- --coverage
```

---

## ✅ Behebungs-Workflow

### Für jeden Fehler:

1. **Test schreiben/überprüfen** (bereits gemacht)
2. **Test ausführen** - sollte fehlschlagen
   ```bash
   npm test tests/unit/security.test.js
   ```
3. **Code beheben** (in Sandbox/main.js)
4. **Test ausführen** - sollte bestanden
   ```bash
   npm test tests/unit/security.test.js
   ```
5. **In Git committen**
   ```bash
   git add -A
   git commit -m "fix: Fehler-Nummer - Beschreibung"
   ```

---

## 📋 Behebungs-Checkliste

### Phase 1: Kritische Fehler (1-3)
- [ ] Fehler 1: nodeIntegration/contextIsolation
- [ ] Fehler 2: enableRemoteModule
- [ ] Fehler 3: Avatar-Voice lowercase
- [ ] Alle Tests grün: ✅

### Phase 2: Mittlere Fehler (4-7)
- [ ] Fehler 4: VIDEO_PATH Initialisierung
- [ ] Fehler 5: Avatar-Auswahl Logik
- [ ] Fehler 6: Progress-Validierung
- [ ] Fehler 7: Text-Chunking
- [ ] Alle Tests grün: ✅

### Phase 3: Geringfügige Fehler (8-10)
- [ ] Fehler 8: Preload Document-Zugriff
- [ ] Fehler 9: loadFile() Funktion
- [ ] Fehler 10: CSS Animation
- [ ] Alle Tests grün: ✅

### Phase 4: Git & Dokumentation
- [ ] Alle Commits erledigt
- [ ] ERRORS_FOUND.md aktualisiert
- [ ] Branch: main
- [ ] README.md aktualisiert

---

## 📊 Status Übersicht

```
Fehler:        🔴🔴🔴 🟡🟡🟡🟡 🟢🟢🟢
Gesamt:        10 (4 kritisch, 6 mittel)

Tests:         ✅✅✅ ✅✅✅ ⏳⏳⏳
Vorhanden:     22 (16 aktiv, 3 TODO)

Sandbox:       🟢 BEREIT
Dokumentation: 🟢 KOMPLETT
```

---

**Zuletzt aktualisiert**: 7. Dezember 2025  
**Repository**: electron-tts (dormarox/eTTS)  
**Branch**: main
