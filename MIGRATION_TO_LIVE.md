# Migrationsanleitung: Änderungen zur Live-App übertragen

## Übersicht
Dieses Dokument beschreibt, wie die in der Sandbox getesteten Änderungen in die Live-App übertragen werden.

---

## 📋 Geänderte Dateien

### 1. `index.html`
**Status**: ✅ Wichtigste Änderungen
**Zeilen**: ~805-1279

**Hauptänderungen**:
- Event-Listener Initialisierung (`initializeApp()`, `setupEventListeners()`)
- Alle Buttons mit Null-Checks und Fehlerbehandlung
- Karussell-Scroll-Verhalten: 1 Karte pro Klick
- Howler.js Script-Tag hinzugefügt

### 2. `preload.js`
**Status**: ✅ Kritische Änderungen
**Zeilen**: ~1-13, ~75-215, ~490-640

**Hauptänderungen**:
- Howler.js Import hinzugefügt
- `fsPromises` Import hinzugefügt
- Gemeinsame Hilfsfunktion `addFileToPlaylist()`
- IPC-Handler für Dateiauswahl korrigiert
- `playTrack()` Funktion verbessert

### 3. `main.js`
**Status**: ✅ Wichtig
**Zeilen**: ~74-108

**Hauptänderungen**:
- `sandbox: false` zu webPreferences hinzugefügt
- DevTools-Konfiguration verbessert

---

## 🚀 Migrationsschritte

### Schritt 1: Backup erstellen
```bash
# Erstelle ein Backup der Live-App
cd /home/aov/CascadeProjects/electron-tts
git status
git add .
git commit -m "Backup vor Migration der Sandbox-Änderungen"
```

### Schritt 2: Dateien kopieren/übertragen

#### Option A: Manuelle Übertragung (Empfohlen)
Kopiere die geänderten Abschnitte aus den Dateien:

**index.html**:
- Zeilen ~788-1279: Event-Listener Initialisierung
- Zeilen ~900-912: Karussell-Scroll-Verhalten
- Zeilen ~918-1030: Button-Event-Listener mit Null-Checks
- Zeile ~788: Howler.js Script-Tag

**preload.js**:
- Zeilen ~1-4: Imports (fsPromises)
- Zeilen ~6-13: Howler.js Import
- Zeilen ~75-215: `addFileToPlaylist()` Hilfsfunktion
- Zeilen ~490-533: `playTrack()` Funktion
- Zeilen ~584-640: IPC-Handler für Dateiauswahl

**main.js**:
- Zeile ~76: `sandbox: false` hinzufügen
- Zeilen ~90-108: DevTools-Konfiguration

#### Option B: Git Merge (Wenn Live-App ein separater Branch ist)
```bash
# Falls Live-App ein separater Branch ist
git checkout live
git merge main
# Konflikte manuell lösen
```

### Schritt 3: Dependencies prüfen
```bash
# Stelle sicher, dass alle Dependencies installiert sind
npm install
```

### Schritt 4: Testen
```bash
# Starte die App und teste alle Funktionen
npm start

# Teste speziell:
# - +Button öffnet Dateiauswahl
# - Dateien werden zur Playlist hinzugefügt
# - Play-Button spielt Titel ab
# - Alle Buttons funktionieren
# - Karussell scrollt korrekt (1 Karte pro Klick)
```

---

## ✅ Checkliste vor dem Übertragen

### Code-Änderungen
- [ ] `index.html`: Event-Listener Initialisierung
- [ ] `index.html`: Alle Buttons mit Null-Checks
- [ ] `index.html`: Karussell-Scroll-Verhalten (1 Karte)
- [ ] `index.html`: Howler.js Script-Tag
- [ ] `preload.js`: Howler.js Import
- [ ] `preload.js`: fsPromises Import
- [ ] `preload.js`: `addFileToPlaylist()` Funktion
- [ ] `preload.js`: `playTrack()` Funktion verbessert
- [ ] `preload.js`: IPC-Handler korrigiert
- [ ] `main.js`: `sandbox: false` hinzugefügt
- [ ] `main.js`: DevTools-Konfiguration

### Tests
- [ ] +Button funktioniert
- [ ] Dateien werden zur Playlist hinzugefügt
- [ ] Play-Button spielt Titel ab
- [ ] Alle Buttons haben Event-Listener
- [ ] Karussell scrollt korrekt
- [ ] APIs sind verfügbar
- [ ] Keine Console-Fehler

