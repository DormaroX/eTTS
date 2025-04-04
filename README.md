# eTTS

Eine Electron-basierte Text-to-Speech-Anwendung mit Videogenerierung durch SadTalker.

## Features

- Text-to-Speech mit verschiedenen Stimmen
- Videogenerierung mit SadTalker
- Charakterauswahl (Maxx, Terra, Nova, Nyxari)
- Qualitätseinstellungen für die Videogenerierung
- Upscaling-Optionen (2K, 4K)
- MP3-Export
- Modernes, dunkles UI-Design

## Voraussetzungen

- Node.js 20.x oder höher
- Python 3.10 oder höher
- FFmpeg für die Videobearbeitung

## Installation

1. Repository klonen:
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

Die Anwendung verwendet verschiedene Umgebungsvariablen, die in der `.env`-Datei definiert werden können:
- `OPENAI_API_KEY` - API-Schlüssel für OpenAI (optional)
- Weitere Konfigurationsoptionen in der `config.js`

## Lizenz

[Lizenzinformationen hier einfügen]
