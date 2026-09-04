const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNUvSxbhfUUjZfJf2x9tXv1CLNzRwAGJwmWEt-xlXTVLqW4X5re3WV5d9wnZdH40Yt/exec';

let userId = localStorage.getItem('app_user_id');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('app_user_id', userId);
}

let queue = JSON.parse(localStorage.getItem('sync_queue')) || [];
let isSending = false;

const form = document.getElementById('data-form');
const input = document.getElementById('user-input');
const categorySelect = document.getElementById('category-select');
const indicator = document.getElementById('sync-indicator');

window.addEventListener('DOMContentLoaded', () => {
    updateIndicatorUI();
    if (queue.length > 0) {
        processQueue();
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const category = categorySelect.value;
    const value = input.value.trim();
    if (!category || !value) return;

    const newItem = {
        id: crypto.randomUUID(),
        user_id: userId,
        category: category,
        value: value,
        time: new Date().toISOString()
    };

    queue.push(newItem);
    saveQueueToStorage();

    input.value = '';
    categorySelect.selectedIndex = 0;
    input.focus();

    updateIndicatorUI();
    processQueue();
});

function saveQueueToStorage() {
    localStorage.setItem('sync_queue', JSON.stringify(queue));
}

async function processQueue() {
    if (isSending || queue.length === 0) return;

    isSending = true;
    updateIndicatorUI();

    const currentItem = queue[0];

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentItem)
        });

        queue.shift();
        saveQueueToStorage();

    } catch (error) {
        console.warn('Ошибка сети, повторим попытку позже...');
    }

    isSending = false;
    updateIndicatorUI();

    if (queue.length > 0) {
        setTimeout(processQueue, 1000);
    }
}

function updateIndicatorUI() {
    if (queue.length > 0) {
        indicator.className = 'syncing';
        indicator.innerHTML = `<span class="spinning">⏳</span> Синхронизация: ${queue.length}`;
    } else {
        indicator.className = 'synced';
        indicator.innerHTML = '✅ Все отправлено';
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker зарегистрирован'))
        .catch((err) => console.log('Ошибка SW:', err));
}
