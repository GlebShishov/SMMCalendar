// Эмуляция файловой системы в браузере
class FileSystem {
    constructor() {
        this.isReady = false;
        this.rootHandle = null;
        this.projectsDirectoryHandle = null;
        this.directoryHandles = {}; // Кэш для хэндлов директорий
        
        // Восстанавливаем состояние из localStorage
        this.restoreState();
    }

    // Восстановление состояния из localStorage
    async restoreState() {
        try {
            const fsState = localStorage.getItem('filesystem_state');
            if (fsState) {
                const state = JSON.parse(fsState);
                this.isReady = state.isReady || false;
                
                // Проверяем, есть ли сохраненный directoryHandle
                if (window.FileSystemHandle && navigator.storage && navigator.storage.getDirectory) {
                    const rootHandleToken = localStorage.getItem('filesystem_root_handle');
                    if (rootHandleToken) {
                        try {
                            // Пробуем восстановить доступ к директории из предыдущей сессии
                            const fileHandles = await navigator.storage.getDirectory();
                            if (fileHandles) {
                                const savedHandleId = rootHandleToken;
                                try {
                                const handle = await fileHandles.getFileHandle(savedHandleId);
                                if (handle && handle.kind === 'directory') {
                                    // Проверяем разрешения
                                    const permission = await handle.requestPermission({ mode: 'readwrite' });
                                    if (permission === 'granted') {
                                        this.rootHandle = handle;
                                        this.projectsDirectoryHandle = handle;
                                        this.isReady = true;
                                        console.log('Восстановлен доступ к директории из предыдущей сессии');
                                    }
                                    }
                                } catch (innerError) {
                                    console.warn('Не удалось получить хендл файла:', innerError);
                                    // Очищаем некорректные записи в localStorage
                                    localStorage.removeItem('filesystem_root_handle');
                                    this.isReady = false;
                                }
                            }
                        } catch (error) {
                            console.warn('Не удалось восстановить доступ к директории:', error);
                            // Очищаем состояние при ошибке безопасности
                            if (error.name === 'SecurityError') {
                                console.warn('Ошибка безопасности. Сбрасываем состояние файловой системы');
                                localStorage.removeItem('filesystem_state');
                                localStorage.removeItem('filesystem_root_handle');
                                this.isReady = false;
                                this.rootHandle = null;
                                this.projectsDirectoryHandle = null;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при восстановлении состояния filesystem:', error);
            // Очищаем состояние при любой критической ошибке
            localStorage.removeItem('filesystem_state');
            localStorage.removeItem('filesystem_root_handle');
            this.isReady = false;
            this.rootHandle = null;
            this.projectsDirectoryHandle = null;
        }
    }

    async initialize() {
        try {
            // Запрашиваем доступ к директории
            this.rootHandle = await window.showDirectoryPicker({
                id: 'smm-calendar-root',
                mode: 'readwrite',
                startIn: 'documents'
            });
            
            // Выбранная пользователем директория является корневой директорией проектов
                this.projectsDirectoryHandle = this.rootHandle;
            console.log('Выбрана директория для проектов:', this.rootHandle.name);
            
            // Запрашиваем постоянный доступ к директории
            if (this.rootHandle.requestPermission) {
                try {
                    const permission = await this.rootHandle.requestPermission({ mode: 'readwrite' });
                    if (permission !== 'granted') {
                        console.warn('Не получено разрешение на постоянный доступ к директории');
                        throw new Error('Отказано в доступе к директории');
                    }
                } catch (permError) {
                    console.error('Ошибка при запросе разрешений:', permError);
                    throw permError;
                }
            }
            
            // Устанавливаем флаг готовности
            this.isReady = true;
            
            // Очищаем кэш директорий
            this.directoryHandles = {};
            
            // Сохраняем состояние
            this._saveState();
            
            return true;
        } catch (error) {
            console.error('Ошибка при инициализации файловой системы:', error);
            this.isReady = false;
            this.rootHandle = null;
            this.projectsDirectoryHandle = null;
            
            // Очищаем состояние при ошибке
            localStorage.removeItem('filesystem_state');
            localStorage.removeItem('filesystem_root_handle');
            
            throw error;
        }
    }

    // Сохранение состояния в localStorage
    _saveState() {
        localStorage.setItem('filesystem_state', JSON.stringify({
            isReady: this.isReady
        }));

        // Сохраняем информацию о директории для доступа между сессиями
        if (this.rootHandle) {
            try {
                // Используем уникальный идентификатор директории
                const handleId = `root-handle-${Date.now()}`;
                localStorage.setItem('filesystem_root_handle', handleId);
                
                // Запрашиваем постоянный доступ к директории
                if (this.rootHandle.requestPermission) {
                    this.rootHandle.requestPermission({ mode: 'readwrite' })
                        .then(permission => {
                            if (permission === 'granted') {
                                console.log('Получено постоянное разрешение на доступ к директории');
                            }
                        })
                        .catch(err => {
                            console.warn('Не удалось получить постоянное разрешение:', err);
                        });
                }
            } catch (error) {
                console.warn('Не удалось сохранить ссылку на директорию:', error);
            }
        }
    }

    // Проверка готовности файловой системы
    checkReady() {
        // Возвращаем true только если установлен флаг isReady и есть handle директории проектов
        return this.isReady && (this.rootHandle !== null) && (this.projectsDirectoryHandle !== null);
    }

    // Проверка инициализации файловой системы
    isInitialized() {
        return this.isReady && (this.rootHandle !== null) && (this.projectsDirectoryHandle !== null);
    }

    // Получение директории
    async getDirectory(path) {
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }

        // Если директория уже в кэше, возвращаем ее
        if (this.directoryHandles[path]) {
            return this.directoryHandles[path];
        }

        // Начинаем с корневой директории проектов
        let currentHandle = this.projectsDirectoryHandle;
        
        // Если путь пустой, возвращаем корневую директорию
        if (!path || path === '') {
            this.directoryHandles[path] = currentHandle;
            return currentHandle;
        }
        
        // Удаляем префикс 'projects/' если он есть (для обратной совместимости)
        if (path.startsWith('projects/')) {
            path = path.substring(9);
        }
        
        // Разбиваем путь на части
        const parts = path.split('/').filter(part => part.length > 0);
        
        // Проходим по частям пути и создаем недостающие директории
        for (const part of parts) {
            try {
                // Пытаемся получить существующую директорию
                currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
            } catch (error) {
                console.error(`Ошибка при получении директории ${part}:`, error);
                throw error;
            }
        }

        // Кэшируем и возвращаем полученный дескриптор
        this.directoryHandles[path] = currentHandle;
        return currentHandle;
    }

    // Создание или обновление файла
    async writeFile(path, data) {
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
        try {
            // Разделяем путь на части
            const parts = path.split('/');
            const fileName = parts.pop();
            const directoryPath = parts.join('/');
            
            // Получаем директорию
            const dirHandle = await this.getDirectory(directoryPath);
            
            // Создаем или открываем файл
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            
            // Получаем доступ к записи
            const writable = await fileHandle.createWritable();
            
            // Записываем данные
            if (typeof data === 'string') {
                await writable.write(data);
            } else if (data instanceof Blob) {
                await writable.write(data);
            } else {
                await writable.write(JSON.stringify(data, null, 2));
            }
            
            // Закрываем файл
            await writable.close();
            
            return true;
        } catch (error) {
            console.error(`Ошибка при записи файла ${path}:`, error);
            throw error;
        }
    }

    // Чтение файла
    async readFile(path) {
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
        try {
            // Разделяем путь на части
            const parts = path.split('/');
            const fileName = parts.pop();
            const directoryPath = parts.join('/');
            
            // Получаем директорию
            const dirHandle = await this.getDirectory(directoryPath);
            
            // Открываем файл
            const fileHandle = await dirHandle.getFileHandle(fileName);
            
            // Получаем файл
            const file = await fileHandle.getFile();
            
            // Чтение файла как текст
            if (file.type.includes('json') || file.type.includes('text') || !file.type) {
                return await file.text();
            }
            
            // Чтение файла как Blob для изображений и других бинарных данных
            return file;
        } catch (error) {
            console.error(`Ошибка при чтении файла ${path}:`, error);
            return null;
        }
    }

    // Удаление файла
    async deleteFile(path) {
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
        try {
            // Разделяем путь на части
            const parts = path.split('/');
            const fileName = parts.pop();
            const directoryPath = parts.join('/');
            
            // Получаем директорию
            const dirHandle = await this.getDirectory(directoryPath);
            
            // Удаляем файл
            await dirHandle.removeEntry(fileName);
            
            return true;
        } catch (error) {
            console.error(`Ошибка при удалении файла ${path}:`, error);
            return false;
        }
    }

    // Чтение содержимого директории
    async readDirectory(path) {
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
        try {
            // Получаем директорию
            const dirHandle = await this.getDirectory(path);
            
            // Получаем все файлы в директории
            const entries = [];
            for await (const entry of dirHandle.values()) {
                entries.push(entry.name);
            }
            
            return entries;
        } catch (error) {
            console.error(`Ошибка при чтении директории ${path}:`, error);
            return [];
        }
    }

    // Обновленные методы для работы с проектами

    // Загрузка данных проекта
    async loadProjectData(projectId) {
        try {
            console.log(`Загрузка данных проекта ${projectId}...`);
            
            // Проверяем, инициализирована ли файловая система
            if (!this.checkReady()) {
                console.log('Файловая система не инициализирована, пробуем локальное хранилище');
                // Загружаем из localStorage
                return this.loadProjectFromLocalStorage(projectId);
            }
            
            // Сначала проверяем, есть ли проект в списке проектов в projects.json
            let projectInfo = null;
            try {
                // Пытаемся получить файл projects.json из корневой директории
                const projectsFileHandle = await this.rootHandle.getFileHandle('projects.json');
                const projectsFile = await projectsFileHandle.getFile();
                const projectsData = await projectsFile.text();
                
                try {
                    const projectsList = JSON.parse(projectsData);
                    // Ищем проект по ID
                    projectInfo = projectsList.find(project => project.id === projectId);
                    
                    if (projectInfo) {
                        console.log(`Проект ${projectId} найден в списке проектов:`, projectInfo);
                    } else {
                        console.log(`Проект ${projectId} не найден в списке projects.json`);
                    }
                } catch (error) {
                    console.error('Ошибка при разборе projects.json:', error);
                }
            } catch (error) {
                console.log('Файл projects.json не найден или недоступен, продолжаем без него');
            }
            
            // Директория проекта
            let projectDir;
            try {
                projectDir = await this.getDirectory(projectId);
            } catch (error) {
                console.error(`Не удалось получить директорию проекта ${projectId}:`, error);
                console.log('Создаем демо-проект из-за ошибки доступа к директории');
                return this.createDemoProject(projectId);
            }
            
            // Директория с днями
            let daysDir;
            try {
                daysDir = await projectDir.getDirectoryHandle('days', { create: true });
            } catch (error) {
                console.error(`Не удалось получить или создать директорию дней для проекта ${projectId}:`, error);
                console.log('Создаем демо-проект из-за ошибки доступа к директории дней');
                return this.createDemoProject(projectId);
            }
            
            // Загружаем мета-данные проекта
            // Если у нас есть информация из projects.json, используем ее
            let projectTitle = projectInfo?.title || `Проект ${projectId}`;
            let projectDescription = projectInfo?.description || 'Календарь публикаций для социальных сетей';
            
            // Дополнительно проверяем meta.json в директории проекта
            try {
                const metaFileHandle = await projectDir.getFileHandle('meta.json');
                const metaFile = await metaFileHandle.getFile();
                const metaData = await metaFile.text();
                
                try {
                    const meta = JSON.parse(metaData);
                    // Если есть данные в meta.json, они имеют приоритет
                    projectTitle = meta.name || meta.title || projectTitle;
                    projectDescription = meta.description || projectDescription;
                    console.log(`Загружены мета-данные проекта ${projectId} из meta.json:`, meta);
                } catch (error) {
                    console.error(`Ошибка при разборе meta.json для проекта ${projectId}:`, error);
                }
            } catch (error) {
                console.log(`Файл meta.json не найден для проекта ${projectId}, используем значения из projects.json или по умолчанию`);
            }
            
            // Создаем объект проекта
            const project = {
                id: projectId,
                title: projectTitle,
                description: projectDescription,
                days: {},
                order: { days: [] }
            };
            
            // Получаем список всех файлов в директории дней
            const daysEntries = [];
            try {
                for await (const entry of daysDir.values()) {
                    if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                        const dayId = entry.name.replace('.json', '');
                        daysEntries.push(dayId);
                        console.log(`Найден день в папке days: ${dayId}`);
                    }
                }
            } catch (error) {
                console.error(`Ошибка при чтении директории дней для проекта ${projectId}:`, error);
            }
            
            // Пытаемся прочитать order.json
            let orderDays = [];
            try {
                const orderFileHandle = await projectDir.getFileHandle('order.json');
                const orderFile = await orderFileHandle.getFile();
                const orderData = await orderFile.text();
                
                try {
                    const order = JSON.parse(orderData);
                    orderDays = order.days || [];
                    console.log(`Прочитан порядок дней из order.json: ${orderDays.join(', ')}`);
                } catch (error) {
                    console.error('Ошибка при разборе order.json:', error);
                }
            } catch (error) {
                console.log('Файл order.json не найден, будем использовать дни из директории');
            }
            
            // Загружаем данные для каждого дня из папки days
            if (daysEntries.length > 0) {
                for (const dayId of daysEntries) {
                    try {
                        const dayFileHandle = await daysDir.getFileHandle(`${dayId}.json`);
                        const dayFile = await dayFileHandle.getFile();
                        const dayData = await dayFile.text();
                        
                        try {
                            const dayObj = JSON.parse(dayData);
                            
                            // Проверяем и обеспечиваем правильную структуру дня
                            if (!dayObj.posts) {
                                dayObj.posts = [];
                            }
                            
                            // Если нет даты, добавляем текущую
                            if (!dayObj.date) {
                                dayObj.date = new Date().toISOString().split('T')[0];
                            }
                            
                            // Добавляем день в проект
                            project.days[dayId] = dayObj;
                            console.log(`Загружены данные дня ${dayId}`);
                        } catch (error) {
                            console.error(`Ошибка при разборе JSON дня ${dayId}:`, error);
                        }
                    } catch (error) {
                        console.error(`Ошибка при чтении файла дня ${dayId}:`, error);
                    }
                }
            } else {
                // Если в папке days нет дней, создаем day_1
                console.log('В папке days нет дней, создаем день day_1');
                try {
                    const day1Id = 'day_1';
                    const day1 = {
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
                    
                    // Сохраняем день в файловую систему
                    const dayFileHandle = await daysDir.getFileHandle(`${day1Id}.json`, { create: true });
                    const writable = await dayFileHandle.createWritable();
                    await writable.write(JSON.stringify(day1, null, 2));
                    await writable.close();
                    
                    // Добавляем день в проект
                    project.days[day1Id] = day1;
                    orderDays.push(day1Id);
                    
                    console.log(`Создан день ${day1Id} в папке days`);
                } catch (error) {
                    console.error('Ошибка при создании day_1:', error);
                }
            }
            
            // Формируем итоговый порядок дней
            // Сначала фильтруем order.json, оставляя только существующие дни
            const validOrderDays = orderDays.filter(dayId => dayId in project.days);
            
            // Добавляем дни, которые есть в проекте, но отсутствуют в order.json
            const missingDays = Object.keys(project.days).filter(dayId => !validOrderDays.includes(dayId));
            
            if (missingDays.length > 0) {
                console.log(`Найдены дни, отсутствующие в order.json: ${missingDays.join(', ')}`);
                validOrderDays.push(...missingDays);
            }
            
            // Сортируем дни по номеру для лучшей презентации
            validOrderDays.sort((a, b) => {
                const numA = parseInt(a.replace('day_', ''), 10) || 0;
                const numB = parseInt(b.replace('day_', ''), 10) || 0;
                return numA - numB;
            });
            
            // Сохраняем итоговый порядок дней
            project.order.days = validOrderDays;
            
            // Сохраняем порядок дней в order.json, если он отличается или order.json отсутствует
            if (JSON.stringify(orderDays) !== JSON.stringify(validOrderDays)) {
                try {
                    const orderFileHandle = await projectDir.getFileHandle('order.json', { create: true });
                    const writable = await orderFileHandle.createWritable();
                    await writable.write(JSON.stringify({ days: validOrderDays }, null, 2));
                    await writable.close();
                    console.log(`Сохранен обновленный порядок дней в order.json: ${validOrderDays.join(', ')}`);
                } catch (error) {
                    console.error('Ошибка при сохранении order.json:', error);
                }
            }
            
            console.log(`Проект ${projectId} загружен успешно:`, project);
            return project;
        } catch (error) {
            console.error(`Ошибка при загрузке данных проекта ${projectId}:`, error);
            
            // В случае ошибки, пробуем создать демо-проект
            console.log('Создаем демо-проект из-за ошибки загрузки');
            return this.createDemoProject(projectId);
        }
    }
    
    // Загрузка проекта из localStorage
    loadProjectFromLocalStorage(projectId) {
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
        const dayIds = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                try {
                    const dayId = key.replace(prefix, '');
                    
                    // Пробуем загрузить данные дня
                    const dayDataString = localStorage.getItem(key);
                    if (dayDataString) {
                        const dayData = JSON.parse(dayDataString);
                        
                        // Добавляем день в проект только если есть валидные данные
                        if (dayData) {
                            dayIds.push(dayId);
                            project.days[dayId] = dayData;
                            console.log(`Загружен день ${dayId} из localStorage`);
                        }
                    }
                } catch (error) {
                    console.error(`Ошибка при загрузке дня из localStorage: ${key}`, error);
                }
            }
        }
        
        // Пробуем загрузить порядок дней
        try {
            const orderKey = `project_${projectId}_order`;
            const orderString = localStorage.getItem(orderKey);
            if (orderString) {
                const order = JSON.parse(orderString);
                if (order && order.days) {
                    // Фильтруем только те дни, которые действительно загрузились
                    project.order.days = order.days.filter(dayId => project.days[dayId]);
                    console.log(`Загружен порядок дней из localStorage: ${project.order.days.join(', ')}`);
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке порядка дней из localStorage:', error);
        }
        
        // Если порядок дней пуст, используем все найденные дни
        if (project.order.days.length === 0 && dayIds.length > 0) {
            // Упорядочиваем дни по номеру
            dayIds.sort((a, b) => {
                const numA = parseInt(a.replace('day_', ''), 10) || 0;
                const numB = parseInt(b.replace('day_', ''), 10) || 0;
                return numA - numB;
            });
            
            project.order.days = dayIds;
            console.log(`Порядок дней создан на основе найденных дней: ${dayIds.join(', ')}`);
        }
        
        // Если дней нет вообще, создаем day_1
        if (Object.keys(project.days).length === 0) {
            console.log('Нет дней в localStorage, создаем день day_1');
            const day1Id = 'day_1';
            const day1 = {
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
            
            // Добавляем день в проект
            project.days[day1Id] = day1;
            project.order.days = [day1Id];
            
            // Сохраняем в localStorage
            localStorage.setItem(`project_${projectId}_day_${day1Id}`, JSON.stringify(day1));
            localStorage.setItem(`project_${projectId}_order`, JSON.stringify({days: [day1Id]}));
            console.log(`Создан день ${day1Id} в localStorage`);
        }
        
        console.log(`Проект ${projectId} загружен из localStorage:`, project);
        return project;
    }

    // Создание демо-проекта
    createDemoProject(projectId) {
        console.log(`Создание демо-проекта для ${projectId}`);
        
        // Базовая структура проекта
        const project = {
            id: projectId,
            title: `Проект ${projectId}`,
            description: 'Демонстрационный проект',
            days: {},
            order: { days: [] }
        };
        
        // Создаем только 1 день с примером поста
        const day1Id = 'day_1';
        
        // Пример поста для первого дня
        const day1 = {
                    date: new Date().toISOString().split('T')[0],
                    posts: [{
                        socialNetwork: 'Telegram',
                        contentType: 'Пост',
                        images: [],
                text: 'Это пример поста для демонстрации функционала календаря SMM публикаций.',
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString()
                    }]
                };
                    
                    // Добавляем день в проект
        project.days[day1Id] = day1;
        project.order.days = [day1Id];
        
        // Сохраняем в localStorage для возможности повторного использования
        try {
            localStorage.setItem(`project_${projectId}_day_${day1Id}`, JSON.stringify(day1));
            // Сохраняем порядок дней
            localStorage.setItem(`project_${projectId}_order`, JSON.stringify({days: [day1Id]}));
            console.log('Демо-проект сохранен в localStorage');
                } catch (error) {
            console.warn('Не удалось сохранить демо-проект в localStorage:', error);
            }
            
            return project;
    }
    
    // Загрузка из localStorage (для обратной совместимости)
    loadFromLocalStorage(projectId) {
        const project = {
            id: projectId,
            title: `Проект ${projectId}`,
            description: 'Календарь публикаций для социальных сетей',
            days: {}
        };
        
        // Загружаем дни из localStorage
        const prefix = `project_${projectId}_day_`;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                const date = key.replace(prefix, '');
                const dayData = JSON.parse(localStorage.getItem(key));
                project.days[date] = dayData;
            }
        }
        
        return project;
    }

    // Сохранение данных проекта
    async saveProjectData(projectId, data) {
        this.checkReady();
        
        try {
            // Создаем директории проекта
            await this.getDirectory(`projects/${projectId}/days`);
            
            // Получаем список существующих дней
            const existingDays = await this.readDirectory(`projects/${projectId}/days`);
            const existingDayIds = existingDays
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));
            
            // Определяем дни для сохранения
            const projectDays = Object.keys(data.days);
            
            // Удаляем дни, которых больше нет в проекте
            for (const dayId of existingDayIds) {
                if (!projectDays.includes(dayId)) {
                    await this.deleteFile(`projects/${projectId}/days/${dayId}.json`);
                }
            }
            
            // Сохраняем каждый день
            for (const [dayId, dayData] of Object.entries(data.days)) {
                const dayPath = `projects/${projectId}/days/${dayId}.json`;
                await this.writeFile(dayPath, dayData);
            }
            
            // Сортируем дни по номеру
            projectDays.sort((a, b) => {
                const numA = parseInt(a.replace('day_', ''), 10);
                const numB = parseInt(b.replace('day_', ''), 10);
                return numA - numB;
            });
            
            // Сохраняем порядок дней
            const orderPath = `projects/${projectId}/order.json`;
            await this.writeFile(orderPath, { days: projectDays });
            
            return true;
        } catch (error) {
            console.error('Ошибка при сохранении данных проекта:', error);
            
            // В случае ошибки сохраняем в localStorage
            this.saveToLocalStorage(projectId, data);
            return false;
        }
    }
    
    // Сохранение в localStorage (для обратной совместимости)
    saveToLocalStorage(projectId, data) {
        // Сохраняем каждый день отдельно
        Object.entries(data.days).forEach(([date, dayData]) => {
            const key = `project_${projectId}_day_${date}`;
            localStorage.setItem(key, JSON.stringify(dayData));
        });
    }

    // Обновление данных дня
    async updateProjectDay(projectId, dayId, dayData) {
        this.checkReady();
        
        try {
            // Создаем директории проекта
            await this.getDirectory(`projects/${projectId}/days`);
            
            // Путь к файлу дня
            const dayPath = `projects/${projectId}/days/${dayId}.json`;
            
            // Если dayData равен null, удаляем день
            if (dayData === null) {
                await this.deleteFile(dayPath);
                
                // Обновляем order.json
                const orderPath = `projects/${projectId}/order.json`;
                const orderData = await this.readFile(orderPath);
                
                if (orderData) {
                    try {
                        const order = JSON.parse(orderData);
                        order.days = (order.days || []).filter(d => d !== dayId);
                        await this.writeFile(orderPath, order);
                    } catch (error) {
                        console.error('Ошибка при обновлении order.json:', error);
                    }
                }
            } else {
                // Иначе создаем или обновляем файл дня
                await this.writeFile(dayPath, dayData);
                
                // Обновляем order.json
                const orderPath = `projects/${projectId}/order.json`;
                const orderData = await this.readFile(orderPath);
                
                if (orderData) {
                    try {
                        const order = JSON.parse(orderData);
                        if (!order.days) order.days = [];
                        if (!order.days.includes(dayId)) {
                            order.days.push(dayId);
                            // Сортируем дни по номеру
                            order.days.sort((a, b) => {
                                const numA = parseInt(a.replace('day_', ''), 10);
                                const numB = parseInt(b.replace('day_', ''), 10);
                                return numA - numB;
                            });
                        }
                        await this.writeFile(orderPath, order);
                    } catch (error) {
                        console.error('Ошибка при обновлении order.json:', error);
                    }
                } else {
                    // Если order.json не существует, создаем его
                    await this.writeFile(orderPath, { days: [dayId] });
                }
            }
            
            return true;
        } catch (error) {
            console.error('Ошибка при обновлении дня:', error);
            
            // В случае ошибки сохраняем в localStorage
            const key = `project_${projectId}_day_${dayId}`;
            if (dayData === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(dayData));
            }
            
            return false;
        }
    }

