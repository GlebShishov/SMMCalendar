let currentProject = null;
let currentDate = null;
let quill = null;
let currentImages = [];
let projectId;

// Создаем объект для хранения экземпляров Quill
const editors = new Map();

// Функция для создания редактора Quill
function createQuillEditor(container, initialContent, onChange) {
    // Проверяем, что контейнер передан
    if (!container) {
        console.error('Контейнер для Quill не передан');
        return null;
    }
    
    // Если передана строка ID вместо DOM элемента, находим элемент
    if (typeof container === 'string') {
        container = document.getElementById(container);
        if (!container) {
            console.error(`Контейнер с ID ${container} не найден в DOM`);
            return null;
        }
    }
    
    // Проверяем подключение к DOM
    const isConnected = document.body.contains(container);
    
    // Если контейнер не подключен к DOM, создаем отложенную инициализацию
    if (!isConnected) {
        console.warn('Контейнер для Quill не подключен к DOM, будет выполнена отложенная инициализация');
        
        // Создаем объект с методами Quill, который будет обновлен при подключении к DOM
        const deferredEditor = {
            container: container,
            initialContent: initialContent,
            onChangeCallback: onChange,
            quill: null,
            root: { innerHTML: initialContent },
            
            // Метод для инициализации редактора после добавления в DOM
            initialize: function() {
                // Если уже инициализирован, просто возвращаем
                if (this.quill) return;
                
                try {
                    // Проверяем, что контейнер теперь подключен к DOM
                    if (!document.body.contains(container)) {
                        console.error('Контейнер все еще не подключен к DOM при попытке инициализации');
                        return;
                    }
                    
                    // Инициализируем Quill с базовыми настройками
                    this.quill = new Quill(container, {
                        theme: 'snow',
                        modules: {
                            toolbar: [
                                ['bold', 'italic', 'underline'],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                ['link'],
                                ['clean']
                            ]
                        },
                        placeholder: 'Введите текст поста...'
                    });
                    
                    // Устанавливаем начальный контент, если он есть
                    if (this.initialContent) {
                        try {
                            this.quill.root.innerHTML = this.initialContent;
                            this.root = this.quill.root;
                        } catch (e) {
                            console.error('Ошибка при установке начального текста:', e);
                            this.quill.setText(this.initialContent);
                        }
                    }
                    
                    // Добавляем обработчик изменений с debounce
                    let timeout;
                    this.quill.on('text-change', () => {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            try {
                                this.onChangeCallback(this.quill.root.innerHTML);
                            } catch (e) {
                                console.error('Ошибка в обработчике изменений Quill:', e);
                            }
                        }, 300);
                    });
                    
                    // Добавляем обработчик для исправления фокуса
                    this.quill.root.addEventListener('blur', () => {
                        try {
                            this.onChangeCallback(this.quill.root.innerHTML);
                        } catch (e) {
                            console.error('Ошибка при потере фокуса редактора:', e);
                        }
                    });
                    
                    console.log('Quill успешно инициализирован после отложенной инициализации');
                } catch (error) {
                    console.error('Ошибка при отложенной инициализации редактора Quill:', error);
                }
            },
            
            // Методы эмуляции Quill
            getText: function() {
                if (this.quill) return this.quill.getText();
                // Если редактор еще не инициализирован, возвращаем текст из html
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.initialContent;
                return tempDiv.textContent || '';
            },
            
            setText: function(text) {
                if (this.quill) {
                    this.quill.setText(text);
                } else {
                    this.initialContent = text;
                    this.root.innerHTML = text;
                }
            }
        };
        
        // Создаем MutationObserver для отслеживания добавления в DOM
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Проверяем добавленные узлы
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const addedNode = mutation.addedNodes[i];
                    // Если добавлен наш контейнер или его родитель
                    if (addedNode === container || addedNode.contains(container)) {
                        // Инициализируем редактор
                        deferredEditor.initialize();
                        // Отключаем наблюдение
                        observer.disconnect();
                        break;
                    }
                }
            });
        });
        
        // Начинаем отслеживание добавления в DOM
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Добавляем дополнительный таймер для инициализации редактора 
        // на случай, если MutationObserver не сработает
        setTimeout(() => {
            if (!deferredEditor.quill && document.body.contains(container)) {
                console.log('Инициализация Quill по таймауту');
                deferredEditor.initialize();
                observer.disconnect();
            }
        }, 500);
        
        return deferredEditor;
    }
    
    // Проверяем, не инициализирован ли уже Quill для этого контейнера
    if (container.querySelector('.ql-editor')) {
        console.warn('Quill уже инициализирован для этого контейнера');
        const existingEditor = Array.from(editors.values())
            .find(editor => editor.container === container);
        if (existingEditor) {
            return existingEditor;
        }
        // Если не нашли в кэше, попробуем очистить и пересоздать
        container.innerHTML = '';
    }
    
    try {
        // Проверяем, что контейнер имеет достаточную высоту
        if (container.clientHeight < 50) {
            container.style.minHeight = '100px';
        }
        
        // Инициализируем редактор с базовыми настройками
        const quill = new Quill(container, {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            },
            placeholder: 'Введите текст поста...'
        });
        
        // Сохраняем редактор в Map для последующего доступа
        const editorId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        editors.set(editorId, quill);
        container.dataset.editorId = editorId;
        
        // Устанавливаем начальный контент, если он есть
        if (initialContent) {
            try {
                quill.root.innerHTML = initialContent;
            } catch (e) {
                console.error('Ошибка при установке начального текста:', e);
                quill.setText(initialContent);
            }
        }
        
        // Добавляем обработчик изменений с debounce
        let timeout;
        quill.on('text-change', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                try {
                    onChange(quill.root.innerHTML);
                } catch (e) {
                    console.error('Ошибка в обработчике изменений Quill:', e);
                }
            }, 300);
        });
        
        // Добавляем обработчик для исправления фокуса
        quill.root.addEventListener('blur', () => {
            try {
                onChange(quill.root.innerHTML);
            } catch (e) {
                console.error('Ошибка при потере фокуса редактора:', e);
            }
        });
        
        return quill;
    } catch (error) {
        console.error('Ошибка при создании редактора Quill:', error);
        
        // Запасной вариант - обычное текстовое поле
        container.innerHTML = '';
        const textarea = document.createElement('textarea');
        textarea.className = 'fallback-editor';
        textarea.style.width = '100%';
        textarea.style.minHeight = '100px';
        textarea.value = initialContent || '';
        textarea.placeholder = 'Введите текст поста...';
        
        textarea.addEventListener('input', () => {
            onChange(textarea.value);
        });
        
        container.appendChild(textarea);
        return null;
    }
}

// Инициализация проекта при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeProject();
    initializeEventListeners();
});

// Инициализация проекта
async function initializeProject() {
    try {
        // Проверяем, что файловая система инициализирована
        if (!window.filesystem || !window.filesystem.checkReady()) {
            console.log('Файловая система не готова, показываем экран выбора директории');
            showDirectorySelection();
            return;
        }

        // Получаем ID проекта из URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        if (!projectId) {
            console.error('ID проекта не указан в URL');
            showError('ID проекта не указан в URL. Пожалуйста, вернитесь на главную страницу и выберите проект.');
            return;
        }
        
        console.log(`Инициализация проекта с ID: ${projectId}`);

        // Загружаем проект и календарь
        try {
            await loadProject();
        } catch (error) {
            console.error('Ошибка при загрузке проекта:', error);
            showError('Не удалось загрузить проект. Пожалуйста, проверьте, что выбрана правильная директория и у вас есть права доступа.');
            return;
        }

        // Инициализируем сайдбар
        initializeSidebar();
        
        // Инициализируем обработчики событий
        initializeEventListeners();
        
        // Загружаем информацию о клиенте
        try {
            await loadClientInfo();
            console.log('Информация о клиенте загружена');
        } catch (error) {
            console.error('Ошибка при загрузке информации о клиенте:', error);
            // Не показываем ошибку пользователю, так как отсутствие информации о клиенте не критично
        }
        
        console.log('Проект успешно инициализирован');
    } catch (error) {
        console.error('Ошибка при инициализации проекта:', error);
        showError('Произошла ошибка при инициализации проекта.');
    }
}

