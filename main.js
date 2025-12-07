const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
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

// Globale Variable für das Hauptfenster
let mainWindow = null;

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
    mainWindow = new BrowserWindow({
        width: 1324,
        height: 747,
        minWidth: 1324,
        minHeight: 747,
        center: true,
        fullscreen: true,
        icon: path.join(iconPath, process.platform === 'linux' ? 'icon-64.png' : 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,  // Deaktiviere Sandbox, damit fs in preload.js verfügbar ist
            webSecurity: true,
            allowRunningInsecureContent: false,
            preload: path.join(__dirname, 'preload.js'),
            devTools: true
        },
        title: 'eTTS by dormarox',
    });

    // Aktiviere die Tastenkombination für DevTools
    globalShortcut.register('CommandOrControl+Shift+I', () => {
        mainWindow.webContents.toggleDevTools();
    });

    mainWindow.loadFile('index.html')
        .then(() => {
            // DevTools im Entwicklungsmodus immer öffnen
            if (process.argv.includes('dev') || process.env.NODE_ENV === 'development') {
                mainWindow.webContents.openDevTools();
            }
        })
        .catch(error => {
            console.error('Fehler beim Laden der HTML-Datei:', error);
            dialog.showErrorBox('Fehler', 'Konnte die HTML-Datei nicht laden. Bitte versuche es erneut.');
        });

    // Entwicklertools in Entwicklungsumgebung aktivieren (auch nach dem Laden)
    if (process.env.NODE_ENV === 'development' || process.argv.includes('dev')) {
        // Warte kurz, dann öffne DevTools
        setTimeout(() => {
            mainWindow.webContents.openDevTools();
        }, 500);
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
    console.log('main.js: Received TTS request:', data);
    // Setze stopRequested zurück, wenn ein neuer Prozess startet
    stopRequested = false;
    try {
        if (!data || !data.text || data.text.trim() === '') {
            event.sender.send('error', 'Bitte gebe einen Text ein.');
            return;
        }

        // Prüfe stopRequested vor der API-Anfrage
        if (stopRequested) {
            console.log('TTS Playback wurde gestoppt');
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

        // Prüfe stopRequested nach der API-Anfrage
        if (stopRequested) {
            console.log('TTS Playback wurde nach API-Aufruf gestoppt');
            return;
        }

        // Konvertiere die Response in einen Buffer
        const buffer = Buffer.from(await mp3.arrayBuffer());
        event.sender.send('tts-playback-result', buffer);
        event.sender.send('progress-update', 100);
        console.log(`Wiedergabe abgeschlossen für: ${data.text}`);

    } catch (error) {
        // Ignoriere Fehler, wenn der Prozess gestoppt wurde
        if (stopRequested) {
            console.log('TTS Playback wurde während der Verarbeitung gestoppt');
            return;
        }
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
    // Prüfe stopRequested vor dem Start
    if (stopRequested) {
        console.log('generateVideo wurde gestoppt, bevor es startete');
        throw new Error('Video-Generierung wurde gestoppt');
    }
    
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
        // Prüfe stopRequested vor dem Start des Prozesses
        if (stopRequested) {
            console.log('generateVideo wurde vor Prozess-Start gestoppt');
            reject(new Error('Video-Generierung wurde gestoppt'));
            return;
        }
        
        console.log('Starte SadTalker-Prozess...');
        const sadtalker = exec(command);

        sadtalker.stdout.on('data', (data) => {
            console.log('SadTalker stdout:', data);
        });

        sadtalker.stderr.on('data', (data) => {
            console.log('SadTalker stderr:', data);
        });

        sadtalker.on('close', (code) => {
            // Prüfe stopRequested nach dem Prozess
            if (stopRequested) {
                console.log('generateVideo wurde während der Ausführung gestoppt');
                // Versuche den Prozess zu killen, falls er noch läuft
                try {
                    sadtalker.kill();
                } catch (e) {
                    console.log('Konnte Prozess nicht killen:', e);
                }
                reject(new Error('Video-Generierung wurde gestoppt'));
                return;
            }
            
            if (code === 0) {
                console.log('SadTalker erfolgreich beendet');
                resolve();
            } else {
                console.error('SadTalker-Fehler:', code);
                reject(new Error(`SadTalker-Fehler: ${code}`));
            }
        });
        
        // Prüfe periodisch, ob stopRequested gesetzt wurde
        const checkInterval = setInterval(() => {
            if (stopRequested) {
                console.log('generateVideo: Stop erkannt, beende Prozess...');
                clearInterval(checkInterval);
                try {
                    sadtalker.kill('SIGTERM');
                    // Falls SIGTERM nicht funktioniert, verwende SIGKILL
                    setTimeout(() => {
                        try {
                            sadtalker.kill('SIGKILL');
                        } catch (e) {
                            console.log('Konnte Prozess nicht killen:', e);
                        }
                    }, 2000);
                } catch (e) {
                    console.log('Fehler beim Beenden des Prozesses:', e);
                }
                reject(new Error('Video-Generierung wurde gestoppt'));
            }
        }, 500); // Prüfe alle 500ms
        
        // Cleanup bei erfolgreichem Abschluss
        sadtalker.on('close', () => {
            clearInterval(checkInterval);
        });
    });
}

