const { contextBridge, ipcRenderer } = require('electron');
const { dialog } = require('@electron/remote');
const fs = require('fs').promises;

contextBridge.exposeInMainWorld('electronAPI', {
    stopProcess: () => ipcRenderer.send('stop-process'),
    sendText: (data) => ipcRenderer.send('tts-playback', data),
    sendTxt2mp4: (data) => {
        console.log('Sende txt2mp4 Request:', data);
        try {
            ipcRenderer.send('txt2mp4-request', data);
            console.log('Request gesendet');
        } catch (error) {
            console.error('Fehler beim Senden:', error);
        }
    },
    saveText(text) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = `/media/andre/Daten/Projekt Himmelsfeuer/Audio/tts_${timestamp}.mp3`;
        ipcRenderer.send('tts-save', text, filePath);
    },
    async uploadTxtFile() {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{ name: 'Text Files', extensions: ['txt'] }]
            });

            if (filePaths && filePaths.length > 0) {
                const txtPath = filePaths[0];
                const text = await fs.readFile(txtPath, 'utf-8');
                // Extrahiere den Dateinamen ohne .txt Endung
                const txtName = txtPath.split('/').pop().replace('.txt', '');
                const mp3Path = `/media/andre/Daten/Projekt Himmelsfeuer/Audio/${txtName}.mp3`;
                ipcRenderer.send('upload-txt-file', text, mp3Path);
            }
        } catch (error) {
            console.error('Fehler beim Lesen der Datei:', error);
        }
    },
    async txt2mp3() {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{ name: 'Text Files', extensions: ['txt'] }]
            });

            if (filePaths && filePaths.length > 0) {
                const txtPath = filePaths[0];
                const text = await fs.readFile(txtPath, 'utf-8');
                // Extrahiere den Dateinamen ohne .txt Endung
                const txtName = txtPath.split('/').pop().replace('.txt', '');
                const mp3Path = `/media/andre/Daten/Projekt Himmelsfeuer/Audio/${txtName}.mp3`;
                ipcRenderer.send('txt2mp3', text, mp3Path);
            }
        } catch (error) {
            console.error('Fehler beim Lesen der Datei:', error);
        }
    },
    onProgressUpdate: (callback) => {
        console.log('Registriere Progress-Update Handler');
        ipcRenderer.on('progress-update', (event, progress, totalBlocks, currentBlock, blockProgress) => {
            console.log('Progress Update:', { progress, totalBlocks, currentBlock, blockProgress });
            callback(progress, totalBlocks, currentBlock, blockProgress);
        });
    },
    onError: (callback) => ipcRenderer.on('error', (event, message) => callback(message))
});

ipcRenderer.on('tts-playback-result', (event, audioBuffer) => {
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Cleanup nach dem Abspielen
    audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
    };

    // Cleanup bei Fehlern
    audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
    };

    audio.play().catch(error => {
        console.error('Fehler beim Abspielen:', error);
        URL.revokeObjectURL(audioUrl);
    });
});

ipcRenderer.on('tts-save-result', (event, filePath) => {
    alert(`Die Datei wurde erfolgreich als MP3 gespeichert: ${filePath}`);
});

ipcRenderer.on('error', (event, message) => {
    alert(message);
});
