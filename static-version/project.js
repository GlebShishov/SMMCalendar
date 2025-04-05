let currentProject = null;
let currentDate = null;
let quill = null;

// Инициализация страницы проекта
document.addEventListener('DOMContentLoaded', () => {
    // Получаем ID проекта из URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        alert('Проект не найден');
        window.location.href = 'index.html';
        return;
    }
    
    // Загружаем проект
    currentProject = getProject(projectId);
    if (!currentProject) {
        alert('Проект не найден');
        window.location.href = 'index.html';
        return;
    }
    
    // Устанавливаем заголовок проекта
    document.getElementById('project-title').textContent = currentProject.title;
    
    // Инициализируем редактор Quill
    quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Введите текст поста...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image']
            ]
        }
    });
    
    // Отображаем календарь
    renderCalendar();
    
    // Обработчики событий
    document.getElementById('save-post-btn').addEventListener('click', savePost);
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
});

// Функция для отображения календаря
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    
    // Получаем текущий месяц
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    // Создаем карточки для каждого дня
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];
        const dayData = currentProject.days[dateString] || {};
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card p-4';
        dayCard.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold">${day}</span>
                <button onclick="editDay('${dateString}')" class="text-blue-500 hover:text-blue-600">
                    ${dayData.text ? 'Редактировать' : 'Добавить'}
                </button>
            </div>
            ${dayData.text ? `
                <div class="flex items-center mb-2">
                    <span class="mr-2">${getSocialNetworkIcon(dayData.socialNetwork)}</span>
                    <span>${getContentTypeIcon(dayData.contentType)}</span>
                </div>
                <p class="text-sm text-gray-600">${dayData.text.substring(0, 100)}${dayData.text.length > 100 ? '...' : ''}</p>
            ` : ''}
        `;
        calendarGrid.appendChild(dayCard);
    }
}

// Функция для открытия модального окна редактирования дня
function editDay(date) {
    currentDate = date;
    const dayData = currentProject.days[date] || {};
    
    // Заполняем форму данными
    document.getElementById('post-date').textContent = formatDate(date);
    document.getElementById('social-network').value = dayData.socialNetwork || 'telegram';
    document.getElementById('content-type').value = dayData.contentType || 'text';
    quill.root.innerHTML = dayData.text || '';
    
    // Отображаем превью изображений
    const imagePreviewContainer = document.getElementById('image-preview');
    imagePreviewContainer.innerHTML = '';
    if (dayData.images && dayData.images.length > 0) {
        dayData.images.forEach(image => {
            const img = document.createElement('img');
            img.src = image;
            img.className = 'image-preview mb-2';
            imagePreviewContainer.appendChild(img);
        });
    }
    
    // Открываем модальное окно
    document.getElementById('edit-modal').classList.remove('hidden');
}

// Функция для сохранения поста
function savePost() {
    if (!currentDate) return;
    
    const dayData = {
        text: quill.root.innerHTML,
        socialNetwork: document.getElementById('social-network').value,
        contentType: document.getElementById('content-type').value,
        images: [] // В статической версии работа с изображениями упрощена
    };
    
    updateProjectDay(currentProject.id, currentDate, dayData);
    renderCalendar();
    closeModal();
}

// Функция для закрытия модального окна
function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    currentDate = null;
    quill.root.innerHTML = '';
} 