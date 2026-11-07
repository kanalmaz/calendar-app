// ═══════════════════════════════════════════════════════════════
//  DIARY POPUP — Notion-style writing area
// ═══════════════════════════════════════════════════════════════

if (!appData.diaryAllPages)      appData.diaryAllPages = {};
if (!appData.diaryGlobalPageIds) appData.diaryGlobalPageIds = [];

// ── State ──────────────────────────────────────────────────────
let diaryActivePageId = null;   // which root-level page tab is active
let diaryNavStack     = [];     // sub-page navigation [{ id, title }]
let diarySaveTimer    = null;

// ── Element refs ───────────────────────────────────────────────
const diaryOverlay     = document.getElementById('diaryOverlay');
const diaryPageTabs    = document.getElementById('diaryPageTabs');
const diaryBackBtn     = document.getElementById('diaryBackBtn');
const diaryBreadcrumb  = document.getElementById('diaryBreadcrumb');
const diaryPageTitleEl = document.getElementById('diaryPageTitleEl');
const diaryEditor      = document.getElementById('diaryEditor');

// ── Helpers ────────────────────────────────────────────────────
function diaryDayPageId(dateStr) { return 'day:' + dateStr; }
function diaryNewPageId()        { return 'page:' + Date.now(); }

function diaryShortDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDate() + ' ' + d.toLocaleDateString('default', { month: 'long' });
}

function diaryEnsurePage(id, title) {
    if (!appData.diaryAllPages[id]) {
        appData.diaryAllPages[id] = { title, content: '' };
        saveData();
    }
    return appData.diaryAllPages[id];
}

// ── Open / Close ───────────────────────────────────────────────
function openDiaryPopup() {
    diaryNavStack = [];
    const dayId = diaryDayPageId(currentDayStr);
    diaryEnsurePage(dayId, diaryShortDate(currentDayStr));
    diaryActivePageId = dayId;
    diaryOverlay.classList.add('active');
    diaryRenderTabs();
    diaryLoadPage(dayId, false);
    diaryShowRootUI();
}

function closeDiaryPopup() {
    diarySaveCurrent();
    diaryOverlay.classList.remove('active');
}

// ── Render page tab buttons ────────────────────────────────────
function diaryRenderTabs() {
    diaryPageTabs.innerHTML = '';

    // Day tab
    const dayId = diaryDayPageId(currentDayStr);
    diaryPageTabs.appendChild(diaryMakeTab(dayId, diaryShortDate(currentDayStr), false));

    // Global page tabs
    (appData.diaryGlobalPageIds || []).forEach(pageId => {
        const page = appData.diaryAllPages[pageId];
        if (!page) return;
        diaryPageTabs.appendChild(diaryMakeTab(pageId, page.title || 'Untitled', true));
    });

    // + Add Page button
    const addBtn = document.createElement('button');
    addBtn.className   = 'diary-add-page-tab-btn';
    addBtn.textContent = '+ Add Page';
    addBtn.addEventListener('click', diaryAddGlobalPage);
    diaryPageTabs.appendChild(addBtn);
}

function diaryMakeTab(pageId, label, isGlobal) {
    const tabWrap = document.createElement('div');
    tabWrap.className = 'diary-page-tab-wrap';

    const btn = document.createElement('button');
    btn.className      = 'diary-page-tab' + (pageId === diaryActivePageId ? ' active' : '');
    btn.dataset.pageId = pageId;
    btn.textContent    = label;
    btn.addEventListener('click', () => {
        if (diaryActivePageId === pageId && diaryNavStack.length === 0) return;
        diarySaveCurrent();
        diaryNavStack     = [];
        diaryActivePageId = pageId;
        diaryRenderTabs();
        diaryLoadPage(pageId, pageId !== diaryDayPageId(currentDayStr));
        diaryShowRootUI();
    });

    tabWrap.appendChild(btn);

    if (isGlobal) {
        const delBtn = document.createElement('button');
        delBtn.className = 'diary-page-tab-del';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${label}"?`)) {
                appData.diaryGlobalPageIds = appData.diaryGlobalPageIds.filter(id => id !== pageId);
                delete appData.diaryAllPages[pageId];
                saveData();
                if (diaryActivePageId === pageId) {
                    diaryActivePageId = diaryDayPageId(currentDayStr);
                    diaryNavStack = [];
                    diaryLoadPage(diaryActivePageId, false);
                }
                diaryRenderTabs();
            }
        });
        tabWrap.appendChild(delBtn);
    }

    return tabWrap;
}

