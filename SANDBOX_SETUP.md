# eTTS Sandbox Testing System

## 🎯 Zweck

Ein **vollständiges, isoliertes Test-Environment** für sichere Entwicklung und Fehlerbehebbung.

---

## 📚 Dokumentation

### Hauptdokumente

| Datei | Beschreibung |
|-------|-------------|
| **TESTING_GUIDE.md** | 📖 Umfassende Test-Dokumentation |
| **ERRORS_FOUND.md** | 🔍 Liste aller gefundenen Fehler |
| **SANDBOX_README.md** | 🧪 Sandbox-Umgebungs-Guide |
| **run-sandbox-tests.sh** | 🚀 Automatisierter Test-Runner |
| **setup-sandbox.sh** | 🔧 Sandbox-Setup Script |

---

## 🗂️ Struktur

```
electron-tts/
├── tests/                          # Test-Suite
│   ├── unit/
│   │   ├── avatar-mapping.test.js
│   │   ├── text-splitting.test.js
│   │   └── security.test.js
│   ├── integration/
│   │   └── ipc-communication.test.js
│   ├── mocks/
│   │   └── mock-data.js
│   ├── setup.js
│   └── sandbox-runner.js
│
├── sandbox/                        # Isolierte Test-Umgebung
│   ├── etts-test/                 # Vollständige Test-Kopie
│   │   ├── main.js
│   │   ├── preload.js
│   │   ├── index.html
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── .env
│   │   └── ...
│   ├── README.md
│   └── .gitignore
│
├── jest.config.js                  # Jest-Konfiguration
├── TESTING_GUIDE.md               # Test-Dokumentation
├── run-sandbox-tests.sh           # Test-Runner
└── setup-sandbox.sh               # Setup-Script
```

---

## 🚀 Quick Start

### 1. Sandbox einrichten

```bash
cd /home/aov/CascadeProjects/electron-tts
bash setup-sandbox.sh
```

### 2. In Sandbox wechseln

```bash
cd sandbox/etts-test
npm install
```

### 3. Tests ausführen

```bash
npm test                    # Alle Tests
npm run test:watch         # Watch-Modus
npm run test:coverage      # Mit Coverage
```

### 4. Fehler beheben

- Fehler identifizieren in Test-Output
- Code in Sandbox-Datei beheben
- Test neu ausführen: `npm test`
- Wenn bestanden → In `main.js` übernehmen
- In Git committen

---

## 🧪 Test-Abdeckung

### Aktive Tests

| Test-Datei | Tests | Status |
|------------|-------|--------|
| **avatar-mapping.test.js** | 5 | ✓ Ready |
| **text-splitting.test.js** | 6 | ✓ Ready |
| **security.test.js** | 5 | ✓ Ready |
| **ipc-communication.test.js** | 6 | ✓ Ready |
| **GESAMT** | **22** | ✓ Ready |

---

## 📋 Fehler-Behebungs-Workflow

```
┌─────────────────┐
│ Fehler gefunden │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Test schreiben (sandbox/)        │
│    - Fehler reproduzieren           │
│    - Test-Case erstellen            │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 2. Test ausführen                   │
│    npm test                         │
│    → FAIL (erwartungsgemäß)         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 3. Code beheben (sandbox/)          │
│    - Fix implementieren             │
│    - Logik validieren               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 4. Test ausführen                   │
│    npm test                         │
│    → PASS ✓                         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 5. In main.js übernehmen            │
│    - Gleichen Fix in main           │
│    - Dokumentieren                  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 6. Git committen                    │
│    git add ERRORS_FOUND.md          │
│    git commit -m "fix: ..."         │
└─────────────────────────────────────┘
```

---

## 📊 Fehler-Matrix

Diese Tests überprüfen diese Fehler:

| # | Fehler | Test | Prio |
|---|--------|------|------|
| 1 | nodeIntegration + contextIsolation | security.test.js | 🔴 |
| 2 | enableRemoteModule deprecated | security.test.js | 🔴 |
| 3 | Avatar-Voice nicht lowercase | avatar-mapping.test.js | 🔴 |
| 4 | Video-Pfad nicht initialisiert | ⏳ TODO | 🟡 |
| 5 | Avatar-Auswahl fehlerhafte Logik | ipc-communication.test.js | 🟡 |
| 6 | Progress-Werte ungültig | ipc-communication.test.js | 🟡 |
| 7 | Text-Chunking Fehler | text-splitting.test.js | 🟡 |
| 8 | Preload Document-Zugriff | ⏳ TODO | 🟡 |
| 9 | loadFile() Funktion fehlt | ⏳ TODO | 🟡 |
| 10 | Progress-Animation Fehler | ⏳ TODO | 🟢 |

---

## 🔄 Befehle

### Test-Runner

```bash
# Hauptlokation
bash run-sandbox-tests.sh

# Oder manuell
cd sandbox/etts-test
npm test
```

### Sandbox-Setup

```bash
bash setup-sandbox.sh
```

### Weitere Befehle

```bash
# Watch-Modus
npm run test:watch

# Coverage-Bericht
npm run test:coverage

# Nur Unit-Tests
npm test -- tests/unit

# Nur Integration-Tests
npm test -- tests/integration

# Spezifischer Test
npm test avatar-mapping.test.js

# Verbose Output
npm test -- --verbose
```

---

## ✅ Checkliste für Fehlerbehebbung

### Vor der Behebbung
- [ ] Fehler in ERRORS_FOUND.md dokumentiert
- [ ] Test für Fehler existiert
- [ ] Test schlägt fehl (zeigt das Problem)
- [ ] Sandbox-Umgebung aktiv

### Bei der Behebbung
- [ ] Fix in Sandbox-Version testen
- [ ] Test bestätigt Fix
- [ ] Code ist sauber und dokumentiert
- [ ] Keine neuen Fehler eingeführt

### Nach der Behebbung
- [ ] Fix in main.js übernommen
- [ ] Alle Tests in main.js ausgeführt
- [ ] Git-Commit mit aussagekräftiger Message
- [ ] ERRORS_FOUND.md aktualisiert

---

## 🔒 Best Practices

1. **Immer in Sandbox testen** vor Änderungen an main.js
2. **Tests schreiben** BEVOR Code beheben
3. **Coverage prüfen** nach Änderungen
4. **Git-Messages** aussagekräftig halten
5. **Dokumentation** aktuell halten

---

## 📞 Troubleshooting

### Problem: "Jest nicht gefunden"
```bash
npm install --save-dev jest @types/jest
```

### Problem: "Sandbox existiert nicht"
```bash
bash setup-sandbox.sh
```

### Problem: "Tests schlagen alle fehl"
```bash
npm test -- --verbose
npm test -- --detectOpenHandles
```

### Problem: "Module nicht gefunden"
```bash
cd sandbox/etts-test
rm -rf node_modules
npm install
```

---

## 📈 Nächste Schritte

1. ✅ Test-Struktur erstellt
2. ✅ Mock-Daten konfiguriert
3. ✅ Sandbox-Umgebung aufgebaut
4. ⏳ Fehler nacheinander beheben
5. ⏳ Tests für jeden Fehler schreiben
6. ⏳ Coverage zu 80%+ bringen
7. ⏳ Alle Änderungen in Git committen

---

## 📝 Zuletzt aktualisiert

**Datum**: 7. Dezember 2025  
**Status**: 🟢 Sandbox-System bereit  
**Fehler zur Behebbung**: 10 (4 kritisch, 6 mittel)

---

**Autor**: Automation System  
**Branch**: main  
**Repository**: electron-tts (dormarox/eTTS)
