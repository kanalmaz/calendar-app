//  HOVER POPUP (Global Viewer)
// ═══════════════════════════════════════════════════════════════
const hoverPopup = document.getElementById('hoverPopup');
const hoverImageDisplay = document.getElementById('hoverImageDisplay');
const hoverPopupTitle = document.getElementById('hoverPopupTitle');
const hoverEventList = document.getElementById('hoverEventList');
let popupPinned = false;

function openHoverPopup(title, imgData, eventsArray) {
    if (popupPinned) return; // Don't override if pinned

    // Stop propagation of clicks inside the popup so clicking it doesn't dismiss itself
    hoverPopup.onclick = e => e.stopPropagation();

    hoverPopupTitle.textContent = title;
    hoverImageDisplay.style.backgroundImage = imgData ? `url(${imgData})` : 'none';
    
    hoverEventList.innerHTML = '';
    if (eventsArray && eventsArray.length > 0) {
        eventsArray.forEach(evt => {
            const div = document.createElement('div');
            div.className = 'hover-event-item';
            div.textContent = evt;
            hoverEventList.appendChild(div);
        });
    } else {
        const div = document.createElement('div');
        div.className = 'hover-event-item';
        div.textContent = 'No events.';
        div.style.color = '#aaa';
        div.style.background = 'transparent';
        hoverEventList.appendChild(div);
    }
    
    // Position it center screen
    hoverPopup.style.left = '50%';
    hoverPopup.style.top = '50%';
    hoverPopup.style.transform = 'translate(-50%, -50%)';
    hoverPopup.classList.add('active');
}

function closeHoverPopup() {
    if (popupPinned) return;
    hoverPopup.classList.remove('active');
}

// Clicking anywhere clears the pin if it's pinned
document.addEventListener('click', () => {
    if (popupPinned) {
        popupPinned = false;
        closeHoverPopup();
    }
});

function attachTrigger(triggerEl, titleStr, getImg, getEvents) {
    triggerEl.addEventListener('mouseenter', () => {
        if (!popupPinned) {
            openHoverPopup(titleStr, getImg(), getEvents());
        }
    });
    
    triggerEl.addEventListener('mouseleave', () => {
        closeHoverPopup();
    });
    
    triggerEl.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent opening the block's own click handler (e.g. Day View or Hour Edit modal)
        
        if (popupPinned) {
            popupPinned = false;
            closeHoverPopup();
            return;
        }
        
        // Let's pin it
        openHoverPopup(titleStr, getImg(), getEvents());
        popupPinned = true;
    });
}

// ═══════════════════════════════════════════════════════════════