// ── Add global page (no prompt — create directly, focus title) ─
function diaryAddGlobalPage() {
    diarySaveCurrent();
    const newId = diaryNewPageId();
    appData.diaryAllPages[newId]    = { title: 'New Page', content: '' };
    appData.diaryGlobalPageIds.push(newId);
    saveData();

    diaryNavStack     = [];
    diaryActivePageId = newId;
    diaryRenderTabs();
    diaryLoadPage(newId, true);
    diaryShowRootUI();

    // Select the title text so user can immediately rename
    setTimeout(() => {
        diaryPageTitleEl.focus();
        const range = document.createRange();
        range.selectNodeContents(diaryPageTitleEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }, 80);
}

// ── Root UI (tabs visible) ─────────────────────────────────────
function diaryShowRootUI() {
    diaryPageTabs.style.display = 'flex';
    diaryBackBtn.classList.remove('visible');
    diaryBreadcrumb.classList.remove('visible');
}

// ── Sub-page UI (back + breadcrumb) ───────────────────────────
function diaryShowSubpageUI() {
    diaryPageTabs.style.display = 'none';
    diaryBackBtn.classList.add('visible');
    diaryBreadcrumb.classList.add('visible');
}

// ── Navigate into a sub-page ──────────────────────────────────
function diaryNavigateTo(pageId, pageTitle) {
    diarySaveCurrent();
    if (diaryNavStack.length === 0) {
        const rootPage  = appData.diaryAllPages[diaryActivePageId];
        const rootTitle = rootPage ? (rootPage.title || '') : '';
        diaryNavStack.push({ id: diaryActivePageId, title: rootTitle });
    }
    diaryNavStack.push({ id: pageId, title: pageTitle });
    diaryEnsurePage(pageId, pageTitle);
    diaryShowSubpageUI();
    diaryUpdateBreadcrumb();
    diaryLoadPage(pageId, true);
}

// ── Go back ───────────────────────────────────────────────────
function diaryGoBack() {
    diarySaveCurrent();
    diaryNavStack.pop();
    if (diaryNavStack.length === 0) {
        diaryRenderTabs();
        diaryLoadPage(diaryActivePageId, diaryActivePageId !== diaryDayPageId(currentDayStr));
        diaryShowRootUI();
        return;
    }
    const prev = diaryNavStack[diaryNavStack.length - 1];
    diaryUpdateBreadcrumb();
    diaryLoadPage(prev.id, true);
}

// ── Breadcrumb ─────────────────────────────────────────────────
function diaryUpdateBreadcrumb() {
    diaryBreadcrumb.innerHTML = '';
    diaryNavStack.forEach((item, i) => {
        const crumb = document.createElement('span');
        crumb.className   = 'diary-crumb' + (i === diaryNavStack.length - 1 ? ' current' : '');
        crumb.textContent = item.title;
        if (i < diaryNavStack.length - 1) {
            crumb.addEventListener('click', () => {
                diarySaveCurrent();
                diaryNavStack = diaryNavStack.slice(0, i + 1);
                if (diaryNavStack.length === 1) {
                    diaryNavStack = [];
                    diaryRenderTabs();
                    diaryLoadPage(diaryActivePageId, diaryActivePageId !== diaryDayPageId(currentDayStr));
                    diaryShowRootUI();
                    return;
                }
                diaryUpdateBreadcrumb();
                const target = diaryNavStack[diaryNavStack.length - 1];
                diaryLoadPage(target.id, true);
            });
        }
        diaryBreadcrumb.appendChild(crumb);
        if (i < diaryNavStack.length - 1) {
            const sep = document.createElement('span');
            sep.className   = 'diary-crumb-sep';
            sep.textContent = '›';
            diaryBreadcrumb.appendChild(sep);
        }
    });
}

// ── Load page into editor ─────────────────────────────────────
function diaryLoadPage(pageId, titleEditable) {
    const page = appData.diaryAllPages[pageId] || { title: '', content: '' };
    diaryPageTitleEl.textContent     = page.title || '';
    diaryPageTitleEl.contentEditable = titleEditable ? 'true' : 'false';
    diaryPageTitleEl.dataset.placeholder = 'Untitled';
    diaryEditor.innerHTML = page.content || '';

    // Inject delete cross into any existing blocks that miss it
    diaryEditor.querySelectorAll('.diary-page-block').forEach(block => {
        if (!block.querySelector('.diary-block-del')) {
            const title = block.dataset.pageTitle || 'Untitled';
            block.innerHTML = `<span class="diary-block-icon">📄</span><span class="diary-block-title">${title}</span><button class="diary-block-del" contenteditable="false">×</button>`;
        }
    });

    setTimeout(() => diaryEditor.focus(), 50);
}

// ── Save current page ─────────────────────────────────────────
function diarySaveCurrent() {
    clearTimeout(diarySaveTimer);
    const pageId = diaryNavStack.length > 0
        ? diaryNavStack[diaryNavStack.length - 1].id
        : diaryActivePageId;
    if (!pageId || !appData.diaryAllPages[pageId]) return;

    appData.diaryAllPages[pageId].content = diaryEditor.innerHTML;
    if (diaryPageTitleEl.contentEditable === 'true') {
        const newTitle = diaryPageTitleEl.textContent.trim() || 'Untitled';
        appData.diaryAllPages[pageId].title = newTitle;
        if (diaryNavStack.length > 0) {
            diaryNavStack[diaryNavStack.length - 1].title = newTitle;
        }
    }
    saveData();
}

// Auto-save on editor input
diaryEditor.addEventListener('input', () => {
    clearTimeout(diarySaveTimer);
    diarySaveTimer = setTimeout(diarySaveCurrent, 600);
});

// Live title → tab label update
diaryPageTitleEl.addEventListener('input', () => {
    if (diaryNavStack.length === 0 && diaryActivePageId) {
        const newTitle = diaryPageTitleEl.textContent.trim() || 'Untitled';
        const tabBtn   = diaryPageTabs.querySelector(`[data-page-id="${diaryActivePageId}"]`);
        if (tabBtn) tabBtn.textContent = newTitle;
        if (appData.diaryAllPages[diaryActivePageId]) {
            appData.diaryAllPages[diaryActivePageId].title = newTitle;
        }
    }
    clearTimeout(diarySaveTimer);
    diarySaveTimer = setTimeout(diarySaveCurrent, 600);
});

// ── Page block click delegation ───────────────────────────────
diaryEditor.addEventListener('click', e => {
    const delBtn = e.target.closest('.diary-block-del');
    if (delBtn) {
        e.preventDefault(); e.stopPropagation();
        const block = delBtn.closest('.diary-page-block');
        if (block) {
            const id = block.dataset.pageId, title = block.dataset.pageTitle;
            if (confirm(`Delete sub-page "${title}"?`)) {
                delete appData.diaryAllPages[id];
                block.remove();
                diarySaveCurrent();
            }
        }
        return;
    }

    const block = e.target.closest('.diary-page-block');
    if (block) {
        e.preventDefault(); e.stopPropagation();
        const id = block.dataset.pageId, title = block.dataset.pageTitle;
        if (id) diaryNavigateTo(id, title);
    }
});

// ── Add Sub-page inline prompt ────────────────────────────────
document.getElementById('diaryAddSubPageBtn').addEventListener('click', () => {
    const promptEl = document.createElement('div');
    promptEl.className        = 'diary-subpage-prompt';
    promptEl.contentEditable  = 'false';

    const inp = document.createElement('input');
    inp.type        = 'text';
    inp.placeholder = 'Page title...';

    const okBtn = document.createElement('button');
    okBtn.className   = 'diary-subpage-prompt-ok';
    okBtn.textContent = 'Create';

    const cancelBtn = document.createElement('button');
    cancelBtn.className   = 'diary-subpage-prompt-cancel';
    cancelBtn.textContent = 'Cancel';

    promptEl.appendChild(inp);
    promptEl.appendChild(okBtn);
    promptEl.appendChild(cancelBtn);
    diaryEditor.appendChild(promptEl);
    inp.focus();

    const confirmCreate = () => {
        const title = inp.value.trim();
        if (!title) { promptEl.remove(); return; }
        const newId = diaryNewPageId();
        appData.diaryAllPages[newId] = { title, content: '' };
        saveData();
        const block = document.createElement('div');
        block.className         = 'diary-page-block';
        block.contentEditable   = 'false';
        block.dataset.pageId    = newId;
        block.dataset.pageTitle = title;
        block.innerHTML         = `<span class="diary-block-icon">📄</span><span class="diary-block-title">${title}</span><button class="diary-block-del" contenteditable="false">×</button>`;
        promptEl.replaceWith(block);
        diarySaveCurrent();
    };

    okBtn.addEventListener('click', confirmCreate);
    inp.addEventListener('keydown', e => {
        if (e.key === 'Enter')  confirmCreate();
        if (e.key === 'Escape') promptEl.remove();
    });
    cancelBtn.addEventListener('click', () => promptEl.remove());
});

// ── Image paste ───────────────────────────────────────────────
diaryEditor.addEventListener('paste', e => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = ev => {
                document.execCommand('insertHTML', false,
                    `<img src="${ev.target.result}" style="max-width:100%;border-radius:6px;margin:6px 0;display:block;">`
                );
                diarySaveCurrent();
            };
            reader.readAsDataURL(items[i].getAsFile());
            return;
        }
    }
});