    // Сохранение изображения
    async saveImage(projectId, file) {
        try {
            // Проверяем инициализацию
            if (!this.isInitialized() && !this.checkReady()) {
                // В демо-режиме создаем имитацию пути к файлу и сохраняем в localStorage
                console.log('Filesystem не инициализирован, используем демо-режим для сохранения изображения');
                
                // Генерируем уникальный идентификатор для изображения
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 8);
                const imagePath = `images/${timestamp}_${randomString}_${file.name}`;
                
                // Создаем URL для изображения
                const url = URL.createObjectURL(file);
                
                // Сохраняем изображение в localStorage
                try {
                    // Сохраняем URL в localStorage
                    localStorage.setItem(`demo_image_${imagePath}`, url);
                    
                    // Сохраняем информацию о проекте и изображении
                    const imagesKey = `project_${projectId}_images`;
                    let images = [];
                    try {
                        const savedImages = localStorage.getItem(imagesKey);
                        if (savedImages) {
                            images = JSON.parse(savedImages);
                        }
                    } catch (e) {
                        console.warn('Ошибка при загрузке списка изображений из localStorage:', e);
                    }
                    
                    // Добавляем новое изображение в список
                    images.push({ path: imagePath, url: url, projectId: projectId });
                    localStorage.setItem(imagesKey, JSON.stringify(images));
                    
                    return imagePath;
                } catch (error) {
                    console.error('Ошибка при сохранении изображения в localStorage:', error);
                    throw new Error('Не удалось сохранить изображение в демо-режиме');
                }
            }
            
            // Стандартный режим сохранения через файловую систему
            // Проверяем инициализацию
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
            // Получаем директорию для изображений
            const imagesDir = await this.getDirectory(`${projectId}/images`);
            
            // Генерируем уникальное имя файла
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
            
            // Создаем файл в директории изображений
            const fileHandle = await imagesDir.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(file);
            await writable.close();
            
            // Возвращаем путь к файлу
            return `images/${fileName}`;
        } catch (error) {
            console.error('Ошибка при сохранении изображения:', error);
            throw error;
        }
    }

    // Получение URL изображения
    async getImage(projectId, imagePath) {
        try {
            // Проверяем, используется ли демо-режим
            if (!this.isInitialized() && !this.checkReady()) {
                console.log('Filesystem не инициализирован, используем демо-режим для загрузки изображения');
                
                // Проверяем сохраненное изображение в localStorage
                const imageUrl = localStorage.getItem(`demo_image_${imagePath}`);
                if (imageUrl) {
                    return imageUrl;
                }
                
                // Проверяем в списке изображений
                const imagesKey = `project_${projectId}_images`;
                let images = [];
                try {
                    const savedImages = localStorage.getItem(imagesKey);
                    if (savedImages) {
                        images = JSON.parse(savedImages);
                        const image = images.find(img => img.path === imagePath);
                        if (image && image.url) {
                            return image.url;
                        }
                    }
                } catch (e) {
                    console.warn('Ошибка при загрузке списка изображений из localStorage:', e);
                }
                
                // Если изображение не найдено, возвращаем плейсхолдер
                return 'https://via.placeholder.com/150?text=Demo+Image';
            }
            
            // Проверяем инициализацию
            if (!this.checkReady()) {
                throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
            }
            
            // Получаем путь к файлу
            const parts = imagePath.split('/');
            const fileName = parts.pop();
            const dirPath = parts.join('/');
            
            // Получаем директорию и файл
            const dirHandle = await this.getDirectory(`${projectId}/${dirPath}`);
            const fileHandle = await dirHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            
            // Возвращаем URL файла
            return URL.createObjectURL(file);
        } catch (error) {
            console.error('Ошибка при получении изображения:', error);
            // Возвращаем плейсхолдер в случае ошибки
            return 'https://via.placeholder.com/150?text=Error';
        }
    }

    // Удаление изображения
    async deleteImage(projectId, imagePath) {
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
        try {
            // Полный путь к файлу изображения
            const fullPath = `${projectId}/${imagePath}`;
            
            // Удаляем файл изображения
            await this.deleteFile(fullPath);
            
            return true;
        } catch (error) {
            console.error('Ошибка при удалении изображения:', error);
            return false;
        }
    }

    // Функция для сжатия изображения
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.src = url;
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Максимальные размеры
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                
                let width = img.width;
                let height = img.height;
                
                // Изменяем размеры, сохраняя пропорции
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // Конвертируем в Blob с нужным типом
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Не удалось создать Blob'));
                    }
                }, file.type || 'image/jpeg', 0.8);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Ошибка загрузки изображения'));
            };
        });
    }

    // Загрузка списка проектов
    async getProjects() {
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
        try {
            // Получаем список проектов (поддиректорий) из выбранной пользователем директории
            const projects = [];
            
            console.log('Анализируем директорию для поиска проектов:', this.projectsDirectoryHandle.name);
            
            for await (const entry of this.projectsDirectoryHandle.values()) {
                if (entry.kind === 'directory') {
                    const projectId = entry.name;
                    
                    // Проверяем структуру директории на соответствие проекту
                    let isProject = false;
                    let projectName = projectId;
                    let projectDescription = '';
                    let projectCreated = new Date().toISOString();
                    let projectLastModified = new Date().toISOString();
                    
                    try {
                        console.log(`Проверяем директорию ${projectId} на наличие проекта`);
                        
                        // Сначала проверяем наличие meta.json
                        try {
                            const metaFileHandle = await entry.getFileHandle('meta.json');
                            const metaFile = await metaFileHandle.getFile();
                            const metaData = await metaFile.text();
                            
                            try {
                                const meta = JSON.parse(metaData);
                                projectName = meta.name || projectId;
                                projectDescription = meta.description || '';
                                projectCreated = meta.created || projectCreated;
                                projectLastModified = meta.lastModified || projectLastModified;
                                isProject = true;
                                console.log(`Директория ${projectId} содержит meta.json, это проект`);
                            } catch (error) {
                                console.warn(`Ошибка при разборе meta.json для проекта ${projectId}:`, error);
                            }
                        } catch (error) {
                            console.log(`В директории ${projectId} не найден meta.json`);
                            
                            // Нет meta.json, проверяем наличие директории days или файлов календаря
                            try {
                                // Проверяем наличие директории days
                                await entry.getDirectoryHandle('days');
                                isProject = true;
                                console.log(`Директория ${projectId} содержит папку days, это проект`);
                            } catch (daysError) {
                                // Проверяем наличие других признаков проекта (например, order.json)
                                try {
                                    await entry.getFileHandle('order.json');
                                    isProject = true;
                                    console.log(`Директория ${projectId} содержит order.json, это проект`);
                                } catch (orderError) {
                                    // Проверяем содержимое директории на наличие файлов .json
                                    let hasJsonFiles = false;
                                    for await (const subEntry of entry.values()) {
                                        if (subEntry.kind === 'file' && subEntry.name.endsWith('.json')) {
                                            hasJsonFiles = true;
                                            break;
                                        }
                                    }
                                    
                                    if (hasJsonFiles) {
                                        isProject = true;
                                        console.log(`Директория ${projectId} содержит JSON файлы, это потенциальный проект`);
                                    } else {
                                        console.log(`Директория ${projectId} не похожа на проект`);
                                    }
                                }
                            }
                        }
                        
                        if (isProject) {
                            console.log(`Добавляем проект ${projectId} в список проектов`);
                            projects.push({
                                id: projectId,
                                name: projectName,
                                description: projectDescription,
                                created: projectCreated,
                                lastModified: projectLastModified
                            });
                        }
                    } catch (error) {
                        console.error(`Ошибка при проверке директории ${projectId}:`, error);
                    }
                }
            }
            
            console.log(`Найдено проектов: ${projects.length}`);
            
            // Если нет проектов, создаем дефолтный проект только при необходимости
            if (projects.length === 0) {
                console.log('Проекты не найдены, спрашиваем пользователя о создании тестового проекта');
                if (confirm('В выбранной директории не найдено проектов. Создать тестовый проект?')) {
                const projectId = 'agarto-test';
                const projectDir = await this.getDirectory(projectId);
                
                // Создаем meta.json
                const meta = {
                        name: 'Тестовый проект',
                    description: 'Тестовый проект для демонстрации',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                
                const metaFileHandle = await projectDir.getFileHandle('meta.json', { create: true });
                const metaWritable = await metaFileHandle.createWritable();
                await metaWritable.write(JSON.stringify(meta, null, 2));
                await metaWritable.close();
                    
                    // Создаем директорию days
                    await this.getDirectory(`${projectId}/days`);
                
                projects.push({
                    id: projectId,
                    name: meta.name,
                    description: meta.description,
                    created: meta.created,
                    lastModified: meta.lastModified
                });
                    
                    console.log('Создан тестовый проект:', projectId);
                }
            }
            
            return projects;
        } catch (error) {
            console.error('Ошибка при загрузке списка проектов:', error);
            throw error;
        }
    }
    
    // Получение проектов из localStorage
    getProjectsFromLocalStorage() {
        try {
            // Возвращаем список проектов из localStorage
            const projects = [];
            const projectIds = new Set();
            
            // Находим все проекты по ключам localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('project_')) {
                    const parts = key.split('_');
                    if (parts.length >= 2) {
                        projectIds.add(parts[1]);
                    }
                }
            }
            
            // Создаем объекты проектов
            projectIds.forEach(id => {
                // Определяем последнюю модификацию
                let lastModified = null;
                
                // Ищем дни проекта для определения последней модификации
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith(`project_${id}_day_`)) {
                        try {
                            const dayData = JSON.parse(localStorage.getItem(key));
                            const dayLastModified = dayData?.posts?.[0]?.lastModified;
                            
                            if (dayLastModified && (!lastModified || new Date(dayLastModified) > new Date(lastModified))) {
                                lastModified = dayLastModified;
                            }
                        } catch (error) {
                            console.error(`Error parsing day data for project ${id}:`, error);
                        }
                    }
                }
                
                projects.push({
                    id,
                    title: `Проект ${id}`,
                    description: 'Календарь публикаций для социальных сетей',
                    lastModified
                });
            });
            
            // Добавляем стандартный проект, если нет проектов
            if (projects.length === 0) {
                projects.push({
                    id: 'agarto-test',
                    title: 'Agarto Test',
                    description: 'Тестовый проект для демонстрации',
                    lastModified: new Date().toISOString()
                });
            }
            
            return projects;
        } catch (error) {
            console.error('Error getting projects from localStorage:', error);
            // Возвращаем дефолтный проект в случае ошибки
            return [{
                id: 'agarto-test',
                title: 'Agarto Test',
                description: 'Тестовый проект для демонстрации',
                lastModified: new Date().toISOString()
            }];
        }
    }

    // Удаление проекта
    async deleteProject(projectId) {
        this.checkReady();
        
        try {
            // Получаем директорию проекта
            const projectPath = `projects/${projectId}`;
            
            // Удаляем все файлы в директории
            const entries = await this.readDirectory(projectPath);
            for (const entry of entries) {
                await this.deleteFile(`${projectPath}/${entry}`);
            }
            
            // Удаляем директорию
            const dirHandle = await this.getDirectory('projects');
            await dirHandle.removeEntry(projectId, { recursive: true });
            
            // Удаляем проект из кэша
            delete this.directoryHandles[projectPath];
            
            // Удаляем проект из localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(`project_${projectId}_`)) {
                    localStorage.removeItem(key);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Ошибка при удалении проекта:', error);
            
            // В случае ошибки удаляем из localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(`project_${projectId}_`)) {
                    localStorage.removeItem(key);
                }
            }
            
            return false;
        }
    }

    // Проверка существования файла
    async fileExists(filePath) {
        if (!this.checkReady()) {
            console.error('Файловая система не готова');
            return false;
        }
        
        try {
            // Разделяем путь на части
            const parts = filePath.split('/');
            const fileName = parts.pop();
            const directoryPath = parts.join('/');
            
            // Получаем директорию
            const dirHandle = await this.getDirectory(directoryPath);
            
            try {
                // Проверяем существование файла
                await dirHandle.getFileHandle(fileName);
                console.log(`Файл ${filePath} существует`);
                return true;
            } catch (error) {
                console.log(`Файл ${filePath} не существует`);
                return false;
            }
        } catch (error) {
            console.error(`Ошибка при проверке существования файла ${filePath}:`, error);
            return false;
        }
    }

    // Метод для создания директории
    async createDirectory(directoryPath) {
        try {
            if (!this.checkReady()) {
                console.error('Файловая система не готова');
                return null;
            }

            // Разбиваем путь на части
            const parts = directoryPath.split('/').filter(part => part);
            let currentDir = this.rootHandle;

            // Проходим по всем частям пути и создаем директории по необходимости
            for (const part of parts) {
                try {
                    // Пытаемся получить директорию, если она существует
                    currentDir = await currentDir.getDirectoryHandle(part);
                } catch (e) {
                    // Если директория не существует, создаем её
                    console.log(`Создаем директорию ${part}`);
                    currentDir = await currentDir.getDirectoryHandle(part, { create: true });
                }
            }

            return currentDir;
        } catch (error) {
            console.error('Ошибка при создании директории:', error);
            return null;
        }
    }

    // Обновление порядка дней в order.json
    async updateOrderJson(projectId, daysOrder) {
        try {
            if (!this.checkReady()) {
                throw new Error('Файловая система не инициализирована');
            }
            
            console.log(`Обновление order.json для проекта ${projectId}...`);
            
            // Получаем директорию проекта
            const projectDir = await this.getDirectory(projectId);
            
            // Обновляем файл order.json
            const orderFileHandle = await projectDir.getFileHandle('order.json', { create: true });
            const writable = await orderFileHandle.createWritable();
            await writable.write(JSON.stringify({ days: daysOrder }, null, 2));
            await writable.close();
            
            console.log(`Успешно обновлен order.json для проекта ${projectId}`);
            return true;
        } catch (error) {
            console.error(`Ошибка при обновлении order.json для проекта ${projectId}:`, error);
            throw error;
        }
    }
}

// Создаем и экспортируем экземпляр
window.filesystem = new FileSystem(); 