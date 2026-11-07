if (!appData.food) appData.food = {};

const foodOverlay   = document.getElementById('foodOverlay');
const foodImgModal  = document.getElementById('foodImgModal');
const foodImgFileEl = document.getElementById('foodImgFileInput');
const foodImgUrlEl  = document.getElementById('foodImgUrlInput');
const foodImgUrlBtn = document.getElementById('foodImgUrlBtn');
const foodImgCancel = document.getElementById('foodImgModalCancel');

let foodCurrentMeal = null;  // 'breakfast' | 'lunch' | 'dinner'

// ── Helpers ──────────────────────────────────────────────────
function foodEnsureDay(dateStr) {
    if (!appData.food[dateStr]) {
        appData.food[dateStr] = { breakfast: [], lunch: [], dinner: [] };
    }
    return appData.food[dateStr];
}

// ── Open / Close ─────────────────────────────────────────────
function openFoodPopup() {
    foodEnsureDay(currentDayStr);
    foodRenderAll();
    foodRenderWeeklyChecklist();
    foodOverlay.classList.add('active');
}

function closeFoodPopup() {
    foodOverlay.classList.remove('active');
}

// ── Render ────────────────────────────────────────────────────
function foodRenderAll() {
    ['breakfast', 'lunch', 'dinner'].forEach(meal => foodRenderMeal(meal));
}

function foodRenderMeal(meal) {
    const grid = document.getElementById('foodGrid-' + meal);
    if (!grid) return;
    grid.innerHTML = '';
    const dayData = foodEnsureDay(currentDayStr);
    const images = dayData[meal] || [];

    images.forEach((src, idx) => {
        const item = document.createElement('div');
        item.className = 'food-img-item';

        const img = document.createElement('img');
        img.src = src;
        img.alt = meal;

        const del = document.createElement('button');
        del.className   = 'food-img-del';
        del.textContent = '×';
        del.addEventListener('click', () => {
            dayData[meal].splice(idx, 1);
            saveData();
            foodRenderMeal(meal);
        });

        item.appendChild(img);
        item.appendChild(del);
        grid.appendChild(item);
    });

    // Hide "+ Add Image" button once 2 images are added
    const addBtn = document.querySelector(`.food-add-img-btn[data-meal="${meal}"]`);
    if (addBtn) {
        addBtn.style.display = images.length >= 2 ? 'none' : '';
    }
}

// ── Add image buttons ─────────────────────────────────────────
document.querySelectorAll('.food-add-img-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        foodCurrentMeal = btn.dataset.meal;
        foodImgUrlEl.value = '';
        foodImgModal.classList.add('active');
    });
});

// ── Image modal ── file upload ────────────────────────────────
foodImgFileEl.addEventListener('change', () => {
    const file = foodImgFileEl.files[0];
    if (!file || !foodCurrentMeal) return;
    const reader = new FileReader();
    reader.onload = ev => {
        foodSaveImage(ev.target.result);
    };
    reader.readAsDataURL(file);
    foodImgFileEl.value = '';
});

// ── Image modal ── URL ────────────────────────────────────────
foodImgUrlBtn.addEventListener('click', () => {
    const url = foodImgUrlEl.value.trim();
    if (!url || !foodCurrentMeal) return;
    foodSaveImage(url);
});

foodImgUrlEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const url = foodImgUrlEl.value.trim();
        if (url && foodCurrentMeal) foodSaveImage(url);
    }
});

function foodSaveImage(src) {
    const dayData = foodEnsureDay(currentDayStr);
    if ((dayData[foodCurrentMeal] || []).length >= 2) {
        foodImgModal.classList.remove('active');
        foodCurrentMeal = null;
        return;
    }
    dayData[foodCurrentMeal].push(src);
    saveData();
    foodRenderMeal(foodCurrentMeal);
    foodImgModal.classList.remove('active');
    foodCurrentMeal = null;
}

// ── Cancel / close modal ──────────────────────────────────────
foodImgCancel.addEventListener('click', () => {
    foodImgModal.classList.remove('active');
    foodCurrentMeal = null;
});
foodImgModal.addEventListener('click', e => {
    if (e.target === foodImgModal) {
        foodImgModal.classList.remove('active');
        foodCurrentMeal = null;
    }
});

// ── Close food popup on overlay click ────────────────────────
foodOverlay.addEventListener('click', e => {
    if (e.target === foodOverlay) closeFoodPopup();
});


