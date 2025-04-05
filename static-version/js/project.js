// Глобальная переменная для хранения перетаскиваемого элемента
let draggedImage = null;

// Глобальные переменные для работы с проектом
let projectId = '';

// Инициализация проекта при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Обработчик кнопки переключения темы
    const themeToggleBtn = document.getElementById('toggle-theme-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Устанавливаем новую тему
            document.documentElement.setAttribute('data-theme', newTheme);
            
            // Сохраняем выбор пользователя в localStorage
            localStorage.setItem('theme', newTheme);
            
            // Обновляем иконку кнопки
            const iconElement = themeToggleBtn.querySelector('i');
            if (iconElement) {
                if (newTheme === 'dark') {
                    iconElement.className = 'fas fa-sun';
                } else {
                    iconElement.className = 'fas fa-moon';
                }
            }
        });
    }
    
    // Проверяем, инициализирована ли файловая система
    console.log('Проверка файловой системы...');

    // Создаем экземпляр файловой системы, если он не существует
    if (!window.filesystem) {
        console.log('Создаем новый экземпляр файловой системы');
        window.filesystem = new FileSystem();
    }
    
    // Добавляем обработчик для кнопки "Изменить директорию"
    const changeDirectoryBtn = document.getElementById('change-directory-btn');
    if (changeDirectoryBtn) {
        changeDirectoryBtn.addEventListener('click', async function() {
            try {
                // Сначала получаем ID проекта из URL перед сменой директории
                const urlParams = new URLSearchParams(window.location.search);
                const currentProjectId = urlParams.get('id');
                
                if (!currentProjectId) {
                    console.warn('ID проекта не указан в URL. Выбор директории может привести к ошибке инициализации проекта.');
                    showNotification('Ошибка: ID проекта не указан в URL', 'error');
                    return;
                }
                
                console.log('Инициализация выбора новой директории для проекта:', currentProjectId);
                
                // Очищаем предыдущее состояние перед инициализацией
                localStorage.removeItem('filesystem_state');
                localStorage.removeItem('filesystem_root_handle');
                
                // Прямой вызов выбора директории
                await window.filesystem.initialize();
                
                if (window.filesystem.isInitialized()) {
                    console.log('Файловая система успешно инициализирована с новой директорией');
                    
                    // Загружаем проект с новой директорией
                    // Явно передаем ID проекта в функцию initProject
                    initProject(currentProjectId).catch(error => {
                        console.error('Ошибка при инициализации проекта:', error);
                        showNotification('Ошибка при загрузке проекта', 'error');
                    });
                    
                    showNotification('Директория успешно изменена', 'success');
                } else {
                    console.error('Не удалось инициализировать файловую систему');
                    showNotification('Не удалось выбрать директорию. Пожалуйста, попробуйте снова.', 'error');
                }
            } catch (error) {
                console.error('Ошибка при выборе директории:', error);
                showNotification('Ошибка при выборе директории: ' + error.message, 'error');
            }
        });
    }

    // Таймаут для ожидания восстановления состояния файловой системы
    setTimeout(async () => {
        try {
            // Проверяем статус файловой системы
            if (window.filesystem && window.filesystem.isInitialized()) {
                console.log('Файловая система инициализирована, загружаем проект');
                
                // Если ID проекта сохранен, используем его
                const savedProjectId = window.currentProjectId || (new URLSearchParams(window.location.search)).get('id');
                
                initProject(savedProjectId).catch(error => {
                    console.error('Ошибка при инициализации проекта:', error);
                    showNotification('Ошибка при загрузке проекта. Попробуйте выбрать другую директорию.', 'error');
                });
            } else {
                console.log('Файловая система не инициализирована, пробуем переинициализировать');
                
                try {
                    // Пробуем повторно инициализировать с сохраненными данными без запроса директории
                    // Это обойдет ошибку безопасности, если браузер заблокировал восстановление директории
                    const urlParams = new URLSearchParams(window.location.search);
                    const projectId = urlParams.get('id');
                    
                    if (projectId) {
                        console.log(`Пробуем загрузить проект ${projectId} напрямую...`);
                        try {
                            // Пробуем загрузить проект из localStorage если возможно
                            // или из ранее созданных файлов в неиндексированной директории
                            initProject(projectId).catch(console.error);
                            return;
                        } catch (loadError) {
                            console.warn('Не удалось напрямую загрузить проект:', loadError);
                        }
                    }
                    
                    // Если прямая загрузка не удалась, сразу предлагаем выбор директории
                    console.log('Запрашиваем выбор директории...');
                    try {
                        await window.filesystem.initialize();
                        
                        if (window.filesystem.isInitialized()) {
                            console.log('Файловая система успешно инициализирована');
                            
                            // Используем ID проекта из URL, если он есть
                            const projectId = (new URLSearchParams(window.location.search)).get('id');
                            
                            // Загружаем проект
                            initProject(projectId).catch(error => {
                                console.error('Ошибка при инициализации проекта:', error);
                                showNotification('Ошибка при загрузке проекта', 'error');
                            });
                        } else {
                            console.error('Не удалось инициализировать файловую систему');
                            showNotification('Не удалось выбрать директорию. Пожалуйста, попробуйте снова.', 'error');
                        }
                    } catch (error) {
                        console.error('Ошибка при выборе директории:', error);
                        showNotification('Ошибка при выборе директории: ' + error.message, 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при попытке переинициализации:', error);
                    showNotification('Ошибка доступа к файловой системе', 'error');
                }
            }
        } catch (error) {
            console.error('Ошибка при проверке файловой системы:', error);
            showNotification('Ошибка при доступе к файловой системе: ' + error.message, 'error');
        }
    }, 100); // Небольшая задержка для возможного восстановления состояния
});

// Функция для инициализации проекта
async function initProject(projectId) {
    try {
        // Получаем ID проекта из параметра или из URL
        if (!projectId) {
            // Если ID не передан, берем из URL
            const urlParams = new URLSearchParams(window.location.search);
            projectId = urlParams.get('id');
        }
        
        if (!projectId) {
            console.error('ID проекта не указан в URL или не передан в параметре');
            showNotification('ID проекта не указан', 'error');
            return;
        }
        
        // Сохраняем ID проекта в глобальной переменной для использования в других функциях
        window.currentProjectId = projectId;
        
        console.log(`Инициализация проекта ${projectId}...`);
        
        let project = null;
        
        // Пробуем загрузить данные проекта через файловую систему
        if (window.filesystem && window.filesystem.isInitialized()) {
            try {
                project = await window.filesystem.loadProjectData(projectId);
                console.log('Проект загружен из файловой системы');
            } catch (fsError) {
                console.warn('Не удалось загрузить проект из файловой системы:', fsError);
            }
        } else {
            console.warn('Файловая система не инициализирована, пробуем альтернативные источники');
        }
        
        // Если не удалось загрузить из файловой системы, пробуем из localStorage
        if (!project) {
            try {
                console.log('Пробуем загрузить проект из localStorage...');
                project = loadProjectFromLocalStorage(projectId);
                if (project) {
                    console.log('Проект загружен из localStorage');
                } else {
                    console.warn('Проект не найден в localStorage');
                }
            } catch (lsError) {
                console.warn('Ошибка при загрузке из localStorage:', lsError);
            }
        }
        
        // Если все еще нет проекта, создаем пустой для демонстрации
        if (!project) {
            console.log('Создаем демонстрационный проект...');
            project = createDemoProject(projectId);
        }
        
        // Отображаем календарь
        renderCalendar(project);
        
        // Инициализируем drag-and-drop после загрузки проекта
        initializeDragAndDrop();
        
        // Обновляем информацию о проекте в сайдбаре
        updateProjectInfo(project);
        
        console.log('Проект инициализирован успешно');
        
        return project;
    } catch (error) {
        console.error('Ошибка при инициализации проекта:', error);
        showNotification('Ошибка при загрузке проекта', 'error');
        throw error;
    }
}

// Функция для загрузки проекта из localStorage
function loadProjectFromLocalStorage(projectId) {
    console.log(`Загрузка проекта ${projectId} из localStorage`);
    
    // Формируем проект
    const project = {
        id: projectId,
        title: `Проект ${projectId}`,
        description: 'Календарь публикаций для социальных сетей',
        days: {},
        order: { days: [] }
    };
    
    // Загружаем дни из localStorage
    const prefix = `project_${projectId}_day_`;
    const daysOrder = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            try {
                const dayId = key.replace(prefix, '');
                const dayData = JSON.parse(localStorage.getItem(key));
                
                if (dayData) {
                    project.days[dayId] = dayData;
                    daysOrder.push(dayId);
                    console.log(`Загружен день ${dayId} из localStorage`);
                }
            } catch (error) {
                console.warn(`Ошибка при загрузке дня из localStorage: ${key}`, error);
            }
        }
    }
    
    // Если есть хотя бы один день, считаем проект валидным
    if (daysOrder.length > 0) {
        // Сортируем дни по номеру
        daysOrder.sort((a, b) => {
            const numA = parseInt(a.replace('day_', ''), 10) || 0;
            const numB = parseInt(b.replace('day_', ''), 10) || 0;
            return numA - numB;
        });
        
        project.order.days = daysOrder;
        return project;
    }
    
    return null;
}

