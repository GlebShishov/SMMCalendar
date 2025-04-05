// Функция для инициализации темы
function initializeTheme() {
    // Проверяем сохраненное значение из localStorage
    const savedTheme = localStorage.getItem('theme');
    
    // Если есть сохраненное значение, применяем его
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Проверяем предпочтения пользователя на системном уровне
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Если пользователь предпочитает темную тему, устанавливаем ее
        if (prefersDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    }
}

// Обработчик для кнопки переключения темы
function setupThemeToggle() {
    const toggleThemeBtn = document.getElementById('toggle-theme-btn');
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Получаем текущую тему
            const currentTheme = document.documentElement.getAttribute('data-theme');
            
            // Определяем новую тему
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Устанавливаем новую тему
            document.documentElement.setAttribute('data-theme', newTheme);
            
            // Сохраняем выбор пользователя в localStorage
            localStorage.setItem('theme', newTheme);
            
            // Показываем уведомление, если есть функция showNotification
            const themeName = newTheme === 'dark' ? 'темная' : 'светлая';
            if (typeof showNotification === 'function') {
                showNotification(`Применена ${themeName} тема`, 'success', 1500);
            } else {
                alert(`Применена ${themeName} тема`);
            }
        });
    }
}

// Инициализация документа
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем тему
    initializeTheme();
    
    // Настраиваем переключатель темы
    setupThemeToggle();
    
    // Добавляем остальные инициализации...
}); 