// Функция для отображения интерфейса выбора директории
function showDirectorySelection(message = 'Пожалуйста, выберите директорию с проектами SMM-календаря') {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = `
        <div class="directory-selection">
            <p>${message}</p>
            <button id="select-directory-btn" class="btn">Выбрать директорию</button>
        </div>
    `;
    
    document.getElementById('select-directory-btn').addEventListener('click', async () => {
        try {
            console.log('Инициализация filesystem...');
            await window.filesystem.initialize();
            
            // Проверяем, что filesystem готов
            if (window.filesystem.checkReady()) {
                console.log('Filesystem успешно инициализирован, загружаем проект');
                loadProject();
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
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = `<div class="error-message">${message}</div>`;
}

// Загрузка проекта
async function loadProject() {
    try {
        // Получаем id проекта из URL
        const urlParams = new URLSearchParams(window.location.search);
        projectId = urlParams.get('id');
        
        if (!projectId) {
            console.error('ID проекта не указан в URL');
            showError('Не указан ID проекта. Вернитесь на главную страницу и выберите проект.');
            return null;
        }
        
        console.log('Загрузка проекта:', projectId);
        
        // Проверяем, что filesystem готов
        if (!window.filesystem.checkReady()) {
            console.log('Filesystem не инициализирован, показываем форму выбора директории');
            showDirectorySelection('Пожалуйста, выберите директорию с проектами');
            return null;
        }
        
        try {
            // Загружаем данные проекта
            const project = await window.filesystem.loadProjectData(projectId);
            console.log('Проект загружен:', project);
            
            if (!project || !project.days) {
                console.error('Проект пуст или не содержит дней');
                showError('Проект пуст или поврежден. Создайте новый проект или выберите другой.');
                return null;
            }
            
            // Отображаем календарь
            try {
                renderCalendar(project);
            } catch (renderError) {
                console.error('Ошибка при рендеринге календаря:', renderError);
                showError(`Ошибка при отображении календаря: ${renderError.message}`);
                return null;
            }
            
            return project;
        } catch (loadError) {
            console.error('Ошибка при загрузке данных проекта:', loadError);
            
            // Проверяем, существует ли директория проекта
            const dirExists = await window.filesystem.fileExists(projectId);
            if (!dirExists) {
                showError(`Проект "${projectId}" не найден в выбранной директории. Убедитесь, что выбрана правильная директория или создайте новый проект.`);
            } else {
                showError(`Ошибка при загрузке проекта: ${loadError.message}`);
            }
            
            return null;
        }
    } catch (error) {
        console.error('Ошибка при загрузке проекта:', error);
        
        // Определяем тип ошибки и выводим соответствующее сообщение
        if (error.message.includes('Cannot read properties of null') || 
            error.message.includes('не инициализирован')) {
            showDirectorySelection('Выберите директорию с проектами SMM-календаря');
        } else if (error.message.includes('showDirectoryPicker')) {
            showError('Выбор директории должен происходить в ответ на действие пользователя. Пожалуйста, нажмите кнопку "Выбрать директорию".');
        } else {
            showError(`Ошибка при загрузке проекта: ${error.message}`);
        }
        
        return null;
    }
}

// Функция инициализации сайдбара
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtn = document.getElementById('toggleSidebar');
    const clientInfoBtn = document.getElementById('client-info-btn');
    const clientInfoModal = document.getElementById('clientInfoModal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const saveClientInfoBtn = document.getElementById('saveClientInfo');
    
    // Получаем сохраненное состояние сайдбара
    const isSidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    
    // Устанавливаем начальное состояние
    if (isSidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
    }
    
    // Обработчик кнопки скрытия/разворачивания сайдбара
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
        
        // Сохраняем состояние сайдбара
        localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
    });
    
    // Обработчик кнопки "О клиенте"
    if (clientInfoBtn) {
        clientInfoBtn.addEventListener('click', () => {
            // Загружаем информацию о клиенте при открытии модального окна
            document.getElementById('clientInfoModal').classList.add('active');
        });
    }
    
    // Обработчики закрытия модального окна
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            clientInfoModal.classList.remove('active');
        });
    });
    
    // Закрытие модального окна при клике вне его содержимого
    clientInfoModal.addEventListener('click', (e) => {
        if (e.target === clientInfoModal) {
            clientInfoModal.classList.remove('active');
        }
    });
    
    // Обработчик сохранения информации о клиенте
    if (saveClientInfoBtn) {
        saveClientInfoBtn.addEventListener('click', saveClientInfo);
    }
    
    // Обновляем информацию о проекте в сайдбаре
    updateProjectInfo();
}

