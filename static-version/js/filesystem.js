// Эмуляция файловой системы в браузере
class FileSystem {
    constructor() {
        this.isReady = false;
        this.rootHandle = null;
        this.projectsDirectoryHandle = null;
        this.directoryHandles = {}; // Кэш для хэндлов директорий
        
        // Восстанавливаем состояние из localStorage
        const fsState = localStorage.getItem('filesystem_state');
        if (fsState) {
            try {
                const state = JSON.parse(fsState);
                this.isReady = state.isReady || false;
            } catch (error) {
                console.error('Ошибка при восстановлении состояния filesystem:', error);
            }
        }
    }

    async initialize() {
        try {
            // Запрашиваем доступ к директории
            this.rootHandle = await window.showDirectoryPicker();
            
            // Проверяем, является ли выбранная директория директорией проектов
            try {
                // Проверяем, существует ли папка projects в корне
                this.projectsDirectoryHandle = await this.rootHandle.getDirectoryHandle('projects', { create: false });
                console.log('Найдена директория projects в корне');
            } catch (error) {
                // Если директории projects нет, значит выбранная директория и есть корень проектов
                console.log('Выбранная директория является корнем проектов');
                this.projectsDirectoryHandle = this.rootHandle;
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
            
            // Сохраняем состояние
            this._saveState();
            
            return false;
        }
    }

    // Сохранение состояния в localStorage
    _saveState() {
        localStorage.setItem('filesystem_state', JSON.stringify({
            isReady: this.isReady
        }));
    }

    // Проверка готовности файловой системы
    checkReady() {
        // Возвращаем true только если установлен флаг isReady и есть handle директории проектов
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

        // Начинаем с директории проектов
        let currentHandle = this.projectsDirectoryHandle;
        
        // Если путь пустой или равен 'projects', возвращаем директорию проектов
        if (!path || path === '' || path === 'projects') {
            this.directoryHandles[path] = currentHandle;
            return currentHandle;
        }
        
        // Если путь начинается с 'projects/', удаляем префикс
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
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
        try {
            console.log(`Загрузка данных проекта ${projectId}...`);
            
            // Директория проекта
            const projectDir = await this.getDirectory(projectId);
            
            // Директория с днями
            let daysDir;
            try {
                daysDir = await projectDir.getDirectoryHandle('days', { create: true });
            } catch (error) {
                console.error(`Не удалось получить или создать директорию дней для проекта ${projectId}:`, error);
                throw error;
            }
            
            // Создаем объект проекта
            const project = {
                id: projectId,
                title: `Проект ${projectId}`,
                description: 'Календарь публикаций для социальных сетей',
                days: {}
            };
            
            // Список дней из order.json
            let days = [];
            
            // Получаем список всех файлов в директории дней
            const daysEntries = [];
            for await (const entry of daysDir.values()) {
                if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                    const dayId = entry.name.replace('.json', '');
                    daysEntries.push(dayId);
                    console.log(`Найден день: ${dayId}`);
                }
            }
            
            // Пытаемся прочитать order.json
            try {
                const orderFileHandle = await projectDir.getFileHandle('order.json');
                const orderFile = await orderFileHandle.getFile();
                const orderData = await orderFile.text();
                
                try {
                    const order = JSON.parse(orderData);
                    days = order.days || [];
                    console.log(`Прочитан порядок дней из order.json: ${days.join(', ')}`);
                } catch (error) {
                    console.error('Ошибка при разборе order.json:', error);
                }
            } catch (error) {
                console.log('Файл order.json не найден, будем использовать дни из директории');
                days = daysEntries;
            }
            
            // Проверяем соответствие списка дней из order.json и файлов в директории
            // Если в order.json есть дни, которых нет на диске, удаляем их из списка
            const validDays = days.filter(dayId => daysEntries.includes(dayId));
            
            // Проверяем, есть ли дни на диске, которых нет в order.json
            const missingDays = daysEntries.filter(dayId => !days.includes(dayId));
            if (missingDays.length > 0) {
                console.log(`Найдены дни на диске, которых нет в order.json: ${missingDays.join(', ')}`);
                validDays.push(...missingDays);
            }
            
            // Используем обновленный список дней
            days = validDays;
            
            // Если из order.json не получили ни одного дня, используем дни из директории
            if (days.length === 0 && daysEntries.length > 0) {
                days = [...daysEntries];
                console.log(`Используем дни из директории: ${days.join(', ')}`);
            }
            
            // Сортируем дни по номеру
            days.sort((a, b) => {
                const numA = parseInt(a.replace('day_', ''), 10);
                const numB = parseInt(b.replace('day_', ''), 10);
                return numA - numB;
            });
            
            console.log(`Отсортированный список дней: ${days.join(', ')}`);
            
            // Сохраняем порядок дней в order.json, если он отличается или отсутствует
            try {
                const orderFileHandle = await projectDir.getFileHandle('order.json', { create: true });
                const writable = await orderFileHandle.createWritable();
                await writable.write(JSON.stringify({ days }, null, 2));
                await writable.close();
                console.log(`Сохранен обновленный порядок дней в order.json`);
            } catch (error) {
                console.error('Ошибка при сохранении order.json:', error);
            }
            
            // Загружаем данные для каждого дня
            for (const dayId of days) {
                try {
                    const dayFileHandle = await daysDir.getFileHandle(`${dayId}.json`);
                    const dayFile = await dayFileHandle.getFile();
                    const dayData = await dayFile.text();
                    
                    try {
                        project.days[dayId] = JSON.parse(dayData);
                        console.log(`Загружены данные дня ${dayId}`);
                    } catch (error) {
                        console.error(`Ошибка при разборе JSON дня ${dayId}:`, error);
                    }
                } catch (error) {
                    console.error(`Ошибка при чтении файла дня ${dayId}:`, error);
                }
            }
            
            // Сохраняем список дней в проекте для упрощения доступа
            project.order = { days };
            
            // Если в проекте нет дней, создаем первый день
            if (Object.keys(project.days).length === 0) {
                console.log(`В проекте нет дней, создаем первый день`);
                
                const dayId = 'day_1'; // Начинаем с day_1 вместо day_0
                
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
                
                // Сохраняем файл дня
                try {
                    const dayFileHandle = await daysDir.getFileHandle(`${dayId}.json`, { create: true });
                    const writable = await dayFileHandle.createWritable();
                    await writable.write(JSON.stringify(newDay, null, 2));
                    await writable.close();
                    console.log(`Создан первый день ${dayId}`);
                    
                    // Обновляем order.json
                    const orderFileHandle = await projectDir.getFileHandle('order.json', { create: true });
                    const orderWritable = await orderFileHandle.createWritable();
                    await orderWritable.write(JSON.stringify({ days: [dayId] }, null, 2));
                    await orderWritable.close();
                    console.log(`Обновлен order.json с первым днем`);
                    
                    // Добавляем день в проект
                    project.days[dayId] = newDay;
                    project.order = { days: [dayId] };
                } catch (error) {
                    console.error(`Ошибка при создании первого дня для проекта ${projectId}:`, error);
                }
            }
            
            console.log(`Проект ${projectId} загружен успешно:`, project);
            return project;
        } catch (error) {
            console.error(`Ошибка при загрузке данных проекта ${projectId}:`, error);
            throw error;
        }
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
    async saveImage(projectId, imageFile) {
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
        try {
            // Создаем директорию для изображений
            await this.getDirectory(`${projectId}/images`);
            
            // Генерируем уникальное имя файла
            const fileName = `img_${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            
            // Путь к файлу изображения
            const imagePath = `${projectId}/images/${fileName}`;
            
            // Сжимаем изображение
            const compressedImage = await this.compressImage(imageFile);
            
            // Сохраняем изображение
            await this.writeFile(imagePath, compressedImage);
            
            // Возвращаем путь к изображению для сохранения в дне
            return `images/${fileName}`;
        } catch (error) {
            console.error('Ошибка при сохранении изображения:', error);
            throw error;
        }
    }

    // Получение изображения
    async getImage(projectId, imagePath) {
        if (!this.checkReady()) {
            throw new Error('Filesystem не инициализирован. Пожалуйста, выберите рабочую директорию.');
        }
        
        try {
            // Путь к файлу изображения
            const fullPath = `${projectId}/${imagePath}`;
            
            // Читаем файл изображения
            const imageFile = await this.readFile(fullPath);
            
            if (imageFile) {
                // Если изображение получено как Blob, создаем URL для него
                if (imageFile instanceof Blob) {
                    return URL.createObjectURL(imageFile);
                }
                return imageFile;
            }
            
            return null;
        } catch (error) {
            console.error('Ошибка при получении изображения:', error);
            return null;
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
            // Получаем список проектов (поддиректорий) из директории проектов
            const projects = [];
            
            for await (const entry of this.projectsDirectoryHandle.values()) {
                if (entry.kind === 'directory') {
                    const projectId = entry.name;
                    
                    // Проверяем, есть ли в директории проекта meta.json или days
                    let isProject = false;
                    let projectName = projectId;
                    let projectDescription = '';
                    let projectCreated = new Date().toISOString();
                    let projectLastModified = new Date().toISOString();
                    
                    try {
                        // Проверяем наличие meta.json
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
                            } catch (error) {
                                console.error(`Ошибка при разборе meta.json для проекта ${projectId}:`, error);
                            }
                        } catch (error) {
                            // Нет meta.json, проверяем наличие директории days
                            try {
                                await entry.getDirectoryHandle('days');
                                isProject = true;
                            } catch (daysError) {
                                // Нет директории days, не считаем директорию проектом
                            }
                        }
                        
                        if (isProject) {
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
            
            // Если нет проектов, добавляем дефолтный проект
            if (projects.length === 0) {
                // Создаем дефолтный проект agarto-test
                const projectId = 'agarto-test';
                const projectDir = await this.getDirectory(projectId);
                const daysDir = await projectDir.getDirectoryHandle('days', { create: true });
                
                // Создаем meta.json
                const meta = {
                    name: 'Agarto Test',
                    description: 'Тестовый проект для демонстрации',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                
                const metaFileHandle = await projectDir.getFileHandle('meta.json', { create: true });
                const metaWritable = await metaFileHandle.createWritable();
                await metaWritable.write(JSON.stringify(meta, null, 2));
                await metaWritable.close();
                
                projects.push({
                    id: projectId,
                    name: meta.name,
                    description: meta.description,
                    created: meta.created,
                    lastModified: meta.lastModified
                });
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
}

// Создаем и экспортируем экземпляр
window.filesystem = new FileSystem(); 