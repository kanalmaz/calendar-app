// ═══════════════════════════════════════════════════════════════
//  TODOS  (global, every day)
// ═══════════════════════════════════════════════════════════════
function renderTodos() {
    // 1. General To-Do List
    const list = document.getElementById('todoList');
    if (list) {
        list.innerHTML = '';
        const todos = appData.todos || [];

        todos.forEach((todo, idx) => {
            const item = document.createElement('div');
            item.className = 'todo-item' + (todo.done ? ' done' : '');
            item.draggable = true;
            item.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'todos', idx }));
            });

            const cb = document.createElement('input');
            cb.type      = 'checkbox';
            cb.checked   = todo.done;
            cb.className = 'todo-checkbox';
            cb.addEventListener('change', () => {
                appData.todos[idx].done = cb.checked;
                saveData();
                renderTodos();
            });

            const txt = document.createElement('span');
            txt.className   = 'todo-text';
            txt.textContent = todo.text;

            const del = document.createElement('button');
            del.className   = 'todo-delete';
            del.textContent = '×';
            del.addEventListener('click', () => {
                appData.todos.splice(idx, 1);
                saveData();
                renderTodos();
            });

            item.appendChild(cb);
            item.appendChild(txt);
            item.appendChild(del);
            list.appendChild(item);
        });
    }

    // Also refresh "Things to Do Today" for the current day
    renderDayTodos();
}

function addTodo() {
    const input = document.getElementById('newTodoInput');
    const text  = input.value.trim();
    if (!text) return;
    if (!appData.todos) appData.todos = [];
    appData.todos.push({ id: Date.now(), text, done: false });
    saveData();
    input.value = '';
    renderTodos();
}

document.getElementById('addTodoBtn').addEventListener('click', addTodo);
document.getElementById('newTodoInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTodo();
});

// ═══════════════════════════════════════════════════════════════
//  THINGS TO DO TODAY (day-specific tasks)
// ═══════════════════════════════════════════════════════════════
function renderDayTodos() {
    const list = document.getElementById('dayTodoList');
    if (!list) return;
    list.innerHTML = '';

    const dayStr = currentDayStr;
    if (!dayStr) return;

    const todos = (appData.dayTodos && appData.dayTodos[dayStr]) || [];

    todos.forEach((todo, idx) => {
        const item = document.createElement('div');
        item.className = 'todo-item' + (todo.done ? ' done' : '');
        item.draggable = true;
        item.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'dayTodos', idx, dayStr }));
        });

        const cb = document.createElement('input');
        cb.type      = 'checkbox';
        cb.checked   = todo.done;
        cb.className = 'todo-checkbox';
        cb.addEventListener('change', () => {
            appData.dayTodos[dayStr][idx].done = cb.checked;
            saveData();
            renderDayTodos();
        });

        const txt = document.createElement('span');
        txt.className   = 'todo-text';
        txt.textContent = todo.text;

        const del = document.createElement('button');
        del.className   = 'todo-delete';
        del.textContent = '×';
        del.addEventListener('click', () => {
            appData.dayTodos[dayStr].splice(idx, 1);
            saveData();
            renderDayTodos();
        });

        item.appendChild(cb);
        item.appendChild(txt);
        item.appendChild(del);
        list.appendChild(item);
    });
}

function addDayTodo() {
    const input = document.getElementById('newDayTodoInput');
    const text  = input.value.trim();
    if (!text || !currentDayStr) return;
    if (!appData.dayTodos) appData.dayTodos = {};
    if (!appData.dayTodos[currentDayStr]) appData.dayTodos[currentDayStr] = [];
    appData.dayTodos[currentDayStr].push({ id: Date.now(), text, done: false });
    saveData();
    input.value = '';
    renderDayTodos();
}

document.getElementById('addDayTodoBtn').addEventListener('click', addDayTodo);
document.getElementById('newDayTodoInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addDayTodo();
});

// ═══════════════════════════════════════════════════════════════
//  THINGS TO BUY (Shopping List, global)
// ═══════════════════════════════════════════════════════════════
let currentShoppingCategory = null;

