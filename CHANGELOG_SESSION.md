# Änderungsprotokoll - Session Zusammenfassung

## Übersicht
Dieses Dokument listet alle Änderungen auf, die während dieser Session vorgenommen wurden.

---

## 1. Karussell-Funktionalität

### 1.1 Zurück zur ursprünglichen Version
**Datei**: `index.html`
- **Änderung**: Komplette Karussell-Logik auf die ursprüngliche Version zurückgesetzt
- **Grund**: Komplexe Änderungen führten zu Problemen
- **Details**:
  - Einfache Klon-Logik für alle Karten (nicht nur Hauptcharaktere)
  - Scroll-Verhalten: `cardWidth * 2` (2 Karten pro Klick)
  - Keine automatische Selektion während des Scrollens
  - Einfache Initialisierung ohne komplexe Flags

### 1.2 Scroll-Verhalten angepasst
**Datei**: `index.html`
- **Änderung**: Scroll-Verhalten von 2 Karten auf 1 Karte pro Klick geändert
- **Zeile**: ~900-912
- **Vorher**: `cardWidth * 2`
- **Nachher**: `cardWidth`

---

## 2. Button-Prüfung und Fehlerbehandlung

### 2.1 Alle Buttons mit Null-Checks versehen
**Datei**: `index.html`
- **Zeilen**: ~918-1030
- **Änderungen**:
  - Jeder Button prüft, ob das Element existiert
  - Jeder Button prüft, ob die benötigten APIs verfügbar sind
  - Console-Logs für Debugging hinzugefügt
  - Fehlermeldungen bei fehlenden APIs

### 2.2 Geprüfte Buttons:
- ✅ **+Button** (`add-files-button`) - Dateien zur Playlist hinzufügen
- ✅ **Play/Pause** - Medienwiedergabe
- ✅ **Prev/Next** - Playlist-Navigation
- ✅ **Stop** - Medien stoppen
- ✅ **Listen** - TTS abspielen
- ✅ **Save** - Als MP3 speichern
- ✅ **txt2mp3** - Text zu MP3 konvertieren
- ✅ **Upload** - TXT-Datei hochladen
- ✅ **txt2mp4** - Text zu MP4 konvertieren
- ✅ **Stop!** - Prozess stoppen
- ✅ **Volume Slider** - Lautstärke
- ✅ **Progress Bar** - Seek-Funktion

---

## 3. +Button Problem behoben

### 3.1 Initialisierung verbessert
**Datei**: `index.html`
- **Zeilen**: ~805-1279
- **Änderungen**:
  - `initializeApp()` Funktion erstellt, die prüft, ob APIs verfügbar sind
  - `setupEventListeners()` Funktion für alle Event-Listener
  - Wartet auf DOM und API-Verfügbarkeit
  - Retry-Logik: Falls APIs nicht sofort verfügbar, wird nach 500ms erneut versucht

### 3.2 +Button speziell verbessert
**Datei**: `index.html`
- **Zeilen**: ~943-957
- **Änderungen**:
  - Zusätzliche Logs und Fehlerbehandlung
  - Prüfung auf `window.electronAPI` Verfügbarkeit
  - Benutzerfreundliche Fehlermeldungen

---

## 4. Preload.js Probleme behoben

### 4.1 Sandbox deaktiviert
**Datei**: `main.js`
- **Zeile**: ~76
- **Änderung**: `sandbox: false` zu `webPreferences` hinzugefügt
- **Grund**: `fs` Modul war im Preload-Script nicht verfügbar

### 4.2 fsPromises hinzugefügt
**Datei**: `preload.js`
- **Zeile**: ~3
- **Änderung**: `const fsPromises = require('fs').promises;` hinzugefügt
- **Grund**: Wurde verwendet, war aber nicht definiert

### 4.3 Howler.js geladen
**Datei**: `preload.js`
- **Zeilen**: ~6-13
- **Änderung**: Howler.js über `require('howler')` geladen
- **Details**:
  ```javascript
  const howler = require('howler');
  Howl = howler.Howl;
  Howler = howler.Howler;
  ```