// Event-Handler für Stop-Anforderung
ipcMain.on('stop-process', (event) => {
    console.log('Stop-Button wurde gedrückt');
    stopRequested = true;
    // Setze Fortschrittsbalken sofort zurück
    event.sender.send('progress-update', 0, 0, 0, 0);
    // Setze Audio-Progress zurück
    event.sender.send('audio-progress', 0, 0);
    // Sende Bestätigung
    event.sender.send('stop-confirmed');
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

// Funktion für die Verarbeitung von Textdateien als eine MP3
async function txt2mp3(event, text, outputPath, avatar = 'Nova|Nova') {
    // Setze stopRequested zurück, wenn ein neuer Prozess startet
    stopRequested = false;
    try {
        if (stopRequested) {
            console.log('txt2mp3 wurde gestoppt');
            return;
        }

        // Prüfe das Ausgabeverzeichnis
        const outputDir = path.dirname(outputPath);
        const dirCheck = checkOutputDirectory(outputDir);
        
        if (!dirCheck.available) {
            throw new Error(`Speicherort nicht verfügbar: ${dirCheck.error}`);
        }

        // Hole die Stimme aus dem Avatar-Mapping
        const avatarName = avatar.split('|')[0].trim();
        const avatarInfo = AVATAR_VOICE_MAP[avatarName];
        if (!avatarInfo) {
            throw new Error(`Ungültiger Avatar: ${avatarName}`);
        }
        const voice = avatarInfo.voice;

        // Teile den Text in Blöcke auf (für OpenAI Limit)
        const blocks = splitTextIntoChunks(text, MAX_CHARS);
        const totalBlocks = blocks.length;
        let currentBlock = 0;
        let combinedAudioBuffer = Buffer.alloc(0);

        // Verarbeite jeden Block einzeln und kombiniere sie
        for (const block of blocks) {
            if (stopRequested) {
                console.log('txt2mp3 Prozess wurde gestoppt');
                event.sender.send('progress-update', 0, 0, 0, 0);
                return;
            }

            currentBlock++;
            const progress = (currentBlock / totalBlocks) * 100;

            console.log(`Verarbeite Block ${currentBlock} von ${totalBlocks}...`);
            event.sender.send('progress-update', progress, totalBlocks, currentBlock, progress);

            // Prüfe stopRequested vor dem API-Aufruf
            if (stopRequested) {
                console.log('txt2mp3 wurde vor API-Aufruf gestoppt');
                event.sender.send('progress-update', 0, 0, 0, 0);
                return;
            }

            const response = await openai.audio.speech.create({
                model: "tts-1-hd",
                voice: voice,
                input: block,
                response_format: "mp3"
            });

            // Prüfe stopRequested nach dem API-Aufruf
            if (stopRequested) {
                console.log('txt2mp3 wurde nach API-Aufruf gestoppt');
                event.sender.send('progress-update', 0, 0, 0, 0);
                return;
            }

            const blockBuffer = Buffer.from(await response.arrayBuffer());
            combinedAudioBuffer = Buffer.concat([combinedAudioBuffer, blockBuffer]);
        }

        // Prüfe stopRequested vor dem Speichern
        if (stopRequested) {
            console.log('txt2mp3 wurde vor dem Speichern gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

        console.log('Speichere kombinierte AudioBuffer...');
        await fsPromises.writeFile(outputPath, combinedAudioBuffer);

        // Prüfe stopRequested nach dem Speichern
        if (stopRequested) {
            console.log('txt2mp3 wurde nach dem Speichern gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

        event.sender.send('progress-update', 100, totalBlocks, totalBlocks, 100);
        event.sender.send('tts-save-result', outputPath);
        event.sender.send('save-complete', `TXT-zu-MP3 Konvertierung abgeschlossen: ${path.basename(outputPath)}`);
        console.log(`MP3-Datei gespeichert als: ${path.basename(outputPath)}`);

    } catch (error) {
        // Ignoriere Fehler, wenn der Prozess gestoppt wurde
        if (stopRequested) {
            console.log('txt2mp3 wurde während der Verarbeitung gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }
        console.error("Fehler bei der MP3-Generierung:", error);
        event.sender.send('error', `Fehler bei der Text-zu-Sprache-Konvertierung: ${error.message}`);
        throw error;
    }
}

// Funktion für die block-basierte MP3-Generierung mit separaten Dateien
async function txt2mp3blocks(event, text, outputPath, avatar = 'Nova|Nova') {
    // Setze stopRequested zurück, wenn ein neuer Prozess startet
    stopRequested = false;
    try {
        if (stopRequested) {
            console.log('txt2mp3blocks wurde gestoppt');
            return;
        }

        // Prüfe das Ausgabeverzeichnis
        const outputDir = path.dirname(outputPath);
        const dirCheck = checkOutputDirectory(outputDir);
        
        if (!dirCheck.available) {
            throw new Error(`Speicherort nicht verfügbar: ${dirCheck.error}`);
        }

        // Hole die Stimme aus dem Avatar-Mapping
        const avatarName = avatar.split('|')[0].trim();
        const avatarInfo = AVATAR_VOICE_MAP[avatarName];
        if (!avatarInfo) {
            throw new Error(`Ungültiger Avatar: ${avatarName}`);
        }
        const voice = avatarInfo.voice;

        // Teile den Text in Blöcke auf
        const blocks = splitTextIntoChunks(text, MAX_CHARS);
        const totalBlocks = blocks.length;
        let currentBlock = 0;

        // Erstelle Basis-Dateinamen ohne .mp3 Erweiterung
        const outputBaseName = outputPath.replace('.mp3', '');

        // Verarbeite jeden Block einzeln
        for (const block of blocks) {
            if (stopRequested) {
                console.log('txt2mp3blocks Prozess wurde gestoppt');
                event.sender.send('progress-update', 0, 0, 0, 0);
                return;
            }

            currentBlock++;
            const progress = (currentBlock / totalBlocks) * 100;

            console.log(`Verarbeite Block ${currentBlock} von ${totalBlocks}...`);
            event.sender.send('progress-update', progress, totalBlocks, currentBlock, progress);

            // Erstelle den Dateinamen für diesen Block
            const blockPath = blocks.length > 1 ? `${outputBaseName}_${currentBlock}.mp3` : outputPath;

            // Prüfe stopRequested vor dem API-Aufruf
            if (stopRequested) {
                console.log('txt2mp3blocks wurde vor API-Aufruf gestoppt');
                event.sender.send('progress-update', 0, 0, 0, 0);
                return;
            }

            const response = await openai.audio.speech.create({
                model: "tts-1-hd",
                voice: voice,
                input: block,
                response_format: "mp3"
            });

            // Prüfe stopRequested nach dem API-Aufruf
            if (stopRequested) {
                console.log('txt2mp3blocks wurde nach API-Aufruf gestoppt');
                event.sender.send('progress-update', 0, 0, 0, 0);
                return;
            }

            // Speichere die Block-MP3
            const blockBuffer = Buffer.from(await response.arrayBuffer());
            await fsPromises.writeFile(blockPath, blockBuffer);

            console.log(`Block ${currentBlock} gespeichert als: ${path.basename(blockPath)}`);
        }

        // Prüfe stopRequested vor dem Abschluss
        if (stopRequested) {
            console.log('txt2mp3blocks wurde vor dem Abschluss gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

        event.sender.send('progress-update', 100, totalBlocks, totalBlocks, 100);
        event.sender.send('tts-save-result', outputPath);
        console.log('Alle Blöcke wurden erfolgreich gespeichert.');

    } catch (error) {
        // Ignoriere Fehler, wenn der Prozess gestoppt wurde
        if (stopRequested) {
            console.log('txt2mp3blocks wurde während der Verarbeitung gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }
        console.error("Fehler bei der MP3-Generierung:", error);
        event.sender.send('error', `Fehler bei der Text-zu-Sprache-Konvertierung: ${error.message}`);
        throw error;
    }
}


// Funktion zum Speichern von Text aus dem Textfeld als MP3
async function save2mp3(event, text, outputPath, avatar = 'Nova|Nova') {
    // Setze stopRequested zurück, wenn ein neuer Prozess startet
    stopRequested = false;
    try {
        if (stopRequested) {
            console.log('save2mp3 wurde gestoppt');
            return;
        }

        // Prüfe das Ausgabeverzeichnis
        const outputDir = path.dirname(outputPath);
        const dirCheck = checkOutputDirectory(outputDir);
        
        if (!dirCheck.available) {
            throw new Error(`Speicherort nicht verfügbar: ${dirCheck.error}`);
        }

        // Hole die Stimme aus dem Avatar-Mapping
        const avatarName = avatar.split('|')[0].trim();
        const avatarInfo = AVATAR_VOICE_MAP[avatarName];
        if (!avatarInfo) {
            throw new Error(`Ungültiger Avatar: ${avatarName}`);
        }
        const voice = avatarInfo.voice;

        // Generiere die MP3
        event.sender.send('progress-update', 0, 1, 0, 0);
        
        // Prüfe stopRequested vor dem API-Aufruf
        if (stopRequested) {
            console.log('save2mp3 wurde vor API-Aufruf gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }
        
        const response = await openai.audio.speech.create({
            model: "tts-1-hd",
            voice: voice,
            input: text,
            response_format: "mp3"
        });

        // Prüfe stopRequested nach dem API-Aufruf
        if (stopRequested) {
            console.log('save2mp3 wurde nach API-Aufruf gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

        // Speichere die MP3-Datei
        const buffer = Buffer.from(await response.arrayBuffer());
        await fsPromises.writeFile(outputPath, buffer);

        // Prüfe stopRequested nach dem Speichern
        if (stopRequested) {
            console.log('save2mp3 wurde nach dem Speichern gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

        event.sender.send('progress-update', 100, 1, 1, 100);
        event.sender.send('tts-save-result', outputPath);
        event.sender.send('save-complete', `MP3-Datei erfolgreich gespeichert als: ${path.basename(outputPath)}`);
        console.log(`MP3-Datei gespeichert als: ${path.basename(outputPath)}`);

    } catch (error) {
        // Ignoriere Fehler, wenn der Prozess gestoppt wurde
        if (stopRequested) {
            console.log('save2mp3 wurde während der Verarbeitung gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }
        console.error("Fehler bei der MP3-Generierung:", error);
        event.sender.send('error', `Fehler bei der Text-zu-Sprache-Konvertierung: ${error.message}`);
        throw error;
    }
}

// Veraltete Handler wurden entfernt:
// - 'tts-save' wurde durch 'save-text-request' ersetzt
// - 'upload-txt-file' wurde durch 'upload-txt-file-request' ersetzt

// Event-Handler für Text-zu-Video (txt2mp4)
ipcMain.on('txt2mp4-request', async (event, data) => {
    console.log('txt2mp4-request empfangen:', data);
    // Setze stopRequested zurück, wenn ein neuer Prozess startet
    stopRequested = false;
    const { text, avatar, quality, upscale } = data;
    try {
        event.sender.send('progress-update', 0, 0, 0, 0);
        
        // Prüfe stopRequested vor dem Start
        if (stopRequested) {
            console.log('txt2mp4 wurde gestoppt');
            return;
        }
        
        // 1. Generiere Audio mit der entsprechenden Stimme
        console.log('Starte Audio-Generierung...');
        const avatarInfo = AVATAR_VOICE_MAP[avatar.split('|')[0]];
        console.log('Avatar Info:', avatarInfo);
        
        let audioResponse;
        try {
            // Prüfe stopRequested vor dem API-Aufruf
            if (stopRequested) {
                console.log('txt2mp4 wurde vor Audio-Generierung gestoppt');
                event.sender.send('progress-update', 0, 0, 0, 0);
                return;
            }
            
            audioResponse = await openai.audio.speech.create({
                model: 'tts-1-hd',
                voice: avatarInfo.voice,
                input: text
            });
            console.log('Audio erfolgreich generiert');
            
            // Prüfe stopRequested nach dem API-Aufruf
            if (stopRequested) {
                console.log('txt2mp4 wurde nach Audio-Generierung gestoppt');
                event.sender.send('progress-update', 0, 0, 0, 0);
                return;
            }
        } catch (error) {
            if (stopRequested) {
                console.log('txt2mp4 wurde während Audio-Generierung gestoppt');
                return;
            }
            console.error('Fehler bei OpenAI:', error);
            throw error;
        }

        // Prüfe stopRequested vor dem Speichern
        if (stopRequested) {
            console.log('txt2mp4 wurde vor dem Speichern gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }
        
        // 2. Speichere Audio temporär als MP3
        const tempMp3Path = path.join(SADTALKER_PATH, 'input_audio.mp3');
        const tempWavPath = path.join(SADTALKER_PATH, 'input_audio.wav');
        const buffer = Buffer.from(await audioResponse.arrayBuffer());
        await fsPromises.writeFile(tempMp3Path, buffer);

        // Prüfe stopRequested nach dem Speichern
        if (stopRequested) {
            console.log('txt2mp4 wurde nach dem Speichern gestoppt');
            // Aufräumen
            try { await fsPromises.unlink(tempMp3Path); } catch (e) {}
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

        event.sender.send('progress-update', 25, 0, 0, 0);

        // Prüfe stopRequested vor FFmpeg
        if (stopRequested) {
            console.log('txt2mp4 wurde vor FFmpeg gestoppt');
            try { await fsPromises.unlink(tempMp3Path); } catch (e) {}
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

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
                if (stopRequested) {
                    console.log('txt2mp4 wurde während FFmpeg gestoppt');
                    resolve(); // Resolve, um Aufräumen zu ermöglichen
                    return;
                }
                if (code === 0) {
                    console.log('FFmpeg-Konvertierung erfolgreich');
                    resolve();
                } else {
                    console.error('FFmpeg-Fehler:', code);
                    reject(new Error(`FFmpeg-Fehler: ${code}`));
                }
            });
        });

        // Prüfe stopRequested nach FFmpeg
        if (stopRequested) {
            console.log('txt2mp4 wurde nach FFmpeg gestoppt');
            // Aufräumen
            try { await fsPromises.unlink(tempMp3Path); } catch (e) {}
            try { await fsPromises.unlink(tempWavPath); } catch (e) {}
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

        // Lösche MP3
        await fsPromises.unlink(tempMp3Path);

        event.sender.send('progress-update', 50, 0, 0, 0);

        // Prüfe stopRequested vor Video-Generierung
        if (stopRequested) {
            console.log('txt2mp4 wurde vor Video-Generierung gestoppt');
            try { await fsPromises.unlink(tempWavPath); } catch (e) {}
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

        // 3. Generiere Video mit SadTalker
        await generateVideo(tempWavPath, avatar.split('|')[0], quality, upscale);
        
        // Prüfe stopRequested nach Video-Generierung
        if (stopRequested) {
            console.log('txt2mp4 wurde nach Video-Generierung gestoppt');
            try { await fsPromises.unlink(tempWavPath); } catch (e) {}
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }
        
        // Lösche WAV
        await fsPromises.unlink(tempWavPath);

        event.sender.send('progress-update', 100, 0, 0, 0);
        event.sender.send('process-complete');

    } catch (error) {
        // Ignoriere Fehler, wenn der Prozess gestoppt wurde
        if (stopRequested) {
            console.log('txt2mp4 wurde während der Verarbeitung gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }
        console.error('Fehler bei der Video-Generierung:', error);
        event.sender.send('error', error.message);
    }
});

// Veralteter Handler wurde entfernt:
// - 'txt2mp3' wurde durch 'txt2mp3-request' ersetzt

// "Als MP3 speichern" - Speichert TTS-generierte Audio als MP3-Datei
ipcMain.on('save-text-request', async (event, data) => {
    try {
        if (!data || !data.text || data.text.trim() === '') {
            event.sender.send('error', 'Bitte gebe einen Text ein.');
            return;
        }

        const avatarName = data.avatar.split('|')[0].trim();
        const avatarInfo = AVATAR_VOICE_MAP[avatarName];
        if (!avatarInfo) {
            throw new Error(`Ungültiger Avatar: ${avatarName}`);
        }

        // Zeige Save-Dialog
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: path.join(app.getPath('downloads'), `${avatarName}_${Date.now()}.mp3`),
            filters: [
                { name: 'MP3-Dateien', extensions: ['mp3'] },
                { name: 'Alle Dateien', extensions: ['*'] }
            ]
        });

        if (result.cancelled) {
            return;
        }

        const outputPath = result.filePath;

        // Generiere Audio mit OpenAI TTS
        const mp3 = await openai.audio.speech.create({
            model: "tts-1-hd",
            voice: avatarInfo.voice,
            input: data.text,
            response_format: "mp3"
        });

        // Speichere die MP3-Datei
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fsPromises.writeFile(outputPath, buffer);

        event.sender.send('save-complete', `MP3 erfolgreich gespeichert: ${path.basename(outputPath)}`);
        console.log(`MP3 gespeichert: ${outputPath}`);

    } catch (error) {
        console.error('Fehler beim Speichern der MP3:', error);
        event.sender.send('error', `Fehler beim Speichern: ${error.message}`);
    }
});

// "txt2mp3" - Öffnet Dialog zum Hochladen einer TXT-Datei und konvertiert sie zu MP3
ipcMain.on('txt2mp3-request', async (event) => {
    try {
        // Zeige Open-Dialog für TXT-Datei
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'TXT-Datei auswählen',
            defaultPath: app.getPath('documents'),
            filters: [
                { name: 'Text-Dateien', extensions: ['txt'] },
                { name: 'Alle Dateien', extensions: ['*'] }
            ],
            properties: ['openFile']
        });

        if (result.cancelled || result.filePaths.length === 0) {
            return;
        }

        const inputFile = result.filePaths[0];
        
        // Lese die TXT-Datei
        const text = await fsPromises.readFile(inputFile, 'utf-8');
        
        if (!text.trim()) {
            event.sender.send('error', 'Die TXT-Datei ist leer.');
            return;
        }

        // Zeige Save-Dialog für Output-MP3
        const saveResult = await dialog.showSaveDialog(mainWindow, {
            defaultPath: path.join(app.getPath('downloads'), `${path.basename(inputFile, '.txt')}.mp3`),
            filters: [
                { name: 'MP3-Dateien', extensions: ['mp3'] },
                { name: 'Alle Dateien', extensions: ['*'] }
            ]
        });

        if (saveResult.cancelled) {
            return;
        }

        const outputPath = saveResult.filePath;

        // Generiere Audio mit OpenAI TTS (benutze standard tts-1 Model für txt2mp3)
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
            response_format: "mp3"
        });

        // Speichere die MP3-Datei
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fsPromises.writeFile(outputPath, buffer);

        event.sender.send('save-complete', `TXT erfolgreich zu MP3 konvertiert: ${path.basename(outputPath)}`);
        console.log(`TXT zu MP3 konvertiert: ${outputPath}`);

    } catch (error) {
        console.error('Fehler bei TXT zu MP3 Konvertierung:', error);
        event.sender.send('error', `Fehler bei der Konvertierung: ${error.message}`);
    }
});

// "txt2mp3 blocks" - Öffnet Dialog zum Hochladen einer TXT-Datei und konvertiert sie mit Blockverarbeitung zu MP3
ipcMain.on('upload-txt-file-request', async (event) => {
    try {
        // Zeige Open-Dialog für TXT-Datei
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'TXT-Datei auswählen',
            defaultPath: app.getPath('documents'),
            filters: [
                { name: 'Text-Dateien', extensions: ['txt'] },
                { name: 'Alle Dateien', extensions: ['*'] }
            ],
            properties: ['openFile']
        });

        if (result.cancelled || result.filePaths.length === 0) {
            return;
        }

        const inputFile = result.filePaths[0];
        
        // Lese die TXT-Datei
        const text = await fsPromises.readFile(inputFile, 'utf-8');
        
        if (!text.trim()) {
            event.sender.send('error', 'Die TXT-Datei ist leer.');
            return;
        }

        // Zeige Save-Dialog für Output-MP3
        const saveResult = await dialog.showSaveDialog(mainWindow, {
            defaultPath: path.join(app.getPath('downloads'), `${path.basename(inputFile, '.txt')}_blocks.mp3`),
            filters: [
                { name: 'MP3-Dateien', extensions: ['mp3'] },
                { name: 'Alle Dateien', extensions: ['*'] }
            ]
        });

        if (saveResult.cancelled) {
            return;
        }

        const outputPath = saveResult.filePath;

        // Zerlege Text in Blöcke
        const chunks = splitTextIntoChunks(text, MAX_CHARS);
        const totalBlocks = chunks.length;
        
        // Array für MP3-Buffer
        const audioBuffers = [];

        // Setze stopRequested zurück, wenn ein neuer Prozess startet
        stopRequested = false;
        
        // Verarbeite jeden Block
        for (let i = 0; i < chunks.length; i++) {
            if (stopRequested) {
                console.log('upload-txt-file-request wurde gestoppt');
                event.sender.send('progress-update', 0, 0, 0, 0);
                event.sender.send('error', 'Prozess unterbrochen.');
                return;
            }

            const chunk = chunks[i];
            const currentBlock = i + 1;

            // Sende Fortschritts-Update
            event.sender.send('progress-update', 0, totalBlocks, currentBlock, 0);

            try {
                // Prüfe stopRequested vor dem API-Aufruf
                if (stopRequested) {
                    console.log('upload-txt-file-request wurde vor API-Aufruf gestoppt');
                    event.sender.send('progress-update', 0, 0, 0, 0);
                    event.sender.send('error', 'Prozess unterbrochen.');
                    return;
                }
                
                // Generiere Audio mit OpenAI TTS (tts-1-hd für höhere Qualität)
                const mp3 = await openai.audio.speech.create({
                    model: "tts-1-hd",
                    voice: "alloy",
                    input: chunk,
                    response_format: "mp3"
                });

                // Prüfe stopRequested nach dem API-Aufruf
                if (stopRequested) {
                    console.log('upload-txt-file-request wurde nach API-Aufruf gestoppt');
                    event.sender.send('progress-update', 0, 0, 0, 0);
                    event.sender.send('error', 'Prozess unterbrochen.');
                    return;
                }

                const buffer = Buffer.from(await mp3.arrayBuffer());
                audioBuffers.push(buffer);

                // Sende Fortschritts-Update (100% für diesen Block)
                event.sender.send('progress-update', Math.round((currentBlock / totalBlocks) * 100), totalBlocks, currentBlock, 100);

            } catch (blockError) {
                if (stopRequested) {
                    console.log('upload-txt-file-request wurde während Block-Verarbeitung gestoppt');
                    event.sender.send('progress-update', 0, 0, 0, 0);
                    return;
                }
                console.error(`Fehler beim Verarbeiten von Block ${currentBlock}:`, blockError);
                event.sender.send('error', `Fehler bei Block ${currentBlock}: ${blockError.message}`);
                return;
            }
        }

        // Prüfe stopRequested vor dem Kombinieren
        if (stopRequested) {
            console.log('upload-txt-file-request wurde vor dem Kombinieren gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            event.sender.send('error', 'Prozess unterbrochen.');
            return;
        }
        
        // Kombiniere alle Audio-Buffer zu einer Datei
        const combinedBuffer = Buffer.concat(audioBuffers);
        await fsPromises.writeFile(outputPath, combinedBuffer);

        // Prüfe stopRequested nach dem Speichern
        if (stopRequested) {
            console.log('upload-txt-file-request wurde nach dem Speichern gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }

        // Setze Fortschritt zurück
        event.sender.send('progress-update', 0, 0, 0, 0);
        event.sender.send('save-complete', `TXT (${totalBlocks} Blöcke) erfolgreich konvertiert: ${path.basename(outputPath)}`);
        console.log(`TXT mit Blockverarbeitung zu MP3 konvertiert: ${outputPath} (${totalBlocks} Blöcke)`);

    } catch (error) {
        if (stopRequested) {
            console.log('upload-txt-file-request wurde während der Verarbeitung gestoppt');
            event.sender.send('progress-update', 0, 0, 0, 0);
            return;
        }
        console.error('Fehler bei TXT zu MP3 Blockverarbeitung:', error);
        event.sender.send('error', `Fehler bei der Blockverarbeitung: ${error.message}`);
    }
});

// "Dateien zur Playlist hinzufügen" - Öffnet Dialog zur Auswahl von Audio-Dateien
ipcMain.on('open-music-folder', async (event) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Audio-Dateien auswählen',
            defaultPath: app.getPath('music'),
            filters: [
                { name: 'Audio-Dateien', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'] },
                { name: 'Alle Dateien', extensions: ['*'] }
            ],
            properties: ['openFile', 'multiSelections']
        });

        if (result.cancelled || result.filePaths.length === 0) {
            return;
        }

        // Sende die ausgewählten Dateien an den Renderer-Prozess
        event.sender.send('files-selected', result.filePaths);
        console.log(`Dateien zur Playlist hinzugefügt: ${result.filePaths.length} Datei(en)`);

    } catch (error) {
        console.error('Fehler beim Öffnen des Dateiauswahl-Dialogs:', error);
        event.sender.send('error', `Fehler beim Öffnen des Dateiauswahl-Dialogs: ${error.message}`);
    }
});

