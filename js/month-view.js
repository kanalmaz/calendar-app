//  MONTHLY VIEW
// ═══════════════════════════════════════════════════════════════
const calendarGrid   = document.getElementById('calendarGrid');
const monthYearLabel = document.getElementById('monthYear');

function renderCalendar() {
    calendarGrid.innerHTML = '';
    const year  = currentDate.getFullYear();
    const month = currentDate.getMonth();

    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Monday start
    const lastDay = new Date(year, month + 1, 0).getDate();

    monthYearLabel.textContent =
        `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

    // Empty prefix blocks
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyBlock = document.createElement('div');
        emptyBlock.className = 'day-block empty';
        calendarGrid.appendChild(emptyBlock);
    }

    // Day blocks
    for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

        const dayBlock = document.createElement('div');
        dayBlock.className = 'day-block';
        dayBlock.addEventListener('click', () => openDayView(dateStr));

        if (appData.images[dateStr]) {
            dayBlock.style.backgroundImage = `url(${appData.images[dateStr]})`;
        }

        // Quarter-circle day badge
        const badge = document.createElement('div');
        badge.className = 'day-number-badge';
        badge.textContent = d;
        dayBlock.appendChild(badge);

        const allEventsForBlock = getAllEventsForDay(dateStr);

        // Monthly hover events (invisible rectangles) up to 5 capacity
        if (allEventsForBlock.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events-container';
            
            const displayEvents = allEventsForBlock.slice(0, 5);
            displayEvents.forEach(evt => {
                const evtRect = document.createElement('div');
                evtRect.className = 'day-event-rect';
                evtRect.textContent = evt;

                // Restore pinned state from saved data
                const pinnedForDate = appData.pinnedEvents[dateStr] || [];
                if (pinnedForDate.includes(evt)) evtRect.classList.add('pinned');

                // Click: toggle pinned and save to appData
                evtRect.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!appData.pinnedEvents[dateStr]) appData.pinnedEvents[dateStr] = [];
                    const idx = appData.pinnedEvents[dateStr].indexOf(evt);
                    if (idx === -1) {
                        appData.pinnedEvents[dateStr].push(evt);
                        evtRect.classList.add('pinned');
                    } else {
                        appData.pinnedEvents[dateStr].splice(idx, 1);
                        evtRect.classList.remove('pinned');
                    }
                    saveData();
                });
                eventsContainer.appendChild(evtRect);
            });
            dayBlock.appendChild(eventsContainer);
        }

        // Invisible trigger spanning the bottom-left corner
        const trigger = document.createElement('div');
        trigger.className = 'popup-trigger';
        attachTrigger(trigger, 
            `${dateStr}`, 
            () => appData.images[dateStr],
            () => getAllEventsForDay(dateStr)
        );
        dayBlock.appendChild(trigger);

        calendarGrid.appendChild(dayBlock);

        // Cycle phase pip
        if (appData.cycleOverlayOn && appData.cycleData) {
            const phaseInfo = getCyclePhaseForDate(dateStr);
            if (phaseInfo) {
                const pip = document.createElement('div');
                pip.className = `cycle-pip cycle-pip-${phaseInfo.phase}${phaseInfo.predicted ? ' predicted' : ''}`;
                pip.textContent = phaseInfo.icon;
                pip.title = `${phaseInfo.label} · Day ${phaseInfo.cycleDay}`;
                dayBlock.appendChild(pip);
            }
        }
    }

    // Trailing empty blocks (5 rows × 7 = 35)
    const totalBlocks = firstDayIndex + lastDay;
    const paddingEnd  = 35 - totalBlocks;
    for (let i = 0; i < paddingEnd; i++) {
        const emptyBlock = document.createElement('div');
        emptyBlock.className = 'day-block empty';
        calendarGrid.appendChild(emptyBlock);
    }
}

// Month navigation
document.getElementById('prevBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('nextBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// ═══════════════════════════════════════════════════════════════
