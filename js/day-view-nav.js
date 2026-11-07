//  DAY VIEW — open / close
// ═══════════════════════════════════════════════════════════════
const monthlyView = document.getElementById('monthlyView');
const dayView     = document.getElementById('dayView');

function openDayView(dateStr) {
    currentDayStr = dateStr;
    monthlyView.style.display = 'none';
    dayView.classList.add('active');
    renderDayView();
}

function closeDayView() {
    dayView.classList.remove('active');
    monthlyView.style.display = 'flex';
    renderCalendar(); // refresh in case photo was changed
}

document.getElementById('backToMonthBtn').addEventListener('click', closeDayView);

// Day navigation
document.getElementById('prevDayBtn').addEventListener('click', () => {
    const d = new Date(currentDayStr + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    currentDayStr = dateToStr(d);
    renderDayView();
});
document.getElementById('nextDayBtn').addEventListener('click', () => {
    const d = new Date(currentDayStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    currentDayStr = dateToStr(d);
    renderDayView();
});

// ═══════════════════════════════════════════════════════════════
