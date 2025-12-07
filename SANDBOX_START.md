# 🎯 eTTS Sandbox & Fehlerbehebbungs-Guide

## ✅ Aktueller Status

Das **Test-Sandbox-System ist komplett eingerichtet** und bereit zur Fehlerbehebbung!

```
Status Dashboard:
✓ Projekt-Struktur:          KOMPLETT
✓ Test-System:               KOMPLETT (4 Test-Dateien)
✓ Dokumentation:             KOMPLETT
✓ Sandbox-Environment:       VORBEREITET
✓ Scripts:                   AUSFÜHRBAR
⚠ Jest Installation:         AUSSTEHEND
✓ Git Repository:            AKTIV
```

---

## 🚀 QUICK START (Schritt für Schritt)

### Schritt 1: Jest installieren

```bash
cd /home/aov/CascadeProjects/electron-tts
npm install --save-dev jest @types/jest
```

**Dauer**: ~30 Sekunden

### Schritt 2: Status überprüfen

```bash
bash status.sh
```

Sollte alles grün zeigen ✓

### Schritt 3: Sandbox initialisieren

```bash
bash setup-sandbox.sh
```

Dies erstellt eine isolierte Test-Kopie in `sandbox/etts-test/`

**Dauer**: ~5 Sekunden

### Schritt 4: Tests ausführen

```bash
npm test
```

Oder speziell:

```bash
npm test -- tests/unit/security.test.js
```

---

## 📋 Fehler-Behebungs-Plan

### 🔴 **Phase 1: Kritische Fehler** (Heute)

```
Fehler 1: nodeIntegration + contextIsolation Konflikt
├─ Datei: main.js (Zeile 74-76)
├─ Test: npm test -- tests/unit/security.test.js
├─ Status: ⏳ Zu beheben
└─ Prio: 🔴 KRITISCH

Fehler 2: enableRemoteModule deprecated
├─ Datei: main.js (Zeile 74)
├─ Test: npm test -- tests/unit/security.test.js
├─ Status: ⏳ Zu beheben
└─ Prio: 🔴 KRITISCH

Fehler 3: Avatar-Voice nicht lowercase
├─ Datei: index.html (Zeile 891) + index.html (Zeile 885)
├─ Test: npm test -- tests/unit/avatar-mapping.test.js
├─ Status: ⏳ Zu beheben
└─ Prio: 🔴 KRITISCH
```

**Ziel**: Alle 3 Fehler heute beheben + Tests grün + Git Commit

---

### 🟡 **Phase 2: Mittlere Fehler** (Diese Woche)

```
Fehler 4: VIDEO_PATH nicht initialisiert
Fehler 5: Avatar-Auswahl fehlerhafte Logik
Fehler 6: Progress-Validierung fehlerhaft
Fehler 7: Text-Chunking Fehler
```

**Ziel**: Nach Phase 1 starten

---

### 🟢 **Phase 3: Geringfügige Fehler** (Später)

```
Fehler 8: Preload Document-Zugriff
Fehler 9: loadFile() Funktion fehlt
Fehler 10: CSS Animation fehlerhaft
```

---

## 🔄 Behebungs-Workflow für JEDEN Fehler

### Beispiel: Fehler 1 beheben

#### Schritt 1: Test ausführen (wird fehlschlagen)

```bash
npm test -- tests/unit/security.test.js

# Output:
# ✓ nodeIntegration mit contextIsolation sollte einen Fehler verursachen
# ✗ enableRemoteModule sollte nicht verwendet werden
# ... (Test schlägt fehl - das ist erwartungsgemäß!)
```

#### Schritt 2: Code beheben

Öffne `main.js` Zeile 74-76:

