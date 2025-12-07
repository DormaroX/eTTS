#!/bin/bash

# eTTS Sandbox Development Environment
# Erstellt eine isolierte Kopie zum Testen von Änderungen

set -e

PROJ_DIR="/home/aov/CascadeProjects/electron-tts"
SANDBOX_DIR="$PROJ_DIR/sandbox"
SANDBOX_COPY="$SANDBOX_DIR/etts-test"

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   eTTS Sandbox Development Environment        ║"
echo "║   Isolierte Test-Umgebung                      ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# 1. Sandbox-Verzeichnis erstellen
echo "📁 Erstelle Sandbox-Verzeichnis..."
mkdir -p "$SANDBOX_COPY"

# 2. Kopiere nur notwendige Dateien
echo "📋 Kopiere Projektdateien (ohne node_modules)..."
rsync -av \
    --exclude='node_modules' \
    --exclude='coverage' \
    --exclude='.git' \
    --exclude='*.mp4' \
    --exclude='*.mp3' \
    "$PROJ_DIR/" "$SANDBOX_COPY/" > /dev/null 2>&1 || true

# 3. Neue package.json für Sandbox
echo "⚙️  Erstelle Sandbox package.json..."
cat > "$SANDBOX_COPY/package.json" << 'EOF'
{
  "name": "etts-sandbox",
  "version": "1.0.0-sandbox",
  "description": "eTTS Sandbox für sichere Tests",
  "main": "main.js",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .js",
    "validate": "npm test && npm run lint"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  },
  "dependencies": {
    "electron": "^35.0.2",
    "openai": "^4.91.1",
    "dotenv": "^16.4.7",
    "howler": "^2.2.4",
    "mp3-duration": "^1.1.0"
  }
}
EOF

# 4. Erstelle README für Sandbox
echo "📝 Erstelle Sandbox-README..."
cat > "$SANDBOX_COPY/SANDBOX_README.md" << 'EOF'
# eTTS Sandbox Environment

Dies ist eine isolierte Test-Umgebung für eTTS-Entwicklung.

## Voraussetzungen

- Node.js >= 20.x
- npm

## Setup

```bash
cd sandbox/etts-test
npm install
```

## Tests ausführen

```bash
npm test                # Alle Tests
npm run test:watch     # Watch-Modus
npm run test:coverage  # Mit Coverage
npm run validate       # Tests + Lint
```

## Struktur

```
.
├── main.js             # Main-Prozess (getestet)
├── preload.js          # Preload-Script (getestet)
├── index.html          # UI (getestet)
├── tests/              # Test-Suite
│   ├── unit/
│   ├── integration/
│   └── mocks/
└── package.json        # Sandbox-Dependencies
```

## Workflow

1. **Änderung schreiben** → Test-Datei anpassen
2. **Test schreiben** → Neue Test-Case erstellen
3. **Test ausführen** → `npm test`
4. **Code beheben** → Fix implementieren
5. **Test bestätigt** → Alle Tests grün
6. **Zu main committen** → Merge zu production

## Sicherheit

- ✓ Keine node_modules aus production
- ✓ Isolierte Pfade
- ✓ Mock-Daten statt echter APIs
- ✓ Keine .git Geschichte

Zuletzt aktualisiert: 7. Dezember 2025
EOF

# 5. .env-Datei für Sandbox
echo "🔐 Erstelle Sandbox .env..."
cat > "$SANDBOX_COPY/.env" << 'EOF'
# Sandbox Environment Variables
NODE_ENV=test
OPENAI_API_KEY=test-key-sandbox-12345
TESTING=true
EOF

# 6. gitignore für Sandbox
echo "🚫 Erstelle Sandbox .gitignore..."
cat > "$SANDBOX_DIR/.gitignore" << 'EOF'
# Sandbox wird nicht versioniert
etts-test/
*.log
.env.local
EOF

# 7. Sandbox-Informationsdatei
echo "ℹ️  Erstelle Sandbox-Info..."
cat > "$SANDBOX_DIR/README.md" << 'EOF'
# eTTS Sandbox Directory

Dies ist die Test-Umgebung für eTTS-Entwicklung.

## Verwende die Sandbox für:

- ✓ Testen von Änderungen
- ✓ Experimenten mit neuem Code
- ✓ Integration-Tests
- ✓ Fehler-Debugging

## NICHT verwenden für:

- ✗ Production-Daten
- ✗ Echte Audio-Dateien
- ✗ Langzeitlagerung

## Wichtig

Die Sandbox wird **nicht** in Git versioniert!
Sie ist nur lokal für Tests gedacht.

Zuletzt aktualisiert: 7. Dezember 2025
EOF

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║       Sandbox erfolgreich erstellt!            ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "📍 Sandbox-Verzeichnis: $SANDBOX_COPY"
echo ""
echo "🚀 Nächste Schritte:"
echo ""
echo "  1. Installiere Dependencies:"
echo "     cd $SANDBOX_COPY"
echo "     npm install"
echo ""
echo "  2. Führe Tests aus:"
echo "     npm test"
echo ""
echo "  3. Teste Änderungen:"
echo "     npm run test:watch"
echo ""
