// DOM элементы
const projectsContainer = document.getElementById('projectsContainer');
const newProjectBtn = document.getElementById('new-project-btn');
const changeDirectoryBtn = document.getElementById('change-directory-btn');
const createProjectModal = document.getElementById('createProjectModal');
const createProjectForm = document.getElementById('createProjectForm');
const projectNameInput = document.getElementById('projectName');
const projectDescInput = document.getElementById('projectDescription');
const closeModalBtn = document.querySelector('.modal-close');
const cancelBtn = document.querySelector('.modal-cancel');

// Функция для инициализации страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Инициализируем тему
        initializeTheme();
        
        // Создаем экземпляр файловой системы, если он не существует
        if (!window.filesystem) {
            console.log('Создаем новый экземпляр файловой системы');
            window.filesystem = new FileSystem();
        }
        
        // Проверяем, готов ли filesystem
        if (window.filesystem.checkReady()) {
            console.log('Filesystem готов, загружаем проекты');
            loadProjects();
        } else {
            console.log('Filesystem не готов, проверяем localStorage');
            
            // Проверяем, есть ли в localStorage данные проектов
            const state = localStorage.getItem('filesystem_state');
            if (state) {
                try {
                    const parsedState = JSON.parse(state);
                    if (parsedState.isReady) {
                        console.log('Нашли данные в localStorage, но нужно переинициализировать filesystem');
                        showDirectorySelection('Необходимо выбрать директорию для проектов');
                        return;
                    }
                } catch (error) {
                    console.error('Ошибка при разборе состояния filesystem:', error);
                    // Очищаем некорректные данные
                    localStorage.removeItem('filesystem_state');
                    localStorage.removeItem('filesystem_root_handle');
                }
            }
            
            // Если filesystem не готов и нет данных в localStorage, показываем кнопку выбора директории
            showDirectorySelection();
        }
    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        showError(`Ошибка: ${error.message}`);
    }
});

// Функция для переключения темы
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Устанавливаем новую тему
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Сохраняем выбор пользователя в localStorage
    localStorage.setItem('theme', newTheme);
    
    // Обновляем иконку кнопки
    updateThemeButtonIcon(newTheme);
    
    // Показываем уведомление, если функция showNotification доступна
    if (typeof showNotification === 'function') {
        const themeName = newTheme === 'dark' ? 'темно-коричневая' : 'светлая';
        showNotification(`Применена ${themeName} тема`, 'success', 1500);
    }
}

// Функция для инициализации темы
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Обновляем иконку кнопки
    updateThemeButtonIcon(savedTheme);
}

// Функция для обновления иконки кнопки переключения темы
function updateThemeButtonIcon(theme) {
    const toggleBtn = document.getElementById('toggle-theme-btn');
    if (!toggleBtn) return;
    
    const iconElement = toggleBtn.querySelector('i');
    if (iconElement) {
        if (theme === 'dark') {
            iconElement.className = 'fas fa-sun';  // Солнце для темной темы (чтобы переключиться на светлую)
        } else {
            iconElement.className = 'fas fa-moon'; // Луна для светлой темы (чтобы переключиться на темную)
        }
    }
}

// Функция для отображения интерфейса выбора директории
function showDirectorySelection(message = 'Пожалуйста, выберите директорию с проектами SMM-календаря') {
    projectsContainer.innerHTML = `
        <div class="directory-selection">
            <p>${message}</p>
            <button id="select-directory-btn" class="btn">Выбрать директорию</button>
        </div>
    `;
    
    document.getElementById('select-directory-btn').addEventListener('click', async () => {
        try {
            console.log('Инициализация filesystem...');
            // Очищаем предыдущее состояние перед инициализацией
            localStorage.removeItem('filesystem_state');
            localStorage.removeItem('filesystem_root_handle');
            await window.filesystem.initialize();
            
            // Проверяем, что filesystem готов
            if (window.filesystem.checkReady()) {
                console.log('Filesystem успешно инициализирован, загружаем проекты');
                loadProjects();
            } else {
                console.log('Filesystem не был инициализирован');
                showError('Не удалось выбрать директорию. Пожалуйста, попробуйте снова.');
            }
        } catch (error) {
            console.error('Ошибка инициализации filesystem:', error);
            showError(`Ошибка: ${error.message}`);
        }
    });
}