```javascript
// ❌ VORHER (FALSCH)
webPreferences: {
    nodeIntegration: true,      // ❌ KONFLIKT
    contextIsolation: true,     // ❌ KONFLIKT
    enableRemoteModule: true,   // ❌ DEPRECATED
    webSecurity: true,
    allowRunningInsecureContent: false,
    preload: path.join(__dirname, 'preload.js'),
    devTools: true
},

// ✅ NACHHER (RICHTIG)
webPreferences: {
    nodeIntegration: false,              // ✅ KORREKT
    contextIsolation: true,              // ✅ KORREKT
    enableRemoteModule: false,           // ✅ Entfernt/false
    webSecurity: true,                   // ✅ Aktiviert
    allowRunningInsecureContent: false,  // ✅ Sicherheit
    preload: path.join(__dirname, 'preload.js'),
    devTools: process.env.NODE_ENV === 'development'  // ✅ Conditional
},
```

#### Schritt 3: Test ausführen (wird bestanden)

```bash
npm test -- tests/unit/security.test.js

# Output:
# ✓ nodeIntegration mit contextIsolation sollte einen Fehler verursachen
# ✓ enableRemoteModule sollte nicht verwendet werden
# ✓ Preload Script sollte definiert sein
# ✓ webSecurity sollte true sein
# ✓ allowRunningInsecureContent sollte false sein
#
# ✓ Alle 5 Tests bestanden!
```

#### Schritt 4: In Git committen

```bash
git add main.js
git commit -m "fix: Security-Konfiguration in BrowserWindow (Fehler 1-2)

- nodeIntegration: false (war true, Konflikt mit contextIsolation)
- enableRemoteModule entfernt (deprecated in Electron 35.x)
- webSecurity: true aktiviert
- devTools nur in development-Mode

Tests: ✅ security.test.js bestanden"
```

---

## 📚 Wichtige Dateien

| Datei | Inhalt | Zweck |
|-------|--------|-------|
| **ERRORS_FOUND.md** | Alle 10 Fehler mit Details | Referenz bei Behebung |
| **TESTING_GUIDE.md** | Test-Dokumentation | Test-Hilfe |
| **SANDBOX_SETUP.md** | Sandbox-Übersicht | Setup-Referenz |
| **tests/unit/security.test.js** | Security-Tests | Fehler 1-2 prüfen |
| **tests/unit/avatar-mapping.test.js** | Avatar-Tests | Fehler 3 prüfen |
| **jest.config.js** | Jest-Konfiguration | Test-Runner Setup |

---

## 🔍 Fehler-Details (Kurz)

### Fehler 1: nodeIntegration + contextIsolation Konflikt

```javascript
// ❌ PROBLEM
webPreferences: {
    nodeIntegration: true,
    contextIsolation: true
}
// → Sicherheit beeinträchtigt
// → IPC funktioniert fehlerhaft
```

**Lösung**: `nodeIntegration: false` setzen

**Test**: `npm test -- tests/unit/security.test.js`

---

### Fehler 2: enableRemoteModule deprecated

```javascript
// ❌ PROBLEM
webPreferences: {
    enableRemoteModule: true
}
// → Nicht mehr in Electron 35.x unterstützt
// → Zukünftige Fehler wahrscheinlich
```

**Lösung**: Auf `false` setzen oder komplett entfernen

**Test**: `npm test -- tests/unit/security.test.js`

---

### Fehler 3: Avatar-Voice nicht lowercase

```html
<!-- ❌ PROBLEM -->
<div data-character="Maxx|Ash">  <!-- Uppercase -->

<!-- ✅ LÖSUNG -->
<div data-character="Maxx|ash">  <!-- Lowercase -->
```

Auch in JavaScript Zeile 885:

```javascript
// ❌ PROBLEM
let selectedCharacter = 'Maxx|Ash';

// ✅ LÖSUNG
let selectedCharacter = 'Maxx|ash';
```

**Test**: `npm test -- tests/unit/avatar-mapping.test.js`

---

## 💾 Git Workflow

### Vor jeder Session

```bash
# Status prüfen
bash status.sh

# Änderungen ansehen
git status

# Falls alte Änderungen: Clean machen
git checkout -- .
```

### Nach jedem Fix

```bash
# Änderungen hinzufügen
git add ERRORS_FOUND.md main.js preload.js index.html

# Mit aussagekräftiger Message committen
git commit -m "fix: [Fehler-Nummer] - Kurzbeschreibung

Detailbeschreibung mit Tests und Auswirkungen"

# Optiona: In Branch pushen
git push origin main
```

