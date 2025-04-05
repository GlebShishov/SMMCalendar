/**
 * Файл с исправлениями для проблем в интерфейсе SMM Календаря
 */

// Обработчик для закрытия всех выпадающих списков при клике вне них
document.addEventListener('click', function(event) {
    // Закрываем все открытые выпадающие списки, если клик был не по ним и не по их триггерам
    const dropdowns = document.querySelectorAll('.dropdown-content.show');
    if (dropdowns.length > 0) {
        dropdowns.forEach(dropdown => {
            // Проверяем, был ли клик внутри дропдауна или по его триггеру
            const isDropdownTrigger = dropdown.previousElementSibling === event.target || 
                                     dropdown.previousElementSibling?.contains(event.target);
            const isInsideDropdown = dropdown.contains(event.target);
            
            if (!isDropdownTrigger && !isInsideDropdown) {
                dropdown.classList.remove('show');
            }
        });
    }
});

// Исправление размера календаря под полную высоту экрана
document.addEventListener('DOMContentLoaded', function() {
    // Устанавливаем высоту календаря
    const calendar = document.getElementById('calendar');
    if (calendar) {
        calendar.style.height = 'calc(100vh - 120px)';
        calendar.style.overflowY = 'auto';
    }
    
    // Патчим функцию создания элемента поста
    if (typeof createPostElement === 'function') {
        const originalCreatePostElement = createPostElement;
        
        // Переопределяем функцию создания поста
        window.createPostElement = function(post, project) {
            const postElement = originalCreatePostElement(post, project);
            
            // Исправляем текст и стили кнопок в text-actions
            const textActions = postElement.querySelector('.text-actions');
            if (textActions) {
                // Находим и исправляем кнопку копирования
                const copyBtn = textActions.querySelector('.copy-text-btn');
                if (copyBtn && !copyBtn.textContent.includes('Копировать текст')) {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Копировать текст';
                }
                
                // Находим и исправляем кнопку редактирования с AI
                const aiBtn = textActions.querySelector('.edit-with-gpt-btn');
                if (aiBtn && !aiBtn.textContent.includes('Редактировать с AI')) {
                    aiBtn.innerHTML = '<i class="fas fa-robot"></i> Редактировать с AI';
                }
            }
            
            // Добавляем stopPropagation для корректной работы выпадающих меню
            const networkDisplay = postElement.querySelector('.network-display');
            if (networkDisplay) {
                const originalClick = networkDisplay.onclick;
                networkDisplay.onclick = function(e) {
                    e.stopPropagation();
                    if (originalClick) originalClick.call(this, e);
                };
            }
            
            const contentTypeDisplay = postElement.querySelector('.content-type-display');
            if (contentTypeDisplay) {
                const originalClick = contentTypeDisplay.onclick;
                contentTypeDisplay.onclick = function(e) {
                    e.stopPropagation();
                    if (originalClick) originalClick.call(this, e);
                };
            }
            
            return postElement;
        };
    }
    
    // Патчим функцию renderCalendar для правильного размера кнопки add-day-btn
    if (typeof renderCalendar === 'function') {
        const originalRenderCalendar = renderCalendar;
        
        window.renderCalendar = function(project) {
            // Вызываем оригинальную функцию
            originalRenderCalendar(project);
            
            // Исправляем размер кнопки добавления дня
            const addDayBtn = document.getElementById('add-day-btn');
            if (addDayBtn) {
                addDayBtn.style.height = '100%';
                addDayBtn.style.width = '100%';
            }
        };
    }
    
    // Внесение исправлений в кнопки и выпадающие меню
    function fixExistingElements() {
        // Исправляем все выпадающие меню
        document.querySelectorAll('.network-display, .content-type-display').forEach(element => {
            element.addEventListener('click', function(e) {
                e.stopPropagation();
                const dropdown = this.nextElementSibling;
                if (dropdown && dropdown.classList.contains('dropdown-content')) {
                    // Закрываем все другие выпадающие списки
                    document.querySelectorAll('.dropdown-content.show').forEach(el => {
                        if (el !== dropdown) {
                            el.classList.remove('show');
                        }
                    });
                    dropdown.classList.toggle('show');
                }
            }, true);
        });
        
        // Исправляем текст кнопок
        document.querySelectorAll('.copy-text-btn').forEach(btn => {
            if (!btn.textContent.includes('Копировать текст')) {
                btn.innerHTML = '<i class="fas fa-copy"></i> Копировать текст';
            }
        });
        
        document.querySelectorAll('.edit-with-gpt-btn').forEach(btn => {
            if (!btn.textContent.includes('Редактировать с AI')) {
                btn.innerHTML = '<i class="fas fa-robot"></i> Редактировать с AI';
            }
        });
    }
    
    // Применяем исправления к существующим элементам
    fixExistingElements();
    
    // Применяем исправления регулярно для новых элементов
    setInterval(fixExistingElements, 2000);
}); 