// Функция для отображения ошибки
function showError(message) {
    projectsContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// Загрузка проектов
async function loadProjects() {
    try {
        // Проверяем, что filesystem готов
        if (!window.filesystem.checkReady()) {
            console.log('Filesystem не инициализирован, показываем форму выбора директории');
            showDirectorySelection();
            return;
        }
        
        console.log('Filesystem готов, запрашиваем список проектов');
        // Получаем список проектов
        const projects = await window.filesystem.getProjects();
        console.log('Получены проекты:', projects);
        
        // Очищаем контейнер
        projectsContainer.innerHTML = '';
        
        // Проверяем наличие проектов
        if (!projects || projects.length === 0) {
            showEmptyState();
            return;
        }
        
        // Отображаем проекты
        projects.forEach(project => {
            const projectCard = createProjectCard(project);
            projectsContainer.appendChild(projectCard);
        });
    } catch (error) {
        console.error('Ошибка при загрузке проектов:', error);
        
        if (error.message.includes('Cannot read properties of null') || 
            error.message.includes('не инициализирован')) {
            showDirectorySelection('Выберите директорию с проектами SMM-календаря');
        } else {
            showError(`Ошибка при загрузке проектов: ${error.message}`);
        }
    }
}

// Создание карточки проекта
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.id = project.id;
    
    // Форматируем дату
    const createdDate = new Date(project.created);
    const formattedDate = createdDate.toLocaleDateString();
    
    card.innerHTML = `
        <div class="project-title">${project.name}</div>
        <div class="project-description">${project.description || 'Нет описания'}</div>
        <div class="project-meta">
            <span class="project-date">Создан: ${formattedDate}</span>
        </div>
    `;
    
    // Добавляем обработчик на клик по карточке
    card.addEventListener('click', () => {
        window.location.href = `project.html?id=${project.id}`;
    });
    
    return card;
}

// Отображение пустого состояния
function showEmptyState() {
    projectsContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-folder-open"></i>
            <h3>Нет проектов</h3>
            <p>У вас пока нет проектов. Создайте новый проект, чтобы начать работу.</p>
            <button class="btn" id="create-first-project">Создать проект</button>
        </div>
    `;
    
    document.getElementById('create-first-project').addEventListener('click', openCreateProjectModal);
}

// Открытие модального окна для создания проекта
function openCreateProjectModal() {
    createProjectModal.classList.add('active');
    projectNameInput.focus();
}

// Закрытие модального окна
function closeCreateProjectModal() {
    createProjectModal.classList.remove('active');
    createProjectForm.reset();
}

// Создание нового проекта
async function createProject(event) {
    event.preventDefault();
    
    const projectName = projectNameInput.value.trim();
    const projectDesc = projectDescInput.value.trim();
    
    if (!projectName) {
        alert('Пожалуйста, введите название проекта');
        return;
    }
    
    try {
        // Генерируем ID проекта из названия
        const projectId = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        // Создаем мета-данные проекта
        const meta = {
            name: projectName,
            description: projectDesc,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Создаем директорию проекта и сохраняем мета-данные
        await window.filesystem.getDirectory(projectId);
        await window.filesystem.writeFile(`${projectId}/meta.json`, JSON.stringify(meta, null, 2));
        
        // Создаем директорию для дней
        await window.filesystem.getDirectory(`${projectId}/days`);
        
        // Создаем файл order.json с пустым списком дат
        await window.filesystem.writeFile(`${projectId}/order.json`, JSON.stringify({ dates: [] }, null, 2));
        
        // Закрываем модальное окно и обновляем список проектов
        closeCreateProjectModal();
        loadProjects();
        
        // Переходим на страницу проекта
        window.location.href = `project.html?id=${projectId}`;
    } catch (error) {
        console.error('Ошибка при создании проекта:', error);
        alert(`Ошибка при создании проекта: ${error.message}`);
    }
}

// Функция для изменения директории проектов
async function changeProjectsDirectory() {
    try {
        console.log('Изменение директории проектов...');
        // Запрашиваем новую директорию
        await window.filesystem.initialize();
        
        // Проверяем, что filesystem готов
        if (window.filesystem.checkReady()) {
            console.log('Новая директория выбрана успешно, загружаем проекты');
            loadProjects();
        } else {
            console.log('Не удалось выбрать новую директорию');
            alert('Не удалось выбрать директорию. Пожалуйста, попробуйте снова.');
        }
    } catch (error) {
        console.error('Ошибка при изменении директории:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

// Обработчики событий
newProjectBtn.addEventListener('click', openCreateProjectModal);
changeDirectoryBtn.addEventListener('click', changeProjectsDirectory);
closeModalBtn.addEventListener('click', closeCreateProjectModal);
cancelBtn.addEventListener('click', closeCreateProjectModal);
createProjectForm.addEventListener('submit', createProject);

// Добавляем обработчик для кнопки переключения темы
const toggleThemeBtn = document.getElementById('toggle-theme-btn');
if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', toggleTheme);
}

// Функция для отображения уведомлений
function showNotification(message, type = 'info', duration = 3000) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Добавляем уведомление в DOM
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Скрываем и удаляем уведомление через указанное время
    setTimeout(() => {
        notification.classList.remove('show');
        
        // Ждем окончания анимации и удаляем элемент
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
}

// Примечание: Код инициализации сайдбара перенесен в inline-скрипт в HTML файле 