// Функция для создания демонстрационного проекта
function createDemoProject(projectId) {
    console.log(`Создание демонстрационного проекта для ${projectId}`);
    
    // Создаем базовую структуру
    const project = {
        id: projectId,
        title: `Проект ${projectId}`,
        description: 'Демонстрационный проект',
        days: {},
        order: { days: [] }
    };
    
    // Создаем первый день
    const dayId = 'day_1';
    const today = new Date();
    
    project.days[dayId] = {
        date: today.toISOString().split('T')[0],
        posts: [{
            socialNetwork: 'Telegram',
            contentType: 'Пост',
            images: [],
            text: 'Демонстрационный пост для ознакомления с интерфейсом. Здесь будет отображаться текст вашего поста.',
            created: today.toISOString(),
            lastModified: today.toISOString()
        }]
    };
    
    project.order.days = [dayId];
    
    // Сохраняем в localStorage, чтобы не потерять при обновлении
    try {
        const key = `project_${projectId}_day_${dayId}`;
        localStorage.setItem(key, JSON.stringify(project.days[dayId]));
    } catch (error) {
        console.warn('Не удалось сохранить демонстрационный проект в localStorage:', error);
    }
    
    return project;
}

// Функция для отображения календаря
function renderCalendar(project) {
    if (!project || !project.days) {
        console.error('Некорректные данные проекта для рендеринга календаря');
        const calendar = document.getElementById('calendar');
        if (calendar) {
            calendar.innerHTML = '<div class="error-message">Ошибка загрузки проекта. Проверьте данные.</div>';
        }
        return;
    }
    
    console.log('ДИАГНОСТИКА ДУБЛИРОВАНИЯ ДНЕЙ');
    console.log('Проект:', project);
    console.log('Дни проекта (из папки days):', Object.keys(project.days));
    console.log('Порядок дней (из order.json):', project.order?.days);
    
    // Получаем контейнер календаря
    const calendar = document.getElementById('calendar');
    if (!calendar) {
        console.error('Элемент календаря не найден');
        return;
    }
    
    // Очищаем контейнер перед отрисовкой, чтобы избежать дублирования
    calendar.innerHTML = '';
    
    // Проверяем, есть ли дни в проекте вообще
    if (!project.days || Object.keys(project.days).length === 0) {
        console.warn('В проекте нет дней');
        calendar.innerHTML = '<div class="empty-calendar"><p>В календаре нет дней. Нажмите "Добавить день", чтобы начать работу.</p></div>';
        
        // Добавляем кнопку для создания первого дня
        const addDayBtn = document.createElement('button');
        addDayBtn.id = 'add-day-btn';
        addDayBtn.className = 'btn primary-btn add-day-btn';
        addDayBtn.innerHTML = '<i class="fas fa-plus"></i> Добавить день';
        addDayBtn.addEventListener('click', () => {
            addNewDay(project).catch(console.error);
        });
        
        calendar.appendChild(addDayBtn);
        return;
    }
    
    // Гарантируем, что order.days существует
    if (!project.order || !project.order.days) {
        project.order = { days: [] };
    }
    
    // ВАЖНО: Убеждаемся, что в проекте нет дубликатов дней
    // Сначала создаем множество (Set) из идентификаторов дней для быстрой проверки дубликатов
    const uniqueDaysFromFolder = new Set(Object.keys(project.days));
    console.log('Уникальные дни в папке days:', Array.from(uniqueDaysFromFolder));
    
    // Проверяем, есть ли дубликаты в order.days
    const daysFromOrder = project.order.days || [];
    const uniqueDaysFromOrder = Array.from(new Set(daysFromOrder));
    
    if (daysFromOrder.length !== uniqueDaysFromOrder.length) {
        console.warn('Обнаружены дубликаты в order.days! Устраняем...');
        console.log('Было:', daysFromOrder);
        console.log('Стало:', uniqueDaysFromOrder);
        // Заменяем на уникальные значения
        project.order.days = uniqueDaysFromOrder;
    }
    
    // Оставляем только те дни из order.json, которые реально существуют в папке days
    const validDays = uniqueDaysFromOrder.filter(dayId => uniqueDaysFromFolder.has(dayId));
    console.log('Действительные дни из order.json, найденные в папке days:', validDays);
    
    // Находим дни, которые есть в папке days, но отсутствуют в order.json
    const missingInOrderDays = Array.from(uniqueDaysFromFolder).filter(dayId => !uniqueDaysFromOrder.includes(dayId));
    if (missingInOrderDays.length > 0) {
        console.log('Дни, найденные в папке days, но отсутствующие в order.json:', missingInOrderDays);
        // Добавляем эти дни в конец списка для отображения
        validDays.push(...missingInOrderDays);
    }
    
    // Избавляемся от возможных дубликатов ещё раз после объединения списков
    const finalDaysList = Array.from(new Set(validDays));
    
    // Сортируем дни по номеру для правильного отображения
    finalDaysList.sort((a, b) => {
        const numA = parseInt(a.replace('day_', ''), 10) || 0;
        const numB = parseInt(b.replace('day_', ''), 10) || 0;
        return numA - numB;
    });
    
    console.log('Итоговый отсортированный и дедуплицированный список дней для отображения:', finalDaysList);
    
    // Если нет действительных дней, показываем сообщение
    if (finalDaysList.length === 0) {
        calendar.innerHTML = '<div class="empty-calendar"><p>В календаре нет дней из папки days. Нажмите "Добавить день", чтобы начать работу.</p></div>';
        
        // Добавляем кнопку для создания первого дня
        const addDayBtn = document.createElement('button');
        addDayBtn.id = 'add-day-btn';
        addDayBtn.className = 'btn primary-btn add-day-btn';
        addDayBtn.innerHTML = '<i class="fas fa-plus"></i> Добавить день';
        addDayBtn.addEventListener('click', () => {
            addNewDay(project).catch(console.error);
        });
        
        calendar.appendChild(addDayBtn);
        return;
    }
    
    // Создаем контейнер для дней
    const daysContainer = document.createElement('div');
    daysContainer.className = 'days-container';
    calendar.appendChild(daysContainer);
    
    // Устанавливаем множество для отслеживания уже отрисованных дней
    const renderedDays = new Set();
    
    // Создаем колонки для каждого действительного дня в календаре
    console.log('Начинаем отрисовку дней в порядке:', finalDaysList);
    finalDaysList.forEach(dayId => {
        // Проверяем, не был ли день уже отрисован
        if (renderedDays.has(dayId)) {
            console.warn(`День ${dayId} уже был отрисован, пропускаем дублирование`);
            return;
        }
        
        // Получаем данные дня из project.days (папка days)
        const dayData = project.days[dayId];
        if (!dayData) {
            console.error(`День ${dayId} не найден в данных проекта`);
            return;
        }
        
        console.log(`Отображение дня ${dayId}:`, dayData);
        
        // Создаем колонку дня с отображением всех его данных (включая текст и картинки)
        const dayColumn = createDayColumn(dayId, dayData, project);
        daysContainer.appendChild(dayColumn);
        
        // Отмечаем день как отрисованный
        renderedDays.add(dayId);
    });
    
    // Добавляем кнопку для добавления нового дня в конец контейнера дней
    const addDayContainer = document.createElement('div');
    addDayContainer.className = 'add-day-container';
    
    const addDayBtn = document.createElement('button');
    addDayBtn.id = 'add-day-btn';
    addDayBtn.className = 'btn primary-btn add-day-btn';
    addDayBtn.innerHTML = '<i class="fas fa-plus"></i> Добавить день';
    addDayBtn.addEventListener('click', () => {
        addNewDay(project).catch(console.error);
    });
    
    addDayContainer.appendChild(addDayBtn);
    daysContainer.appendChild(addDayContainer);
    
    console.log('Календарь отображен успешно, всего отрисовано дней:', renderedDays.size);
    
    // Если в проекте обнаружены дубликаты или неправильный порядок, сохраняем исправленный вариант
    if (daysFromOrder.length !== finalDaysList.length || 
        JSON.stringify(daysFromOrder) !== JSON.stringify(finalDaysList)) {
        console.log('Обновляем порядок дней в проекте из-за обнаруженных проблем');
        project.order.days = finalDaysList;
        
        // Сохраняем исправленный порядок в файловую систему
        if (window.filesystem && window.filesystem.isInitialized()) {
            try {
                window.filesystem.updateOrderJson(project.id, finalDaysList)
                    .then(() => console.log('Order.json успешно обновлен с исправленным списком дней'))
                    .catch(err => console.error('Ошибка при обновлении order.json:', err));
            } catch (error) {
                console.error('Ошибка при обновлении порядка дней:', error);
            }
        }
    }
}

