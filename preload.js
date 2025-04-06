const { contextBridge, ipcRenderer, shell } = require('electron');
const { Howl, Howler } = require('howler');
const { dialog } = require('@electron/remote');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const mp3Duration = require('mp3-duration');

// Globale Variablen für die Playlist-Funktionalität
let playlist = [];
let currentIndex = -1;
let currentSound = null;
let isPlaying = false;

// Initialisiere die APIs
const electronAPI = {
    onAudioProgress: (callback) => {
        ipcRenderer.on('audio-progress', (event, currentTime, duration) => {
            callback(currentTime, duration);
        });
    },
    openMusicFolder: async () => {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] }]
            });

            if (filePaths && filePaths.length > 0) {
                for (const filePath of filePaths) {
                    try {
                        const fileName = path.basename(filePath);
                        console.log('Lade Audio-Datei:', fileName);
                        
                        // Lese die Datei
                        const buffer = await fsPromises.readFile(filePath);
                        
                        // Ermittle die Dauer
                        const duration = await new Promise((resolve, reject) => {
                            mp3Duration(buffer, (err, durationValue) => {
                                if (err) {
                                    console.error('Fehler bei mp3-duration:', err);
                                    reject(err);
                                    return;
                                }
                                
                                if (durationValue === undefined || typeof durationValue !== 'number') {
                                    console.error('Dauer ist undefined oder kein number!');
                                    reject(new Error(`Ungültige Dauer: ${durationValue}`));
                                    return;
                                }
                                
                                resolve(durationValue);
                            });
                        });
                        
                        // Erstelle das Track-Objekt
                        const track = {
                            name: fileName,
                            url: filePath,  // Lokale Datei, verwende den Pfad direkt
                            duration: duration
                        };
                        
                        console.log('Track hinzugefügt:', {
                            name: track.name,
                            duration: track.duration,
                            durationType: typeof track.duration
                        });
                        
                        playlist.push(track);
                    } catch (error) {
                        console.error('Fehler beim Laden von', filePath, ':', error);
                    }
                }
                updatePlaylistUI();
            }
        } catch (error) {
            console.error('Error selecting files:', error);
        }
    },
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
    saveText: (text) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = `/media/andre/Daten/Projekt Himmelsfeuer/Audio/tts_${timestamp}.mp3`;
        ipcRenderer.send('tts-save', text, filePath);
    },
    uploadTxtFile: async () => {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{ name: 'Text Files', extensions: ['txt'] }]
            });

            if (filePaths && filePaths.length > 0) {
                const txtPath = filePaths[0];
                const text = await fs.readFile(txtPath, 'utf-8');
                const txtName = txtPath.split('/').pop().replace('.txt', '');
                const mp3Path = `/media/andre/Daten/Projekt Himmelsfeuer/Audio/${txtName}.mp3`;
                ipcRenderer.send('upload-txt-file', text, mp3Path);
            }
        } catch (error) {
            console.error('Fehler beim Lesen der Datei:', error);
        }
    },
    txt2mp3: async () => {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{ name: 'Text Files', extensions: ['txt'] }]
            });

            if (filePaths && filePaths.length > 0) {
                const txtPath = filePaths[0];
                const text = await fs.readFile(txtPath, 'utf-8');
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
};

// Expose APIs
contextBridge.exposeInMainWorld('electronAPI', electronAPI);



