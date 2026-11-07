// ═══════════════════════════════════════════════════════════════
//  CYCLE TRACKER
// ═══════════════════════════════════════════════════════════════

/**
 * Given a YYYY-MM-DD string, returns the cycle phase info for that date,
 * or null if no cycle data is configured.
 *
 * Returns: { phase, label, icon, cycleDay, predicted }
 *   phase     — 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
 *   label     — human-readable phase name
 *   icon      — emoji icon for the phase
 *   cycleDay  — day number within the current cycle (1-based)
 *   predicted — true if this is a projected future cycle
 */
function getCyclePhaseForDate(dateStr) {
    const cd = appData.cycleData;
    if (!cd || !cd.periodStartDate) return null;

    const periodLength = cd.periodLength  || 5;
    const cycleLength  = cd.cycleLength   || 28;
    const lutealLength = cd.lutealLength  || 14;

    const targetMs = new Date(dateStr + 'T12:00:00').getTime();
    const anchorMs = new Date(cd.periodStartDate + 'T12:00:00').getTime();

    const diffDays = Math.round((targetMs - anchorMs) / 86400000);

    // Find the cycle start closest before (or on) the target date
    let cycleNum;
    if (diffDays >= 0) {
        cycleNum = Math.floor(diffDays / cycleLength);
    } else {
        cycleNum = Math.floor(diffDays / cycleLength); // negative
    }
    const cycleStart = anchorMs + cycleNum * cycleLength * 86400000;

    const cycleDay = Math.round((targetMs - cycleStart) / 86400000) + 1; // 1-based

    if (cycleDay < 1 || cycleDay > cycleLength) return null;

    // Ovulation window: around (cycleLength - lutealLength), ±1 day
    const ovulationDay = cycleLength - lutealLength;

    let phase, label, icon;
    if (cycleDay <= periodLength) {
        phase = 'menstrual';  label = 'Menstrual';  icon = '🩸';
    } else if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1) {
        phase = 'ovulation';  label = 'Ovulation';  icon = '✨';
    } else if (cycleDay < ovulationDay - 1) {
        phase = 'follicular'; label = 'Follicular'; icon = '🌱';
    } else {
        phase = 'luteal';     label = 'Luteal';     icon = '🌙';
    }

    // Predicted = any cycle that starts after the anchor (first logged start)
    const predicted = cycleStart > anchorMs;

    return { phase, label, icon, cycleDay, predicted };
}

/**
 * Returns the phase info for today.
 */
function getTodayCyclePhase() {
    return getCyclePhaseForDate(dateToStr(new Date()));
}

/**
 * Updates the sidebar phase label to reflect current cycle status.
 */
function updateCyclePhaseLabel() {
    const labelEl    = document.getElementById('cyclePhaseLabel');
    const toggleBtn  = document.getElementById('cycleToggleBtn');
    if (!labelEl) return;

    if (!appData.cycleData || !appData.cycleData.periodStartDate) {
        labelEl.textContent = 'Set up cycle tracker';
        labelEl.classList.add('no-data');
        if (toggleBtn) toggleBtn.classList.remove('active');
        return;
    }

    labelEl.classList.remove('no-data');

    const info = getTodayCyclePhase();
    if (info) {
        labelEl.textContent = `${info.label} PHASE`.toUpperCase();
    } else {
        labelEl.textContent = 'Cycle tracked';
    }

    if (toggleBtn) {
        toggleBtn.classList.toggle('active', !!appData.cycleOverlayOn);
    }
}

// ── Modal elements ───────────────────────────────────────────────
const cycleOverlay       = document.getElementById('cycleOverlay');
const cycleModalCloseBtn = document.getElementById('cycleModalClose');
const cycleSaveBtn       = document.getElementById('cycleSaveBtn');
const cycleDeleteBtn     = document.getElementById('cycleDeleteBtn');
const cycleStartDateEl    = document.getElementById('cycleStartDate');
const cyclePeriodLengthEl = document.getElementById('cyclePeriodLength');
const cycleCycleLengthEl  = document.getElementById('cycleCycleLength');
const cycleLutealLengthEl = document.getElementById('cycleLutealLength');
const cycleHistoryList    = document.getElementById('cycleHistoryList');
const cycleHistoryInput   = document.getElementById('cycleHistoryInput');
const cycleHistoryAddBtn  = document.getElementById('cycleHistoryAddBtn');

function openCycleModal() {
    const cd = appData.cycleData;
    if (cd) {
        if (cycleStartDateEl)    cycleStartDateEl.value    = cd.periodStartDate || '';
        if (cyclePeriodLengthEl) cyclePeriodLengthEl.value = cd.periodLength  || 5;
        if (cycleCycleLengthEl)  cycleCycleLengthEl.value  = cd.cycleLength   || 28;
        if (cycleLutealLengthEl) cycleLutealLengthEl.value = cd.lutealLength  || 14;
    } else {
        if (cycleStartDateEl)    cycleStartDateEl.value    = dateToStr(new Date());
        if (cyclePeriodLengthEl) cyclePeriodLengthEl.value = 5;
        if (cycleCycleLengthEl)  cycleCycleLengthEl.value  = 28;
        if (cycleLutealLengthEl) cycleLutealLengthEl.value = 14;
    }
    renderCycleHistoryList();
    if (cycleOverlay) cycleOverlay.classList.add('active');
}

function closeCycleModal() {
    if (cycleOverlay) cycleOverlay.classList.remove('active');
}

