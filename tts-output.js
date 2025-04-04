const fs = require('fs');
const path = require('path');

const TTS_OUTPUT_FILE = '/tmp/chat_output.txt';

// Stelle sicher, dass die Datei existiert
if (!fs.existsSync(TTS_OUTPUT_FILE)) {
    fs.writeFileSync(TTS_OUTPUT_FILE, '');
}

function writeToTTS(text) {
    if (!text || typeof text !== 'string') return;
    
    try {
        // Schreibe den Text in die Datei
        fs.appendFileSync(TTS_OUTPUT_FILE, text.trim() + '\n');
    } catch (err) {
        console.error('Fehler beim Schreiben in TTS-Datei:', err);
    }
}

module.exports = { writeToTTS };