// Expose APIs to renderer process
contextBridge.exposeInMainWorld('mediaPlayer', {
    addToPlaylist: async (file) => {
        try {
            console.log('Lade Audio-Datei:', file.name);
            
            // Erstelle eine temporäre Datei
            const tempPath = path.join(require('os').tmpdir(), file.name);
            const buffer = Buffer.from(await file.arrayBuffer());
            await fsPromises.writeFile(tempPath, buffer);
            
            console.log('Temporäre Datei erstellt:', tempPath);
            
            // Ermittle die Dauer mit mp3-duration
            console.log('Temporäre Datei existiert:', await fsPromises.access(tempPath).then(() => true).catch(() => false));
            console.log('Temporäre Datei Stats:', await fsPromises.stat(tempPath));
            
            const duration = await new Promise((resolve, reject) => {
                console.log('Starte mp3-duration für:', tempPath);
                
                // Direkte Verwendung des Buffers statt der Datei
                const buffer = fs.readFileSync(tempPath);
                mp3Duration(buffer, (err, durationValue) => {
                    if (err) {
                        console.error('Fehler bei mp3-duration:', err);
                        reject(err);
                        return;
                    }
                    
                    console.log('MP3 Dauer ermittelt:', durationValue, 'Sekunden');
                    console.log('Dauer Typ:', typeof durationValue);
                    
                    if (durationValue === undefined || typeof durationValue !== 'number') {
                        console.error('Dauer ist undefined oder kein number!');
                        reject(new Error(`Ungültige Dauer: ${durationValue}`));
                        return;
                    }
                    
                    resolve(durationValue);
                });
            });
            
            console.log('Dauer nach Promise:', duration, 'Sekunden');
            console.log('Dauer Typ nach Promise:', typeof duration);
            
            // Lösche die temporäre Datei
            await fsPromises.unlink(tempPath);
            
            // Validiere die Dauer
            if (typeof duration !== 'number' || isNaN(duration) || duration <= 0) {
                throw new Error(`Ungültige Dauer: ${duration} (${typeof duration})`);
            }

            // Erstelle das Track-Objekt
            const track = {
                name: file.name,  // Kein Debug-Info mehr im Namen
                url: URL.createObjectURL(file),
                duration: duration  // Bereits eine Nummer von mp3-duration
            };
            
            console.log('Track hinzugefügt:', {
                name: track.name,
                duration: track.duration,
                durationType: typeof track.duration,
                formattedDuration: formatTime(track.duration)
            });
            
            playlist.push(track);
            updatePlaylistUI();
        } catch (error) {
            console.error('Fehler beim Laden:', error);
            const track = {
                name: `${file.name} [Fehler: ${error.message}]`,
                url: URL.createObjectURL(file),
                duration: 0
            };
            playlist.push(track);
            updatePlaylistUI();
        }
    },
    
    play: () => {
        if (currentSound && currentSound.playing()) {
            currentSound.pause();
            isPlaying = false;
            updatePlayButton();
        } else if (currentSound) {
            currentSound.play();
            isPlaying = true;
            updatePlayButton();
            updateProgress();
        } else if (playlist.length > 0) {
            playTrack(0);
        }
    },
    
    next: () => {
        if (currentIndex < playlist.length - 1) {
            playTrack(currentIndex + 1);
        }
    },
    
    prev: () => {
        if (currentIndex > 0) {
            playTrack(currentIndex - 1);
        }
    },
    
    seek: (percent) => {
        if (currentSound) {
            const duration = currentSound.duration();
            currentSound.seek(duration * (percent / 100));
        }
    }
});

// Hilfsfunktionen
let timeTracker = null;

function createTimeTracker(url) {
    // Cleanup vorheriger Tracker
    if (timeTracker) {
        timeTracker.pause();
        timeTracker.remove();
    }

    // Erstelle einen versteckten Audio-Player
    timeTracker = new Audio();
    timeTracker.style.display = 'none';
    timeTracker.src = url;

    // Event-Listener für Zeitaktualisierung
    timeTracker.addEventListener('timeupdate', () => {
        if (currentSound && currentSound.playing() && currentIndex >= 0) {
            const track = playlist[currentIndex];
            const currentTime = timeTracker.currentTime;
            const duration = timeTracker.duration;

            // Berechne den Fortschritt
            const progress = (currentTime / duration) * 100;
            document.getElementById('progress-bar').style.width = `${progress}%`;

            // Sende aktuelle Position und Dauer
            ipcRenderer.send('audio-progress', currentTime, duration);
        }
    });

    return timeTracker;
}

function updatePlayButton() {
    const playButton = document.getElementById('play-button');
    if (playButton) {
        playButton.textContent = isPlaying ? '⏸' : '▶';
    }
}

