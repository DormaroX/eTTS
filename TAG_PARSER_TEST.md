# Tag-Parser Test - test.text Analyse

## Datei: `/home/aov/Dokumente/Himmelsfeuer/Hörspielfassung/test.text`

## Gefundene Tags:

1. `[NARRATOR]` - Zeile 1
2. `[NYXARI]` - Zeilen 8, 37, 45, 49, 57
3. `[BISHOP]` - Zeilen 25, 34
4. `[MAXX]` - Zeile 31
5. `[TERRA]` - Zeile 42
6. `[TERRA:soft]` - Zeile 54 (mit Modifier!)

## Aktueller Status der Implementierung:

### ❌ Problem:
Die aktuelle Implementierung würde **NICHT** korrekt funktionieren:

1. **txt2mp3-request** (Zeile 986-991 in main.js):
   - Verwendet feste Stimme: `"alloy"`
   - Ignoriert alle Tags komplett
   - Würde den gesamten Text mit einer Stimme umwandeln

2. **upload-txt-file-request** (txt2mp3 blocks):
   - Verwendet ebenfalls keine Tag-Erkennung
   - Teilt Text nur in Blöcke auf (MAX_CHARS)
   - Ignoriert Character-Tags

3. **txt2mp3() Funktion**:
   - Verwendet einen festen Avatar-Parameter
   - Keine Tag-Parsing-Logik

## Was fehlt:

### ✅ Benötigte Features:

1. **Tag-Parser Funktion**:
   ```javascript
   function parseTextWithTags(text) {
       // Erkennt [CHARACTER] Tags
       // Erkennt [CHARACTER:modifier] Tags (z.B. [TERRA:soft])
       // Teilt Text in Segmente mit zugeordneten Charakteren
       // Gibt Array zurück: [{character: 'NARRATOR', text: '...'}, ...]
   }
   ```

2. **Multi-Character TTS Verarbeitung**:
   - Jedes Segment mit der richtigen Stimme umwandeln
   - Audio-Segmente kombinieren
   - Pausen zwischen Character-Wechseln

3. **Modifier-Support**:
   - `[TERRA:soft]` - könnte andere Voice-Parameter verwenden
   - Oder Character-Instructions anpassen

## Empfohlene Lösung:

1. Tag-Parser implementieren
2. Text in Character-Segmente aufteilen
3. Jedes Segment mit korrekter Stimme verarbeiten
4. Audio-Segmente nahtlos kombinieren

## Test-Ergebnis:

**Status**: ❌ **Würde NICHT korrekt funktionieren**

Die Datei würde aktuell:
- Alle Tags ignorieren
- Mit einer festen Stimme ("alloy") umgewandelt
- Keine Character-Unterscheidung
- Keine Modifier-Unterstützung

**Empfehlung**: Tag-Parser und Multi-Character-TTS implementieren
