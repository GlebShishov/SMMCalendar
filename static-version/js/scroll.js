// Инициализация perfect-scrollbar
function initializeScrollbars() {
    const containers = document.querySelectorAll('.scrollable');
    containers.forEach(container => {
        new PerfectScrollbar(container);
    });
}

// Наблюдаем за изменениями в DOM для инициализации новых скроллбаров
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Проверяем, что это элемент
                const scrollables = node.querySelectorAll('.scrollable');
                scrollables.forEach(container => {
                    new PerfectScrollbar(container);
                });
                if (node.classList && node.classList.contains('scrollable')) {
                    new PerfectScrollbar(node);
                }
            }
        });
    });
});

// Запускаем наблюдатель
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем существующие скроллбары
    initializeScrollbars();

    // Начинаем наблюдение за изменениями в DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}); 