// Formatiere Zeit in MM:SS
function formatTime(seconds) {
    // Stelle sicher, dass wir eine gültige Nummer haben
    let duration;
    if (typeof seconds === 'number') {
        duration = seconds;
    } else if (typeof seconds === 'string') {
        duration = parseFloat(seconds);
    } else {
        console.error('Ungültiger Typ für formatTime:', typeof seconds);
        return '00:00';
    }

    // Prüfe auf ungültige Werte
    if (isNaN(duration) || duration <= 0) {
        console.error('Ungültige Dauer für formatTime:', duration);
        return '00:00';
    }

    // Berechne Stunden, Minuten und Sekunden
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const remainingSeconds = Math.floor(duration % 60);

    // Formatiere die Zeit (mit oder ohne Stunden)
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Berechne die Gesamtzeit der Playlist
function calculateTotalDuration() {
    let total = 0;
    playlist.forEach(track => {
        if (track.duration) {
            total += track.duration;
        }
    });
    return total;
}

function updatePlaylistUI() {
    const playlistContainer = document.getElementById('playlist-items');
    if (!playlistContainer) return;

    // Lösche alle vorhandenen Einträge
    playlistContainer.innerHTML = '';

    let dragSrcElement = null;

    // Füge alle Tracks aus der Playlist hinzu
    playlist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        if (index === currentIndex) {
            item.classList.add('active');
        }

        // Erstelle Container für Track-Info
        const trackInfo = document.createElement('div');
        trackInfo.className = 'track-info';

        // Track-Name
        const trackName = document.createElement('div');
        trackName.className = 'track-name';
        trackName.textContent = track.name;
        trackName.title = track.name; // Für den Marquee-Effekt

        // Container für Dauer und Remove-Button
        const durationContainer = document.createElement('div');
        durationContainer.className = 'duration-container';
        
        // Track-Dauer
        const trackDuration = document.createElement('div');
        trackDuration.className = 'track-duration';
        
        // Stelle sicher, dass die Dauer eine gültige Nummer ist
        if (typeof track.duration === 'number' && !isNaN(track.duration) && track.duration > 0) {
            const formattedTime = formatTime(track.duration);
            trackDuration.textContent = formattedTime;
            console.log(`Dauer für '${track.name}': ${track.duration}s (${formattedTime})`);
        } else {
            trackDuration.textContent = '00:00';
            console.error(`Ungültige Dauer für '${track.name}':`, track.duration);
        }
        
        // Remove-Button
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.textContent = '×';
        removeButton.title = 'Entfernen';
        removeButton.onclick = (e) => {
            e.stopPropagation(); // Verhindere Klick auf Track
            playlist.splice(index, 1);
            if (currentIndex > index) {
                currentIndex--;
            } else if (currentIndex === index) {
                if (currentSound) {
                    currentSound.stop();
                }
                currentIndex = -1;
                isPlaying = false;
            }
            updatePlaylistUI();
        };
        
        durationContainer.appendChild(trackDuration);
        durationContainer.appendChild(removeButton);

        trackInfo.appendChild(trackName);
        trackInfo.appendChild(durationContainer);
        item.appendChild(trackInfo);

        item.onclick = () => playTrack(index);

        // Drag & Drop Event Listener
        item.setAttribute('draggable', true);
        
        item.addEventListener('dragstart', function(e) {
            dragSrcElement = this;
            e.dataTransfer.effectAllowed = 'move';
            this.classList.add('dragging');
        });

        item.addEventListener('dragenter', function(e) {
            this.classList.add('over');
        });

        item.addEventListener('dragleave', function(e) {
            this.classList.remove('over');
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            return false;
        });

        item.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            playlistContainer.querySelectorAll('.playlist-item').forEach(item => {
                item.classList.remove('over');
            });
        });

        item.addEventListener('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();

            if (dragSrcElement !== this) {
                const allItems = [...playlistContainer.querySelectorAll('.playlist-item')];
                const draggedIndex = allItems.indexOf(dragSrcElement);
                const droppedIndex = allItems.indexOf(this);

                // Aktualisiere die Playlist-Reihenfolge
                const [movedItem] = playlist.splice(draggedIndex, 1);
                playlist.splice(droppedIndex, 0, movedItem);

                // Aktualisiere den currentIndex, wenn nötig
                if (currentIndex === draggedIndex) {
                    currentIndex = droppedIndex;
                } else if (currentIndex > draggedIndex && currentIndex <= droppedIndex) {
                    currentIndex--;
                } else if (currentIndex < draggedIndex && currentIndex >= droppedIndex) {
                    currentIndex++;
                }

                // Aktualisiere die Playlist-Anzeige
                updatePlaylistUI();
            }

            return false;
        });

        playlistContainer.appendChild(item);
    });

    // Aktualisiere die Gesamtzeit
    const totalDuration = calculateTotalDuration();
    const totalTimeElement = document.getElementById('total-time');
    if (totalTimeElement) {
        totalTimeElement.textContent = `Gesamtzeit: ${formatTime(totalDuration)}`;
    }

    // Aktualisiere den Namen des aktuellen Tracks
    const currentTrackElement = document.getElementById('current-track');
    if (currentTrackElement) {
        currentTrackElement.textContent = currentIndex >= 0 ? playlist[currentIndex].name : 'Kein Titel ausgewählt';
    }
}