### 4.4 +Button Dateiauswahl Problem behoben
**Datei**: `preload.js`
- **Zeilen**: ~584-640
- **Problem**: `window.mediaPlayer.addToPlaylist()` war im IPC-Handler nicht verfügbar
- **Lösung**: 
  - Gemeinsame Hilfsfunktion `addFileToPlaylist()` erstellt
  - IPC-Handler ruft Funktion direkt auf (nicht über `window`)
  - `mediaPlayer.addToPlaylist` verwendet jetzt die gemeinsame Funktion

---

## 5. Play-Button Problem behoben

### 5.1 playTrack Funktion verbessert
**Datei**: `preload.js`
- **Zeilen**: ~490-533
- **Änderungen**:
  - Validierung für Track-Index und Track-Objekt
  - Prüfung, ob Howl verfügbar ist
  - Bessere Fehlerbehandlung
  - `currentSound.unload()` hinzugefügt für Cleanup

### 5.2 Volume-Funktion korrigiert
**Datei**: `preload.js`
- **Zeile**: ~585
- **Änderung**: Prüfung, ob Howler verfügbar ist, bevor Volume gesetzt wird

---

## 6. DevTools Konfiguration

### 6.1 DevTools automatisch öffnen
**Datei**: `main.js`
- **Zeilen**: ~90-108
- **Änderungen**:
  - DevTools öffnen mit `--dev` Flag oder `NODE_ENV=development`
  - Timeout hinzugefügt, damit DevTools nach dem Laden geöffnet werden
  - Doppelte Prüfung für bessere Kompatibilität

---

## 7. Code-Struktur Verbesserungen

### 7.1 Event-Listener Initialisierung
**Datei**: `index.html`
- **Struktur**:
  ```javascript
  function initializeApp() {
      // Prüft API-Verfügbarkeit
      // Ruft setupEventListeners() auf
  }
  
  function setupEventListeners() {
      // Alle Event-Listener werden hier registriert
  }
  ```

### 7.2 Fehlerbehandlung
- Alle kritischen Funktionen haben jetzt Fehlerbehandlung
- Console-Logs für Debugging
- Benutzerfreundliche Fehlermeldungen

---

## 8. Zusammenfassung der behobenen Probleme

### ✅ Behobene Fehler:
1. **+Button funktioniert nicht** → Behoben durch Initialisierung und API-Prüfung
2. **Preload.js kann fs nicht laden** → Behoben durch `sandbox: false` und `fsPromises` Import
3. **window.mediaPlayer nicht verfügbar** → Behoben durch gemeinsame Hilfsfunktion
4. **Play-Button spielt keine Titel ab** → Behoben durch Howler.js Import
5. **DevTools öffnen nicht automatisch** → Behoben durch verbesserte Konfiguration
6. **Karussell-Scroll-Verhalten** → Angepasst auf 1 Karte pro Klick
7. **Alle Buttons prüfen** → Null-Checks und Fehlerbehandlung hinzugefügt

---

## 9. Technische Details

### Geänderte Dateien:
1. **index.html** - Event-Listener, Button-Prüfung, Karussell-Logik
2. **preload.js** - Howler.js Import, Hilfsfunktionen, IPC-Handler
3. **main.js** - Sandbox-Konfiguration, DevTools-Konfiguration

### Neue Abhängigkeiten:
- Keine neuen Abhängigkeiten (Howler.js war bereits installiert)

### Entfernte Features:
- Automatische Karussell-Scroll-Funktion
- Komplexe Karussell-Initialisierung
- Automatische Selektion während des Scrollens

---

## 10. Nächste Schritte (Optional)

### Empfohlene Verbesserungen:
1. **Error Handling**: Zentralisierte Fehlerbehandlung
2. **Logging**: Strukturiertes Logging-System
3. **Tests**: Unit-Tests für kritische Funktionen
4. **Dokumentation**: API-Dokumentation für exponierten Funktionen

---

## 11. Test-Checkliste

### ✅ Getestete Funktionen:
- [x] +Button öffnet Dateiauswahl-Dialog
- [x] Dateien werden zur Playlist hinzugefügt
- [x] Play-Button spielt Titel ab
- [x] Alle Buttons haben Event-Listener
- [x] Karussell scrollt korrekt (1 Karte pro Klick)
- [x] APIs sind verfügbar nach Initialisierung
- [x] DevTools öffnen im Debug-Modus

