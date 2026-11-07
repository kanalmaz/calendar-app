const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Synchronous load on startup (blocks until file is read — needed before other scripts run)
    loadLatestBackupSync: () => ipcRenderer.sendSync('load-latest-backup-sync'),

    // Called on startup to get the most recent backup (async version for other uses)
    loadLatestBackup: () => ipcRenderer.invoke('load-latest-backup'),

    // Main process calls this when user closes the window
    onRequestBackup: (callback) => ipcRenderer.on('request-data-for-backup', callback),

    // Renderer sends current data back to main to be saved as a file
    deliverBackup: (jsonData) => ipcRenderer.send('deliver-data-for-backup', jsonData),

    // Get list of available backups for the settings panel
    listBackups: () => ipcRenderer.invoke('list-backups'),
});
