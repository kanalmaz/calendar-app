const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ── Portable data path ─────────────────────────────────────────────────────
const portableDataPath = path.join(path.dirname(app.getPath('exe')), 'calendar_data');
if (!fs.existsSync(portableDataPath)) fs.mkdirSync(portableDataPath, { recursive: true });
app.setPath('userData', portableDataPath);

// ── Backup paths ───────────────────────────────────────────────────────────
const localBackupsDir  = path.join(portableDataPath, 'backups');
const oneDriveBackupsDir = 'D:\\OneDrive\\CalendarBackups';

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getTimestamp() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function pruneBackups(dir, keep = 10) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir)
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
        .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtimeMs }))
        .sort((a, b) => b.time - a.time); // newest first
    files.slice(keep).forEach(f => {
        try { fs.unlinkSync(path.join(dir, f.name)); } catch {}
    });
}

function saveBackupFiles(jsonData) {
    const ts = getTimestamp();
    const filename = `backup_${ts}.json`;

    // Local backup
    ensureDir(localBackupsDir);
    fs.writeFileSync(path.join(localBackupsDir, filename), jsonData, 'utf8');
    pruneBackups(localBackupsDir, 10);

    // OneDrive backup
    try {
        ensureDir(oneDriveBackupsDir);
        fs.writeFileSync(path.join(oneDriveBackupsDir, filename), jsonData, 'utf8');
        pruneBackups(oneDriveBackupsDir, 10);
    } catch (e) {
        console.warn('OneDrive backup failed:', e.message);
    }

    return filename;
}

function getLatestBackup() {
    const dirs = [localBackupsDir, oneDriveBackupsDir];
    let latest = null;
    let latestTime = 0;

    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir)
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'));
        for (const f of files) {
            const stat = fs.statSync(path.join(dir, f));
            if (stat.mtimeMs > latestTime) {
                latestTime = stat.mtimeMs;
                latest = path.join(dir, f);
            }
        }
    }
    return latest;
}

// ── Window ─────────────────────────────────────────────────────────────────
let mainWindow;
let isQuitting = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 850,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            additionalArguments: ['--disable-http-cache']
        },
        autoHideMenuBar: true
    });

    Menu.setApplicationMenu(null);
    mainWindow.loadFile('index.html');

    // Intercept close: ask renderer for data, save backup, then actually close
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.webContents.send('request-data-for-backup');
        }
    });
}

// ── IPC Handlers ───────────────────────────────────────────────────────────

// Renderer sends data on close
ipcMain.on('deliver-data-for-backup', (event, jsonData) => {
    try {
        const filename = saveBackupFiles(jsonData);
        console.log('Backup saved:', filename);
    } catch (e) {
        console.error('Backup save failed:', e);
    }
    isQuitting = true;
    mainWindow.close();
});

// Renderer asks for the latest backup on startup (async)
ipcMain.handle('load-latest-backup', () => {
    const filePath = getLatestBackup();
    if (!filePath) return null;
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }
});

// Renderer asks for the latest backup synchronously (used on first load before other scripts run)
ipcMain.on('load-latest-backup-sync', (event) => {
    const filePath = getLatestBackup();
    if (!filePath) { event.returnValue = null; return; }
    try {
        event.returnValue = fs.readFileSync(filePath, 'utf8');
    } catch {
        event.returnValue = null;
    }
});

// Renderer requests list of backups (for settings panel)
ipcMain.handle('list-backups', () => {
    const results = [];
    const dirs = [localBackupsDir, oneDriveBackupsDir];
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        fs.readdirSync(dir)
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
            .forEach(f => results.push({ name: f, path: path.join(dir, f), time: fs.statSync(path.join(dir, f)).mtimeMs }));
    }
    // Return unique by name, newest first
    const seen = new Set();
    return results
        .filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; })
        .sort((a, b) => b.time - a.time)
        .slice(0, 10);
});

// ── App lifecycle ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