// Функция для добавления нового дня
async function addNewDay(project) {
    try {
        console.log('Добавление нового дня...');
        
        // Определяем номер нового дня на основе существующих дней
        const existingDays = Object.keys(project.days);
        let maxDayNumber = 0;
        
        // Находим максимальный номер дня
        existingDays.forEach(dayId => {
            const matches = dayId.match(/day_(\d+)/);
            if (matches && matches[1]) {
                const dayNumber = parseInt(matches[1], 10);
                if (dayNumber > maxDayNumber) {
                    maxDayNumber = dayNumber;
                }
            }
        });
        
        // Новый номер дня - следующий за максимальным
        const newDayNumber = maxDayNumber + 1;
        const dayId = `day_${newDayNumber}`;
        
        console.log(`Создаем новый день с ID ${dayId}`);
        
        // Создаем новый день
        const newDay = {
            date: new Date().toISOString().split('T')[0],
            posts: [{
                socialNetwork: 'Telegram',
                contentType: 'Пост',
                images: [],
                text: '',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }]
        };
        
        // Сохраняем новый день в файловую систему или localStorage
        if (window.filesystem && window.filesystem.isInitialized()) {
            try {
                // Сохраняем в файловую систему
                await window.filesystem.updateProjectDay(project.id, dayId, newDay);
                console.log(`День ${dayId} сохранен в файловую систему`);
            } catch (error) {
                console.error(`Ошибка при сохранении дня ${dayId} в файловую систему:`, error);
                showNotification('Ошибка при сохранении дня', 'error');
                
                // Пробуем сохранить в localStorage как запасной вариант
                try {
                    localStorage.setItem(`project_${project.id}_day_${dayId}`, JSON.stringify(newDay));
                    console.log(`День ${dayId} сохранен в localStorage`);
                } catch (lsError) {
                    console.error(`Ошибка при сохранении дня ${dayId} в localStorage:`, lsError);
                    throw error; // Пробрасываем первоначальную ошибку, так как localStorage тоже не сработал
                }
            }
        } else {
            // Если файловая система недоступна, сохраняем в localStorage
            try {
                localStorage.setItem(`project_${project.id}_day_${dayId}`, JSON.stringify(newDay));
                console.log(`День ${dayId} сохранен в localStorage`);
            } catch (error) {
                console.error(`Ошибка при сохранении дня ${dayId} в localStorage:`, error);
                showNotification('Ошибка при сохранении дня', 'error');
                throw error;
            }
        }
        
        // Добавляем день в проект
        project.days[dayId] = newDay;
        
        // Добавляем день в порядок дней
        if (!project.order) {
            project.order = { days: [] };
        }
        
        // Добавляем новый день в массив
        project.order.days.push(dayId);
        
        // Сохраняем обновленный порядок дней
        if (window.filesystem && window.filesystem.isInitialized()) {
            try {
                await window.filesystem.updateOrderJson(project.id, project.order.days);
                console.log(`Обновлен order.json с новым днем ${dayId}`);
            } catch (error) {
                console.error('Ошибка при обновлении order.json:', error);
                
                // Пробуем сохранить порядок дней в localStorage
                try {
                    localStorage.setItem(`project_${project.id}_order`, JSON.stringify({days: project.order.days}));
                    console.log(`Порядок дней сохранен в localStorage`);
                } catch (lsError) {
                    console.error('Ошибка при сохранении порядка дней в localStorage:', lsError);
                }
            }
        } else {
            // Сохраняем порядок в localStorage
            try {
                localStorage.setItem(`project_${project.id}_order`, JSON.stringify({days: project.order.days}));
                console.log(`Порядок дней сохранен в localStorage`);
            } catch (error) {
                console.error('Ошибка при сохранении порядка дней в localStorage:', error);
            }
        }
        
        // Перезагружаем календарь для отображения нового дня
        renderCalendar(project);
        
        console.log(`Новый день ${dayId} добавлен`);
        showNotification('Новый день добавлен', 'success');
        
        return dayId;
    } catch (error) {
        console.error('Ошибка при добавлении нового дня:', error);
        showNotification('Ошибка при добавлении нового дня', 'error');
        throw error;
    }
}

// Функция для обновления информации о проекте в сайдбаре
async function updateProjectInfo(project) {
    try {
        if (!project) {
            console.warn('Проект не передан в updateProjectInfo');
            return;
        }
        
        // Обновляем заголовок страницы
        document.title = `SMM Календарь - ${project.title || project.id}`;
        
        // Если есть элемент с заголовком проекта, обновляем его
        const projectTitleElement = document.getElementById('project-title');
        if (projectTitleElement) {
            projectTitleElement.textContent = project.title || project.id;
        }
        
        // Обновляем другие элементы UI, если они существуют
        const projectDescElement = document.getElementById('project-description');
        if (projectDescElement) {
            projectDescElement.textContent = project.description || '';
        }
        
        // Пробуем загрузить информацию о клиенте, если есть файловая система
        if (window.filesystem && window.filesystem.isInitialized()) {
    try {
        // Путь к файлу с информацией о проекте
                const clientInfoPath = `${project.id}/client_info.json`;
                
                // Проверяем существование файла
                const exists = await window.filesystem.fileExists(clientInfoPath);
                
                if (exists) {
                    // Загружаем информацию о клиенте
                    const clientInfoData = await window.filesystem.readFile(clientInfoPath);
                    
                    if (clientInfoData) {
                        try {
                            const clientInfo = JSON.parse(clientInfoData);
                            console.log('Загружена информация о клиенте:', clientInfo);
                            // Здесь можно обновить UI с информацией о клиенте
            } catch (error) {
                            console.warn('Ошибка при разборе информации о клиенте:', error);
                        }
                    }
                } else {
                    console.log('Информация о клиенте не найдена');
                }
            } catch (error) {
                console.warn('Ошибка при загрузке информации о клиенте:', error);
            }
        } else {
            console.warn('Файловая система не инициализирована, информация о клиенте не будет загружена');
        }
    } catch (error) {
        console.error('Ошибка при обновлении информации о проекте:', error);
    }
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Добавляем уведомление на страницу
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) {
        // Если контейнера уведомлений нет, создаем его
        const newContainer = document.createElement('div');
        newContainer.id = 'notifications';
        document.body.appendChild(newContainer);
        newContainer.appendChild(notification);
    } else {
        notificationsContainer.appendChild(notification);
    }
    
    // Автоматически скрываем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300); // Время для анимации скрытия
    }, 3000);
}

// Обработчики событий drag and drop
function handleDragStart(e) {
    // Запоминаем текущий перетаскиваемый элемент
    draggedImage = this;
    this.classList.add('dragging');
    
    // Сохраняем информацию о перетаскиваемом элементе
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
        imagePath: this.dataset.imagePath,
        imageIndex: parseInt(this.dataset.imageIndex),
        dayId: this.dataset.dayId,
        postIndex: parseInt(this.dataset.postIndex)
    }));
    
    // Добавляем визуальное отображение перетаскивания
    this.style.opacity = '0.4';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Позволяет сделать drop
    }
    e.dataTransfer.dropEffect = 'move';
    
    // Определяем элемент, после которого нужно вставить перетаскиваемый элемент
    const afterElement = getDragAfterElement(this, e.clientY);
    
    // Подсветка места, куда будет вставлен элемент
    const dropIndicator = this.querySelector('.drop-indicator');
    if (!dropIndicator) {
        const newIndicator = document.createElement('div');
        newIndicator.className = 'drop-indicator';
        this.appendChild(newIndicator);
    }
    
    return false;
}

