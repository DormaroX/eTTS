# Tag-Analyse: test.text

## Datei: `/home/aov/Dokumente/Himmelsfeuer/Hörspielfassung/test.text`

## Gefundene Character-Tags:

1. `[NARRATOR]` - Zeile 1
2. `[NYXARI]` - Zeilen 8, 37, 45, 49, 57
3. `[BISHOP]` - Zeilen 25, 34 (entspricht "Admiral Bishop")
4. `[MAXX]` - Zeile 31
5. `[TERRA]` - Zeile 42
6. `[TERRA:soft]` - Zeile 54 (mit Modifier!)

## Aktueller Status: ❌ WÜRDE NICHT KORREKT FUNKTIONIEREN

### Problem 1: txt2mp3-request (Zeile 986-991)
```javascript
const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",  // ❌ Feste Stimme, ignoriert alle Tags!
    input: text,     // ❌ Kompletter Text mit Tags wird gesprochen
    response_format: "mp3"
});
```

**Ergebnis**: 
- Alle Tags würden als Text gesprochen werden: "[NARRATOR] Himmelsfeuer..."
- Nur eine Stimme ("alloy") für alle Charaktere
- Keine Character-Unterscheidung

### Problem 2: upload-txt-file-request (txt2mp3 blocks)
- Teilt Text nur nach MAX_CHARS auf
- Ignoriert Character-Tags komplett
- Verwendet keine Character-Stimmen

### Problem 3: Keine Tag-Parsing-Logik
- Es gibt keine Funktion, die `[CHARACTER]` Tags erkennt
- Keine Funktion, die Text in Character-Segmente aufteilt
- Keine Multi-Character-TTS-Verarbeitung

## Was benötigt wird:

### 1. Tag-Parser Funktion
```javascript
function parseTextWithTags(text) {
    // Erkennt [CHARACTER] Tags
    // Erkennt [CHARACTER:modifier] Tags
    // Teilt Text in Segmente: [{character: 'NARRATOR', text: '...', modifier: null}, ...]
}
```

### 2. Character-Mapping für Tags
- `[NARRATOR]` → Narrator (voice: "ash") ✅
- `[NYXARI]` → Nyxari (voice: "shimmer")
- `[BISHOP]` → Admiral Bishop (voice: "onyx")
- `[MAXX]` → Maxx (voice: "ash")
- `[TERRA]` → Terra (voice: "nova")
- `[TERRA:soft]` → Terra mit Modifier (könnte andere Parameter verwenden)

### 3. Multi-Character TTS Verarbeitung
- Jedes Segment mit korrekter Stimme umwandeln
- Audio-Segmente nahtlos kombinieren
- Pausen zwischen Character-Wechseln (optional)

## Empfohlene Lösung:

1. **Tag-Parser implementieren** - Erkennt und parst alle Tags
2. **Text in Character-Segmente aufteilen** - Jedes Segment mit zugeordnetem Charakter
3. **Multi-Character-TTS** - Jedes Segment mit korrekter Stimme verarbeiten
4. **Audio-Kombination** - Segmente nahtlos zusammenfügen

## Test-Ergebnis:

**Status**: ❌ **Würde NICHT korrekt funktionieren**

Die Datei würde aktuell:
- Alle Tags als Text sprechen
- Mit einer festen Stimme ("alloy") umwandeln
- Keine Character-Unterscheidung haben
- Keine Modifier-Unterstützung haben

**Nächster Schritt**: Tag-Parser und Multi-Character-TTS implementieren
