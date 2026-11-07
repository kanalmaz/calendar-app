// ═══════════════════════════════════════════════════════════════
//  DRAG & DROP INITIALIZATION
// ═══════════════════════════════════════════════════════════════
// Hour-block → hour-block and hour-block → todoList drops.
function setupDragAndDrop() {
    // ── General To-Do list drop zone ────────────────────────────
    const todoList = document.getElementById('todoList');
    if (todoList) {
        todoList.addEventListener('dragover', e => {
            e.preventDefault();
            todoList.classList.add('todo-list-drag-over');
        });
        todoList.addEventListener('dragleave', () => {
            todoList.classList.remove('todo-list-drag-over');
        });
        todoList.addEventListener('drop', e => {
            e.preventDefault();
            todoList.classList.remove('todo-list-drag-over');
            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (data.source === 'hourTasks') {
                    // Hour block → To-Do
                    const srcDay  = data.date;
                    const srcHour = data.hour;
                    const srcIdx  = data.idx;
                    if (!appData.hourTasks[srcDay] || !appData.hourTasks[srcDay][srcHour]) return;
                    const [moved] = appData.hourTasks[srcDay][srcHour].splice(srcIdx, 1);
                    if (!moved) return;
                    if (!appData.todos) appData.todos = [];
                    appData.todos.push({ id: moved.id || Date.now(), text: moved.text, done: moved.done });
                    saveData();
                    renderDayView();
                } else if (data.source === 'dayTodos') {
                    // Things to Do Today → To-Do
                    const srcDay = data.dayStr;
                    if (!appData.dayTodos || !appData.dayTodos[srcDay]) return;
                    const [moved] = appData.dayTodos[srcDay].splice(data.idx, 1);
                    if (!moved) return;
                    if (!appData.todos) appData.todos = [];
                    appData.todos.push({ id: moved.id || Date.now(), text: moved.text, done: moved.done });
                    saveData();
                    renderTodos();
                }
            } catch(err) {}
        });
    }

    // ── Things to Do Today drop zone ────────────────────────────
    const dayTodoList = document.getElementById('dayTodoList');
    if (dayTodoList) {
        dayTodoList.addEventListener('dragover', e => {
            e.preventDefault();
            dayTodoList.classList.add('todo-list-drag-over');
        });
        dayTodoList.addEventListener('dragleave', () => {
            dayTodoList.classList.remove('todo-list-drag-over');
        });
        dayTodoList.addEventListener('drop', e => {
            e.preventDefault();
            dayTodoList.classList.remove('todo-list-drag-over');
            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (data.source === 'todos') {
                    // General To-Do → Things to Do Today
                    const [moved] = appData.todos.splice(data.idx, 1);
                    if (!moved) return;
                    if (!appData.dayTodos) appData.dayTodos = {};
                    if (!appData.dayTodos[currentDayStr]) appData.dayTodos[currentDayStr] = [];
                    appData.dayTodos[currentDayStr].push({ id: moved.id || Date.now(), text: moved.text, done: moved.done });
                    saveData();
                    renderTodos();
                } else if (data.source === 'hourTasks') {
                    // Hour block → Things to Do Today
                    const srcDay  = data.date;
                    const srcHour = data.hour;
                    const srcIdx  = data.idx;
                    if (!appData.hourTasks[srcDay] || !appData.hourTasks[srcDay][srcHour]) return;
                    const [moved] = appData.hourTasks[srcDay][srcHour].splice(srcIdx, 1);
                    if (!moved) return;
                    if (!appData.dayTodos) appData.dayTodos = {};
                    if (!appData.dayTodos[currentDayStr]) appData.dayTodos[currentDayStr] = [];
                    appData.dayTodos[currentDayStr].push({ id: moved.id || Date.now(), text: moved.text, done: moved.done });
                    saveData();
                    renderDayView();
                }
            } catch(err) {}
        });
    }
}
setupDragAndDrop();