// Функция для определения элемента, после которого нужно вставить перетаскиваемый элемент
function getDragAfterElement(container, y) {
    // Получаем все не-перетаскиваемые в данный момент превью изображений
    const draggableElements = [...container.querySelectorAll('.image-preview:not(.dragging):not(.add-image)')];
    
    // Находим ближайший элемент
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - (box.top + box.height / 2);
        
        // Если мы находимся выше элемента и ближе к нему, чем к предыдущему "ближайшему"
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleDragEnter(e) {
    // Добавляем визуальную индикацию, что элемент может быть сброшен
    const targetElement = findDropTarget(e.target);
    if (targetElement) {
        targetElement.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    // Удаляем визуальную индикацию
    const targetElement = findDropTarget(e.target);
    if (targetElement) {
        targetElement.classList.remove('drag-over');
    }
    
    // Удаляем индикатор места сброса
    const dropIndicator = this.querySelector('.drop-indicator');
    if (dropIndicator) {
        this.removeChild(dropIndicator);
    }
}

async function handleDrop(e) {
    // Предотвращаем открытие файла в браузере
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    // Удаляем все индикаторы сброса
    document.querySelectorAll('.drop-indicator').forEach(indicator => {
        indicator.parentNode.removeChild(indicator);
    });
    
    // Находим цель для сброса
    const dropTarget = findDropTarget(e.target);
    if (!dropTarget) return false;
    
    // Удаляем визуальную индикацию
    dropTarget.classList.remove('drag-over');
    
    // Если сбрасываемый элемент существует
    if (!draggedImage || draggedImage === this) {
        return false;
    }
    
    // Сохраняем новый порядок изображений
    await saveNewImageOrder(this, draggedImage);
    
    return false;
}

// Функция для сохранения нового порядка изображений
async function saveNewImageOrder(container, draggedElement) {
    if (!draggedElement || !draggedElement.dataset) {
        console.error('Неверный формат перетаскиваемого элемента');
        return false;
    }
    
    try {
        // Получаем данные о перетаскиваемом изображении
        const imagePath = draggedElement.dataset.imagePath;
        const imageIndex = parseInt(draggedElement.dataset.imageIndex);
        const dayId = draggedElement.dataset.dayId;
        const postIndex = parseInt(draggedElement.dataset.postIndex);
        
        // Получаем проект из URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        if (dayId && projectId && !isNaN(postIndex) && !isNaN(imageIndex)) {
            // Загружаем данные проекта
            const project = await window.filesystem.loadProjectData(projectId);
            
            // Получаем пост, которому принадлежит изображение
            if (project.days && project.days[dayId] && project.days[dayId].posts) {
                const targetPost = project.days[dayId].posts[postIndex];
                
                if (targetPost && targetPost.images && Array.isArray(targetPost.images)) {
                    // Определяем, куда поместить изображение
                    const targetContainer = container.closest('.images-container');
                    const targetPostElement = targetContainer ? targetContainer.closest('.post') : null;
                    
                    let targetDayId = dayId;
                    let targetPostIndex = postIndex;
                    
                    // Если целевой контейнер найден и отличается от исходного
                    if (targetPostElement) {
                        const targetDayColumn = targetPostElement.closest('.day-column');
                        if (targetDayColumn) {
                            targetDayId = targetDayColumn.dataset.dayId;
                            
                            // Находим индекс поста в дне
                            const posts = targetDayColumn.querySelectorAll('.post');
                            for (let i = 0; i < posts.length; i++) {
                                if (posts[i] === targetPostElement) {
                                    targetPostIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Получаем целевой пост
                    const targetPost = project.days[targetDayId].posts[targetPostIndex];
                    
                    // Если перемещение в тот же самый пост
                    if (targetDayId === dayId && targetPostIndex === postIndex) {
                        // Определяем новый индекс для изображения
                        const currentIndex = imageIndex;
                        let newIndex = targetPost.images.length - 1;
                        
                        // Находим новую позицию, основываясь на предыдущем и следующем элементах
                        const imagePreviews = targetContainer.querySelectorAll('.image-preview:not(.add-image)');
                        const targetImageIndex = Array.from(imagePreviews).indexOf(draggedElement);
                        
                        if (targetImageIndex !== -1 && targetImageIndex !== currentIndex) {
                            newIndex = targetImageIndex;
                        }
                        
                        // Переставляем изображение, если позиция изменилась
                        if (currentIndex !== newIndex) {
                            // Удаляем изображение с текущей позиции
                            const imageToMove = targetPost.images.splice(currentIndex, 1)[0];
                            
                            // Вставляем его на новую позицию
                            targetPost.images.splice(newIndex, 0, imageToMove);
                            
                            // Обновляем пост
                            await window.filesystem.updateProjectDay(projectId, targetDayId, project.days[targetDayId]);
                            
                            // Перезагрузить только конкретный пост
                            const imagesContainer = targetPostElement.querySelector('.images-container');
                            if (imagesContainer) {
                                await reloadImages(imagesContainer, targetPost, targetPostElement, targetDayId, targetPostIndex);
                            }
                            
                            showNotification('Порядок изображений изменен', 'success');
                        }
                    }
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка при перемещении изображения:', error);
        showNotification('Ошибка при перемещении изображения', 'error');
        return false;
    }
}

function handleDragEnd(e) {
    // Восстанавливаем стили после окончания перетаскивания
    this.style.opacity = '1';
    this.classList.remove('dragging');
    
    // Очищаем все индикаторы drag-over на странице
    document.querySelectorAll('.drag-over').forEach(element => {
        element.classList.remove('drag-over');
    });
    
    draggedImage = null;
}

// Функция для определения цели сброса
function findDropTarget(element) {
    // Проверяем, является ли элемент подходящей целью для сброса
    if (element.classList.contains('image-preview') || element.classList.contains('images-container')) {
        return element;
    }
    
    // Ищем ближайший контейнер изображений или предпросмотр изображения
    let parent = element.closest('.image-preview') || element.closest('.images-container');
    return parent;
}

// Функция для инициализации drag-and-drop для изображений
function initializeDragAndDrop() {
    console.log('Инициализация функциональности drag-and-drop для изображений...');
    
    // Находим все контейнеры с изображениями
    const imagesContainers = document.querySelectorAll('.images-container');
    
    imagesContainers.forEach(container => {
        // Добавляем слушателей событий перетаскивания для всех превью изображений в контейнере
        const imagePreviews = container.querySelectorAll('.image-preview:not(.add-image)');
        
        imagePreviews.forEach(preview => {
            preview.setAttribute('draggable', 'true');
            preview.addEventListener('dragstart', handleDragStart);
            preview.addEventListener('dragend', handleDragEnd);
        });
        
        // Добавляем обработчики для контейнера изображений
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
    });
    
    console.log('Функциональность drag-and-drop инициализирована');
}

// Функция для создания колонки дня
function createDayColumn(dayId, dayData, project) {
    // Создаем элемент колонки дня
    const dayColumn = document.createElement('div');
    dayColumn.className = 'day-column';
    dayColumn.dataset.dayId = dayId;
    
    // Получаем номер дня из ID
    const dayNumber = dayId.replace('day_', '');
    
    // Добавляем номер дня в левый верхний угол
    const dayNumberDisplay = document.createElement('div');
    dayNumberDisplay.className = 'day-number-display';
    dayNumberDisplay.textContent = dayNumber;
    dayColumn.appendChild(dayNumberDisplay);
    
    // Заголовок с датой
    const dateHeader = document.createElement('div');
    dateHeader.className = 'date-header';
    
    // Контейнер для даты и кнопки редактирования
    const dateContainer = document.createElement('div');
    dateContainer.className = 'date-container';
    
    // Отображение даты
    const dateDisplay = document.createElement('div');
    dateDisplay.className = 'date-display';
    const date = dayData.date || new Date().toISOString().split('T')[0];
    dateDisplay.textContent = formatDate(new Date(date));
    dateContainer.appendChild(dateDisplay);
    
    // Редактирование даты
    const editDateBtn = document.createElement('button');
    editDateBtn.className = 'calendar-button edit-date-btn';
    editDateBtn.innerHTML = '<i class="fas fa-calendar-alt"></i>';
    editDateBtn.title = 'Изменить дату';
    editDateBtn.addEventListener('click', () => {
    const dateSelector = document.createElement('input');
    dateSelector.type = 'date';
    dateSelector.className = 'date-selector';
    dateSelector.value = date;
        
    dateSelector.addEventListener('change', (e) => {
        const newDate = e.target.value;
            updateDayDate(dayId, newDate, project);
        dateDisplay.textContent = formatDate(new Date(newDate));
    });
    
        dateSelector.click(); // Открываем селектор даты
    });
    dateContainer.appendChild(editDateBtn);
    dateHeader.appendChild(dateContainer);
    
    // Кнопки действий с днем (удаление, сортировка)
    const actionButtons = document.createElement('div');
    actionButtons.className = 'day-actions';
    
    // Кнопка сортировки постов
    const sortPostsBtn = document.createElement('button');
    sortPostsBtn.className = 'sort-posts-btn';
    sortPostsBtn.innerHTML = '<i class="fas fa-sort"></i>';
    sortPostsBtn.title = 'Сортировать посты по дате';
    sortPostsBtn.addEventListener('click', () => {
        sortPostsByDate(dayId, project);
    });
    
    actionButtons.appendChild(sortPostsBtn);
    
    // Кнопка удаления дня
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-day-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Удалить день';
    deleteBtn.addEventListener('click', () => {
        if (confirm(`Вы уверены, что хотите удалить день ${formatDate(new Date(date))}?`)) {
            deleteDay(dayId, project);
        }
    });
    
    actionButtons.appendChild(deleteBtn);
    dateHeader.appendChild(actionButtons);
    dayColumn.appendChild(dateHeader);
    
    // Контейнер для постов
    const postsContainer = document.createElement('div');
    postsContainer.className = 'posts-container';
    
    // Добавляем посты из данных дня
    if (dayData.posts && dayData.posts.length > 0) {
        console.log(`Найдено ${dayData.posts.length} постов для дня ${dayId}`);
        
        // Сортируем посты по дате последнего изменения (от новых к старым)
        const sortedPosts = [...dayData.posts].sort((a, b) => {
            // Если есть lastModified, используем его
            if (a.lastModified && b.lastModified) {
                return new Date(b.lastModified) - new Date(a.lastModified);
            }
            // Если есть created, используем его
            if (a.created && b.created) {
                return new Date(b.created) - new Date(a.created);
            }
            // По умолчанию не меняем порядок
            return 0;
        });
        
        // Создаем элементы для каждого поста
        sortedPosts.forEach(post => {
            const postElement = createPostElement(post, project);
            postsContainer.appendChild(postElement);
        });
    } else {
        console.log(`Нет постов для дня ${dayId}, создаем пустой пост`);
        
        // Если постов нет, создаем один пустой пост
        const emptyPost = {
            socialNetwork: 'Telegram',
            contentType: 'Пост',
            images: [],
            text: '',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Если у нас нет массива постов в данных дня, создаем его
        if (!dayData.posts) {
            dayData.posts = [];
        }
        
        // Добавляем пустой пост в данные дня
        dayData.posts.push(emptyPost);
        
        // Сохраняем обновленные данные дня
        if (window.filesystem && window.filesystem.isInitialized()) {
            try {
                window.filesystem.updateProjectDay(project.id, dayId, dayData);
            } catch (error) {
                console.error(`Ошибка при сохранении пустого поста для дня ${dayId}:`, error);
            }
        } else {
            console.log('Файловая система не инициализирована, сохраняем в localStorage');
            localStorage.setItem(`project_${project.id}_day_${dayId}`, JSON.stringify(dayData));
        }
        
        const postElement = createPostElement(emptyPost, project);
        postsContainer.appendChild(postElement);
    }
    
    dayColumn.appendChild(postsContainer);
    
    // Кнопка добавления нового поста
    const addPostBtn = document.createElement('button');
    addPostBtn.className = 'add-post-btn';
    addPostBtn.innerHTML = '<i class="fas fa-plus"></i> Добавить публикацию';
    addPostBtn.addEventListener('click', async () => {
        // Создаем новый пост
        const newPost = {
            socialNetwork: 'Telegram',
            contentType: 'Пост',
            images: [],
            text: '',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Добавляем пост в данные дня
        dayData.posts.push(newPost);
        
        // Сохраняем обновленные данные дня
        if (window.filesystem && window.filesystem.isInitialized()) {
            try {
                await window.filesystem.updateProjectDay(project.id, dayId, dayData);
            } catch (error) {
                console.error(`Ошибка при добавлении нового поста для дня ${dayId}:`, error);
            }
        } else {
            console.log('Файловая система не инициализирована, сохраняем в localStorage');
            localStorage.setItem(`project_${project.id}_day_${dayId}`, JSON.stringify(dayData));
        }
        
        // Добавляем пост в DOM
        const postElement = createPostElement(newPost, project);
        postsContainer.appendChild(postElement);
    });
    
    dayColumn.appendChild(addPostBtn);
    
    return dayColumn;
}

// Функция для форматирования даты
function formatDate(date) {
    // Проверяем, что date не undefined
    if (!date) return '';
    
    // Если date - строка, преобразуем в объект Date
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // Форматируем дату как "5 апреля в 03:00" без года
    const options = { 
        day: 'numeric', 
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    try {
        const formattedDate = date.toLocaleString('ru-RU', options);
        // Заменяем запятую на предлог "в"
        return formattedDate.replace(',', ' в');
    } catch (error) {
        console.error('Ошибка при форматировании даты:', error);
        return date.toLocaleDateString('ru-RU');
    }
}

// Функция для работы с порядком дней
async function updateDaysOrder(projectId, dates) {
    try {
        const project = await window.filesystem.loadProjectData(projectId);
        if (!project.order) {
            project.order = { days: [] };
        }
        project.order.days = dates;
        await window.filesystem.saveProjectData(projectId, project);
        console.log(`Порядок дней обновлен для проекта ${projectId}:`, dates);
    } catch (error) {
        console.error('Ошибка при обновлении порядка дней:', error);
    }
}

// Функция для получения порядка дней
async function getDaysOrder(projectId) {
    try {
        const project = await window.filesystem.loadProjectData(projectId);
        return project?.order?.days || Object.keys(project?.days || {}).sort();
    } catch (error) {
        console.error('Ошибка при получении порядка дней:', error);
        return [];
    }
}

// Функция для обновления даты дня
async function updateDayDate(dayId, newDate, project) {
    try {
        // Получаем файл дня
        const projectId = new URLSearchParams(window.location.search).get('id');
        const dayPath = `${projectId}/days/${dayId}.json`;
        const dayDataJson = await window.filesystem.readFile(dayPath);
        
        if (!dayDataJson) {
            console.error(`Файл дня ${dayId} не найден`);
            return false;
        }
        
        // Парсим данные дня
        let dayData;
        try {
            dayData = JSON.parse(dayDataJson);
        } catch (error) {
            console.error(`Ошибка при разборе JSON дня ${dayId}:`, error);
            return false;
        }
        
        // Обновляем дату
        dayData.date = newDate;
        
        // Сохраняем обновленные данные
        await window.filesystem.writeFile(dayPath, JSON.stringify(dayData, null, 2));
        
        // Сортируем дни по дате после изменения
        await sortDaysByDate(projectId, project);
        
        // Перезагружаем календарь, чтобы отразить изменения
        const project = await window.filesystem.loadProjectData(projectId);
        renderCalendar(project);
        
        return true;
    } catch (error) {
        console.error(`Ошибка при обновлении даты дня ${dayId}:`, error);
        return false;
    }
}

// Функция для создания элемента поста
function createPostElement(post, project) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    
    // Заголовок поста
    const postHeader = document.createElement('div');
    postHeader.className = 'post-header';
    
    // Выбор социальной сети
    const networkSelector = document.createElement('div');
    networkSelector.className = 'network-selector';
    
    // Текущее значение соц. сети
    const networkDisplay = document.createElement('div');
    networkDisplay.className = 'network-display';
    networkDisplay.innerHTML = `<i class="fab fa-${post.socialNetwork.toLowerCase()}"></i> ${post.socialNetwork}`;
    networkSelector.appendChild(networkDisplay);
    
    // Выпадающий список с социальными сетями
    const networkDropdown = document.createElement('div');
    networkDropdown.className = 'dropdown-content network-dropdown';
    
    // Список социальных сетей
    const networks = ['Instagram', 'Facebook', 'TikTok', 'Telegram', 'VK', 'YouTube'];
    networks.forEach(network => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        option.innerHTML = `<i class="fab fa-${network.toLowerCase()}"></i> ${network}`;
        option.addEventListener('click', async () => {
            post.socialNetwork = network;
            networkDisplay.innerHTML = `<i class="fab fa-${network.toLowerCase()}"></i> ${network}`;
            networkDropdown.classList.remove('show');
            
            // Обновляем пост
            const dayColumn = postElement.closest('.day-column');
            if (dayColumn) {
                const dayId = dayColumn.dataset.dayId;
                const postsContainer = dayColumn.querySelector('.posts-container');
                const posts = Array.from(postsContainer.querySelectorAll('.post'));
                const postIndex = posts.indexOf(postElement);
                
                if (postIndex !== -1) {
                    await updatePost(dayId, post, postIndex, project);
                }
            }
        });
        networkDropdown.appendChild(option);
    });
    
    networkDisplay.addEventListener('click', () => {
        // Закрываем все другие выпадающие списки
        document.querySelectorAll('.dropdown-content.show').forEach(el => {
            if (el !== networkDropdown) {
                el.classList.remove('show');
            }
        });
        networkDropdown.classList.toggle('show');
    });
    
    networkSelector.appendChild(networkDropdown);
    postHeader.appendChild(networkSelector);
    
    // Выбор типа контента
    const contentTypeSelector = document.createElement('div');
    contentTypeSelector.className = 'content-type-selector';
    
    // Текущее значение типа контента
    const contentTypeDisplay = document.createElement('div');
    contentTypeDisplay.className = 'content-type-display';
    contentTypeDisplay.textContent = post.contentType || 'Пост';
    contentTypeSelector.appendChild(contentTypeDisplay);
    
    // Выпадающий список с типами контента
    const contentTypeDropdown = document.createElement('div');
    contentTypeDropdown.className = 'dropdown-content content-type-dropdown';
    
    // Список типов контента
    const contentTypes = ['Пост', 'Сторис', 'Рилс', 'Превью', 'Обложка'];
    contentTypes.forEach(type => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        option.textContent = type;
        option.addEventListener('click', async () => {
            post.contentType = type;
            contentTypeDisplay.textContent = type;
            contentTypeDropdown.classList.remove('show');
            
            // Обновляем пост
            const dayColumn = postElement.closest('.day-column');
            if (dayColumn) {
                const dayId = dayColumn.dataset.dayId;
                const postsContainer = dayColumn.querySelector('.posts-container');
                const posts = Array.from(postsContainer.querySelectorAll('.post'));
                const postIndex = posts.indexOf(postElement);
                
                if (postIndex !== -1) {
                    await updatePost(dayId, post, postIndex, project);
                }
            }
        });
        contentTypeDropdown.appendChild(option);
    });
    
    contentTypeDisplay.addEventListener('click', () => {
        // Закрываем все другие выпадающие списки
        document.querySelectorAll('.dropdown-content.show').forEach(el => {
            if (el !== contentTypeDropdown) {
                el.classList.remove('show');
            }
        });
        contentTypeDropdown.classList.toggle('show');
    });
    
    contentTypeSelector.appendChild(contentTypeDropdown);
    postHeader.appendChild(contentTypeSelector);
    
    // Кнопка удаления поста
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-post-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Удалить публикацию';
    deleteBtn.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите удалить эту публикацию?')) {
            // Удаляем пост из DOM
            postElement.remove();
            
            // Удаляем пост из данных
            const dayColumn = postElement.closest('.day-column');
            if (dayColumn) {
                const dayId = dayColumn.dataset.dayId;
                const postsContainer = dayColumn.querySelector('.posts-container');
                const posts = Array.from(postsContainer.querySelectorAll('.post'));
                const postIndex = posts.indexOf(postElement);
                
                if (postIndex !== -1) {
                    await deletePost(dayId, postIndex, project);
                }
            }
        }
    });
    
    postHeader.appendChild(deleteBtn);
    postElement.appendChild(postHeader);
    
    // Контейнер для изображений
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'images-container';
    
    // Обновляем контейнер с изображениями 
    // Здесь не используем await, так как функция не асинхронная
    reloadImages(imagesContainer, post, postElement, 
        postElement.closest('.day-column')?.dataset.dayId, 
        Array.from(postElement.closest('.day-column')?.querySelectorAll('.post') || []).indexOf(postElement), project);
    
    postElement.appendChild(imagesContainer);
    
    // Кнопки управления текстом (копирование и редактирование через GPT)
    const textActionsDiv = document.createElement('div');
    textActionsDiv.className = 'text-actions';
    
    // Кнопка копирования текста
    const copyTextBtn = document.createElement('button');
    copyTextBtn.className = 'copy-text-btn';
    copyTextBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyTextBtn.title = 'Скопировать текст';
    copyTextBtn.addEventListener('click', () => {
        // Получаем текст из редактора Quill
        const editor = postElement.querySelector('.ql-editor');
        if (editor && editor.innerHTML) {
            // Копируем текст в буфер обмена
            navigator.clipboard.writeText(editor.innerText)
                .then(() => {
                    showNotification('Текст скопирован в буфер обмена', 'success');
                })
                .catch(err => {
                    console.error('Не удалось скопировать текст:', err);
                    showNotification('Не удалось скопировать текст', 'error');
                });
        } else {
            showNotification('Нет текста для копирования', 'info');
        }
    });
    textActionsDiv.appendChild(copyTextBtn);
    
    // Кнопка редактирования с помощью ChatGPT
    const editWithGptBtn = document.createElement('button');
    editWithGptBtn.className = 'edit-with-gpt-btn';
    editWithGptBtn.innerHTML = '<i class="fas fa-robot"></i>';
    editWithGptBtn.title = 'Редактировать с помощью ChatGPT';
    editWithGptBtn.addEventListener('click', () => {
        // Получаем редактор Quill
        const quillContainer = postElement.querySelector('.text-container');
        if (quillContainer) {
            // Открываем модальное окно для редактирования с ChatGPT
            const dayColumn = postElement.closest('.day-column');
            if (dayColumn) {
                const dayId = dayColumn.dataset.dayId;
                const postIndex = Array.from(dayColumn.querySelectorAll('.post')).indexOf(postElement);
                openGptEditModal(quillContainer, post, dayId, postIndex, project);
            }
        }
    });
    textActionsDiv.appendChild(editWithGptBtn);
    
    // Добавляем actions перед text-container
    postElement.appendChild(textActionsDiv);
    
    // Редактор текста (используем Quill)
    const textContainer = document.createElement('div');
    textContainer.className = 'text-container';
    
    // Создаем контейнер для редактора Quill
    const quillContainer = document.createElement('div');
    quillContainer.className = 'quill-editor';
    textContainer.appendChild(quillContainer);
    
    postElement.appendChild(textContainer);
    
    // Инициализируем Quill после добавления элемента в DOM
    setTimeout(() => {
        // Настраиваем панель инструментов Quill
        const quill = new Quill(quillContainer, {
            theme: 'snow',
            placeholder: 'Введите текст публикации...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'clean']
                ]
            }
        });
        
        // Устанавливаем начальный текст
        if (post.text) {
            quill.root.innerHTML = post.text;
        }
        
        // Обработчик изменений
        quill.on('text-change', function() {
            post.text = quill.root.innerHTML;
            post.lastModified = new Date().toISOString();
            
            // Сохраняем изменения с задержкой для предотвращения частых сохранений
            clearTimeout(quill.saveTimeout);
            quill.saveTimeout = setTimeout(async () => {
                const dayColumn = postElement.closest('.day-column');
                if (dayColumn) {
                    const dayId = dayColumn.dataset.dayId;
                    const postsContainer = dayColumn.querySelector('.posts-container');
                    const posts = Array.from(postsContainer.querySelectorAll('.post'));
                    const postIndex = posts.indexOf(postElement);
                    
                    if (postIndex !== -1) {
                        await updatePost(dayId, { text: post.text, lastModified: post.lastModified }, postIndex, project);
                    }
                }
            }, 1000);
        });
    }, 0);
    
    return postElement;
}

// Функция для открытия модального окна редактирования с ChatGPT
function openGptEditModal(textArea, post, dayId, postIndex, project) {
    // Проверяем, существует ли уже модальное окно
    let modalElement = document.getElementById('gptEditModal');
    
    // Если окно не существует, создаем его
    if (!modalElement) {
        modalElement = document.createElement('dialog');
        modalElement.id = 'gptEditModal';
        modalElement.className = 'modal';
        
        // Создаем содержимое модального окна
        modalElement.innerHTML = `
            <div class="modal-content">
                <header class="modal-header">
                    <h2>Редактирование с помощью ChatGPT</h2>
                    <button class="modal-close" type="button" aria-label="Закрыть">&times;</button>
                </header>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="gpt-prompt">Опишите, что нужно сделать с текстом:</label>
                        <textarea id="gpt-prompt" class="form-control" rows="3" placeholder="Например: 'Сделай текст более креативным' или 'Исправь грамматические ошибки'"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="gpt-current-text">Текущий текст:</label>
                        <textarea id="gpt-current-text" class="form-control" rows="5" readonly></textarea>
                    </div>
                    <div class="form-group gpt-result-container" style="display: none;">
                        <label for="gpt-result-text">Результат:</label>
                        <textarea id="gpt-result-text" class="form-control" rows="5"></textarea>
                    </div>
                    <div class="gpt-loading" style="display: none;">
                        <div class="spinner"></div>
                        <p>ChatGPT обрабатывает запрос...</p>
                    </div>
                </div>
                <footer class="modal-footer">
                    <button class="btn btn-secondary modal-cancel" type="button">Отмена</button>
                    <button class="btn btn-primary" id="sendToGptBtn" type="button">Отправить запрос</button>
                    <button class="btn btn-success" id="applyGptResultBtn" type="button" style="display: none;">Применить результат</button>
                </footer>
            </div>
        `;
        
        // Добавляем модальное окно в DOM
        document.body.appendChild(modalElement);
        
        // Добавляем обработчики событий
        const closeBtn = modalElement.querySelector('.modal-close');
        const cancelBtn = modalElement.querySelector('.modal-cancel');
        const sendToGptBtn = modalElement.querySelector('#sendToGptBtn');
        const applyGptResultBtn = modalElement.querySelector('#applyGptResultBtn');
        
        // Закрытие окна
        closeBtn.addEventListener('click', () => {
            modalElement.close();
        });
        
        cancelBtn.addEventListener('click', () => {
            modalElement.close();
        });
        
        // Отправка запроса в ChatGPT
        sendToGptBtn.addEventListener('click', async () => {
            const promptText = modalElement.querySelector('#gpt-prompt').value;
            const currentText = modalElement.querySelector('#gpt-current-text').value;
            
            if (!promptText || !currentText) {
                showNotification('Заполните все поля', 'error');
                return;
            }
            
            // Показываем индикатор загрузки
            modalElement.querySelector('.gpt-loading').style.display = 'block';
            sendToGptBtn.disabled = true;
            
            // Имитация запроса к ChatGPT (в реальном приложении здесь будет API-вызов)
            setTimeout(() => {
                // Скрываем индикатор загрузки
                modalElement.querySelector('.gpt-loading').style.display = 'none';
                sendToGptBtn.disabled = false;
                
                // Показываем результат
                const resultContainer = modalElement.querySelector('.gpt-result-container');
                resultContainer.style.display = 'block';
                
                // Генерируем "улучшенный" текст (здесь должна быть интеграция с API ChatGPT)
                const resultText = processTextWithGpt(currentText, promptText);
                
                // Устанавливаем результат
                modalElement.querySelector('#gpt-result-text').value = resultText;
                
                // Показываем кнопку применения результата
                applyGptResultBtn.style.display = 'inline-block';
            }, 1500);
        });
        
        // Применение результата
        applyGptResultBtn.addEventListener('click', async () => {
            const resultText = modalElement.querySelector('#gpt-result-text').value;
            if (resultText) {
                // Применяем результат к textarea поста
                textArea.value = resultText;
                
                // Обновляем текст поста
                post.text = resultText;
                post.lastModified = new Date().toISOString();
                
                // Обновляем пост в хранилище
                if (dayId && postIndex !== undefined) {
                    await updatePost(dayId, { text: post.text, lastModified: post.lastModified }, postIndex, project);
                }
                
                // Закрываем модальное окно
                modalElement.close();
                
                // Показываем уведомление
                showNotification('Текст успешно обновлен', 'success');
                
                // Сбрасываем содержимое полей
                modalElement.querySelector('#gpt-prompt').value = '';
                modalElement.querySelector('#gpt-result-text').value = '';
                modalElement.querySelector('.gpt-result-container').style.display = 'none';
                applyGptResultBtn.style.display = 'none';
            }
        });
    }
    
    // Устанавливаем текущий текст в поле
    modalElement.querySelector('#gpt-current-text').value = textArea.value;
    
    // Скрываем результат, если он был показан
    modalElement.querySelector('.gpt-result-container').style.display = 'none';
    modalElement.querySelector('#applyGptResultBtn').style.display = 'none';
    
    // Открываем модальное окно
    modalElement.showModal();
}

// Функция для обработки текста с помощью GPT (имитация)
function processTextWithGpt(text, prompt) {
    // Заглушка для демонстрации. В реальном приложении здесь будет вызов API ChatGPT
    let result = text;
    
    // Простые преобразования в зависимости от запроса
    if (prompt.toLowerCase().includes('кратко')) {
        // Сокращаем текст
        result = text.split('. ').slice(0, Math.max(1, Math.floor(text.split('. ').length / 2))).join('. ');
    } else if (prompt.toLowerCase().includes('эмодзи') || prompt.toLowerCase().includes('emoji')) {
        // Добавляем эмодзи
        const emojis = ['😊', '👍', '⭐', '🔥', '❤️', '✨', '🎉', '📊', '📱', '🚀'];
        result = text.split('. ').map(sentence => 
            sentence + ' ' + emojis[Math.floor(Math.random() * emojis.length)]
        ).join('. ');
    } else if (prompt.toLowerCase().includes('формат') || prompt.toLowerCase().includes('форматирование')) {
        // Добавляем форматирование
        result = text.split('\n').map(paragraph => 
            paragraph.trim().length > 0 ? paragraph + '\n' : paragraph
        ).join('\n');
    } else {
        // По умолчанию - улучшаем текст (добавляем эмоциональности)
        const enhancers = [
            'отличный', 'замечательный', 'превосходный', 'великолепный', 
            'удивительный', 'потрясающий', 'уникальный', 'инновационный'
        ];
        result = text.replace(/\b(хороший|неплохой|нормальный)\b/gi, () => 
            enhancers[Math.floor(Math.random() * enhancers.length)]
        );
    }
    
    return result + '\n\n[Текст обработан с помощью ChatGPT]';
}

// Функция для обновления поста
async function updatePost(dayId, updatedFields, postIndex, project) {
    try {
        // Получаем проект
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        // Загружаем данные проекта
        const project = await window.filesystem.loadProjectData(projectId);
        
        // Получаем данные дня
        const dayData = project.days[dayId];
        if (!dayData || !dayData.posts || !Array.isArray(dayData.posts)) {
            console.error(`День ${dayId} не содержит постов или посты не являются массивом`);
            return false;
        }
        
        // Получаем пост
        const post = dayData.posts[postIndex];
        if (!post) {
            console.error(`Пост с индексом ${postIndex} не найден в дне ${dayId}`);
            return false;
        }
        
        // Обновляем поля поста
        Object.assign(post, updatedFields);
        
        // Обновляем дату последнего изменения, если она не была обновлена
        if (!updatedFields.lastModified) {
            post.lastModified = new Date().toISOString();
        }
        
        // Сохраняем обновленные данные
        await window.filesystem.updateProjectDay(projectId, dayId, dayData);
        
        // Перезагружаем календарь
        renderCalendar(project);
        
        console.log(`Пост ${postIndex} в дне ${dayId} обновлен`);
        return true;
    } catch (error) {
        console.error(`Ошибка при обновлении поста ${postIndex} в дне ${dayId}:`, error);
        return false;
    }
}

// Функция для перезагрузки изображений
async function reloadImages(imagesContainer, post, postElement, dayId, postIndex, project) {
    try {
        // Получаем ID проекта
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id') || project.id;
        
        // Очищаем контейнер
        imagesContainer.innerHTML = '';
        
        // Если есть новые файлы, которые пришли из input, загружаем их
        if (arguments.length > 6 && arguments[6] && arguments[6].files && arguments[6].files.length > 0) {
            const files = arguments[6].files;
            
            // Создаем массив изображений, если его нет
            if (!post.images) {
                post.images = [];
            }
            
            // Загружаем новые изображения
            for (const file of files) {
                try {
                    // Проверяем, инициализирована ли файловая система
                    const imagePath = await window.filesystem.saveImage(projectId, file);
                    if (imagePath) {
                        // Добавляем путь к изображению в пост
                        post.images.unshift(imagePath);
                        console.log(`Изображение ${imagePath} добавлено в пост`);
                    }
                } catch (error) {
                    console.error('Ошибка при сохранении изображения:', error);
                    showNotification('Ошибка при загрузке изображения', 'error');
                }
            }
            
            // Обновляем пост в хранилище, если известен его ID
            if (dayId && postIndex !== undefined) {
                await updatePost(dayId, { images: post.images }, postIndex, project);
            }
        }
        
        // Добавляем изображения в сетку (максимум 2 колонки)
        if (post.images && post.images.length > 0) {
            post.images.forEach((imagePath, index) => {
                const imagePreview = document.createElement('div');
                imagePreview.className = 'image-preview';
                
                // Добавляем атрибуты для drag and drop
                imagePreview.draggable = true;
                imagePreview.dataset.imagePath = imagePath;
                imagePreview.dataset.imageIndex = index;
                imagePreview.dataset.dayId = dayId;
                imagePreview.dataset.postIndex = postIndex;
                
                // Удаляем фиксированный aspect-ratio, чтобы установить его динамически
                imagePreview.style.aspectRatio = 'auto';
                
                const img = document.createElement('img');
                
                // Получаем URL изображения
                window.filesystem.getImage(projectId, imagePath)
                    .then(imageUrl => {
                        if (imageUrl) {
                            img.src = imageUrl;
                            
                            // Добавляем обработчик события загрузки изображения для определения пропорций
                            img.onload = function() {
                                // Если изображение загружено, проверяем его пропорции
                                const imgWidth = this.naturalWidth;
                                const imgHeight = this.naturalHeight;
                                const imgAspectRatio = imgWidth / imgHeight;
                                
                                // Определяем тип изображения и устанавливаем соответствующий aspect-ratio
                                if (imgAspectRatio > 1.2) {
                                    // Горизонтальное изображение (ширина > высота)
                                    imagePreview.style.aspectRatio = '16/9';
                                } else if (imgAspectRatio < 0.8) {
                                    // Вертикальное изображение (высота > ширина)
                                    imagePreview.style.aspectRatio = '9/16';
                                } else {
                                    // Квадратное или близкое к квадратному
                                    imagePreview.style.aspectRatio = '1/1';
                                }
                                
                                // Если изображение очень вытянутое, применяем дополнительные стили
                                if (imgAspectRatio > 3 || imgAspectRatio < 0.33) {
                                    img.style.maxWidth = '80%';
                                    img.style.maxHeight = '80%';
                                    imagePreview.style.display = 'flex';
                                    imagePreview.style.justifyContent = 'center';
                                    imagePreview.style.alignItems = 'center';
                                }
                            };
                        } else {
                            img.src = 'img/placeholder.jpg';
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка загрузки изображения:', error);
                        img.src = 'img/placeholder.jpg';
                    });
                
                imagePreview.appendChild(img);
                
                // Кнопка удаления изображения
                const removeBtn = document.createElement('button');
                removeBtn.className = 'image-remove';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Удалить это изображение?')) {
                        // Удаляем изображение из массива
                        const updatedImages = [...post.images];
                        updatedImages.splice(index, 1);
                        
                        // Обновляем пост
                        if (dayId && postIndex !== undefined) {
                            await updatePost(dayId, { images: updatedImages }, postIndex, project);
                        }
                    }
                });
                
                // Добавляем обработчики событий для перетаскивания
                imagePreview.addEventListener('dragstart', handleDragStart);
                imagePreview.addEventListener('dragover', handleDragOver);
                imagePreview.addEventListener('dragenter', handleDragEnter);
                imagePreview.addEventListener('dragleave', handleDragLeave);
                imagePreview.addEventListener('drop', handleDrop);
                imagePreview.addEventListener('dragend', handleDragEnd);
                
                imagePreview.appendChild(removeBtn);
                imagesContainer.appendChild(imagePreview);
            });
        }
        
        // Создаем кнопку добавления изображения с центрированной иконкой
        const newAddImageBtn = document.createElement('div');
        newAddImageBtn.className = 'image-preview add-image';
        
        // Устанавливаем квадратную форму для кнопки добавления
        newAddImageBtn.style.aspectRatio = '1/1';
        
        // Создаем контейнер для иконки, чтобы разместить ее по центру
        const addImageIcon = document.createElement('div');
        addImageIcon.className = 'add-image-icon';
        addImageIcon.innerHTML = '<i class="fas fa-plus"></i>';
        
        newAddImageBtn.appendChild(addImageIcon);
        
        newAddImageBtn.addEventListener('click', async () => {
            // Используем диалог выбора файла
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            
            input.addEventListener('change', async (e) => {
                if (input.files && input.files.length > 0) {
                    // Запускаем перезагрузку изображений с новыми файлами
                    await reloadImages(imagesContainer, post, postElement, dayId, postIndex, project, input);
                }
            });
            
            input.click();
        });
        
        // Добавляем обработчики перетаскивания для контейнера изображений
        imagesContainer.addEventListener('dragover', handleDragOver);
        imagesContainer.addEventListener('dragenter', handleDragEnter);
        imagesContainer.addEventListener('dragleave', handleDragLeave);
        imagesContainer.addEventListener('drop', handleDrop);
        
        imagesContainer.appendChild(newAddImageBtn);
        console.log('Изображения перезагружены успешно');
        
        return true;
    } catch (error) {
        console.error('Ошибка при перезагрузке изображений:', error);
        return false;
    }
}

// Функция для удаления дня
async function deleteDay(dayId, project) {
    try {
        console.log(`Удаление дня ${dayId}...`);
        
        // Получаем проект
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        // Загружаем данные проекта
        const project = await window.filesystem.loadProjectData(projectId);
        
        // Проверяем, существует ли день
        if (!project.days[dayId]) {
            console.error(`День ${dayId} не найден в проекте`);
            showNotification(`День ${dayId} не найден`, 'error');
            return false;
        }
        
        // Получаем порядок дней
        const daysOrder = project.order?.days || [];
        
        // Удаляем день из порядка
        const updatedOrder = daysOrder.filter(id => id !== dayId);
        
        // Обновляем порядок дней
        await updateDaysOrder(projectId, updatedOrder);
        
        // Удаляем файл дня
        const dayPath = `${projectId}/days/${dayId}.json`;
        await window.filesystem.deleteFile(dayPath);
        
        // Удаляем день из объекта проекта
        delete project.days[dayId];
        
        // Сохраняем проект без удаленного дня
        await window.filesystem.saveProjectData(projectId, project);
        
        // Перезагружаем календарь
        renderCalendar(project);
        
        console.log(`День ${dayId} удален`);
        showNotification('День удален', 'success');
        return true;
    } catch (error) {
        console.error(`Ошибка при удалении дня ${dayId}:`, error);
        showNotification('Ошибка при удалении дня', 'error');
        return false;
    }
}

// Функция для удаления поста
async function deletePost(dayId, postIndex, project) {
    try {
        console.log(`Удаление поста ${postIndex} из дня ${dayId}...`);
        
        // Получаем данные дня
        const dayData = project.days[dayId];
        if (!dayData || !dayData.posts || !Array.isArray(dayData.posts)) {
            console.error(`День ${dayId} не содержит постов или посты не являются массивом`);
            return false;
        }
        
        // Получаем пост для удаления
        const post = dayData.posts[postIndex];
        if (!post) {
            console.error(`Пост с индексом ${postIndex} не найден в дне ${dayId}`);
            return false;
        }
        
        // Удаляем пост из массива
        dayData.posts.splice(postIndex, 1);
        
        // Сохраняем обновленные данные
        await window.filesystem.updateProjectDay(project.id, dayId, dayData);
        
        console.log(`Пост ${postIndex} удален из дня ${dayId}`);
        showNotification('Пост удален', 'success');
        return true;
    } catch (error) {
        console.error(`Ошибка при удалении поста ${postIndex} из дня ${dayId}:`, error);
        showNotification('Ошибка при удалении поста', 'error');
        return false;
    }
}

// Функция для сортировки постов по дате
async function sortPostsByDate(dayId, project) {
    try {
        // Получаем данные дня
        const dayData = project.days[dayId];
        if (!dayData || !dayData.posts || !Array.isArray(dayData.posts)) {
            console.warn(`День ${dayId} не содержит постов для сортировки`);
            return false;
        }
        
        // Сортируем посты по дате создания (от новых к старым)
        dayData.posts.sort((a, b) => {
            const dateA = a.created ? new Date(a.created) : new Date(0);
            const dateB = b.created ? new Date(b.created) : new Date(0);
            return dateB - dateA; // От новых к старым
        });
        
        // Сохраняем обновленные данные дня
        await window.filesystem.updateProjectDay(project.id, dayId, dayData);
        
        // Перезагружаем календарь
        renderCalendar(project);
        
        console.log(`Посты в дне ${dayId} отсортированы по дате`);
        return true;
    } catch (error) {
        console.error(`Ошибка при сортировке постов в дне ${dayId}:`, error);
        return false;
    }
}

// Функция для сортировки дней по дате
async function sortDaysByDate(projectId, project) {
    try {
        console.log(`Сортировка дней проекта ${projectId} по дате...`);
        
        // Получаем список дней с их датами
        const daysWithDates = Object.entries(project.days).map(([dayId, dayData]) => {
            return {
                id: dayId,
                date: dayData.date ? new Date(dayData.date) : new Date(0)
            };
        });
        
        // Сортируем дни по дате (от старых к новым)
        daysWithDates.sort((a, b) => a.date - b.date);
        
        // Создаем новый порядок дней
        const newOrder = daysWithDates.map(day => day.id);
        
        // Обновляем порядок дней
        await updateDaysOrder(projectId, newOrder);
        
        console.log(`Дни проекта ${projectId} отсортированы по дате`);
        return true;
    } catch (error) {
        console.error(`Ошибка при сортировке дней проекта ${projectId}:`, error);
        return false;
    }
}

// Функция для закрытия всех выпадающих списков
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}
