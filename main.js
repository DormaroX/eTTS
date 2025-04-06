const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { exec } = require('child_process');

// Erhöhe das Limit für Event Listener
require('events').EventEmitter.defaultMaxListeners = 20;
// Konfiguriere dotenv
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '.env');

// Erstelle .env Datei, falls sie nicht existiert
if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, '\n# Konfiguration\nOPENAI_API_KEY=\nPORT=3000\nHOST=localhost\n');
}

// Lade Umgebungsvariablen
dotenv.config({ path: envPath });
const { OpenAI } = require('openai');
require('@electron/remote/main').initialize();
const { writeToTTS } = require('./tts-output');

// Pfade für SadTalker
const SADTALKER_PATH = '/home/aov/SadTalker';
const IMAGES_PATH = path.join(__dirname, 'assets', 'images');
const VIDEO_PATH = path.join(app.getPath('videos'), 'eTTS-Export');

// Avatar zu Stimmen-Mapping
const AVATAR_VOICE_MAP = {
    'Maxx': { voice: 'ash', image: 'maxx.png' },
    'Terra': { voice: 'sage', image: 'terra.png' },
    'Nova': { voice: 'nova', image: 'nova.png' },
    'Nyxari': { voice: 'coral', image: 'nyxari.png' }
};

// Globale Variable für den Stopp-Status
let stopRequested = false;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Maximale Zeichenlänge pro OpenAI-Anfrage
const MAX_CHARS = 4095;

// Funktion, um langen Text in kleinere Blöcke zu zerlegen
function splitTextIntoChunks(text, maxLength) {
    let chunks = [];
    while (text.length > 0) {
        let chunk = text.substring(0, maxLength);
        let lastPeriod = chunk.lastIndexOf(". "); // Versuche an einem Punkt zu trennen
        if (lastPeriod !== -1 && lastPeriod > maxLength * 0.8) {
            chunk = text.substring(0, lastPeriod + 1);
        }
        chunks.push(chunk.trim());
        text = text.substring(chunk.length).trim();
    }
    return chunks;
}


function createWindow() {
    const iconPath = path.join(__dirname, 'assets');
    let mainWindow = new BrowserWindow({
        width: 1324,
        height: 747,
        minWidth: 1324,
        minHeight: 747,
        center: true,
        fullscreen: true,
        icon: path.join(iconPath, process.platform === 'linux' ? 'icon-64.png' : 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            preload: path.join(__dirname, 'preload.js'),
            devTools: false
        },
        title: 'eTTS by dormarox',
    });

    require('@electron/remote/main').enable(mainWindow.webContents);

    mainWindow.loadFile('index.html')
        .then(() => {
            // DevTools nur im Entwicklungsmodus öffnen
            if (process.env.NODE_ENV === 'development') {
                mainWindow.webContents.openDevTools();
            }
        })
        .catch(error => {
            console.error('Fehler beim Laden der HTML-Datei:', error);
            dialog.showErrorBox('Fehler', 'Konnte die HTML-Datei nicht laden. Bitte versuche es erneut.');
        });

    // Entwicklertools in Entwicklungsumgebung aktivieren
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// "Anhören" (schneller, mit `tts-1`)
ipcMain.on('tts-playback', async (event, data) => {
    try {
        if (!data || !data.text || data.text.trim() === '') {
            event.sender.send('error', 'Bitte gebe einen Text ein.');
            return;
        }

        // Hole die Stimme aus dem Avatar-Mapping
        const avatarName = data.avatar.split('|')[0].trim();
        const avatarInfo = AVATAR_VOICE_MAP[avatarName];
        if (!avatarInfo) {
            throw new Error(`Ungültiger Avatar: ${avatarName}`);
        }

        // Generiere Audio-Stream mit der entsprechenden Stimme
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: avatarInfo.voice,
            input: data.text,
            response_format: "mp3"
        });

        // Konvertiere die Response in einen Buffer
        const buffer = Buffer.from(await mp3.arrayBuffer());
        event.sender.send('tts-playback-result', buffer);
        event.sender.send('progress-update', 100);
        console.log(`Wiedergabe abgeschlossen für: ${data.text}`);

    } catch (error) {
        console.error("Fehler beim TTS Playback:", error);
        event.sender.send('error', 'Fehler beim Text-zu-Sprache-Konvertierung. Bitte versuche es erneut.');
    }
});