// ── Hook up 🍔 food button ────────────────────────────────────
const foodBtn = document.querySelector('.sliding-menu-btn[title="Food"]');
if (foodBtn) foodBtn.addEventListener('click', openFoodPopup);

// ── Weekly Checklist ──────────────────────────────────────────

function getWeekStartStr(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const start = new Date(d.setDate(diff));
    return start.getFullYear() + "-" + 
           String(start.getMonth() + 1).padStart(2, '0') + "-" + 
           String(start.getDate()).padStart(2, '0');
}

function foodRenderWeeklyChecklist() {
    const container = document.getElementById('foodChecklistContainer');
    const headerDate = document.getElementById('foodWeeklyHeader');
    if (!container) return;

    const weekStr = getWeekStartStr(currentDayStr);
    if (!weekStr) return;

    headerDate.textContent = `Week of ${weekStr}`;

    if (!appData.foodChecklistState[weekStr]) {
        appData.foodChecklistState[weekStr] = {};
    }
    const state = appData.foodChecklistState[weekStr];
    const config = appData.foodChecklistConfig || [];

    container.innerHTML = '';

    if (config.length === 0) {
        container.innerHTML = `<div style="color:#aaa; font-size: 13px; font-style: italic;">No items tracking this week.</div>`;
        return;
    }

    config.forEach(item => {
        const checkedCount = state[item.id] || 0;

        const el = document.createElement('div');
        el.className = 'fc-item';
        
        const leftSide = document.createElement('div');
        leftSide.className = 'fc-item-left';

        const delBtn = document.createElement('button');
        delBtn.className = 'fc-item-delete';
        delBtn.innerHTML = '&#10005;'; // X
        delBtn.title = 'Remove item';
        delBtn.onclick = () => {
            appData.foodChecklistConfig = appData.foodChecklistConfig.filter(c => c.id !== item.id);
            saveData();
            foodRenderWeeklyChecklist();
        };

        const name = document.createElement('span');
        name.className = 'fc-item-name';
        name.textContent = item.name;

        leftSide.appendChild(delBtn);
        leftSide.appendChild(name);
        el.appendChild(leftSide);

        const boxes = document.createElement('div');
        boxes.className = 'fc-boxes';

        for (let i = 0; i < item.target; i++) {
            const box = document.createElement('div');
            box.className = 'fc-box';
            if (i < checkedCount) box.classList.add('checked');
            
            box.onclick = () => {
                let current = appData.foodChecklistState[weekStr][item.id] || 0;
                if (box.classList.contains('checked')) {
                    appData.foodChecklistState[weekStr][item.id] = Math.max(0, current - 1);
                } else {
                    appData.foodChecklistState[weekStr][item.id] = Math.min(item.target, current + 1);
                }
                saveData();
                foodRenderWeeklyChecklist();
            };
            boxes.appendChild(box);
        }

        el.appendChild(boxes);
        container.appendChild(el);
    });
}

// Add Item via Enter key
function fcAddItem() {
    const nameInput = document.getElementById('fcNewName');
    const targetInput = document.getElementById('fcNewTarget');
    if (!nameInput || !targetInput) return;

    const name = nameInput.value.trim();
    const target = parseInt(targetInput.value, 10);

    if (!name || isNaN(target) || target < 1) return;

    if (!appData.foodChecklistConfig) appData.foodChecklistConfig = [];
    
    appData.foodChecklistConfig.push({
        id: Date.now().toString(),
        name: name,
        target: target
    });
    saveData();
    
    nameInput.value = '';
    targetInput.value = '1';
    foodRenderWeeklyChecklist();
    nameInput.focus(); // Keep focus for rapid entry
}

document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active && (active.id === 'fcNewName' || active.id === 'fcNewTarget')) {
            fcAddItem();
            e.preventDefault();
        }
        if (active && (active.id === 'ecNewName' || active.id === 'ecNewTarget')) {
            ecAddItem();
            e.preventDefault();
        }
        if (active && active.id === 'ecTitle') {
            active.blur();
            e.preventDefault();
        }
    }
});

const ecTitleEl = document.getElementById('ecTitle');
if (ecTitleEl) {
    ecTitleEl.addEventListener('blur', () => {
        appData.extraChecklistTitle = ecTitleEl.textContent.trim() || 'Extra Checklist';
        saveData();
    });
}

// ── Book Navigation ───────────────────────────────────────────
const foodFlipper = document.getElementById('foodFlipper');
const foodPrevBtn = document.getElementById('foodPrevBtn');
const foodNextBtn = document.getElementById('foodNextBtn');