---

---

## 12. Multi-Character-TTS mit Tag-Parser (v1.5.0)

### 12.1 Character-Config System
**Datei**: `character-config.js` (NEU)
- **Feature**: Zentralisierte Character-Konfiguration
- **Details**:
  - `CharacterSettings` Klasse für strukturierte Character-Daten
  - 8 Charaktere vollständig konfiguriert (Maxx, Terra, Nova, Nyxari, Aurora, Admiral Bishop, Commander Cook, Narrator)
  - Voice-Mappings korrigiert (Terra→nova, Nova→sage, Nyxari→shimmer, Narrator→ash)
  - Character-Instructions für TTS-Prompting

### 12.2 Tag-Parser Implementierung
**Datei**: `main.js`
- **Feature**: `parseTextWithTags()` Funktion
- **Details**:
  - Erkennt `[CHARACTER]` und `[CHARACTER:modifier]` Tags
  - Teilt Text in Character-Segmente auf
  - Unterstützt Tag-Mapping (z.B. `NARRATOR` → `Narrator`)
  - Behandelt mehrzeilige Text-Segmente korrekt

### 12.3 Multi-Character-TTS System
**Datei**: `main.js`
- **Feature**: `processMultiCharacterTTS()` Funktion
- **Details**:
  - Verarbeitet Text-Dateien mit Character-Tags
  - Jedes Segment wird mit der korrekten Character-Stimme umgewandelt
  - Unterstützt lange Texte (Block-Aufteilung)
  - Progress-Tracking für Multi-Segment-Verarbeitung
  - Automatische Erkennung von Tags in `txt2mp3-request` und `upload-txt-file-request`

### 12.4 Pausen zwischen Character-Wechseln
**Datei**: `main.js`
- **Feature**: FFmpeg-basierte Pausen-Einfügung
- **Details**:
  - Konfigurierbare Pausenlänge (Standard: 0.6 Sekunden)
  - Pausen werden nur zwischen verschiedenen Charakteren eingefügt
  - Verwendet FFmpeg für nahtlose MP3-Kombination
  - Temporäre Dateien werden automatisch aufgeräumt
  - `combineAudioSegmentsWithPauses()` Funktion für FFmpeg-Integration

### 12.5 Integration in bestehende Handler
**Datei**: `main.js`
- **Änderungen**:
  - `txt2mp3-request`: Prüft auf Tags, verwendet Multi-Character-TTS wenn vorhanden
  - `upload-txt-file-request`: Prüft auf Tags, verwendet Multi-Character-TTS wenn vorhanden
  - Fallback auf Narrator-Stimme wenn keine Tags gefunden werden

### 12.6 AVATAR_VOICE_MAP aktualisiert
**Datei**: `main.js`
- **Änderung**: `AVATAR_VOICE_MAP` verwendet jetzt `CharacterConfig` für Voice und Settings
- **Vorteil**: Zentrale Konfiguration, einfachere Wartung

---

## 13. Version 1.5.0 - Release Notes

### Neue Features:
- ✅ **Multi-Character-TTS**: Unterstützung für Text-Dateien mit Character-Tags
- ✅ **Tag-Parser**: Automatische Erkennung und Verarbeitung von `[CHARACTER]` Tags
- ✅ **Character-Config System**: Zentrale Konfiguration aller Charaktere
- ✅ **Pausen zwischen Character-Wechseln**: Natürlichere Dialoge mit konfigurierbaren Pausen

### Technische Verbesserungen:
- FFmpeg-Integration für Audio-Kombination
- Temporäre Datei-Verwaltung mit automatischem Cleanup
- Verbesserte Progress-Tracking für Multi-Segment-Verarbeitung

### Geänderte Dateien:
1. **main.js** - Tag-Parser, Multi-Character-TTS, Pausen-Logik
2. **character-config.js** - NEU: Character-Konfiguration
3. **package.json** - Version 1.5.0

---

**Erstellt am**: $(date)
**Session**: Button-Prüfung, Karussell-Fixes, Play-Button, Preload.js Fixes, Multi-Character-TTS, Tag-Parser, Pausen-Funktion
**Version**: 1.5.0
