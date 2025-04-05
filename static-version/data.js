// Функция для загрузки данных из localStorage
function loadData() {
    const projectsData = localStorage.getItem('projects');
    return projectsData ? JSON.parse(projectsData) : {
        projects: [
            {
                id: '1',
                title: 'Тестовый проект',
                description: 'Описание тестового проекта',
                days: {
                    '2024-04-01': {
                        text: 'Тестовый пост',
                        socialNetwork: 'telegram',
                        contentType: 'text',
                        images: []
                    }
                }
            }
        ]
    };
}

// Функция для сохранения данных в localStorage
function saveData(data) {
    localStorage.setItem('projects', JSON.stringify(data));
}

// Функция для создания нового проекта
function createProject(title, description) {
    const data = loadData();
    const newProject = {
        id: Date.now().toString(),
        title,
        description,
        days: {}
    };
    data.projects.push(newProject);
    saveData(data);
    return newProject;
}

// Функция для получения проекта по ID
function getProject(projectId) {
    const data = loadData();
    return data.projects.find(p => p.id === projectId);
}

// Функция для обновления дня в проекте
function updateProjectDay(projectId, date, dayData) {
    const data = loadData();
    const project = data.projects.find(p => p.id === projectId);
    if (project) {
        project.days[date] = dayData;
        saveData(data);
    }
}

// Функция для удаления проекта
function deleteProject(projectId) {
    const data = loadData();
    data.projects = data.projects.filter(p => p.id !== projectId);
    saveData(data);
}

// Функция для форматирования даты
function formatDate(date) {
    return new Date(date).toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Функция для получения иконки социальной сети
function getSocialNetworkIcon(network) {
    const icons = {
        telegram: '📱',
        instagram: '📸',
        vk: '💬',
        facebook: '👥'
    };
    return icons[network] || '📝';
}

// Функция для получения иконки типа контента
function getContentTypeIcon(type) {
    const icons = {
        text: '📝',
        image: '🖼️',
        video: '🎥',
        story: '📱'
    };
    return icons[type] || '📄';
} 