if (foodPrevBtn && foodNextBtn && foodFlipper) {
    foodPrevBtn.addEventListener('click', () => {
        foodFlipper.classList.remove('flipped');
        foodPrevBtn.style.display = 'none';
        foodNextBtn.style.display = 'flex';
    });
    foodNextBtn.addEventListener('click', () => {
        foodFlipper.classList.add('flipped');
        foodNextBtn.style.display = 'none';
        foodPrevBtn.style.display = 'flex';
        ecRenderChecklist(); // Render when flipped
    });
}

// Ensure the popup resets to page 1 when opened
const originalOpenFoodPopup = openFoodPopup;
window.openFoodPopup = function() {
    if (foodFlipper) foodFlipper.classList.remove('flipped');
    if (foodPrevBtn) foodPrevBtn.style.display = 'none';
    if (foodNextBtn) foodNextBtn.style.display = 'flex';
    if (ecTitleEl && appData.extraChecklistTitle) {
        ecTitleEl.textContent = appData.extraChecklistTitle;
    }
    ecRenderChecklist();
    originalOpenFoodPopup();
};

// Override the local function if it was called directly by the button listener
const internalFoodBtn = document.querySelector('.sliding-menu-btn[title="Food"]');
if (internalFoodBtn) {
    internalFoodBtn.removeEventListener('click', originalOpenFoodPopup);
    internalFoodBtn.addEventListener('click', window.openFoodPopup);
}

// ── Extra Checklist ───────────────────────────────────────────

function ecRenderChecklist() {
    const container = document.getElementById('extraChecklistContainer');
    if (!container) return;

    const weekStr = getWeekStartStr(currentDayStr);
    if (!weekStr) return;

    if (!appData.extraChecklistState) appData.extraChecklistState = {};
    if (!appData.extraChecklistState[weekStr]) appData.extraChecklistState[weekStr] = {};

    if (!appData.extraChecklistConfig) appData.extraChecklistConfig = [];

    const config = appData.extraChecklistConfig;
    const state = appData.extraChecklistState[weekStr];

    container.innerHTML = '';

    if (config.length === 0) {
        container.innerHTML = `<div style="color:#aaa; font-size: 13px; font-style: italic;">No items added yet.</div>`;
        return;
    }

    config.forEach(item => {
        const checkedCount = state[item.id] || 0;

        const el = document.createElement('div');
        el.className = 'fc-item';
        
        const leftSide = document.createElement('div');
        leftSide.className = 'fc-item-left';

        const delBtn = document.createElement('button');
        delBtn.className = 'fc-item-delete';
        delBtn.innerHTML = '&#10005;'; // X
        delBtn.title = 'Remove item';
        delBtn.onclick = () => {
            appData.extraChecklistConfig = appData.extraChecklistConfig.filter(c => c.id !== item.id);
            saveData();
            ecRenderChecklist();
        };

        const name = document.createElement('span');
        name.className = 'fc-item-name';
        name.textContent = item.name;

        leftSide.appendChild(delBtn);
        leftSide.appendChild(name);
        el.appendChild(leftSide);

        const boxes = document.createElement('div');
        boxes.className = 'fc-boxes';

        for (let i = 0; i < (item.target || 1); i++) {
            const box = document.createElement('div');
            box.className = 'fc-box';
            if (i < checkedCount) box.classList.add('checked');
            
            box.onclick = () => {
                let current = appData.extraChecklistState[weekStr][item.id] || 0;
                if (box.classList.contains('checked')) {
                    appData.extraChecklistState[weekStr][item.id] = Math.max(0, current - 1);
                } else {
                    appData.extraChecklistState[weekStr][item.id] = Math.min(item.target || 1, current + 1);
                }
                saveData();
                ecRenderChecklist();
            };
            boxes.appendChild(box);
        }

        el.appendChild(boxes);
        container.appendChild(el);
    });
}

function ecAddItem() {
    const nameInput = document.getElementById('ecNewName');
    const targetInput = document.getElementById('ecNewTarget');
    if (!nameInput || !targetInput) return;

    const name = nameInput.value.trim();
    const target = parseInt(targetInput.value, 10);
    
    if (!name || isNaN(target) || target < 1) return;

    if (!appData.extraChecklistConfig) appData.extraChecklistConfig = [];
    
    appData.extraChecklistConfig.push({
        id: 'ec_' + Date.now().toString(),
        name: name,
        target: target
    });
    saveData();
    
    nameInput.value = '';
    targetInput.value = '1';
    ecRenderChecklist();
    nameInput.focus();
}