// Функция для загрузки информации о клиенте
function loadClientInfo() {
    console.log('Загрузка информации о клиенте...');
    
    // Получаем ID проекта из URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        console.error('ID проекта не найден в URL');
        return;
    }
    
    // Получаем директорию проекта
    const projectDirectory = localStorage.getItem('selectedDirectory');
    if (!projectDirectory) {
        console.error('Директория проекта не найдена');
        return;
    }
    
    // Формируем путь к файлу с информацией о клиенте
    const clientInfoFilePath = `${projectDirectory}/projects/${projectId}/client-info.json`;
    
    // Проверяем существование и загружаем файл
    window.filesystem.readFile(clientInfoFilePath)
        .then(data => {
            try {
                const clientData = JSON.parse(data);
                console.log('Информация о клиенте загружена:', clientData);
                
                // Заполняем поля формы полученными данными
                document.getElementById('clientName').value = clientData.name || '';
                document.getElementById('clientWebsite').value = clientData.website || '';
                document.getElementById('clientPhone').value = clientData.phone || '';
                document.getElementById('clientEmail').value = clientData.email || '';
                document.getElementById('clientAddress').value = clientData.address || '';
                
                // Заполняем социальные сети
                document.getElementById('clientInstagram').value = clientData.socialNetworks?.instagram || '';
                document.getElementById('clientTelegram').value = clientData.socialNetworks?.telegram || '';
                document.getElementById('clientVk').value = clientData.socialNetworks?.vk || '';
                document.getElementById('clientFacebook').value = clientData.socialNetworks?.facebook || '';
                
                // Заполняем информацию о бренде
                document.getElementById('clientDescription').value = clientData.brandInfo?.description || '';
                document.getElementById('clientUsp').value = clientData.brandInfo?.usp || '';
                document.getElementById('clientTargetAudience').value = clientData.brandInfo?.targetAudience || '';
                document.getElementById('clientPriceRange').value = clientData.brandInfo?.priceRange || '';
                
                // Заполняем гайдлайн для контента
                document.getElementById('clientToneOfVoice').value = clientData.contentGuidelines?.toneOfVoice || '';
                document.getElementById('clientMainTopics').value = clientData.contentGuidelines?.mainTopics || '';
                document.getElementById('clientForbiddenTopics').value = clientData.contentGuidelines?.forbiddenTopics || '';
                document.getElementById('clientHashtags').value = clientData.contentGuidelines?.hashtags || '';
                
                // Заполняем настройки дизайна
                document.getElementById('clientBrandColors').value = clientData.designSettings?.brandColors || '';
                document.getElementById('clientPrimaryFont').value = clientData.designSettings?.primaryFont || '';
                document.getElementById('clientSecondaryFont').value = clientData.designSettings?.secondaryFont || '';
                document.getElementById('clientMainLogo').value = clientData.designSettings?.mainLogo || '';
                document.getElementById('clientAltLogo').value = clientData.designSettings?.altLogo || '';
                
                // Заполняем служебную информацию
                document.getElementById('clientCreated').value = 
                    clientData.metaInfo?.created ? 
                    new Date(clientData.metaInfo.created).toLocaleString() : 
                    new Date().toLocaleString();
                    
                document.getElementById('clientLastModified').value = 
                    clientData.metaInfo?.lastModified ? 
                    new Date(clientData.metaInfo.lastModified).toLocaleString() : 
                    new Date().toLocaleString();
                
                // Добавляем пользовательские поля социальных сетей
                if (clientData.customSocialNetworks && Object.keys(clientData.customSocialNetworks).length > 0) {
                    const container = document.getElementById('additionalFieldsContainer');
                    
                    // Очищаем существующие поля, которые могли быть добавлены ранее
                    container.innerHTML = '';
                    
                    // Добавляем каждую пользовательскую социальную сеть
                    Object.entries(clientData.customSocialNetworks).forEach(([name, url]) => {
                        // Пропускаем, если название начинается с 'custom_'
                        if (name.startsWith('custom_')) return;
                        
                        const fieldId = `socialField_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        
                        const fieldGroup = document.createElement('div');
                        fieldGroup.className = 'form-group social-field';
                        
                        const inputGroup = document.createElement('div');
                        inputGroup.className = 'input-group';
                        inputGroup.style.display = 'flex';
                        
                        const input = document.createElement('input');
                        input.type = 'url';
                        input.id = fieldId;
                        input.className = 'form-control custom-social';
                        input.value = `${name}: ${url}`;
                        input.style.flex = '1';
                        
                        const removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'btn btn-danger remove-field';
                        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                        removeBtn.style.marginLeft = '10px';
                        removeBtn.addEventListener('click', function() {
                            container.removeChild(fieldGroup);
                        });
                        
                        inputGroup.appendChild(input);
                        inputGroup.appendChild(removeBtn);
                        fieldGroup.appendChild(inputGroup);
                        
                        container.appendChild(fieldGroup);
                    });
                }
            } catch (error) {
                console.error('Ошибка при разборе данных клиента:', error);
            }
        })
        .catch(error => {
            console.warn('Не удалось загрузить информацию о клиенте:', error);
            // Если файл не существует, это нормально - просто начинаем с пустой формы
            // Устанавливаем только текущую дату для поля "Дата создания"
            document.getElementById('clientCreated').value = new Date().toLocaleString();
            document.getElementById('clientLastModified').value = new Date().toLocaleString();
        });
}

// Функция для создания дополнительного поля
function createAdditionalField(container, key, value) {
    // Создаем секцию, если ее еще нет
    let additionalSection = container.querySelector('.form-section');
    if (!additionalSection) {
        additionalSection = document.createElement('div');
        additionalSection.className = 'form-section';
        
        const sectionTitle = document.createElement('h4');
        sectionTitle.textContent = 'Дополнительные поля';
        additionalSection.appendChild(sectionTitle);
        
        container.appendChild(additionalSection);
    }
    
    // Создаем новое поле
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group additional-field';
    
    // Преобразуем ключ в более читаемый формат
    const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    
    // Создаем метку
    const label = document.createElement('label');
    label.setAttribute('for', `clientField_${key}`);
    label.textContent = fieldLabel;
    
    // Определяем тип поля в зависимости от значения
    let input;
    if (typeof value === 'object') {
        // Для объектов используем textarea с JSON
        input = document.createElement('textarea');
        input.className = 'form-control';
        input.rows = 5;
        input.value = JSON.stringify(value, null, 2);
    } else if (typeof value === 'string' && value.length > 50) {
        // Для длинных строк используем textarea
        input = document.createElement('textarea');
        input.className = 'form-control';
        input.rows = 3;
        input.value = value;
    } else {
        // Для коротких строк и других типов используем input
        input = document.createElement('input');
        input.className = 'form-control';
        input.type = 'text';
        input.value = value || '';
    }
    
    input.id = `clientField_${key}`;
    input.name = key;
    input.dataset.fieldKey = key;
    input.dataset.valueType = typeof value === 'object' ? 'json' : typeof value;
    
    // Создаем кнопку удаления
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn btn-danger btn-sm remove-field';
    removeButton.textContent = 'Удалить';
    removeButton.addEventListener('click', () => {
        formGroup.remove();
    });
    
    // Добавляем элементы в форму
    formGroup.appendChild(label);
    formGroup.appendChild(input);
    formGroup.appendChild(removeButton);
    
    // Добавляем новое поле в секцию
    additionalSection.appendChild(formGroup);
}

// Сохранение информации о клиенте
async function saveClientInfo(defaultData = null) {
    try {
        // Получаем ID проекта из URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        if (!projectId) {
            console.error('Не указан ID проекта');
            alert('Ошибка: не удалось определить ID проекта');
            return;
        }
        
        // Путь к файлу с информацией о клиенте
        const clientInfoPath = `${projectId}/client_info.json`;
        
        // Если переданы данные по умолчанию, используем их
        if (defaultData) {
            // Сохраняем данные
            await window.filesystem.writeFile(clientInfoPath, JSON.stringify(defaultData, null, 2));
            return;
        }
        
        // Собираем данные из формы
        const clientInfo = {
            name: document.getElementById('clientName').value,
            website: document.getElementById('clientWebsite').value,
            contacts: document.getElementById('clientPhone').value,
            email: document.getElementById('clientEmail').value,
            address: document.getElementById('clientAddress').value,
            socialAccounts: {
                instagram: document.getElementById('clientInstagram').value,
                telegram: document.getElementById('clientTelegram').value,
                vk: document.getElementById('clientVk').value,
                facebook: document.getElementById('clientFacebook').value
            },
            description: document.getElementById('clientDescription').value,
            usp: document.getElementById('clientUsp').value,
            targetAudience: document.getElementById('clientTargetAudience').value,
            priceRange: document.getElementById('clientPriceRange').value,
            toneOfVoice: document.getElementById('clientToneOfVoice').value,
            mainTopics: document.getElementById('clientMainTopics').value,
            forbiddenTopics: document.getElementById('clientForbiddenTopics').value,
            hashtags: document.getElementById('clientHashtags').value,
            brandColors: document.getElementById('clientBrandColors').value,
            primaryFont: document.getElementById('clientPrimaryFont').value,
            secondaryFont: document.getElementById('clientSecondaryFont').value,
            mainLogo: document.getElementById('clientMainLogo').value,
            altLogo: document.getElementById('clientAltLogo').value,
            created: document.getElementById('clientCreated').value,
            lastModified: new Date().toISOString()
        };
        
        // Собираем пользовательские поля
        const customSocialFields = document.querySelectorAll('.custom-social-field input');
        customSocialFields.forEach(field => {
            const fieldName = field.dataset.fieldName;
            if (fieldName) {
                clientInfo.socialAccounts[fieldName] = field.value;
            }
        });
        
        // Собираем дополнительные поля
        const additionalFields = document.querySelectorAll('.additional-field [data-field-key]');
        additionalFields.forEach(field => {
            const key = field.dataset.fieldKey;
            const valueType = field.dataset.valueType || 'string';
            
            if (key) {
                let value = field.value;
                
                // Если тип данных - JSON, пытаемся распарсить
                if (valueType === 'json') {
                    try {
                        value = JSON.parse(value);
                    } catch (error) {
                        console.error(`Ошибка при разборе JSON для поля ${key}:`, error);
                        // Оставляем строку, если не удалось распарсить
                    }
                }
                
                clientInfo[key] = value;
            }
        });
        
        // Сохраняем данные
        await window.filesystem.writeFile(clientInfoPath, JSON.stringify(clientInfo, null, 2));
        
        console.log('Информация о клиенте сохранена');
        
        // Закрываем модальное окно
        document.getElementById('clientInfoModal').classList.remove('active');
        
        // Показываем уведомление
        alert('Информация о клиенте успешно сохранена');
        
    } catch (error) {
        console.error('Ошибка при сохранении информации о клиенте:', error);
        alert('Произошла ошибка при сохранении информации о клиенте');
    }
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

// Функция для обновления информации о проекте в сайдбаре
async function updateProjectInfo() {
    try {
        // Путь к файлу с информацией о проекте
        const metaPath = `${projectId}/meta.json`;
        
        // Читаем файл
        const metaData = await window.filesystem.readFile(metaPath);
        let meta = {};
        
        if (metaData) {
            try {
                meta = JSON.parse(metaData);
            } catch (error) {
                console.error('Ошибка при разборе JSON метаданных проекта:', error);
            }
        }
        
        // Обновляем информацию в сайдбаре
        const projectNameElement = document.getElementById('projectName');
        const projectDescriptionElement = document.getElementById('projectDescription');
        
        if (projectNameElement) {
            projectNameElement.textContent = meta.name || projectId;
        }
        
        if (projectDescriptionElement) {
            projectDescriptionElement.textContent = meta.description || 'Нет описания';
        }
        
    } catch (error) {
        console.error('Ошибка при обновлении информации о проекте:', error);
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

// Добавление нового дня
async function addNewDay() {
    try {
        // Получаем id проекта из URL
        const urlParams = new URLSearchParams(window.location.search);
        const currentProjectId = urlParams.get('id');
        
        if (!currentProjectId) {
            console.error('Не указан ID проекта');
            alert('Ошибка: не удалось определить ID проекта');
            return;
        }
        
        // Получаем директорию проекта
        const projectDir = await window.filesystem.getDirectory(currentProjectId);
        
        // Создаем директорию для дней, если её нет
        let daysDir;
        try {
            daysDir = await projectDir.getDirectoryHandle('days', { create: true });
        } catch (error) {
            console.error('Ошибка при создании директории дней:', error);
            alert('Не удалось создать директорию для дней проекта');
            return;
        }
        
        // Получаем текущую дату в формате ISO
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        // Загружаем проект для получения актуальных данных
        const projectData = await window.filesystem.loadProjectData(currentProjectId);
        
        // Получаем текущий порядок дней
        let daysOrder = projectData.order?.days || [];
        console.log('Текущий порядок дней:', daysOrder);
        
        // Находим максимальный индекс дня
        let maxDayNumber = 0;
        daysOrder.forEach(dayId => {
            const dayNumber = parseInt(dayId.replace('day_', ''), 10);
            if (!isNaN(dayNumber) && dayNumber > maxDayNumber) {
                maxDayNumber = dayNumber;
            }
        });
        
        // Создаем уникальный идентификатор для нового дня
        const newDayNumber = maxDayNumber + 1;
        const dayId = `day_${newDayNumber}`;
        console.log(`Создаем новый день с ID: ${dayId}`);
        
        // Проверяем существование дня с таким ID
        try {
            await daysDir.getFileHandle(`${dayId}.json`);
            alert(`День с ID ${dayId} уже существует.`);
            return;
        } catch (error) {
            // День не существует, можно создавать
        }
        
        // Создаем новый день
        const newDay = {
            date: formattedDate,
            posts: [
                {
                    socialNetwork: 'Telegram',
                    contentType: 'Пост',
                    images: [],
                    text: '',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            ]
        };
        
        // Сохраняем файл дня
        try {
            const dayFileHandle = await daysDir.getFileHandle(`${dayId}.json`, { create: true });
            const writable = await dayFileHandle.createWritable();
            await writable.write(JSON.stringify(newDay, null, 2));
            await writable.close();
            console.log(`День ${dayId} успешно создан`);
        } catch (error) {
            console.error('Ошибка при создании файла дня:', error);
            alert('Не удалось создать файл дня');
            return;
        }
        
        // Добавляем день в порядок дней
        if (!daysOrder.includes(dayId)) {
            daysOrder.push(dayId);
            console.log(`День ${dayId} добавлен в порядок дней:`, daysOrder);
            await updateDaysOrder(currentProjectId, daysOrder);
        }
        
        // Очищаем неиспользуемые изображения
        await cleanupUnusedImages(currentProjectId);
        
        // Перезагружаем проект с актуальными данными
        const updatedProject = await window.filesystem.loadProjectData(currentProjectId);
        console.log('Перерисовываем календарь с обновленным проектом:', updatedProject);
        renderCalendar(updatedProject);
        
        console.log('Новый день добавлен успешно');
    } catch (error) {
        console.error('Ошибка при добавлении нового дня:', error);
        alert('Произошла ошибка при добавлении нового дня');
    }
}

// Функция очистки неиспользуемых изображений
async function cleanupUnusedImages(projectId) {
    try {
        console.log('Начинаем очистку неиспользуемых изображений...');
        
        // Получаем все дни проекта
        const project = await window.filesystem.loadProjectData(projectId);
        
        // Собираем все используемые изображения
        const usedImages = new Set();
        for (const dayId in project.days) {
            const dayData = project.days[dayId];
            if (dayData.posts) {
                dayData.posts.forEach(post => {
                    if (post.images && Array.isArray(post.images)) {
                        post.images.forEach(imagePath => {
                            usedImages.add(imagePath);
                        });
                    }
                });
            }
        }
        
        // Получаем все файлы в директории изображений
        try {
            // Получаем директорию проекта
            const projectDir = await window.filesystem.getDirectory(projectId);
            
            // Проверяем, существует ли директория изображений
            let imagesDir;
            try {
                imagesDir = await projectDir.getDirectoryHandle('images', { create: false });
            } catch (error) {
                console.log('Директория изображений не найдена, нечего удалять');
                return;
            }
            
            // Получаем список всех файлов в директории изображений
            const allImages = [];
            for await (const entry of imagesDir.values()) {
                if (entry.kind === 'file') {
                    allImages.push(entry.name);
                }
            }
            
            // Удаляем неиспользуемые изображения
            let deletedCount = 0;
            for (const imageName of allImages) {
                const imagePath = `images/${imageName}`;
                if (!usedImages.has(imagePath)) {
                    try {
                        await imagesDir.removeEntry(imageName);
                        deletedCount++;
                        console.log(`Удалено неиспользуемое изображение: ${imageName}`);
                    } catch (error) {
                        console.error(`Ошибка при удалении изображения ${imageName}:`, error);
                    }
                }
            }
            
            console.log(`Очистка завершена: удалено ${deletedCount} неиспользуемых изображений`);
        } catch (error) {
            console.error('Ошибка при очистке изображений:', error);
        }
    } catch (error) {
        console.error('Ошибка при очистке неиспользуемых изображений:', error);
    }
}

// Создание колонки дня
function createDayColumn(dayId, dayData = null) {
    // Проверяем аргументы
    console.log(`Создание колонки дня ${dayId}`, dayData);
    
    // Создаем контейнер для дня
    const dayColumn = document.createElement('div');
    dayColumn.className = 'day-column';
    dayColumn.dataset.dayId = dayId;
    
    // Получаем номер дня из ID
    const dayNumber = parseInt(dayId.replace('day_', ''), 10);
    
    // Номер дня в левом верхнем углу
    const dayNumberDisplay = document.createElement('div');
    dayNumberDisplay.className = 'day-number-display';
    dayNumberDisplay.textContent = `День ${dayNumber}`;
    dayColumn.appendChild(dayNumberDisplay);
    
    // Создаем заголовок с датой
    const dateHeader = document.createElement('div');
    dateHeader.className = 'date-header';
    
    // Форматируем дату для отображения
    const date = dayData?.date || new Date().toISOString().split('T')[0];
    
    // Создаем контейнер для даты
    const dateContainer = document.createElement('div');
    dateContainer.className = 'date-container';
    
    // Текстовое отображение даты
    const dateDisplay = document.createElement('span');
    dateDisplay.className = 'date-display';
    dateDisplay.textContent = formatDate(new Date(date));
    dateContainer.appendChild(dateDisplay);
    
    // Кнопка выбора даты
    const dateSelector = document.createElement('input');
    dateSelector.type = 'date';
    dateSelector.className = 'date-selector';
    dateSelector.value = date;
    dateSelector.addEventListener('change', (e) => {
        const newDate = e.target.value;
        updateDayDate(dayId, newDate);
        dateDisplay.textContent = formatDate(new Date(newDate));
    });
    
    // Кнопка календаря
    const calendarButton = document.createElement('button');
    calendarButton.className = 'calendar-button';
    calendarButton.innerHTML = '<i class="fas fa-calendar-alt"></i>';
    calendarButton.title = 'Выбрать дату';
    calendarButton.addEventListener('click', () => {
        dateSelector.showPicker();
    });
    
    dateContainer.appendChild(calendarButton);
    
    // Добавляем невидимый селектор даты
    dateSelector.style.display = 'none';
    dateContainer.appendChild(dateSelector);

    dateHeader.appendChild(dateContainer);
    
    // Кнопка удаления дня
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-day-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Удалить день';
    deleteBtn.addEventListener('click', () => {
        if (confirm(`Вы уверены, что хотите удалить день ${formatDate(new Date(date))}?`)) {
            deleteDay(dayId);
        }
    });
    
    // Кнопка сортировки постов
    const sortPostsBtn = document.createElement('button');
    sortPostsBtn.className = 'sort-posts-btn';
    sortPostsBtn.innerHTML = '<i class="fas fa-sort"></i>';
    sortPostsBtn.title = 'Сортировать посты по дате';
    sortPostsBtn.addEventListener('click', () => {
        sortPostsByDate(dayId);
    });
    
    dateHeader.appendChild(sortPostsBtn);
    dateHeader.appendChild(deleteBtn);
    dayColumn.appendChild(dateHeader);
    
    // Контейнер для постов
    const postsContainer = document.createElement('div');
    postsContainer.className = 'posts-container';
    
    // Если есть данные дня, заполняем их
    if (dayData && dayData.posts) {
        // Сортируем посты по дате создания (от новых к старым)
        const sortedPosts = [...dayData.posts].sort((a, b) => {
            const dateA = a.created ? new Date(a.created) : new Date(0);
            const dateB = b.created ? new Date(b.created) : new Date(0);
            return dateB - dateA; // От новых к старым
        });
        
        // Создаем элементы для каждого поста
        sortedPosts.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    } else {
        // Создаем пустой пост
        const emptyPost = {
            socialNetwork: 'Telegram',
            contentType: 'Пост',
            images: [],
            text: '',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        const postElement = createPostElement(emptyPost);
        postsContainer.appendChild(postElement);
    }
    
    dayColumn.appendChild(postsContainer);
    
    // Кнопка добавления поста
    const addPostBtn = document.createElement('button');
    addPostBtn.className = 'add-post-btn';
    addPostBtn.textContent = '+ Добавить публикацию';
    addPostBtn.addEventListener('click', () => {
        // Создаем новый пост
        const newPost = {
            socialNetwork: 'Telegram',
            contentType: 'Пост',
            images: [],
            text: '',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Добавляем пост в DOM
        const postElement = createPostElement(newPost);
        postsContainer.appendChild(postElement);
        
        // Добавляем пост в день
        const dayColumn = postElement.closest('.day-column');
        if (dayColumn) {
            const dayId = dayColumn.dataset.dayId;
            
            // Получаем данные дня
            const urlParams = new URLSearchParams(window.location.search);
            const projectId = urlParams.get('id');
            
            window.filesystem.loadProjectData(projectId)
                .then(project => {
                    const dayData = project.days[dayId];
                    if (!dayData.posts) {
                        dayData.posts = [];
                    }
                    
                    // Добавляем пост в начало списка
                    dayData.posts.unshift(newPost);
                    
                    // Обновляем день
                    window.filesystem.updateProjectDay(projectId, dayId, dayData)
                        .then(result => {
                            console.log(`Пост добавлен в день ${dayId}`);
                        })
                        .catch(error => {
                            console.error(`Ошибка при обновлении дня ${dayId}:`, error);
                        });
                })
                .catch(error => {
                    console.error('Ошибка при загрузке проекта:', error);
                });
        }
    });
    
    dayColumn.appendChild(addPostBtn);
    
    return dayColumn;
}

// Обновление даты дня
async function updateDayDate(dayId, newDate) {
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
        await sortDaysByDate(projectId);
        
        // Перезагружаем календарь, чтобы отразить изменения
        const project = await window.filesystem.loadProjectData(projectId);
        renderCalendar(project);
        
        return true;
    } catch (error) {
        console.error(`Ошибка при обновлении даты дня ${dayId}:`, error);
        return false;
    }
}

// Сортировка дней по дате
async function sortDaysByDate(projectId) {
    try {
        // Загружаем проект
        const project = await window.filesystem.loadProjectData(projectId);
        
        // Собираем информацию о днях с датами
        const daysWithDates = [];
        for (const dayId in project.days) {
            daysWithDates.push({
                id: dayId,
                date: project.days[dayId].date || '2099-12-31' // Если нет даты, ставим далекую дату
            });
        }
        
        // Сортируем по дате
        daysWithDates.sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            return 0;
        });
        
        // Обновляем порядок дней
        const newOrder = daysWithDates.map(day => day.id);
        await updateDaysOrder(projectId, newOrder);
        
        return true;
    } catch (error) {
        console.error('Ошибка при сортировке дней по дате:', error);
        return false;
    }
}

// Функция для удаления дня
async function deleteDay(dayId) {
    try {
        // Получаем ID проекта из URL
        const urlParams = new URLSearchParams(window.location.search);
        const currentProjectId = urlParams.get('id');
        
        if (!currentProjectId) {
            console.error('Не указан ID проекта');
            alert('Ошибка: не удалось определить ID проекта');
            return;
        }
        
        // Получаем директорию проекта
        const projectDir = await window.filesystem.getDirectory(currentProjectId);
        
        // Получаем директорию дней
        let daysDir;
        try {
            daysDir = await projectDir.getDirectoryHandle('days', { create: false });
        } catch (error) {
            console.error('Ошибка при получении директории дней:', error);
            alert('Директория дней не найдена');
            return;
        }
        
        // Удаляем файл дня
        try {
            await daysDir.removeEntry(`${dayId}.json`);
            console.log(`День ${dayId} успешно удален`);
        } catch (error) {
            console.error(`Ошибка при удалении файла дня ${dayId}:`, error);
            alert(`Не удалось удалить день ${dayId}`);
            return;
        }
        
        // Получаем текущий порядок дней
        let daysOrder = await getDaysOrder(currentProjectId);
        
        // Удаляем день из списка
        daysOrder = daysOrder.filter(day => day !== dayId);
        
        // Сохраняем обновленный список дней
        await updateDaysOrder(currentProjectId, daysOrder);
        
        // Очищаем неиспользуемые изображения после удаления дня
        await cleanupUnusedImages(currentProjectId);
        
        // Если мы удалили последний день, создаем новый
        if (daysOrder.length === 0) {
            await addNewDay();
        } else {
            // Обновляем проект и перерисовываем календарь
            const project = await window.filesystem.loadProjectData(currentProjectId);
            renderCalendar(project);
        }
    } catch (error) {
        console.error('Ошибка при удалении дня:', error);
        alert('Произошла ошибка при удалении дня');
    }
}

// Инициализация горизонтального скролла
function initializeHorizontalScroll() {
    const calendarGrid = document.getElementById('calendarGrid');
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');

    if (!calendarGrid || !scrollLeftBtn || !scrollRightBtn) return;

    // Функция для обновления состояния кнопок
    function updateScrollButtons() {
        // Проверяем возможность скролла влево
        scrollLeftBtn.classList.toggle('disabled', calendarGrid.scrollLeft <= 0);

        // Проверяем возможность скролла вправо
        const maxScroll = calendarGrid.scrollWidth - calendarGrid.clientWidth;
        scrollRightBtn.classList.toggle('disabled', calendarGrid.scrollLeft >= maxScroll);
    }

    // Обработчики для кнопок скролла
    scrollLeftBtn.addEventListener('click', () => {
        if (scrollLeftBtn.classList.contains('disabled')) return;
        
        const columnWidth = calendarGrid.querySelector('.day-column')?.offsetWidth || 0;
        const scrollAmount = columnWidth + 20; // 20px - это gap между колонками
        
        calendarGrid.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    scrollRightBtn.addEventListener('click', () => {
        if (scrollRightBtn.classList.contains('disabled')) return;
        
        const columnWidth = calendarGrid.querySelector('.day-column')?.offsetWidth || 0;
        const scrollAmount = columnWidth + 20; // 20px - это gap между колонками
        
        calendarGrid.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Обновляем состояние кнопок при скролле
    calendarGrid.addEventListener('scroll', updateScrollButtons);

    // Обновляем состояние кнопок при изменении размера окна
    window.addEventListener('resize', updateScrollButtons);

    // Инициализируем начальное состояние
    updateScrollButtons();
}

// Функция для безопасного уничтожения редактора Quill
function safeDestroyEditor(editor) {
    if (!editor) return;
    
    try {
        // Отключаем все обработчики событий Quill
        if (editor.emitter && typeof editor.emitter.removeAllListeners === 'function') {
            editor.emitter.removeAllListeners();
        }
        
        // Удаляем DOM элементы
        if (editor.container) {
            // Удаляем тулбар, чтобы избежать утечек памяти
            const toolbar = editor.container.querySelector('.ql-toolbar');
            if (toolbar) {
                toolbar.parentNode.removeChild(toolbar);
            }
            
            // Очищаем содержимое контейнера редактора
            const editorContainer = editor.container.querySelector('.ql-editor');
            if (editorContainer) {
                editorContainer.innerHTML = '';
            }
            
            // Если есть возможность, позволяем Quill самому очистить свои ресурсы
            if (typeof editor.destroy === 'function') {
                editor.destroy();
            }
        }
    } catch (error) {
        console.error('Ошибка при уничтожении редактора Quill:', error);
    }
    
    // Убеждаемся, что все ссылки на редактор удалены
    return null;
}

// Отображение календаря
function renderCalendar(project) {
    // Очищаем календарь
    const calendar = document.getElementById('calendar');
    if (!calendar) {
        console.error('Календарь не найден');
        return;
    }
    
    console.log('Отрисовка календаря с проектом:', project);
    
    // Очищаем содержимое
    while (calendar.firstChild) {
        // Очищаем Quill редакторы перед удалением элементов
        const quillEditors = calendar.querySelectorAll('.post');
        quillEditors.forEach(post => {
            if (post.quillEditor) {
                safeDestroyEditor(post.quillEditor);
                post.quillEditor = null;
            }
        });
        
        calendar.removeChild(calendar.firstChild);
    }
    
    // Создаем контейнер для дней
    const daysContainer = document.createElement('div');
    daysContainer.className = 'days-container';
    
    // Проверяем, что у нас есть проект и данные дней
    if (!project || !project.days || Object.keys(project.days).length === 0) {
        console.error('Проект не содержит данные дней');
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-calendar-message';
        emptyMessage.textContent = 'Нет дней в календаре. Нажмите кнопку "+" чтобы добавить новый день.';
        calendar.appendChild(emptyMessage);
        
        // Создаем кнопку добавления дня
        const addDayBtn = document.createElement('button');
        addDayBtn.className = 'add-day-btn';
        addDayBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addDayBtn.addEventListener('click', addNewDay);
        calendar.appendChild(addDayBtn);
        
        return;
    }
    
    // Получаем дни из порядка дней в проекте или из объекта дней
    let days = [];
    if (project.order && project.order.days && project.order.days.length > 0) {
        days = project.order.days;
        console.log('Используем порядок дней из project.order.days:', days);
    } else {
        // Если нет порядка дней, берем ключи из project.days и сортируем их по номеру
        days = Object.keys(project.days).sort((a, b) => {
            const numA = parseInt(a.replace('day_', ''), 10);
            const numB = parseInt(b.replace('day_', ''), 10);
            return numA - numB;
        });
        console.log('Используем отсортированные ключи из project.days:', days);
    }
    
    // Если дней нет, создаем заглушку
    if (days.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-calendar-message';
        emptyMessage.textContent = 'Нет дней в календаре. Нажмите кнопку "+" чтобы добавить новый день.';
        calendar.appendChild(emptyMessage);
        
        // Создаем кнопку добавления дня
        const addDayBtn = document.createElement('button');
        addDayBtn.className = 'add-day-btn';
        addDayBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addDayBtn.addEventListener('click', addNewDay);
        emptyMessage.appendChild(addDayBtn);
        
        return;
    }
    
    console.log('Отрисовываем дни:', days);
    
    // Отображаем дни
    days.forEach(dayId => {
        const dayData = project.days[dayId];
        if (dayData) {
            console.log(`Отрисовка дня ${dayId}:`, dayData);
            const dayElement = createDayColumn(dayId, dayData);
            daysContainer.appendChild(dayElement);
        } else {
            console.warn(`День ${dayId} не найден в проекте`);
        }
    });
    
    // Добавляем кнопку для добавления нового дня
    const addDayBtn = document.createElement('button');
    addDayBtn.className = 'add-day-btn';
    addDayBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addDayBtn.addEventListener('click', addNewDay);
    daysContainer.appendChild(addDayBtn);
    
    // Добавляем контейнер дней в календарь
    calendar.appendChild(daysContainer);
    
    // Инициализируем горизонтальный скролл после полной загрузки календаря
    setTimeout(() => {
        initializeHorizontalScroll();
    }, 100);
    
    console.log('Календарь успешно отрисован');
}

// Получение следующей доступной даты
function getNextAvailableDate(existingDates) {
    let newDate;
    
    if (existingDates.length > 0) {
        // Берем последнюю дату и добавляем день
        const lastDate = new Date(existingDates[existingDates.length - 1]);
        newDate = new Date(lastDate);
        newDate.setDate(lastDate.getDate() + 1);
    } else {
        // Если нет дат, начинаем с сегодня
        newDate = new Date();
    }

    // Форматируем дату в строку YYYY-MM-DD
    return newDate.toISOString().split('T')[0];
}

// Создание пустой колонки
function createEmptyDayColumn(date, template) {
    const emptyColumn = template.content.cloneNode(true);
    const dateDisplay = emptyColumn.querySelector('.date-display');
    dateDisplay.textContent = formatDate(date);
    dateDisplay.setAttribute('datetime', date);
    
    // Добавляем обработчик для создания контента
    const emptyContent = emptyColumn.querySelector('.day-column-empty');
    emptyContent.addEventListener('click', () => createDayContent(date));
    
    return emptyColumn;
}

// Функция создания элемента поста
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    
    // Заголовок поста
    const postHeader = document.createElement('div');
    postHeader.className = 'post-header';
    
    // Выбор соц. сети
    const networkDropdown = document.createElement('div');
    networkDropdown.className = 'network-dropdown';
    
    const networkDisplay = document.createElement('div');
    networkDisplay.className = 'network-display';
    networkDisplay.textContent = post.socialNetwork || 'Telegram';
    
    const networkDropdownContent = document.createElement('div');
    networkDropdownContent.className = 'dropdown-content';
    
    // Список доступных соц. сетей
    const networks = ['Instagram', 'Telegram', 'VK', 'WhatsApp', 'YouTube'];
    networks.forEach(network => {
        const networkItem = document.createElement('div');
        networkItem.className = 'dropdown-item';
        networkItem.dataset.value = network;
        networkItem.textContent = network;
        
        networkItem.addEventListener('click', (e) => {
            post.socialNetwork = network;
            networkDisplay.textContent = network;
            networkDropdownContent.classList.remove('active');
            
            // Обновляем пост в день
            const dayColumn = postElement.closest('.day-column');
            if (dayColumn) {
                const dayId = dayColumn.dataset.dayId;
                const posts = dayColumn.querySelectorAll('.post');
                const postIndex = Array.from(posts).indexOf(postElement);
                updatePost(dayId, { socialNetwork: network }, postIndex, false);
            }
        });
        
        networkDropdownContent.appendChild(networkItem);
    });
    
    networkDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        networkDropdownContent.classList.toggle('active');
    });
    
    networkDropdown.appendChild(networkDisplay);
    networkDropdown.appendChild(networkDropdownContent);
    
    // Тип контента
    const contentTypeDropdown = document.createElement('div');
    contentTypeDropdown.className = 'content-type-dropdown';
    
    const contentTypeDisplay = document.createElement('div');
    contentTypeDisplay.className = 'content-type-display';
    contentTypeDisplay.textContent = post.contentType || 'Пост';
    
    const contentTypeDropdownContent = document.createElement('div');
    contentTypeDropdownContent.className = 'dropdown-content';
    
    // Список доступных типов контента
    const contentTypes = ['Пост', 'Story', 'Reels', 'Статья', 'Новость', 'Опрос'];
    contentTypes.forEach(type => {
        const contentTypeItem = document.createElement('div');
        contentTypeItem.className = 'dropdown-item';
        contentTypeItem.dataset.value = type;
        contentTypeItem.textContent = type;
        
        contentTypeItem.addEventListener('click', (e) => {
            post.contentType = type;
            contentTypeDisplay.textContent = type;
            contentTypeDropdownContent.classList.remove('active');
            
            // Обновляем пост в день
            const dayColumn = postElement.closest('.day-column');
            if (dayColumn) {
                const dayId = dayColumn.dataset.dayId;
                const posts = dayColumn.querySelectorAll('.post');
                const postIndex = Array.from(posts).indexOf(postElement);
                updatePost(dayId, { contentType: type }, postIndex, false);
            }
        });
        
        contentTypeDropdownContent.appendChild(contentTypeItem);
    });
    
    contentTypeDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        contentTypeDropdownContent.classList.toggle('active');
    });
    
    contentTypeDropdown.appendChild(contentTypeDisplay);
    contentTypeDropdown.appendChild(contentTypeDropdownContent);
    
    // Добавляем элементы в заголовок
    postHeader.appendChild(networkDropdown);
    postHeader.appendChild(contentTypeDropdown);
    
    // Кнопка удаления поста
    const deletePostBtn = document.createElement('button');
    deletePostBtn.className = 'delete-post-btn';
    deletePostBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deletePostBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите удалить эту публикацию?')) {
            const dayColumn = postElement.closest('.day-column');
            if (dayColumn) {
                const dayId = dayColumn.dataset.dayId;
                const posts = dayColumn.querySelectorAll('.post');
                const postIndex = Array.from(posts).indexOf(postElement);
                // Удаляем пост
                deletePost(dayId, postIndex);
            }
        }
    });
    
    postHeader.appendChild(deletePostBtn);
    postElement.appendChild(postHeader);
    
    // Панель инструментов для изображений
    const imagesToolsPanel = document.createElement('div');
    imagesToolsPanel.className = 'images-tools-panel';
    
    // Кнопка генерации изображений через ИИ
    const generateImagesBtn = document.createElement('button');
    generateImagesBtn.className = 'tool-button';
    generateImagesBtn.innerHTML = '<i class="fas fa-robot"></i>';
    generateImagesBtn.title = 'Сгенерировать изображения с помощью ChatGPT';
    generateImagesBtn.addEventListener('click', () => {
        alert('Функционал генерации изображений будет доступен в ближайшее время');
    });
    
    // Кнопка скачивания изображений
    const downloadImagesBtn = document.createElement('button');
    downloadImagesBtn.className = 'tool-button';
    downloadImagesBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadImagesBtn.title = 'Скачать все изображения';
    downloadImagesBtn.addEventListener('click', () => {
        if (post.images && post.images.length > 0) {
            alert(`Подготовка к скачиванию ${post.images.length} изображений`);
            // Здесь будет реализован функционал скачивания
        } else {
            alert('Нет изображений для скачивания');
        }
    });
    
    imagesToolsPanel.appendChild(generateImagesBtn);
    imagesToolsPanel.appendChild(downloadImagesBtn);
    postElement.appendChild(imagesToolsPanel);
    
    // Контейнер для изображений
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'images-container';
    
    // Добавляем существующие изображения
    if (post.images && post.images.length > 0) {
        // Если есть изображения, создаем сетку 3 на 3
        post.images.forEach((imagePath, index) => {
            const imagePreview = document.createElement('div');
            imagePreview.className = 'image-preview';
            
            const img = document.createElement('img');
            // Преобразуем путь к изображению
            const urlParams = new URLSearchParams(window.location.search);
            const projectId = urlParams.get('id');
            
            // Получаем URL изображения
            window.filesystem.getImage(projectId, imagePath)
                .then(imageUrl => {
                    if (imageUrl) {
                        img.src = imageUrl;
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
                    const dayColumn = postElement.closest('.day-column');
                    if (dayColumn) {
                        const dayId = dayColumn.dataset.dayId;
                        const posts = dayColumn.querySelectorAll('.post');
                        const postIndex = Array.from(posts).indexOf(postElement);
                        
                        // Обновляем изображения
                        await updatePost(dayId, { images: updatedImages }, postIndex, true);
                    }
                }
            });
            
            imagePreview.appendChild(removeBtn);
            imagesContainer.appendChild(imagePreview);
        });
    }
    
    // Кнопка добавления изображения
    const addImageBtn = document.createElement('div');
    addImageBtn.className = 'image-preview add-image';
    addImageBtn.innerHTML = '<div class="add-image-icon"><i class="fas fa-plus"></i></div>';
    addImageBtn.addEventListener('click', async () => {
        // Используем диалог выбора файла
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        
        input.addEventListener('change', async () => {
            if (input.files && input.files.length > 0) {
                const dayColumn = postElement.closest('.day-column');
                if (dayColumn) {
                    const dayId = dayColumn.dataset.dayId;
                    const posts = dayColumn.querySelectorAll('.post');
                    const postIndex = Array.from(posts).indexOf(postElement);
                    
                    // Загружаем и добавляем изображения
                    await reloadImages(imagesContainer, post, postElement, dayId, postIndex, input.files);
                }
            }
        });
        
        input.click();
    });
    
    imagesContainer.appendChild(addImageBtn);
    postElement.appendChild(imagesContainer);
    
    // Панель инструментов для текстового редактора
    const editorToolsPanel = document.createElement('div');
    editorToolsPanel.className = 'editor-tools-panel';
    
    // Кнопка генерации текста через ИИ
    const generateTextBtn = document.createElement('button');
    generateTextBtn.className = 'tool-button';
    generateTextBtn.innerHTML = '<i class="fas fa-magic"></i>';
    generateTextBtn.title = 'Поправить с помощью ChatGPT';
    generateTextBtn.addEventListener('click', () => {
        alert('Функционал генерации текста будет доступен в ближайшее время');
    });
    
    // Кнопка копирования текста
    const copyTextBtn = document.createElement('button');
    copyTextBtn.className = 'tool-button';
    copyTextBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyTextBtn.title = 'Скопировать текст в буфер обмена';
    copyTextBtn.addEventListener('click', () => {
        if (postElement.quillEditor) {
            const text = postElement.quillEditor.getText();
            const htmlContent = postElement.quillEditor.root.innerHTML;
            
            // Копируем HTML-содержимое в буфер обмена
            navigator.clipboard.writeText(text)
                .then(() => {
                    // Показываем всплывающее уведомление о копировании
                    showNotification('Текст скопирован в буфер обмена', 'success', 2000);
                })
                .catch(err => {
                    console.error('Ошибка при копировании текста:', err);
                    showNotification('Не удалось скопировать текст в буфер обмена', 'error');
                });
        }
    });
    
    editorToolsPanel.appendChild(generateTextBtn);
    editorToolsPanel.appendChild(copyTextBtn);
    
    // Создаем контейнер для текста и редактора
    const textContainer = document.createElement('div');
    textContainer.className = 'post-text-container';
    textContainer.appendChild(editorToolsPanel);
    
    // Добавляем текстовый контейнер в пост
    postElement.appendChild(textContainer);
    
    // Создаем контейнер для редактора Quill
    const editorContainer = document.createElement('div');
    editorContainer.className = 'editor-container';
    textContainer.appendChild(editorContainer);
    
    // ВАЖНО: На этом этапе весь DOM-путь от корня до контейнера редактора уже создан
    // и элементы добавлены в DOM документа
    
    // Инициализация Quill с отложенной инициализацией, если нужно
    console.log('Создание редактора Quill для контейнера:', editorContainer);
    const quill = createQuillEditor(editorContainer, post.text || '', (content) => {
        // Сохраняем текст при изменении
        post.text = content;
        
        // Обновляем пост в день
        const dayColumn = postElement.closest('.day-column');
        if (dayColumn) {
            const dayId = dayColumn.dataset.dayId;
            const posts = dayColumn.querySelectorAll('.post');
            const postIndex = Array.from(posts).indexOf(postElement);
            
            // Debounce: обновляем не чаще чем раз в 2 секунды
            clearTimeout(postElement.updateTimeout);
            postElement.updateTimeout = setTimeout(() => {
                updatePost(dayId, { text: content }, postIndex, false);
            }, 2000);
        }
    });
    
    // Сохраняем ссылку на редактор для последующего удаления
    if (quill) {
        postElement.quillEditor = quill;
    }
    
    return postElement;
}

// Функция для закрытия всех выпадающих списков
function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

// Функция для инициализации обработчиков событий
function initializeEventListeners() {
    console.log('Инициализация обработчиков событий...');
    
    // Обработчик для кнопки информации о клиенте
    const clientInfoBtn = document.getElementById('client-info-btn');
    if (clientInfoBtn) {
        clientInfoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const clientInfoModal = document.getElementById('clientInfoModal');
            if (clientInfoModal) {
                clientInfoModal.classList.add('active');
                // Загружаем информацию о клиенте при открытии окна
                loadClientInfo();
            }
        });
    }
    
    // Обработчик для кнопок закрытия модального окна
    const closeButtons = document.querySelectorAll('.modal-close, .modal-cancel');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Обработчик нажатия Escape для закрытия модальных окон
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    // Закрытие выпадающих списков при клике вне их
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-content') && !e.target.closest('.network-display') && !e.target.closest('.content-type-display')) {
            closeAllDropdowns();
        }
    });
    
    // Обработчик для кнопки сохранения информации о клиенте
    const saveClientInfoBtn = document.getElementById('saveClientInfoBtn');
    if (saveClientInfoBtn) {
        saveClientInfoBtn.addEventListener('click', saveClientInfo);
    }
    
    // Обработчик для кнопки добавления поля социальной сети
    const addSocialFieldBtn = document.getElementById('addSocialField');
    if (addSocialFieldBtn) {
        addSocialFieldBtn.addEventListener('click', function() {
            const container = document.getElementById('additionalFieldsContainer');
            if (!container) return;
            
            const fieldId = `socialField_${Date.now()}`;
            
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'form-group social-field';
            
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';
            inputGroup.style.display = 'flex';
            
            const input = document.createElement('input');
            input.type = 'url';
            input.id = fieldId;
            input.className = 'form-control custom-social';
            input.placeholder = 'Название соцсети: ссылка';
            input.style.flex = '1';
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-danger remove-field';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.style.marginLeft = '10px';
            removeBtn.addEventListener('click', function() {
                container.removeChild(fieldGroup);
            });
            
            inputGroup.appendChild(input);
            inputGroup.appendChild(removeBtn);
            fieldGroup.appendChild(inputGroup);
            
            container.appendChild(fieldGroup);
        });
    }
    
    // Обработчик для кнопки изменения директории
    const changeDirectoryBtn = document.getElementById('change-directory-btn');
    if (changeDirectoryBtn) {
        changeDirectoryBtn.addEventListener('click', function() {
            showDirectorySelection('Выберите директорию с проектами');
        });
    }
    
    // Обработчик для кнопки переключения сайдбара
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
            }
            
            if (mainContent) {
                mainContent.classList.toggle('expanded');
            }
        });
    }
    
    // Добавление обработчиков для новых кнопок сайдбара
    
    // Кнопка скачивания CSV
    const downloadCsvBtn = document.getElementById('download-csv-btn');
    if (downloadCsvBtn) {
        downloadCsvBtn.addEventListener('click', function() {
            alert('Функционал скачивания CSV проекта будет доступен в ближайшее время');
        });
    }
    
    // Кнопка загрузки CSV
    const uploadCsvBtn = document.getElementById('upload-csv-btn');
    if (uploadCsvBtn) {
        uploadCsvBtn.addEventListener('click', function() {
            alert('Функционал загрузки CSV будет доступен в ближайшее время');
        });
    }
    
    // Кнопка загрузки информации о клиенте
    const uploadClientInfoBtn = document.getElementById('upload-client-info-btn');
    if (uploadClientInfoBtn) {
        uploadClientInfoBtn.addEventListener('click', function() {
            alert('Функционал загрузки информации о клиенте будет доступен в ближайшее время');
        });
    }
    
    console.log('Обработчики событий инициализированы');
}

// Функция для обновления поста в дне
async function updatePost(dayId, newPostData, postIndex, reload = true) {
    try {
        console.log(`Обновление поста в ${dayId}, индекс ${postIndex}:`, newPostData);
        
        // Получаем ID проекта из URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        if (!projectId) {
            console.error('Не указан ID проекта');
            alert('Ошибка: не удалось определить ID проекта');
            return false;
        }
        
        // Получаем файл дня
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
        
        // Проверяем, что у дня есть посты и что указанный индекс существует
        if (!dayData.posts || !Array.isArray(dayData.posts) || postIndex >= dayData.posts.length) {
            console.error(`День ${dayId} не содержит пост с индексом ${postIndex}`);
            return false;
        }
        
        // Обновляем данные поста
        const post = dayData.posts[postIndex];
        for (const key in newPostData) {
            post[key] = newPostData[key];
        }
        
        // Обновляем last modified
        post.lastModified = new Date().toISOString();
        
        // Сохраняем обновленные данные
        await window.filesystem.writeFile(dayPath, JSON.stringify(dayData, null, 2));
        
        console.log(`Пост в ${dayId} с индексом ${postIndex} успешно обновлен`);
        
        // Если нужно перезагрузить календарь
        if (reload) {
            const project = await window.filesystem.loadProjectData(projectId);
            renderCalendar(project);
        }
        
        return true;
    } catch (error) {
        console.error(`Ошибка при обновлении поста в ${dayId}:`, error);
        return false;
    }
}

// Функция для удаления поста из дня
async function deletePost(dayId, postIndex) {
    try {
        console.log(`Удаление поста в ${dayId}, индекс ${postIndex}`);
        
        // Получаем ID проекта из URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        if (!projectId) {
            console.error('Не указан ID проекта');
            alert('Ошибка: не удалось определить ID проекта');
            return false;
        }
        
        // Получаем файл дня
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
        
        // Проверяем, что у дня есть посты и что указанный индекс существует
        if (!dayData.posts || !Array.isArray(dayData.posts) || postIndex >= dayData.posts.length) {
            console.error(`День ${dayId} не содержит пост с индексом ${postIndex}`);
            return false;
        }
        
        // Удаляем пост
        dayData.posts.splice(postIndex, 1);
        
        // Если постов не осталось, создаем пустой пост
        if (dayData.posts.length === 0) {
            dayData.posts.push({
                socialNetwork: 'Telegram',
                contentType: 'Пост',
                images: [],
                text: '',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            });
        }
        
        // Сохраняем обновленные данные
        await window.filesystem.writeFile(dayPath, JSON.stringify(dayData, null, 2));
        
        console.log(`Пост в ${dayId} с индексом ${postIndex} успешно удален`);
        
        // Перезагружаем календарь
        const project = await window.filesystem.loadProjectData(projectId);
        renderCalendar(project);
        
        return true;
    } catch (error) {
        console.error(`Ошибка при удалении поста в ${dayId}:`, error);
        return false;
    }
}

// Функция для перезагрузки изображений поста
async function reloadImages(imagesContainer, post, postElement, dayId, postIndex, newFiles = null) {
    try {
        console.log('Перезагрузка изображений для поста:', post);
        
        // Получаем проект из URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        // Если переданы новые файлы, загружаем их
        if (newFiles && newFiles.length > 0) {
            // Создаем массив изображений, если его нет
            if (!post.images) {
                post.images = [];
            }
            
            // Загружаем все новые файлы
            for (const file of newFiles) {
                try {
                    const imagePath = await window.filesystem.saveImage(projectId, file);
                    post.images.push(imagePath);
                    console.log(`Изображение ${imagePath} добавлено к посту`);
                } catch (error) {
                    console.error('Ошибка при загрузке изображения:', error);
                    alert('Не удалось загрузить изображение: ' + error.message);
                }
            }
            
            // Обновляем пост в JSON
            if (dayId && postIndex !== undefined) {
                await updatePost(dayId, { images: post.images }, postIndex, false);
            }
        }
        
        // Очищаем контейнер изображений, кроме кнопки добавления
        const addImageBtn = imagesContainer.querySelector('.add-image');
        imagesContainer.innerHTML = '';
        
        // Добавляем изображения в сетку
        if (post.images && post.images.length > 0) {
            post.images.forEach((imagePath, index) => {
                const imagePreview = document.createElement('div');
                imagePreview.className = 'image-preview';
                
                const img = document.createElement('img');
                
                // Получаем URL изображения
                window.filesystem.getImage(projectId, imagePath)
                    .then(imageUrl => {
                        if (imageUrl) {
                            img.src = imageUrl;
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
                            await updatePost(dayId, { images: updatedImages }, postIndex, true);
                        }
                    }
                });
                
                imagePreview.appendChild(removeBtn);
                imagesContainer.appendChild(imagePreview);
            });
        }
        
        // Создаем новую кнопку добавления изображения
        const newAddImageBtn = document.createElement('div');
        newAddImageBtn.className = 'image-preview add-image';
        newAddImageBtn.innerHTML = '<div class="add-image-icon"><i class="fas fa-plus"></i></div>';
        newAddImageBtn.addEventListener('click', async () => {
            // Используем диалог выбора файла
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            
            input.addEventListener('change', async () => {
                if (input.files && input.files.length > 0) {
                    await reloadImages(imagesContainer, post, postElement, dayId, postIndex, input.files);
                }
            });
            
            input.click();
        });
        
        imagesContainer.appendChild(newAddImageBtn);
        console.log('Изображения перезагружены успешно');
        
        return true;
    } catch (error) {
        console.error('Ошибка при перезагрузке изображений:', error);
        return false;
    }
}

// Сортировка постов по дате
async function sortPostsByDate(dayId) {
    try {
        // Получаем проект из URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        // Загружаем данные проекта
        const project = await window.filesystem.loadProjectData(projectId);
        
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
        await window.filesystem.updateProjectDay(projectId, dayId, dayData);
        
        // Перезагружаем календарь
        renderCalendar(project);
        
        console.log(`Посты в дне ${dayId} отсортированы по дате`);
        return true;
    } catch (error) {
        console.error(`Ошибка при сортировке постов в дне ${dayId}:`, error);
        return false;
    }
}

// Функция для сохранения информации о клиенте
function saveClientInfo() {
    console.log('Сохранение информации о клиенте...');
    
    // Получаем все поля из формы
    const clientData = {
        name: document.getElementById('clientName').value || '',
        website: document.getElementById('clientWebsite').value || '',
        phone: document.getElementById('clientPhone').value || '',
        email: document.getElementById('clientEmail').value || '',
        address: document.getElementById('clientAddress').value || '',
        socialNetworks: {
            instagram: document.getElementById('clientInstagram').value || '',
            telegram: document.getElementById('clientTelegram').value || '',
            vk: document.getElementById('clientVk').value || '',
            facebook: document.getElementById('clientFacebook').value || ''
        },
        brandInfo: {
            description: document.getElementById('clientDescription').value || '',
            usp: document.getElementById('clientUsp').value || '',
            targetAudience: document.getElementById('clientTargetAudience').value || '',
            priceRange: document.getElementById('clientPriceRange').value || ''
        },
        contentGuidelines: {
            toneOfVoice: document.getElementById('clientToneOfVoice').value || '',
            mainTopics: document.getElementById('clientMainTopics').value || '',
            forbiddenTopics: document.getElementById('clientForbiddenTopics').value || '',
            hashtags: document.getElementById('clientHashtags').value || ''
        },
        designSettings: {
            brandColors: document.getElementById('clientBrandColors').value || '',
            primaryFont: document.getElementById('clientPrimaryFont').value || '',
            secondaryFont: document.getElementById('clientSecondaryFont').value || '',
            mainLogo: document.getElementById('clientMainLogo').value || '',
            altLogo: document.getElementById('clientAltLogo').value || ''
        },
        metaInfo: {
            created: document.getElementById('clientCreated').value || new Date().toISOString(),
            lastModified: new Date().toISOString()
        },
        customSocialNetworks: {}
    };
    
    // Получаем пользовательские поля социальных сетей
    const customSocialFields = document.querySelectorAll('.custom-social');
    customSocialFields.forEach(field => {
        const input = field.value.trim();
        if (input) {
            // Если пользователь использовал формат "Название: ссылка"
            const parts = input.split(':');
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const url = parts.slice(1).join(':').trim();
                clientData.customSocialNetworks[name] = url;
            } else {
                // Если формат не соответствует ожидаемому, просто сохраняем как есть
                clientData.customSocialNetworks[`custom_${field.id}`] = input;
            }
        }
    });
    
    // Получаем ID проекта из URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        console.error('ID проекта не найден в URL');
        showNotification('Ошибка: ID проекта не найден', 'error');
        return;
    }
    
    // Получаем директорию проекта
    const projectDirectory = localStorage.getItem('selectedDirectory');
    if (!projectDirectory) {
        console.error('Директория проекта не найдена');
        showNotification('Ошибка: директория проекта не найдена', 'error');
        return;
    }
    
    // Формируем путь к файлу с информацией о клиенте
    const clientInfoFilePath = `${projectDirectory}/projects/${projectId}/client-info.json`;
    
    // Сохраняем информацию в файл
    window.filesystem.writeFile(clientInfoFilePath, JSON.stringify(clientData, null, 2))
        .then(() => {
            console.log('Информация о клиенте успешно сохранена:', clientInfoFilePath);
            
            // Обновляем дату последнего изменения
            document.getElementById('clientLastModified').value = new Date().toLocaleString();
            
            // Закрываем модальное окно
            document.getElementById('clientInfoModal').classList.remove('active');
            
            // Показываем уведомление пользователю
            showNotification('Информация о клиенте сохранена', 'success');
        })
        .catch(error => {
            console.error('Ошибка при сохранении информации о клиенте:', error);
            showNotification('Ошибка при сохранении информации о клиенте', 'error');
        });
}

// Функция для отображения уведомлений
function showNotification(message, type = 'info', duration = 3000) {
    // Проверяем, существует ли уже контейнер для уведомлений
    let notificationContainer = document.getElementById('notification-container');
    
    // Если контейнера нет, создаем его
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.bottom = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : 
                                        type === 'error' ? '#F44336' : 
                                        type === 'warning' ? '#FF9800' : '#2196F3';
    notification.style.color = 'white';
    notification.style.padding = '12px 16px';
    notification.style.margin = '8px 0';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.display = 'flex';
    notification.style.justifyContent = 'space-between';
    notification.style.alignItems = 'center';
    notification.style.transition = 'all 0.3s ease';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    
    // Добавляем иконку в зависимости от типа уведомления
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle"></i>';
    else icon = '<i class="fas fa-info-circle"></i>';
    
    // Добавляем содержимое уведомления
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <span style="margin-right: 8px;">${icon}</span>
            <span>${message}</span>
        </div>
        <button class="close-notification" style="background: none; border: none; color: white; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Добавляем уведомление в контейнер
    notificationContainer.appendChild(notification);
    
    // Анимируем появление уведомления
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Настраиваем закрытие уведомления по клику на крестик
    const closeButton = notification.querySelector('.close-notification');
    closeButton.addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Настраиваем автоматическое закрытие уведомления через указанное время
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
    
    return notification;
}