function renderCycleHistoryList() {
    if (!cycleHistoryList) return;
    cycleHistoryList.innerHTML = '';
    const history = (appData.cycleData && appData.cycleData.history) || [];
    const sorted  = [...history].sort((a, b) => b.localeCompare(a)); // newest first
    sorted.forEach(ds => {
        const item = document.createElement('div');
        item.className = 'cycle-history-item';

        const d = new Date(ds + 'T12:00:00');
        const formatted = d.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' });

        const span = document.createElement('span');
        span.textContent = formatted;

        const del = document.createElement('button');
        del.className = 'cycle-history-del';
        del.textContent = '×';
        del.title = 'Remove this date';
        del.addEventListener('click', () => {
            if (!appData.cycleData) return;
            const idx = appData.cycleData.history.indexOf(ds);
            if (idx !== -1) appData.cycleData.history.splice(idx, 1);
            saveData();
            renderCycleHistoryList();
        });

        item.appendChild(span);
        item.appendChild(del);
        cycleHistoryList.appendChild(item);
    });
}

// ── Stepper ± buttons ───────────────────────────────────────────
document.querySelectorAll('.cycle-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const delta    = parseInt(btn.dataset.delta, 10);
        const input    = document.getElementById(targetId);
        if (!input) return;
        const minV = parseInt(input.min, 10) || 1;
        const maxV = parseInt(input.max, 10) || 99;
        let val = parseInt(input.value, 10) || 0;
        val = Math.min(maxV, Math.max(minV, val + delta));
        input.value = val;
    });
});

// ── Add past period start ────────────────────────────────────────
if (cycleHistoryAddBtn) {
    cycleHistoryAddBtn.addEventListener('click', () => {
        const val = cycleHistoryInput ? cycleHistoryInput.value.trim() : '';
        if (!val) return;
        if (!appData.cycleData) appData.cycleData = { history: [] };
        if (!appData.cycleData.history) appData.cycleData.history = [];
        if (!appData.cycleData.history.includes(val)) {
            appData.cycleData.history.push(val);
            appData.cycleData.history.sort();
        }
        saveData();
        if (cycleHistoryInput) cycleHistoryInput.value = '';
        renderCycleHistoryList();
    });
}

// ── Save ────────────────────────────────────────────────────────
if (cycleSaveBtn) {
    cycleSaveBtn.addEventListener('click', () => {
        const startDate    = cycleStartDateEl    ? cycleStartDateEl.value.trim()           : '';
        const periodLength = cyclePeriodLengthEl ? parseInt(cyclePeriodLengthEl.value, 10) : 5;
        const cycleLength  = cycleCycleLengthEl  ? parseInt(cycleCycleLengthEl.value, 10)  : 28;
        const lutealLength = cycleLutealLengthEl ? parseInt(cycleLutealLengthEl.value, 10) : 14;

        if (!startDate) {
            if (cycleStartDateEl) {
                cycleStartDateEl.style.borderColor = '#e11d48';
                setTimeout(() => { if (cycleStartDateEl) cycleStartDateEl.style.borderColor = ''; }, 1500);
            }
            return;
        }

        const existingHistory = (appData.cycleData && appData.cycleData.history) || [];
        if (!existingHistory.includes(startDate)) {
            existingHistory.push(startDate);
            existingHistory.sort();
        }

        appData.cycleData = {
            periodStartDate: startDate,
            periodLength:    Math.max(1,  Math.min(10, periodLength)),
            cycleLength:     Math.max(21, Math.min(45, cycleLength)),
            lutealLength:    Math.max(10, Math.min(18, lutealLength)),
            history:         existingHistory
        };

        // Turn overlay on automatically on first save
        appData.cycleOverlayOn = true;

        saveData();
        closeCycleModal();
        updateCyclePhaseLabel();
        renderCalendar();
    });
}

// ── Clear all data ───────────────────────────────────────────────
if (cycleDeleteBtn) {
    cycleDeleteBtn.addEventListener('click', () => {
        if (!confirm('Clear all cycle tracking data? This cannot be undone.')) return;
        appData.cycleData      = null;
        appData.cycleOverlayOn = false;
        saveData();
        closeCycleModal();
        updateCyclePhaseLabel();
        renderCalendar();
    });
}

// ── Close modal ──────────────────────────────────────────────────
if (cycleModalCloseBtn) cycleModalCloseBtn.addEventListener('click', closeCycleModal);
if (cycleOverlay) {
    cycleOverlay.addEventListener('click', e => {
        if (e.target === cycleOverlay) closeCycleModal();
    });
}

// ── Toggle overlay on/off ────────────────────────────────────────
const cycleToggleBtnEl = document.getElementById('cycleToggleBtn');
if (cycleToggleBtnEl) {
    cycleToggleBtnEl.addEventListener('click', e => {
        e.stopPropagation();
        if (!appData.cycleData || !appData.cycleData.periodStartDate) {
            openCycleModal();
            return;
        }
        appData.cycleOverlayOn = !appData.cycleOverlayOn;
        saveData();
        updateCyclePhaseLabel();
        renderCalendar();
    });
}

// ── Phase label click → always opens modal ───────────────────────
const cyclePhaseLabelEl = document.getElementById('cyclePhaseLabel');
if (cyclePhaseLabelEl) {
    cyclePhaseLabelEl.addEventListener('click', e => {
        e.stopPropagation();
        openCycleModal();
    });
}

// ── Init on load ─────────────────────────────────────────────────
updateCyclePhaseLabel();