function renderShoppingList() {
    const list = document.getElementById('shoppingList');
    const title = document.getElementById('shoppingTitle');
    const backBtn = document.getElementById('shoppingBackBtn');
    const input = document.getElementById('newShoppingInput');
    if (!list || !title || !backBtn || !input) return;
    
    list.innerHTML = '';
    
    // Normalize format from simple items to categories for backwards auth
    if (appData.shopping && appData.shopping.length > 0) {
        if (!appData.shopping[0].items && typeof appData.shopping[0].text === 'string') {
            const existingItems = appData.shopping;
            appData.shopping = [{
                id: Date.now(),
                text: 'General',
                done: false,
                items: existingItems
            }];
            saveData();
        }
    }

    const categories = appData.shopping || [];

    if (currentShoppingCategory === null) {
        title.textContent = 'Things to Buy';
        backBtn.style.display = 'none';
        input.placeholder = 'Add category...';

        categories.forEach((cat, idx) => {
            const div = document.createElement('div');
            div.className = 'todo-item' + (cat.done ? ' done' : '');
            div.style.cursor = 'pointer';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = cat.done;
            cb.className = 'todo-checkbox';
            cb.addEventListener('click', e => e.stopPropagation());
            cb.addEventListener('change', () => {
                appData.shopping[idx].done = cb.checked;
                saveData();
                renderShoppingList();
            });

            const txt = document.createElement('span');
            txt.className = 'todo-text';
            txt.textContent = cat.text;
            
            // Add arrow visual to indicate drilldown
            const arrow = document.createElement('span');
            arrow.textContent = '›';
            arrow.style.color = '#ccc';
            arrow.style.marginLeft = 'auto';
            arrow.style.marginRight = '8px';
            arrow.style.fontSize = '16px';
            arrow.style.lineHeight = '1';

            div.addEventListener('click', () => {
                currentShoppingCategory = cat.id;
                renderShoppingList();
            });

            const del = document.createElement('button');
            del.className = 'todo-delete';
            del.textContent = '×';
            del.addEventListener('click', e => {
                e.stopPropagation();
                appData.shopping.splice(idx, 1);
                saveData();
                renderShoppingList();
            });

            div.appendChild(cb);
            div.appendChild(txt);
            div.appendChild(arrow);
            div.appendChild(del);
            list.appendChild(div);
        });
    } else {
        const catObj = categories.find(c => c.id === currentShoppingCategory);
        if (!catObj) {
            currentShoppingCategory = null;
            renderShoppingList();
            return;
        }

        title.textContent = catObj.text;
        backBtn.style.display = 'block';
        input.placeholder = 'Add item...';

        const items = catObj.items || [];
        items.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'todo-item' + (item.done ? ' done' : '');

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = item.done;
            cb.className = 'todo-checkbox';
            cb.addEventListener('change', () => {
                item.done = cb.checked;
                saveData();
                renderShoppingList();
            });

            const txt = document.createElement('span');
            txt.className = 'todo-text';
            txt.textContent = item.text;

            const del = document.createElement('button');
            del.className = 'todo-delete';
            del.textContent = '×';
            del.addEventListener('click', () => {
                catObj.items.splice(idx, 1);
                saveData();
                renderShoppingList();
            });

            div.appendChild(cb);
            div.appendChild(txt);
            div.appendChild(del);
            list.appendChild(div);
        });
    }
}

function addShoppingItem() {
    const input = document.getElementById('newShoppingInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    if (!appData.shopping) appData.shopping = [];

    if (currentShoppingCategory === null) {
        appData.shopping.push({ id: Date.now(), text, done: false, items: [] });
    } else {
        const catObj = appData.shopping.find(c => c.id === currentShoppingCategory);
        if (catObj) {
            if (!catObj.items) catObj.items = [];
            catObj.items.push({ id: Date.now(), text, done: false });
            catObj.done = false;
        }
    }

    saveData();
    input.value = '';
    renderShoppingList();
}

const newShoppingInput = document.getElementById('newShoppingInput');
if (newShoppingInput) {
    newShoppingInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') addShoppingItem();
    });
}

const shoppingBackBtn = document.getElementById('shoppingBackBtn');
if (shoppingBackBtn) {
    shoppingBackBtn.addEventListener('click', () => {
        currentShoppingCategory = null;
        renderShoppingList();
    });
}

