const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNUvSxbhfUUjZfJf2x9tXv1CLNzRwAGJwmWEt-xlXTVLqW4X5re3WV5d9wnZdH40Yt/exec';

// Генерация или получение user_id без авторизации
let userId = localStorage.getItem('app_user_id');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('app_user_id', userId);
}

// Загружаем очередь из localStorage при открытии приложения
let queue = JSON.parse(localStorage.getItem('sync_queue')) || [];
let isSending = false;

const form = document.getElementById('data-form');
const input = document.getElementById('user-input');
const indicator = document.getElementById('sync-indicator');

// Если при открытии в локалсторе остались недоотправленные данные — запускаем отправку
window.addEventListener('DOMContentLoaded', () => {
    updateIndicatorUI();
    if (queue.length > 0) {
        processQueue();
    }
});

// Обработка отправки формы пользователем
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;

    const newItem = {
        id: crypto.randomUUID(),
        user_id: userId,
        value: value,
        time: new Date().toISOString()
    };

    // 1. Добавляем в очередь и сохраняем в память телефона
    queue.push(newItem);
    saveQueueToStorage();

    // 2. Мгновенно очищаем форму для следующего ввода (UI не ждет сети)
    input.value = '';
    input.focus();

    // 3. Обновляем индикатор и запускаем фоновый процесс
    updateIndicatorUI();
    processQueue();
});

// Сохранение текущей очереди в localStorage
function saveQueueToStorage() {
    localStorage.setItem('sync_queue', JSON.stringify(queue));
}

// Фоновый воркер отправки данных строго по очереди
async function processQueue() {
    if (isSending || queue.length === 0) return;

    isSending = true;
    updateIndicatorUI();

    const currentItem = queue[0]; // Берем первый элемент

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Важно для Apps Script
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentItem)
        });

        // Запрос улетел — удаляем элемент из очереди
        queue.shift();
        saveQueueToStorage();

    } catch (error) {
        console.warn('Ошибка сети, повторим попытку позже...');
    }

    isSending = false;
    updateIndicatorUI();

    // Если в очереди еще остались данные, рекурсивно шлем следующий с паузой в 1 сек
    if (queue.length > 0) {
        setTimeout(processQueue, 1000);
    }
}

// Управление визуальным индикатором в углу
function updateIndicatorUI() {
    if (queue.length > 0) {
        indicator.className = 'syncing';
        indicator.innerHTML = `<span class="spinning">⏳</span> Синхронизация: ${queue.length}`;
    } else {
        indicator.className = 'synced';
        indicator.innerHTML = '✅ Все отправлено';
    }
}
