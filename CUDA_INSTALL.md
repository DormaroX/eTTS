## CUDA Installation Schritte für Ubuntu

### 0. Backup (Optional aber empfohlen)
- [ ] Wichtige Daten sichern
- [ ] System-Snapshot erstellen falls möglich

### 1. Voraussetzungen prüfen
- [ ] GPU identifizieren:
  ```bash
  lspci | grep -i nvidia
  ```
- [ ] System-Version prüfen:
  ```bash
  uname -m && cat /etc/*release
  ```
- [ ] Compiler prüfen:
  ```bash
  gcc --version
  g++ --version
  ```
- [ ] Kernel-Headers prüfen:
  ```bash
  uname -r
  dpkg -l | grep linux-headers
  ```

### 2. Cleanup
- [ ] Existierende NVIDIA-Treiber entfernen:
  ```bash
  sudo apt-get --purge remove "*nvidia*"
  ```
- [ ] Existierende CUDA-Installation entfernen:
  ```bash
  sudo apt-get --purge remove "cuda*"
  ```
- [ ] System bereinigen:
  ```bash
  sudo apt-get autoremove
  sudo apt-get autoclean
  ```

### 3. System Update
- [ ] Paketlisten aktualisieren:
  ```bash
  sudo apt-get update
  ```
- [ ] System upgraden:
  ```bash
  sudo apt-get upgrade
  ```
- [ ] Kernel-Header installieren:
  ```bash
  sudo apt-get install linux-headers-$(uname -r)
  ```

### 4. CUDA Installation
- [ ] CUDA-Repository-Schlüssel herunterladen:
  ```bash
  wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
  ```
- [ ] Keyring installieren:
  ```bash
  sudo dpkg -i cuda-keyring_1.1-1_all.deb
  ```
- [ ] Paketlisten aktualisieren:
  ```bash
  sudo apt-get update
  ```
- [ ] CUDA Toolkit installieren:
  ```bash
  sudo apt-get -y install cuda
  ```
- [ ] Optional: Spezifische CUDA-Version installieren:
  ```bash
  sudo apt-get -y install cuda-11-8  # Beispiel für CUDA 11.8
  ```

### 5. Umgebung einrichten
- [ ] PATH in /etc/environment setzen:
  ```bash
  sudo sh -c 'echo "PATH=\"\$PATH:/usr/local/cuda/bin\"" >> /etc/environment'
  ```
- [ ] LD_LIBRARY_PATH in /etc/environment setzen:
  ```bash
  sudo sh -c 'echo "LD_LIBRARY_PATH=\"\$LD_LIBRARY_PATH:/usr/local/cuda/lib64\"" >> /etc/environment'
  ```
- [ ] Umgebungsvariablen laden:
  ```bash
  source /etc/environment
  ```
- [ ] System neu starten:
  ```bash
  sudo reboot
  ```

### 6. Verifizierung
- [ ] NVIDIA Treiber prüfen:
  ```bash
  nvidia-smi
  ```
- [ ] CUDA Version prüfen:
  ```bash
  nvcc -V
  ```
- [ ] CUDA Samples testen (optional):
  ```bash
  cuda-install-samples-11.8.0 ~/  # Version anpassen
  cd ~/NVIDIA_CUDA-11.8_Samples
  make
  cd bin/x86_64/linux/release
  ./deviceQuery  # Sollte "Result = PASS" zeigen
  ```

### Fehlerbehebung
- Bei schwarzem Bildschirm:
  1. Ctrl+Alt+F1 für TTY
  2. Einloggen
  3. `sudo service gdm3 stop`  # oder lightdm/sddm je nach System
  4. Installation durchführen
  5. `sudo service gdm3 start`

- Bei "held packages":
  ```bash
  sudo apt-get --allow-change-held-packages install cuda
  ```

### Notizen
- Installation kann 30+ Minuten dauern
- Mehrere Neustarts können erforderlich sein
- Bei Problemen: /var/log/cuda-installer.log prüfen
