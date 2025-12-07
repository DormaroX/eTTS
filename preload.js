const { contextBridge, ipcRenderer, shell } = require('electron');

// Globale Variablen für die Playlist-Funktionalität
let playlist = [];
let currentIndex = -1;
let currentSound = null;
let isPlaying = false;

// Initialisiere die APIs
const electronAPI = {
    onProcessComplete: (callback) => {
        ipcRenderer.on('process-complete', (event, message) => {
            callback(message);
        });
    },
    onAudioProgress: (callback) => {
        ipcRenderer.on('audio-progress', (event, currentTime, duration) => {
            callback(currentTime, duration);
        });
    },
    openMusicFolder: () => {
        // Sende Request an Main Process für Dialog
        ipcRenderer.send('open-music-folder');
    },
    stopProcess: () => ipcRenderer.send('stop-process'),
    sendText: (data) => {
        console.log('preload.js: Sending TTS request:', data);
        ipcRenderer.send('tts-playback', data);
    },
    sendTxt2mp4: (data) => {
        console.log('Sende txt2mp4 Request:', data);
        try {
            ipcRenderer.send('txt2mp4-request', data);
            console.log('Request gesendet');
        } catch (error) {
            console.error('Fehler beim Senden:', error);
        }
    },
    saveText: (data) => {
        // Sende Request an Main Process für Save Dialog
        ipcRenderer.send('save-text-request', data);
    },
    uploadTxtFile: () => {
        // Sende Request an Main Process für Upload Dialog
        ipcRenderer.send('upload-txt-file-request');
    },
    txt2mp3: () => {
        // Sende Request an Main Process für txt2mp3 Dialog
        ipcRenderer.send('txt2mp3-request');
    },
    onProgressUpdate: (callback) => {
        console.log('Registriere Progress-Update Handler');
        ipcRenderer.on('progress-update', (event, progress, totalBlocks, currentBlock, blockProgress) => {
            console.log('Progress Update:', { progress, totalBlocks, currentBlock, blockProgress });
            callback(progress, totalBlocks, currentBlock, blockProgress);
        });
    },
    onSaveComplete: (callback) => {
        console.log('Registriere Save-Complete Handler');
        ipcRenderer.on('save-complete', (event, message) => {
            console.log('Save Complete:', message);
            callback(message);
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
let progressRAF = null;

function updateProgress() {
    if (currentSound && currentSound.playing() && currentIndex >= 0) {
        const currentTime = currentSound.seek() || 0;
        const duration = currentSound.duration() || 0;

        if (duration > 0) {
            // Sende Audio-Progress Event
            ipcRenderer.send('audio-progress', currentTime, duration);

            // Berechne den Fortschritt
            const progress = (currentTime / duration) * 100;
            const progressBar = document.getElementById('audio-progress-bar');
            
            // Aktualisiere den Fortschrittsbalken
            progressBar.style.width = `${progress}%`;
        }
    }

    // Nächstes Frame anfordern
    progressRAF = requestAnimationFrame(updateProgress);
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
            
            // Starte die Fortschrittsanzeige
            cancelAnimationFrame(progressRAF);
            progressRAF = requestAnimationFrame(updateProgress);
        },
        onpause: () => {
            isPlaying = false;
            updatePlayButton();
            // Stoppe die Fortschrittsanzeige
            cancelAnimationFrame(progressRAF);
        },
        onstop: () => {
            isPlaying = false;
            updatePlayButton();
            
            // Stoppe die Fortschrittsanzeige
            cancelAnimationFrame(progressRAF);
            
            // Setze Progress zurück
            ipcRenderer.send('audio-progress', 0, 0);
            document.getElementById('audio-progress-bar').style.width = '0%';
        },
        onend: () => {
            // Stoppe die Fortschrittsanzeige
            cancelAnimationFrame(progressRAF);
            
            if (currentIndex < playlist.length - 1) {
                playTrack(currentIndex + 1);
            } else {
                isPlaying = false;
                updatePlayButton();
                // Setze Progress zurück
                ipcRenderer.send('audio-progress', 0, 0);
                document.getElementById('audio-progress-bar').style.width = '0%';
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
