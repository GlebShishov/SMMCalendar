// Функция для загрузки данных
function loadData() {
    return {
        projects: window.filesystem.getProjects()
    };
}

// Функция для создания нового проекта
function createProject(title, description) {
    const projectId = Date.now().toString();
    const newProject = {
        id: projectId,
        title,
        description,
        days: {}
    };
    
    window.filesystem.saveProjectData(projectId, newProject);
    return newProject;
}

// Функция для получения проекта по ID
function getProject(projectId) {
    return window.filesystem.loadProjectData(projectId);
}

// Функция для обновления дня в проекте
function updateProjectDay(projectId, date, dayData) {
    window.filesystem.updateProjectDay(projectId, date, dayData);
}

// Функция для удаления проекта
function deleteProject(projectId) {
    window.filesystem.deleteProject(projectId);
}

// Функция для сохранения изображения
function saveImage(projectId, imageFile) {
    return window.filesystem.saveImage(projectId, imageFile);
}

// Функция для удаления изображения
function deleteImage(projectId, fileName) {
    window.filesystem.deleteImage(projectId, fileName);
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
    return icons[network.toLowerCase()] || '📝';
}

// Функция для получения иконки типа контента
function getContentTypeIcon(type) {
    const icons = {
        text: '📝',
        image: '🖼️',
        video: '🎥',
        story: '📱',
        пост: '📝',
        фото: '🖼️',
        видео: '🎥'
    };
    return icons[type.toLowerCase()] || '📄';
} 