---

## 🧪 Test-Commands (Wichtig!)

```bash
# Alle Tests
npm test

# Unit-Tests nur
npm test -- tests/unit

# Integration-Tests nur
npm test -- tests/integration

# Specific Test
npm test -- tests/unit/security.test.js
npm test -- tests/unit/avatar-mapping.test.js

# Mit Coverage
npm test -- --coverage

# Watch Mode (Auto-Rerun bei Änderungen)
npm test -- --watch

# Verbose Output
npm test -- --verbose
```

---

## ⚠️ Häufige Fehler vermeiden

### ❌ NICHT MACHEN

```bash
# Änderungen ohne Tests
git commit -m "fix: irgendwas"

# Tests nicht ausführen
git push ohne vorher npm test

# Fehler-Datei nicht aktualisieren
# (vergessen ERRORS_FOUND.md zu aktualisieren)

# Falsch Case verwenden
data-character="Maxx|Ash"  # ❌ FALSCH
```

### ✅ RICHTIG MACHEN

```bash
# Erst testen
npm test -- tests/unit/security.test.js

# Dann beheben
# (Code-Änderung)

# Wieder testen
npm test -- tests/unit/security.test.js

# Git aktualisieren
git add -A
git commit -m "fix: Fehler-Nummer beschreibung"

# ERRORS_FOUND.md Status aktualisieren
# (mit ✅ bei behobenen Fehlern)
```

---

## 📊 Progress-Tracking

Nach jedem Fix:

1. ERRORS_FOUND.md öffnen
2. Status von "⏳" zu "✅" ändern
3. Beispiel:

```markdown
| 1 | nodeIntegration + contextIsolation | main.js | 74-76 | 🔴 | security.test.js | ✅ | ← geändert!
```

---

## 🆘 Probleme?

### Problem: "jest nicht gefunden"
```bash
npm install --save-dev jest @types/jest
```

### Problem: "Tests schlagen alle fehl"
```bash
npm test -- --verbose  # Detaillierter Output
npm test -- --detectOpenHandles  # Handle-Debugging
```

### Problem: "Kann nicht testen, Fehler in Code"
```bash
# Versuche, spezifischen Test zu isolieren
npm test security.test.js -- --verbose
```

### Problem: "Sandbox nicht initialisiert"
```bash
bash setup-sandbox.sh
```

---

## 📈 Ziele

- ✅ Sandbox-System aufgebaut
- ✅ Tests geschrieben
- ✅ Dokumentation erstellt
- ⏳ Fehler 1-3 beheben (heute)
- ⏳ Fehler 4-7 beheben (diese Woche)
- ⏳ Fehler 8-10 beheben (später)
- ⏳ 80%+ Test-Coverage erreichen

---

## 📞 Kontakt/Hilfe

Alle Dokumentation:
- **ERRORS_FOUND.md** - Fehler-Details
- **TESTING_GUIDE.md** - Test-Anleitung
- **SANDBOX_SETUP.md** - Setup-Guide

Befehle:
```bash
bash status.sh              # Status zeigen
npm test                    # Tests ausführen
npm test -- --watch        # Auto-Rerun
npm test -- --coverage     # Coverage
```

---

## ✨ Zusammenfassung

```
DAS IST DEINE SANDBOX-UMGEBUNG!
│
├─ 🧪 22 Tests (16 aktiv)
├─ 📚 3 Dokumentation
├─ 🔧 3 Scripts
├─ 🔴 3 kritische Fehler zu beheben
├─ 🟡 4 mittlere Fehler zu beheben
└─ 🟢 3 geringfügige Fehler zu beheben

WORKFLOW:
1. Test schreiben (bereits gemacht ✓)
2. Test ausführen (wird fehlschlagen)
3. Code beheben
4. Test ausführen (wird bestanden)
5. Git committen
6. REPEAT

ZIEL: Alle Tests grün ✓ + Cleancode + Production-Ready
```

---

**Viel Erfolg beim Debugging! 🚀**

Zuletzt aktualisiert: 7. Dezember 2025