// Prüft, ob der Speicherort verfügbar ist
function checkOutputDirectory(dirPath) {
    try {
        // Prüfe, ob das Verzeichnis existiert
        if (!fs.existsSync(dirPath)) {
            return {
                available: false,
                error: `Das Verzeichnis ${dirPath} existiert nicht. Bitte stelle sicher, dass das Laufwerk eingebunden ist.`
            };
        }

        // Prüfe Schreibrechte mit einer temporären Datei
        const testFile = path.join(dirPath, '.write_test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);

        return { available: true };
    } catch (error) {
        return {
            available: false,
            error: `Keine Schreibrechte für ${dirPath}. Fehler: ${error.message}`
        };
    }
}

// Funktion zur Generierung des Videos mit SadTalker
async function generateVideo(audioPath, avatarName, quality, upscale) {
    console.log('Starte Video-Generierung...');
    console.log(`Audio: ${audioPath}`);
    console.log(`Avatar: ${avatarName}`);
    console.log(`Qualität: ${quality}`);
    console.log(`Upscale: ${upscale}`);
    const avatarInfo = AVATAR_VOICE_MAP[avatarName];
    if (!avatarInfo) throw new Error('Avatar nicht gefunden');

    // Prüfe Video-Verzeichnis
    const dirCheck = checkOutputDirectory(VIDEO_PATH);
    if (!dirCheck.available) {
        throw new Error(`Video-Verzeichnis nicht verfügbar: ${dirCheck.error}`);
    }

    // Erstelle Zeitstempel für eindeutigen Dateinamen
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const videoName = `${avatarName}_${timestamp}`;

    const imagePath = path.join(IMAGES_PATH, avatarInfo.image);
    // Erstelle temporäres Verzeichnis für die Ausgabe
    const tempOutputDir = path.join(SADTALKER_PATH, 'temp_output');
    if (!fs.existsSync(tempOutputDir)) {
        fs.mkdirSync(tempOutputDir);
    }

    let command = `cd ${SADTALKER_PATH} && CUDA_VISIBLE_DEVICES=-1 python3 inference.py \
        --driven_audio "${audioPath}" \
        --source_image "${imagePath}" \
        --result_dir "${tempOutputDir}" \
        --expression_scale 1.0 \
        --size 256 \
        --still \
        --preprocess crop \
        --net_recon resnet18 \
        --checkpoint_dir "${SADTALKER_PATH}/checkpoints" \
        --cpu`;

    // Warte auf die Fertigstellung und verschiebe die Datei
    command += ` && sleep 2 && mv "${tempOutputDir}"/*.mp4 "${path.join(VIDEO_PATH, videoName)}.mp4"`;
    console.log('Ausführe Befehl:', command);

    if (upscale !== 'none') {
        const scale = upscale === '4k' ? '3840:3840' : '2048:2048';
        const inputVideo = path.join(VIDEO_PATH, `${videoName}.mp4`);
        const outputVideo = path.join(VIDEO_PATH, `${videoName}_${upscale}.mp4`);
        command += ` && ffmpeg -i "${inputVideo}" \
            -vf "hqdn3d=1.5:1.5:6:6,scale=${scale}:flags=lanczos+accurate_rnd+full_chroma_int+full_chroma_inp" \
            -c:v libx264 -crf 18 -preset slow \
            -pix_fmt yuv420p \
            -movflags +faststart \
            -c:a copy \
            "${outputVideo}"`;
    }

    // Aufräumen am Ende
    command += ` && rm -rf "${tempOutputDir}"`;

    return new Promise((resolve, reject) => {
        console.log('Starte SadTalker-Prozess...');
        const sadtalker = exec(command);

        sadtalker.stdout.on('data', (data) => {
            console.log('SadTalker stdout:', data);
        });

        sadtalker.stderr.on('data', (data) => {
            console.log('SadTalker stderr:', data);
        });

        sadtalker.on('close', (code) => {
            if (code === 0) {
                console.log('SadTalker erfolgreich beendet');
                resolve();
            } else {
                console.error('SadTalker-Fehler:', code);
                reject(new Error(`SadTalker-Fehler: ${code}`));
            }
        });
    });
}

// Event-Handler für Stop-Anforderung
ipcMain.on('stop-process', (event) => {
    stopRequested = true;
    // Setze Fortschrittsbalken sofort zurück
    event.sender.send('progress-update', 0, 0, 0, 0);
    // Setze Audio-Progress zurück
    event.sender.send('audio-progress', 0, 0);
    // Sende sofort eine Bestätigung
    event.sender.send('error', 'Prozess wurde gestoppt');
});

// Event-Handler für Audio-Progress
ipcMain.on('audio-progress', (event, currentTime, duration) => {
    // Validiere die Werte
    if (typeof currentTime === 'number' && !isNaN(currentTime) &&
        typeof duration === 'number' && !isNaN(duration)) {
        // Sende nur gültige Werte
        event.sender.send('audio-progress', currentTime, duration);
    }
});

// Gemeinsame Funktion für die MP3-Generierung
async function generateMP3(event, text, outputPath, voice = 'nova') {
    // Setze stopRequested zurück
    stopRequested = false;
    if (!text || text.trim() === '') {
        throw new Error('Der Text ist leer.');
    }

    // Prüfe das Ausgabeverzeichnis
    const outputDir = path.dirname(outputPath);
    const dirCheck = checkOutputDirectory(outputDir);
    
    if (!dirCheck.available) {
        // Versuche, im Musik-Verzeichnis zu speichern
        const homeDir = path.join(app.getPath('music'), 'eTTS-Export');
        
        // Erstelle das Verzeichnis, falls es nicht existiert
        if (!fs.existsSync(homeDir)) {
            await fsPromises.mkdir(homeDir, { recursive: true });
        }
        
        // Verwende Musik-Verzeichnis als Alternative
        outputPath = path.join(homeDir, path.basename(outputPath));
        console.log(`Verwende alternativen Speicherort: ${homeDir}`);
    }

    event.sender.send('progress-update', 0, 0, 0, 0);
    
    // Teile den Text in Blöcke auf
    const blocks = splitTextIntoChunks(text, MAX_CHARS);
    const totalBlocks = blocks.length;
    let currentBlock = 0;

    // Erstelle Basis-Dateinamen ohne .mp3 Erweiterung
    const outputBaseName = path.join(path.dirname(outputPath), path.basename(outputPath, '.mp3'));

    // Verarbeite jeden Block
    for (const block of blocks) {
        currentBlock++;
        
        // Schreibe Text für Nova TTS
        writeToTTS(block);

        // Erstelle einen Fortschrittsevent für den Block
        const updateBlockProgress = (progress) => {
            // Berechne den Fortschritt für den Block-Übersichtsbalken (erster Balken)
            const blockOverviewProgress = ((currentBlock - 1 + (progress / 100)) / totalBlocks) * 100;
            
            // Gesamtfortschritt: Nur abgeschlossene Blöcke zählen
            const overallProgress = ((currentBlock - 1) / totalBlocks) * 100;
            
            // Sende Updates: blockOverviewProgress, totalBlocks, currentBlock, blockProgress
            event.sender.send('progress-update', blockOverviewProgress, totalBlocks, currentBlock, progress);
        };

        try {
            // Prüfe ob Stop angefordert wurde
            if (stopRequested) {
                event.sender.send('progress-update', 0, 0, 0, 0);
                return;
            }

            // Initialisiere Fortschritt für diesen Block
            updateBlockProgress(0);

            // Generiere MP3 für diesen Block
            const response = await openai.audio.speech.create({
                model: "tts-1",
                voice: voice,
                input: block,
                response_format: "mp3"
            });

            // Erstelle den Dateinamen für diesen Block
            const blockFileName = `${outputBaseName}-Block${currentBlock.toString().padStart(3, '0')}.mp3`;

            // Speichere die MP3-Datei
            const audioBuffer = Buffer.from(await response.arrayBuffer());
            await fsPromises.writeFile(blockFileName, audioBuffer);

            // Block erfolgreich verarbeitet
            updateBlockProgress(100);
            console.log(`Block ${currentBlock} gespeichert als: ${path.basename(blockFileName)}`);

        } catch (error) {
            console.error(`Fehler bei Block ${currentBlock}:`, error);
            event.sender.send('error', `Fehler bei Block ${currentBlock}: ${error.message}`);
            throw error;
        }
    }

    // Benachrichtige den Renderer-Prozess über den Abschluss
    event.sender.send('progress-update', 100, totalBlocks, totalBlocks, 100);
}



// "Als MP3 speichern" (höhere Qualität mit `tts-1-hd`)
ipcMain.on('tts-save', async (event, text, filePath) => {
    try {
        if (stopRequested) {
            return;
        }
        await generateMP3(event, text, filePath);
        if (!stopRequested) {
            event.sender.send('tts-save-result', filePath);
        }
    } catch (error) {
        if (!stopRequested) {
            console.error("Fehler beim Speichern der MP3-Datei:", error);
            event.sender.send('error', 'Fehler beim Speichern der MP3-Datei. Bitte versuche es erneut.');
        }
    }
});

// "TXT-Datei hochladen und umwandeln"
ipcMain.on('upload-txt-file', async (event, text, mp3Path) => {
    try {
        console.log('Starte Verarbeitung der TXT-Datei...');
        console.log(`Textlänge: ${text.length} Zeichen`);
        await generateMP3(event, text, mp3Path);
        console.log('TXT-Datei erfolgreich verarbeitet.');
    } catch (error) {
        console.error("Fehler beim Umwandeln der TXT-Datei in MP3:", error);
        event.sender.send('error', `Fehler beim Konvertieren der TXT-Datei: ${error.message}`);
    }
});

// Event-Handler für Text-zu-Video (txt2mp4)
ipcMain.on('txt2mp4-request', async (event, data) => {
    console.log('txt2mp4-request empfangen:', data);
    const { text, avatar, quality, upscale } = data;
    try {
        event.sender.send('progress-update', 0, 0, 0, 0);
        
        // 1. Generiere Audio mit der entsprechenden Stimme
        console.log('Starte Audio-Generierung...');
        const avatarInfo = AVATAR_VOICE_MAP[avatar.split('|')[0]];
        console.log('Avatar Info:', avatarInfo);
        
        let audioResponse;
        try {
            audioResponse = await openai.audio.speech.create({
                model: 'tts-1-hd',
                voice: avatarInfo.voice,
                input: text
            });
            console.log('Audio erfolgreich generiert');
        } catch (error) {
            console.error('Fehler bei OpenAI:', error);
            throw error;
        }

        // 2. Speichere Audio temporär als MP3
        const tempMp3Path = path.join(SADTALKER_PATH, 'input_audio.mp3');
        const tempWavPath = path.join(SADTALKER_PATH, 'input_audio.wav');
        const buffer = Buffer.from(await audioResponse.arrayBuffer());
        await fsPromises.writeFile(tempMp3Path, buffer);

        event.sender.send('progress-update', 25, 0, 0, 0);

        // Konvertiere zu WAV für SadTalker
        console.log('Starte FFmpeg-Konvertierung...');
        console.log('FFmpeg Befehl:', `ffmpeg -i "${tempMp3Path}" -acodec pcm_s16le -ar 44100 "${tempWavPath}"`);
        
        await new Promise((resolve, reject) => {
            const ffmpeg = exec(`ffmpeg -y -i "${tempMp3Path}" -acodec pcm_s16le -ar 44100 "${tempWavPath}"`);
            
            ffmpeg.stdout.on('data', (data) => {
                console.log('FFmpeg stdout:', data);
            });
            
            ffmpeg.stderr.on('data', (data) => {
                console.log('FFmpeg stderr:', data);
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('FFmpeg-Konvertierung erfolgreich');
                    resolve();
                } else {
                    console.error('FFmpeg-Fehler:', code);
                    reject(new Error(`FFmpeg-Fehler: ${code}`));
                }
            });
        });

        // Lösche MP3
        await fsPromises.unlink(tempMp3Path);

        event.sender.send('progress-update', 50, 0, 0, 0);

        // 3. Generiere Video mit SadTalker
        await generateVideo(tempWavPath, avatar.split('|')[0], quality, upscale);
        // Lösche WAV
        await fsPromises.unlink(tempWavPath);

        event.sender.send('progress-update', 100, 0, 0, 0);
        event.sender.send('process-complete');

    } catch (error) {
        console.error('Fehler bei der Video-Generierung:', error);
        event.sender.send('error', error.message);
    }
});