function playTrack(index) {
    if (currentSound) {
        currentSound.stop();
    }

    currentIndex = index;
    const track = playlist[index];
    
    currentSound = new Howl({
        src: [track.url],  // Verwende url statt path
        html5: true,
        onplay: () => {
            isPlaying = true;
            updatePlayButton();
            
            // Starte den Zeittracker
            const track = playlist[currentIndex];
            if (track) {
                const tracker = createTimeTracker(track.url);
                tracker.currentTime = currentSound.seek() || 0;
                tracker.play();
            }
        },
        onpause: () => {
            isPlaying = false;
            updatePlayButton();
            // Pausiere den Zeittracker
            if (timeTracker) {
                timeTracker.pause();
            }
        },
        onstop: () => {
            isPlaying = false;
            updatePlayButton();
            
            // Stoppe den Zeittracker
            if (timeTracker) {
                timeTracker.pause();
                timeTracker.currentTime = 0;
            }
            
            // Setze Progress zurück
            ipcRenderer.send('audio-progress', 0, 0);
        },
        onend: () => {
            // Stoppe den Zeittracker
            if (timeTracker) {
                timeTracker.pause();
                timeTracker.currentTime = 0;
            }
            
            if (currentIndex < playlist.length - 1) {
                playTrack(currentIndex + 1);
            } else {
                isPlaying = false;
                updatePlayButton();
                // Setze Progress zurück
                ipcRenderer.send('audio-progress', 0, 0);
            }
        }
    });

    currentSound.play();
    updatePlaylistUI();
}

// Expose Media Player Controls
contextBridge.exposeInMainWorld('mediaPlayerControls', {
    play: () => {
        if (!currentSound && playlist.length > 0) {
            // Wenn kein Sound geladen ist, aber Tracks in der Playlist sind
            playTrack(0);
            return;
        } else if (!currentSound) {
            return;
        }
        
        if (currentSound.playing()) {
            currentSound.pause();
            isPlaying = false;
        } else {
            currentSound.play();
            isPlaying = true;
            updateProgress();
        }
        updatePlayButton();
    },

    prev: () => {
        if (playlist.length === 0) return;
        
        if (currentIndex > 0) {
            playTrack(currentIndex - 1);
        } else {
            // Wenn wir am Anfang sind, zum letzten Track springen
            playTrack(playlist.length - 1);
        }
    },

    next: () => {
        if (playlist.length === 0) return;
        
        if (currentIndex < playlist.length - 1) {
            playTrack(currentIndex + 1);
        } else {
            // Wenn wir am Ende sind, zum ersten Track springen
            playTrack(0);
        }
    },

    setVolume: (value) => {
        Howler.volume(value / 100);
    },

    stop: () => {
        if (currentSound) {
            currentSound.stop();
            isPlaying = false;
            updatePlayButton();
        }
    },

    seek: (e, progressBar) => {
        if (!currentSound) return;
        
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        currentSound.seek(currentSound.duration() * percent);
    },

    handleDrop: (files) => {
        for (const file of files) {
            if (file.type.startsWith('audio/')) {
                loadFile(file);
            }
        }
    },

    updatePlaylistOrder: (newPlaylist) => {
        playlist = newPlaylist;
        updatePlaylistUI();
    }
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
