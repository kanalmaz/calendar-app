// ═══════════════════════════════════════════════════════════════
//  DAY PHOTO (set/remove from day view sidebar)
// ═══════════════════════════════════════════════════════════════
document.getElementById('dayPhotoInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        appData.images[currentDayStr] = ev.target.result;
        saveData();
    };
    reader.readAsDataURL(file);
});

document.getElementById('setPhotoUrlBtn').addEventListener('click', () => {
    const urlInput = document.getElementById('dayPhotoUrl');
    const urlText = urlInput.value.trim();
    
    if (!urlText) {
        delete appData.images[currentDayStr];
    } else {
        appData.images[currentDayStr] = urlText;
    }
    
    saveData();
});

document.getElementById('removeDayPhotoBtn').addEventListener('click', () => {
    delete appData.images[currentDayStr];
    saveData();
    document.getElementById('dayPhotoInput').value = '';
    document.getElementById('dayPhotoUrl').value = '';
});

