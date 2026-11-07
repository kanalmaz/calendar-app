// ═══════════════════════════════════════════════════════════════
//  APP STATE
// ═══════════════════════════════════════════════════════════════
window.onerror = function(msg, url, lineNo, columnNo, error) {
    alert("Error: " + msg + "\nLine: " + lineNo);
    return false;
};

let currentDate   = new Date();
let currentDayStr = null; // "2026-04-18"

// ── Load data: prefer localStorage, but use backup if it's newer (synced) ──
let appData = {};

(function loadAppData() {
    let lsDataStr = localStorage.getItem('calendarAppData');
    let lsData = null;
    try { if (lsDataStr) lsData = JSON.parse(lsDataStr); } catch (e) {}

    let backupData = null;
    if (window.electronAPI && window.electronAPI.loadLatestBackupSync) {
        try {
            const backupJson = window.electronAPI.loadLatestBackupSync();
            if (backupJson) {
                const parsed = JSON.parse(backupJson);
                if (parsed && typeof parsed === 'object') backupData = parsed;
            }
        } catch(e) {
            console.warn('Could not load backup file:', e);
        }
    }

    const lsTime = (lsData && lsData.lastModified) ? lsData.lastModified : 0;
    const bkTime = (backupData && backupData.lastModified) ? backupData.lastModified : 0;

    // Use backup ONLY if it's strictly newer than localStorage, or if localStorage is empty
    if (backupData && (!lsData || bkTime > lsTime)) {
        appData = backupData;
        localStorage.setItem('calendarAppData', JSON.stringify(appData));
    } else if (lsData) {
        appData = lsData;
    } else {
        appData = {};
    }

    // Ensure all keys exist
    if (!appData.images)           appData.images = {};
    if (!appData.events)           appData.events = {};
    if (!appData.timeEvents)       appData.timeEvents = {};
    if (!appData.hourImages)       appData.hourImages = {};
    if (!appData.todos)            appData.todos = [];
    if (!appData.dayTodos)         appData.dayTodos = {};
    if (!appData.shopping)         appData.shopping = [];
    if (!appData.pinnedEvents)     appData.pinnedEvents = {};     // { "2026-04-26": ["event text", ...] }
    if (!appData.pinnedHourEvents) appData.pinnedHourEvents = {}; // { "2026-04-26": { "08:00": ["txt"] } }
    if (!appData.hourTasks)        appData.hourTasks = {};        // { "2026-04-26": { "08:00": [{id, text, done}] } }
    if (!appData.cycleData)        appData.cycleData = null;      // null = not set up yet
    if (appData.cycleOverlayOn === undefined) appData.cycleOverlayOn = false;
    if (!appData.foodChecklistConfig) appData.foodChecklistConfig = [];
    if (!appData.foodChecklistState)  appData.foodChecklistState = {};
})();



function saveData() {
    appData.lastModified = Date.now();
    localStorage.setItem('calendarAppData', JSON.stringify(appData));
}

// ═══════════════════════════════════════════════════════════════
//  DATA MIGRATION (EXPORT / IMPORT)
// ═══════════════════════════════════════════════════════════════
const migrationTools = document.getElementById('migrationTools');
if (migrationTools) migrationTools.style.display = '';

document.getElementById('hideMigrationBtn')?.addEventListener('click', () => {
    appData.hideMigrationTools = true;
    saveData();
    if (migrationTools) migrationTools.style.display = 'none';
});

document.getElementById('exportDataBtn')?.addEventListener('click', () => {
    const dataStr = JSON.stringify(appData);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendar_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

document.getElementById('importDataInput')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const importedData = JSON.parse(ev.target.result);
            if (importedData && typeof importedData === 'object') {
                localStorage.setItem('calendarAppData', JSON.stringify(importedData));
                alert('Data successfully imported! The application will now reload.');
                window.location.reload();
            } else {
                alert('Invalid backup file format.');
            }
        } catch (err) {
            alert('Error reading backup file.');
        }
    };
    reader.readAsText(file);
});

// Helper: Date → "YYYY-MM-DD"
function dateToStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// One-time initialization block to wipe your past test variables per your instruction
if (!appData.hasWipedOldData_0418) {
    appData.events = {};
    appData.timeEvents = {};
    appData.todos = [];
    appData.shopping = [];
    appData.hasWipedOldData_0418 = true;
    saveData();
}

// Daily purge for completed To-Dos and Shopping items the next day
const todayStrCheck = dateToStr(new Date());
if (appData.lastTodoPurgeDate !== todayStrCheck) {
    appData.todos = appData.todos.filter(t => !t.done);
    if (appData.shopping) {
        appData.shopping = appData.shopping.filter(cat => !cat.done);
        appData.shopping.forEach(cat => {
            if (cat.items) {
                cat.items = cat.items.filter(i => !i.done);
            }
        });
    }
    appData.lastTodoPurgeDate = todayStrCheck;
    saveData();
}

// Aggregator that merges classical day events with specific hour events
function getAllEventsForDay(dateStr) {
    let all = [];
    if (appData.events[dateStr]) {
        all = all.concat(appData.events[dateStr]);
    }
    if (appData.timeEvents[dateStr]) {
        const sortedTimes = Object.keys(appData.timeEvents[dateStr]).sort();
        sortedTimes.forEach(t => {
            appData.timeEvents[dateStr][t].forEach(evt => {
                all.push(`${t} ${evt}`);
            });
        });
    }
    return all;
}


// ═══════════════════════════════════════════════════════════════

// ── Backup on close: main process asks, renderer delivers ───────────────────
if (window.electronAPI) {
    window.electronAPI.onRequestBackup(() => {
        window.electronAPI.deliverBackup(JSON.stringify(appData));
    });
}
