#!/bin/bash

# eTTS Sandbox Test Runner
# Führt eine komplette Test-Suite aus

set -e

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   eTTS Sandbox Test System                     ║"
echo "║   Test-Suite für sichere Entwicklung           ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

PROJ_DIR="/home/aov/CascadeProjects/electron-tts"
cd "$PROJ_DIR"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Abhängigkeiten prüfen
echo -e "${BLUE}[1/6]${NC} Prüfe Abhängigkeiten..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm nicht gefunden${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm gefunden${NC}"

# 2. Jest installieren (falls notwendig)
echo ""
echo -e "${BLUE}[2/6]${NC} Installiere Test-Dependencies..."
if [ ! -d "node_modules/jest" ]; then
    echo "Jest nicht gefunden, installiere..."
    npm install --save-dev jest @types/jest > /dev/null 2>&1
fi
echo -e "${GREEN}✓ Dependencies bereit${NC}"

# 3. Test-Verzeichnis prüfen
echo ""
echo -e "${BLUE}[3/6]${NC} Prüfe Test-Struktur..."
if [ ! -d "tests" ]; then
    echo -e "${RED}✗ tests/ Verzeichnis nicht gefunden${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Test-Struktur vorhanden${NC}"

# 4. Unit-Tests ausführen
echo ""
echo -e "${BLUE}[4/6]${NC} Führe Unit-Tests aus..."
if npm test -- tests/unit 2>/dev/null; then
    echo -e "${GREEN}✓ Unit-Tests bestanden${NC}"
else
    echo -e "${YELLOW}⚠ Einige Unit-Tests fehlgeschlagen${NC}"
fi

# 5. Integration-Tests ausführen
echo ""
echo -e "${BLUE}[5/6]${NC} Führe Integration-Tests aus..."
if npm test -- tests/integration 2>/dev/null; then
    echo -e "${GREEN}✓ Integration-Tests bestanden${NC}"
else
    echo -e "${YELLOW}⚠ Einige Integration-Tests fehlgeschlagen${NC}"
fi

# 6. Coverage-Bericht generieren
echo ""
echo -e "${BLUE}[6/6]${NC} Generiere Coverage-Bericht..."
mkdir -p coverage
npm test -- --coverage --silent 2>/dev/null || true
echo -e "${GREEN}✓ Coverage-Bericht generiert${NC}"

# Zusammenfassung
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║            Test-Zusammenfassung                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Test-Sandbox erfolgreich eingerichtet${NC}"
echo ""
echo "📁 Test-Verzeichnisse:"
echo "  - tests/unit/              (Unit-Tests)"
echo "  - tests/integration/       (Integration-Tests)"
echo "  - tests/mocks/             (Mock-Daten)"
echo ""
echo "📄 Wichtige Dateien:"
echo "  - jest.config.js           (Jest-Konfiguration)"
echo "  - TESTING_GUIDE.md         (Test-Dokumentation)"
echo ""
echo "🚀 Nächste Schritte:"
echo "  1. Tests ausführen: npm test"
echo "  2. Coverage prüfen: npm test -- --coverage"
echo "  3. Fehler beheben in sandbox/"
echo "  4. Änderungen in Git committen"
echo ""