// ── Formatting toolbar ────────────────────────────────────────
document.querySelectorAll('.diary-fmt-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('mousedown', e => {
        e.preventDefault();
        document.execCommand(btn.dataset.cmd, false, null);
    });
});

// ── Back / Close / Overlay ────────────────────────────────────
diaryBackBtn.addEventListener('click', diaryGoBack);
diaryOverlay.addEventListener('click', e => { if (e.target === diaryOverlay) closeDiaryPopup(); });

// ── Diary button ──────────────────────────────────────────────
const diaryBtn = document.getElementById('diaryBtn');
if (diaryBtn) diaryBtn.addEventListener('click', openDiaryPopup);

// ═══════════════════════════════════════════════════════════════
//  GRID SIZING  (keeps day squares perfectly square)
// ═══════════════════════════════════════════════════════════════
function resizeCalendar() {
    const grid    = document.getElementById('calendarGrid');
    const gridTop = grid.getBoundingClientRect().top;
    const availableH = window.innerHeight - gridTop;
    const cellSize = Math.ceil(availableH / 5);
    const gridW    = cellSize * 7;
    grid.style.gridTemplateColumns = `repeat(7, ${cellSize}px)`;
    grid.style.gridTemplateRows    = `repeat(5, ${cellSize}px)`;
    grid.style.width               = `${gridW}px`;
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
renderCalendar();

window.addEventListener('load', resizeCalendar);
window.addEventListener('resize', resizeCalendar);


// ═══════════════════════════════════════════════════════════════
//  DIARY RESIZE — remember size across sessions
// ═══════════════════════════════════════════════════════════════
(function() {
    const panel = document.querySelector('.diary-panel');
    if (!panel) return;

    // Apply saved size when popup opens
    const _origOpen = openDiaryPopup;
    window.openDiaryPopup = function() {
        _origOpen();
        if (appData.diarySize) {
            panel.style.width  = appData.diarySize.width;
            panel.style.height = appData.diarySize.height;
        }
    };

    // Save size whenever user stops dragging the resize handle
    let resizeDebounce = null;
    const ro = new ResizeObserver(() => {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(() => {
            const w = panel.style.width  || panel.offsetWidth  + 'px';
            const h = panel.style.height || panel.offsetHeight + 'px';
            appData.diarySize = { width: w, height: h };
            saveData();
        }, 300);
    });
    ro.observe(panel);
})();


