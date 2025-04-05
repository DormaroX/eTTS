# eTTS v1.2

Eine Electron-basierte Text-to-Speech-Anwendung mit Videogenerierung durch SadTalker.

## Features

- Text-to-Speech mit verschiedenen Stimmen
- Videogenerierung mit SadTalker
- Visuelles Charakter-Auswahlmenü mit Profilbildern (Maxx, Terra, Nova, Nyxari)
- Qualitätseinstellungen für die Videogenerierung
- Upscaling-Optionen (2K, 4K)
- MP3-Export
- Modernes, dunkles UI-Design
- Playlist-Management mit Drag & Drop
- Automatische Wiedergabe-Queue
- Fortschrittsanzeige für die Audiowiedergabe
- Lautstärkeregelung
- Kompakte Benutzeroberfläche
- Verbesserte Fortschrittsanzeigen für Verarbeitungsprozesse
- Korrekte Anzeige von Audiodauern (inkl. Stunden)
- Optimierte UI-Layouts für verschiedene Fenstergrößen

## Voraussetzungen

- [Node.js](https://nodejs.org/) 20.x oder höher
- [Python](https://www.python.org/) 3.10 oder höher
- [FFmpeg](https://ffmpeg.org/) für die Videobearbeitung
- [Git](https://git-scm.com/) für das Klonen der Repositories
- Mindestens 8GB RAM für die Videogenerierung
- Ca. 5GB freier Speicherplatz für die SadTalker-Modelle

## Installation

1. Stellen Sie sicher, dass alle Voraussetzungen erfüllt sind:
```bash
# Überprüfen der installierten Versionen
node --version  # sollte >= 20.x sein
python3 --version  # sollte >= 3.10 sein
ffmpeg -version  # sollte installiert sein
```

2. Repository klonen:
```bash
git clone https://github.com/dormarox/eTTS.git
cd eTTS
```

2. Node.js-Abhängigkeiten installieren:
```bash
npm install
```

3. SadTalker einrichten (falls nicht vorhanden):
```bash
cd /home/aov
git clone https://github.com/OpenTalker/SadTalker.git
cd SadTalker
bash scripts/download_models.sh
python3 -m venv venv
source venv/bin/activate
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

## Verzeichnisstruktur

- `/assets`
  - `/images` - Charakterbilder und Hintergrund
  - `/videos` - Generierte Videos
- `/src` - Quellcode
- `start.sh` - Startscript

## Verwendung

1. Anwendung starten:
```bash
./start.sh
```

2. Text eingeben und Charakter auswählen
3. Qualitätseinstellungen anpassen (optional)
4. Eine der folgenden Aktionen wählen:
   - "Anhören" - Direkte TTS-Wiedergabe
   - "Als MP3 speichern" - Audio exportieren
   - "txt2mp3" - Text in MP3 umwandeln
   - "txt2mp3 blocks" - Längeren Text in Blöcken verarbeiten

## Konfiguration

1. Erstellen Sie eine `.env`-Datei im Hauptverzeichnis:
```bash
cp .env.example .env
```

2. Bearbeiten Sie die `.env`-Datei und fügen Sie Ihre Konfiguration hinzu:
```env
OPENAI_API_KEY=ihr_api_schlüssel  # Optional für erweiterte Funktionen
SADTALKER_PATH=/pfad/zu/sadtalker  # Pfad zu Ihrer SadTalker-Installation
```

3. Weitere Konfigurationsoptionen finden Sie in:
- `config.js` - Allgemeine Anwendungseinstellungen
- `src/config/characters.js` - Charakterkonfiguration
- `src/config/audio.js` - Audioeinstellungen

## Fehlerbehebung

### Bekannte Probleme

1. **SadTalker-Modelle werden nicht geladen**
   - Überprüfen Sie den Pfad in der `.env`-Datei
   - Stellen Sie sicher, dass alle Modelle heruntergeladen wurden
   - Führen Sie `bash scripts/download_models.sh` im SadTalker-Verzeichnis erneut aus

2. **Videogenerierung schlägt fehl**
   - Überprüfen Sie den verfügbaren RAM
   - Stellen Sie sicher, dass FFmpeg korrekt installiert ist
   - Prüfen Sie die Python-Umgebung und Abhängigkeiten

3. **Audio-Ausgabe funktioniert nicht**
   - Überprüfen Sie die Systemlautstärke
   - Stellen Sie sicher, dass das richtige Audiogerät ausgewählt ist
   - Prüfen Sie die Berechtigungen für die Audioausgabe

## System-Abhängigkeiten

### Linux
```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y ffmpeg python3-venv python3-pip nodejs npm git

# Fedora
sudo dnf install -y ffmpeg python3-venv python3-pip nodejs npm git

# Arch Linux
sudo pacman -S ffmpeg python-virtualenv python-pip nodejs npm git
```

### Windows
1. [Node.js](https://nodejs.org/) (LTS Version)
2. [Python](https://www.python.org/) (Version 3.10 oder höher)
3. [FFmpeg](https://ffmpeg.org/download.html#build-windows)
4. [Git](https://git-scm.com/download/windows)

### macOS
```bash
# Mit Homebrew
brew install ffmpeg python node git
```

## Support

Bei Problemen oder Fragen:
1. Überprüfen Sie die [Issues](https://github.com/dormarox/eTTS/issues) auf GitHub
2. Erstellen Sie ein neues Issue mit einer detaillierten Beschreibung
3. Fügen Sie relevante Logs und Systeminformationen bei

## Danksagung

- [SadTalker](https://github.com/OpenTalker/SadTalker) für die Videogenerierung
- [Electron](https://www.electronjs.org/) für das Framework
- Allen Mitwirkenden und der Community
