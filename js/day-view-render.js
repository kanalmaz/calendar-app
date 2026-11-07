//  DAY VIEW — render grid
// ═══════════════════════════════════════════════════════════════
function renderDayView() {
    const d = new Date(currentDayStr + 'T12:00:00');

    document.getElementById('dayViewWeekday').textContent =
        d.toLocaleDateString('default', { weekday: 'long' });
    document.getElementById('dayViewNum').textContent = d.getDate();
    document.getElementById('dayViewMonthYear').textContent =
        d.toLocaleDateString('default', { month: 'long', year: 'numeric' });

    const grid = document.getElementById('hourGrid');
    grid.innerHTML = '';

    const currentImage = appData.images[currentDayStr];
    const dayPhotoUrlInput = document.getElementById('dayPhotoUrl');
    if (dayPhotoUrlInput) {
        dayPhotoUrlInput.value = (currentImage && currentImage.startsWith('http')) ? currentImage : '';
    }

    if (!appData.hourImages[currentDayStr]) appData.hourImages[currentDayStr] = {};
    if (!appData.timeEvents[currentDayStr]) appData.timeEvents[currentDayStr] = {};

    for (let h = 8; h <= 23; h++) {
        const hhKey = String(h).padStart(2, '0') + ':00'; // "08:00"
        const labelText = h + ':00'; // "8:00"

        const block = document.createElement('div');
        block.className = 'hour-block';
        
        // Background image
        const img = appData.hourImages[currentDayStr][hhKey];
        if (img) block.style.backgroundImage = `url(${img})`;

        // Click opens edit modal
        block.addEventListener('click', () => openHourModal(currentDayStr, hhKey, labelText));

        // ── Drag & Drop: accept tasks from the To-Do list ──
        block.addEventListener('dragover', e => {
            if (e.dataTransfer.types.includes('text/plain')) {
                e.preventDefault();
                block.classList.add('hour-block-drag-over');
            }
        });
        block.addEventListener('dragleave', () => {
            block.classList.remove('hour-block-drag-over');
        });
        block.addEventListener('drop', e => {
            e.preventDefault();
            e.stopPropagation();
            block.classList.remove('hour-block-drag-over');
            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));

                if (data.source === 'todos') {
                    // From the general To-Do list → add as a new hour task
                    const todo = appData.todos.splice(data.idx, 1)[0];
                    if (!todo) return;
                    if (!appData.hourTasks[currentDayStr]) appData.hourTasks[currentDayStr] = {};
                    if (!appData.hourTasks[currentDayStr][hhKey]) appData.hourTasks[currentDayStr][hhKey] = [];
                    appData.hourTasks[currentDayStr][hhKey].push({ id: todo.id || Date.now(), text: todo.text, done: false });
                    saveData();
                    renderDayView();

                } else if (data.source === 'dayTodos') {
                    // From the "Things to Do Today" list → add as a new hour task
                    const srcDay = data.dayStr;
                    if (!appData.dayTodos || !appData.dayTodos[srcDay]) return;
                    const todo = appData.dayTodos[srcDay].splice(data.idx, 1)[0];
                    if (!todo) return;
                    if (!appData.hourTasks[currentDayStr]) appData.hourTasks[currentDayStr] = {};
                    if (!appData.hourTasks[currentDayStr][hhKey]) appData.hourTasks[currentDayStr][hhKey] = [];
                    appData.hourTasks[currentDayStr][hhKey].push({ id: todo.id || Date.now(), text: todo.text, done: false });
                    saveData();
                    renderDayView();

                } else if (data.source === 'hourTasks') {
                    // From another (or same) hour block → move the task
                    const srcDay  = data.date;
                    const srcHour = data.hour;
                    const srcIdx  = data.idx;
                    if (!appData.hourTasks[srcDay] || !appData.hourTasks[srcDay][srcHour]) return;
                    const [moved] = appData.hourTasks[srcDay][srcHour].splice(srcIdx, 1);
                    if (!moved) return;
                    if (!appData.hourTasks[currentDayStr]) appData.hourTasks[currentDayStr] = {};
                    if (!appData.hourTasks[currentDayStr][hhKey]) appData.hourTasks[currentDayStr][hhKey] = [];
                    appData.hourTasks[currentDayStr][hhKey].push(moved);
                    saveData();
                    renderDayView();
                }
            } catch(err) {}
        });

        // ── Unified visible list: events on top, then dropped tasks ──
        const eventsArray  = appData.timeEvents[currentDayStr][hhKey] || [];
        const hourTasksArr = (appData.hourTasks[currentDayStr] || {})[hhKey] || [];

        if (eventsArray.length > 0 || hourTasksArr.length > 0) {
            const unified = document.createElement('div');
            unified.className = 'hour-task-list';

            // — Events (always visible, no checkbox) —
            eventsArray.forEach((txt, eIdx) => {
                const item = document.createElement('div');
                item.className = 'hour-task-item hour-event-item';

                const label = document.createElement('span');
                label.className = 'hour-task-text';
                label.textContent = txt;

                const del = document.createElement('button');
                del.className = 'hour-task-del';
                del.textContent = '×';
                del.addEventListener('click', e => {
                    e.stopPropagation();
                    appData.timeEvents[currentDayStr][hhKey].splice(eIdx, 1);
                    saveData();
                    renderDayView();
                });

                item.appendChild(label);
                item.appendChild(del);
                unified.appendChild(item);
            });

            // — Dropped tasks (draggable, checkable) —
            hourTasksArr.forEach((task, tIdx) => {
                const taskItem = document.createElement('div');
                taskItem.className = 'hour-task-item' + (task.done ? ' done' : '');
                taskItem.draggable = true;
                taskItem.addEventListener('dragstart', e => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        source: 'hourTasks',
                        date:   currentDayStr,
                        hour:   hhKey,
                        idx:    tIdx
                    }));
                });

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = task.done;
                cb.className = 'hour-task-cb';
                cb.addEventListener('click', e => e.stopPropagation());
                cb.addEventListener('change', e => {
                    e.stopPropagation();
                    appData.hourTasks[currentDayStr][hhKey][tIdx].done = cb.checked;
                    saveData();
                    renderDayView();
                });

                const txt = document.createElement('span');
                txt.className = 'hour-task-text';
                txt.textContent = task.text;

                const del = document.createElement('button');
                del.className = 'hour-task-del';
                del.textContent = '×';
                del.addEventListener('click', e => {
                    e.stopPropagation();
                    appData.hourTasks[currentDayStr][hhKey].splice(tIdx, 1);
                    saveData();
                    renderDayView();
                });

                taskItem.appendChild(cb);
                taskItem.appendChild(txt);
                taskItem.appendChild(del);
                unified.appendChild(taskItem);
            });

            block.appendChild(unified);
        }


        // Bottom left label duals as label and indicates trigger zone
        const label = document.createElement('div');
        label.className = 'hour-label';
        label.textContent = labelText;
        block.appendChild(label);

        // Invisible trigger spanning the bottom-left corner
        const trigger = document.createElement('div');
        trigger.className = 'popup-trigger';
        attachTrigger(trigger,
            currentDayStr + " / " + labelText, 
            () => appData.hourImages[currentDayStr]?.[hhKey],
            () => appData.timeEvents[currentDayStr]?.[hhKey] || []
        );
        block.appendChild(trigger);

        grid.appendChild(block);
    }

    renderTodos();
    renderShoppingList();
}