// "txt2mp3" - Konvertiert eine TXT-Datei in eine einzelne MP3
ipcMain.on('txt2mp3', async (event, text, outputPath) => {
    try {
        if (stopRequested) {
            stopRequested = false;
            return;
        }

        // Prüfe das Ausgabeverzeichnis
        const outputDir = path.dirname(outputPath);
        const dirCheck = checkOutputDirectory(outputDir);
        
        if (!dirCheck.available) {
            throw new Error(`Speicherort nicht verfügbar: ${dirCheck.error}`);
        }

        // Teile den Text in Blöcke auf
        const blocks = splitTextIntoChunks(text, MAX_CHARS);
        const totalBlocks = blocks.length;
        let currentBlock = 0;
        let combinedAudioBuffer = Buffer.alloc(0);

        for (const block of blocks) {
            currentBlock++;
            const progress = (currentBlock / totalBlocks) * 100;

            console.log(`Verarbeite Block ${currentBlock} von ${totalBlocks}...`);
            event.sender.send('progress-update', progress, totalBlocks, currentBlock, progress);

            const response = await openai.audio.speech.create({
                model: "tts-1-hd",
                voice: "nova",
                input: block,
                response_format: "mp3"
            });

            const blockBuffer = Buffer.from(await response.arrayBuffer());
            combinedAudioBuffer = Buffer.concat([combinedAudioBuffer, blockBuffer]);
        }

        console.log('Speichere kombinierte AudioBuffer...');
        await fsPromises.writeFile(outputPath, combinedAudioBuffer);

        event.sender.send('progress-update', 100, totalBlocks, totalBlocks, 100);
        event.sender.send('tts-save-result', outputPath);
        console.log(`MP3-Datei gespeichert als: ${path.basename(outputPath)}`);

    } catch (error) {
        console.error("Fehler bei der MP3-Generierung:", error);
        event.sender.send('error', `Fehler bei der Text-zu-Sprache-Konvertierung: ${error.message}`);
    }
});
