// ═══════════════════════════════════════════════════════════════
//  HOUR EDIT MODAL (Setup Page)
// ═══════════════════════════════════════════════════════════════
const hourModal = document.getElementById('hourModal');
let currentEditDate = null;
let currentEditHour = null;

// close when clicking outside the content window
hourModal.addEventListener('click', e => {
    if (e.target === hourModal) {
        hourModal.classList.remove('active');
        renderDayView(); // refresh the grid to show updates
    }
});

function openHourModal(dateStr, hhKey, labelText) {
    currentEditDate = dateStr;
    currentEditHour = hhKey;
    
    document.getElementById('hourModalTitle').textContent = `Edit Time: ${labelText}`;
    document.getElementById('newHourEventText').value = '';
    document.getElementById('hourPhotoInput').value = '';
    
    refreshHourModal();
    hourModal.classList.add('active');
}

function refreshHourModal() {
    // Refresh Photo side
    const img = appData.hourImages[currentEditDate]?.[currentEditHour];
    document.getElementById('hourImagePreview').style.backgroundImage = img ? `url(${img})` : 'none';

    const hourPhotoUrlInput = document.getElementById('hourPhotoUrl');
    if (hourPhotoUrlInput) {
        hourPhotoUrlInput.value = (img && img.startsWith('http')) ? img : '';
    }

    // Refresh Events side
    const eventsList = document.getElementById('hourEventsList');
    eventsList.innerHTML = '';
    const eventsArray = appData.timeEvents[currentEditDate]?.[currentEditHour] || [];

    eventsArray.forEach((txt, idx) => {
        const item = document.createElement('div');
        item.className = 'hover-event-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        
        const span = document.createElement('span');
        span.textContent = txt;
        
        const delBtn = document.createElement('button');
        delBtn.textContent = '×';
        delBtn.style.border = 'none';
        delBtn.style.background = 'none';
        delBtn.style.color = '#e55';
        delBtn.style.cursor = 'pointer';
        delBtn.style.fontSize = '18px';
        delBtn.style.fontWeight = 'bold';
        
        delBtn.addEventListener('click', () => {
            appData.timeEvents[currentEditDate][currentEditHour].splice(idx, 1);
            saveData();
            refreshHourModal();
        });

        item.appendChild(span);
        item.appendChild(delBtn);
        eventsList.appendChild(item);
    });
}

// Events
document.getElementById('addHourEventBtn').addEventListener('click', () => {
    const text = document.getElementById('newHourEventText').value.trim();
    if (!text) return;
    if (!appData.timeEvents[currentEditDate]) appData.timeEvents[currentEditDate] = {};
    if (!appData.timeEvents[currentEditDate][currentEditHour]) appData.timeEvents[currentEditDate][currentEditHour] = [];
    
    appData.timeEvents[currentEditDate][currentEditHour].push(text);
    saveData();
    document.getElementById('newHourEventText').value = '';
    refreshHourModal();
});
document.getElementById('newHourEventText').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('addHourEventBtn').click();
});

// Photo selection
document.getElementById('hourPhotoInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        if (!appData.hourImages[currentEditDate]) appData.hourImages[currentEditDate] = {};
        appData.hourImages[currentEditDate][currentEditHour] = ev.target.result;
        saveData();
        refreshHourModal();
    };
    reader.readAsDataURL(file);
});

document.getElementById('setHourUrlBtn').addEventListener('click', () => {
    const urlInput = document.getElementById('hourPhotoUrl');
    const urlText = urlInput.value.trim();
    
    if (!urlText) {
        if (appData.hourImages[currentEditDate]) {
            delete appData.hourImages[currentEditDate][currentEditHour];
        }
    } else {
        if (!appData.hourImages[currentEditDate]) appData.hourImages[currentEditDate] = {};
        appData.hourImages[currentEditDate][currentEditHour] = urlText;
    }
    
    saveData();
    refreshHourModal();
});

document.getElementById('removeHourPhotoBtn').addEventListener('click', () => {
    if (appData.hourImages[currentEditDate] && appData.hourImages[currentEditDate][currentEditHour]) {
        delete appData.hourImages[currentEditDate][currentEditHour];
        saveData();
        refreshHourModal();
    }
});

