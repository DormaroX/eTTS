#!/bin/bash

# eTTS Sandbox System Status
# Zeigt den aktuellen Status des Test-Systems

PROJ_DIR="/home/aov/CascadeProjects/electron-tts"

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   eTTS Sandbox System - Status Dashboard                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Projekt-Status
echo -e "${BLUE}📊 Projekt Status:${NC}"
echo ""
if [ -f "$PROJ_DIR/package.json" ]; then
    echo -e "  ${GREEN}✓${NC} package.json vorhanden"
    VERSION=$(grep '"version"' "$PROJ_DIR/package.json" | head -1 | cut -d'"' -f4)
    echo "    Version: v$VERSION"
fi

if [ -f "$PROJ_DIR/main.js" ]; then
    echo -e "  ${GREEN}✓${NC} main.js vorhanden"
fi

if [ -f "$PROJ_DIR/preload.js" ]; then
    echo -e "  ${GREEN}✓${NC} preload.js vorhanden"
fi

if [ -f "$PROJ_DIR/index.html" ]; then
    echo -e "  ${GREEN}✓${NC} index.html vorhanden"
fi

# 2. Test-System
echo ""
echo -e "${BLUE}🧪 Test-System:${NC}"
echo ""

if [ -d "$PROJ_DIR/tests" ]; then
    echo -e "  ${GREEN}✓${NC} tests/ Verzeichnis vorhanden"
    TEST_FILES=$(find "$PROJ_DIR/tests" -name "*.test.js" | wc -l)
    echo "    Tests vorhanden: $TEST_FILES"
fi

if [ -f "$PROJ_DIR/jest.config.js" ]; then
    echo -e "  ${GREEN}✓${NC} jest.config.js vorhanden"
fi

if [ -d "$PROJ_DIR/tests/unit" ]; then
    UNIT_TESTS=$(ls "$PROJ_DIR/tests/unit/"*.test.js 2>/dev/null | wc -l)
    echo -e "  ${GREEN}✓${NC} Unit-Tests: $UNIT_TESTS"
fi

if [ -d "$PROJ_DIR/tests/integration" ]; then
    INT_TESTS=$(ls "$PROJ_DIR/tests/integration/"*.test.js 2>/dev/null | wc -l)
    echo -e "  ${GREEN}✓${NC} Integration-Tests: $INT_TESTS"
fi

# 3. Dokumentation
echo ""
echo -e "${BLUE}📚 Dokumentation:${NC}"
echo ""

DOCS=("TESTING_GUIDE.md" "ERRORS_FOUND.md" "SANDBOX_SETUP.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$PROJ_DIR/$doc" ]; then
        echo -e "  ${GREEN}✓${NC} $doc"
    else
        echo -e "  ${YELLOW}⚠${NC} $doc (fehlt)"
    fi
done

# 4. Sandbox
echo ""
echo -e "${BLUE}🔒 Sandbox Environment:${NC}"
echo ""

if [ -d "$PROJ_DIR/sandbox" ]; then
    echo -e "  ${GREEN}✓${NC} sandbox/ Verzeichnis vorhanden"
    if [ -d "$PROJ_DIR/sandbox/etts-test" ]; then
        echo -e "  ${GREEN}✓${NC} etts-test/ Testumgebung vorhanden"
    else
        echo -e "  ${YELLOW}⚠${NC} etts-test/ nicht initialisiert"
        echo "     → Ausführen: bash setup-sandbox.sh"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} sandbox/ Verzeichnis fehlt"
    echo "     → Ausführen: bash setup-sandbox.sh"
fi

# 5. Scripts
echo ""
echo -e "${BLUE}🚀 Scripts:${NC}"
echo ""

SCRIPTS=("setup-sandbox.sh" "run-sandbox-tests.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$PROJ_DIR/$script" ]; then
        if [ -x "$PROJ_DIR/$script" ]; then
            echo -e "  ${GREEN}✓${NC} $script (ausführbar)"
        else
            echo -e "  ${YELLOW}⚠${NC} $script (nicht ausführbar)"
            echo "     → Ausführen: chmod +x $script"
        fi
    fi
done

# 6. Node Dependencies
echo ""
echo -e "${BLUE}📦 Dependencies:${NC}"
echo ""

if [ -d "$PROJ_DIR/node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} node_modules vorhanden"
    if [ -d "$PROJ_DIR/node_modules/jest" ]; then
        echo -e "  ${GREEN}✓${NC} jest installiert"
    else
        echo -e "  ${YELLOW}⚠${NC} jest nicht installiert"
        echo "     → Ausführen: npm install --save-dev jest"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} node_modules fehlt"
    echo "     → Ausführen: npm install"
fi

# 7. Git Status
echo ""
echo -e "${BLUE}📌 Git Status:${NC}"
echo ""

cd "$PROJ_DIR"
if [ -d ".git" ]; then
    BRANCH=$(git branch --show-current)
    CHANGES=$(git status --porcelain | wc -l)
    COMMITS=$(git log --oneline | head -1)
    
    echo -e "  ${GREEN}✓${NC} Repository aktiv"
    echo "    Branch: $BRANCH"
    echo "    Änderungen: $CHANGES"
    echo "    Letzter Commit: $(git log -1 --pretty=format:'%h - %s')"
else
    echo -e "  ${RED}✗${NC} Kein Git Repository"
fi

# 8. Fehler-Übersicht
echo ""
echo -e "${BLUE}🔍 Fehler-Übersicht:${NC}"
echo ""

if [ -f "$PROJ_DIR/ERRORS_FOUND.md" ]; then
    CRITICAL=$(grep -c "🔴" "$PROJ_DIR/ERRORS_FOUND.md" || echo "0")
    MEDIUM=$(grep -c "🟡" "$PROJ_DIR/ERRORS_FOUND.md" || echo "0")
    LOW=$(grep -c "🟢" "$PROJ_DIR/ERRORS_FOUND.md" || echo "0")
    
    echo -e "  ${RED}🔴 Kritisch: $CRITICAL${NC}"
    echo -e "  ${YELLOW}🟡 Mittel: $MEDIUM${NC}"
    echo -e "  ${GREEN}🟢 Gering: $LOW${NC}"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   Nächste Schritte                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "1. ${BLUE}Sandbox initialisieren:${NC}"
echo "   bash setup-sandbox.sh"
echo ""
echo -e "2. ${BLUE}Tests ausführen:${NC}"
echo "   npm test"
echo ""
echo -e "3. ${BLUE}Fehler beheben (in dieser Reihenfolge):${NC}"
echo "   - Kritische Fehler (Prio: 1-3)"
echo "   - Mittlere Fehler (Prio: 4-7)"
echo "   - Geringfügige Fehler (Prio: 8-10)"
echo ""
echo -e "4. ${BLUE}In Git committen:${NC}"
echo "   git add -A"
echo "   git commit -m 'test: Sandbox-System und Fehlerbehebbung'"
echo ""

# Final Status
echo "╔════════════════════════════════════════════════════════════╗"
if [ "$CHANGES" -eq 0 ]; then
    echo -e "║  ${GREEN}✓ System bereit zum Starten der Fehlerbehebbung${NC}             ║"
else
    echo -e "║  ${YELLOW}⚠ Es gibt noch Änderungen zu committen${NC}               ║"
fi
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