### Dokumentation
- [ ] CHANGELOG_SESSION.md erstellt
- [ ] MIGRATION_TO_LIVE.md erstellt
- [ ] Git-Commit vorbereitet

---

## 🔍 Wichtige Code-Abschnitte zum Kopieren

### 1. index.html - Event-Listener Initialisierung
```javascript
// Zeilen ~805-826
function initializeApp() {
    console.log('Initializing event listeners...');
    console.log('window.electronAPI verfügbar:', typeof window.electronAPI !== 'undefined');
    console.log('window.mediaPlayerControls verfügbar:', typeof window.mediaPlayerControls !== 'undefined');
    
    if (typeof window.electronAPI === 'undefined') {
        console.error('WARNUNG: window.electronAPI ist nicht verfügbar!');
        setTimeout(() => {
            if (typeof window.electronAPI === 'undefined') {
                console.error('FEHLER: window.electronAPI ist immer noch nicht verfügbar nach 500ms!');
            } else {
                console.log('window.electronAPI ist jetzt verfügbar, initialisiere Event-Listener...');
                setupEventListeners();
            }
        }, 500);
        return;
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    // Alle Event-Listener hier
}
```

### 2. preload.js - Howler.js Import
```javascript
// Zeilen ~6-13
// Lade Howler.js
let Howl, Howler;
try {
    const howler = require('howler');
    Howl = howler.Howl;
    Howler = howler.Howler;
    console.log('Howler.js erfolgreich geladen');
} catch (e) {
    console.error('Howler.js nicht gefunden:', e);
}
```

### 3. preload.js - addFileToPlaylist Funktion
```javascript
// Zeilen ~75-215
async function addFileToPlaylist(file) {
    // Gemeinsame Hilfsfunktion für Dateiauswahl
    // Wird sowohl von IPC-Handler als auch von exponierten API verwendet
}
```

### 4. main.js - Sandbox deaktivieren
```javascript
// Zeile ~76
webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: false,  // WICHTIG: Deaktiviert, damit fs verfügbar ist
    webSecurity: true,
    allowRunningInsecureContent: false,
    preload: path.join(__dirname, 'preload.js'),
    devTools: true
},
```

---

## 🐛 Bekannte Probleme und Lösungen

### Problem: "Howl ist nicht verfügbar"
**Lösung**: Stelle sicher, dass Howler.js korrekt importiert ist in `preload.js`

### Problem: "fs module not found"
**Lösung**: Stelle sicher, dass `sandbox: false` in `main.js` gesetzt ist

### Problem: "window.electronAPI nicht verfügbar"
**Lösung**: Initialisierung wartet jetzt auf API-Verfügbarkeit

### Problem: "+Button funktioniert nicht"
**Lösung**: IPC-Handler verwendet jetzt gemeinsame Hilfsfunktion

---

## 📝 Git-Commit Message Vorlage

```bash
git add index.html preload.js main.js
git commit -m "feat: Button-Prüfung, Karussell-Fixes, Play-Button, Preload.js Fixes

- Alle Buttons mit Null-Checks und Fehlerbehandlung versehen
- Event-Listener Initialisierung verbessert (initializeApp)
- Karussell-Scroll-Verhalten: 1 Karte pro Klick
- +Button Problem behoben (window.mediaPlayer)
- Play-Button Problem behoben (Howler.js Import)
- Preload.js Fixes (sandbox, fsPromises, Howler.js)
- DevTools automatisch öffnen im Debug-Modus

Siehe CHANGELOG_SESSION.md für Details"
```

---

## 🔄 Rollback-Plan

Falls Probleme auftreten:

```bash
# Zurück zum letzten funktionierenden Commit
git log --oneline
git checkout <commit-hash>

# Oder alle Änderungen rückgängig machen
git reset --hard HEAD~1
```

---

## 📞 Support

Bei Problemen:
1. Prüfe die Console-Logs (F12)
2. Prüfe CHANGELOG_SESSION.md für Details
3. Prüfe ERRORS_FOUND.md für bekannte Probleme

---

**Erstellt am**: $(date)
**Version**: 1.4.0
**Status**: ✅ Bereit zur Übertragung
