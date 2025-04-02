import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

// Директория с загруженными изображениями
const uploadDir = path.join(process.cwd(), 'public/uploads');

// Функция для очистки имени файла от недопустимых символов
const sanitizeFileName = (name) => {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
};

// Получение списка всех проектов (для тестового пользователя)
const getTestProjects = () => {
  if (global.testUserProjects) {
    return global.testUserProjects;
  }
  
  try {
    const testProjectsFile = path.join(process.cwd(), 'test-projects.json');
    if (fs.existsSync(testProjectsFile)) {
      const data = fs.readFileSync(testProjectsFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading test projects:', error);
  }
  
  return [];
};

// Получение списка всех изображений, используемых в проектах
const getUsedImages = (projects) => {
  const usedImages = new Map();
  
  projects.forEach(project => {
    const projectName = sanitizeFileName(project.name || 'unnamed');
    
    if (project.days && Array.isArray(project.days)) {
      project.days.forEach((day, dayIndex) => {
        const date = day.date || new Date().toISOString().split('T')[0];
        
        if (day.images && Array.isArray(day.images)) {
          day.images.forEach((imagePath, imageIndex) => {
            // Получаем только имя файла из пути
            const filename = path.basename(imagePath);
            // Сохраняем информацию об изображении
            usedImages.set(filename, {
              projectName,
              date,
              dayIndex,
              imageIndex,
              originalPath: imagePath
            });
          });
        }
      });
    }
  });
  
  return usedImages;
};

// Получение списка всех файлов в директории uploads
const getAllUploadedFiles = async () => {
  try {
    const files = await fs.readdir(uploadDir);
    return files;
  } catch (error) {
    console.error('Error reading upload directory:', error);
    return [];
  }
};

// Удаление неиспользуемых изображений
const deleteUnusedImages = async (allFiles, usedImages) => {
  const deletedFiles = [];
  
  for (const file of allFiles) {
    if (!usedImages.has(file)) {
      try {
        await fs.unlink(path.join(uploadDir, file));
        deletedFiles.push(file);
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    }
  }
  
  return deletedFiles;
};

// Переименование используемых изображений по новой схеме
const renameUsedImages = async (usedImages, projects) => {
  const renamedFiles = [];
  const updatedProjects = JSON.parse(JSON.stringify(projects));
  
  // Создаем карту соответствия старых и новых имен файлов
  const fileNameMap = new Map();
  
  // Сначала формируем новые имена файлов
  for (const [oldFileName, imageInfo] of usedImages.entries()) {
    const { projectName, date, imageIndex } = imageInfo;
    const ext = path.extname(oldFileName);
    const newFileName = `${projectName}_${date}_img_${imageIndex}${ext}`;
    fileNameMap.set(oldFileName, newFileName);
  }
  
  // Переименовываем файлы
  for (const [oldFileName, newFileName] of fileNameMap.entries()) {
    try {
      const oldPath = path.join(uploadDir, oldFileName);
      const newPath = path.join(uploadDir, newFileName);
      
      // Проверяем, существует ли файл
      try {
        await fs.access(oldPath);
      } catch (error) {
        console.error(`File ${oldPath} does not exist, skipping`);
        continue;
      }
      
      // Переименовываем файл
      await fs.rename(oldPath, newPath);
      renamedFiles.push({ oldFileName, newFileName });
    } catch (error) {
      console.error(`Error renaming file ${oldFileName} to ${newFileName}:`, error);
    }
  }
  
  // Обновляем пути в проектах
  updatedProjects.forEach(project => {
    if (project.days && Array.isArray(project.days)) {
      project.days.forEach(day => {
        if (day.images && Array.isArray(day.images)) {
          day.images = day.images.map(imagePath => {
            const oldFileName = path.basename(imagePath);
            const newFileName = fileNameMap.get(oldFileName);
            
            if (newFileName) {
              return `/uploads/${newFileName}`;
            }
            
            return imagePath;
          });
        }
      });
    }
  });
  
  // Сохраняем обновленные проекты
  global.testUserProjects = updatedProjects;
  if (global.saveTestProjects) {
    global.saveTestProjects();
  }
  
  return { renamedFiles, updatedProjects };
};

export default async function handler(req, res) {
  // Проверка аутентификации
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Только для POST запросов
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Получаем список всех проектов
    const projects = getTestProjects();
    
    // Получаем список всех используемых изображений
    const usedImages = getUsedImages(projects);
    
    // Получаем список всех файлов в директории uploads
    const allFiles = await getAllUploadedFiles();
    
    // Переименовываем используемые изображения
    const { renamedFiles, updatedProjects } = await renameUsedImages(usedImages, projects);
    
    // Удаляем неиспользуемые изображения
    const deletedFiles = await deleteUnusedImages(allFiles, usedImages);
    
    return res.status(200).json({
      success: true,
      message: `Renamed ${renamedFiles.length} images and cleaned up ${deletedFiles.length} unused images`,
      renamedFiles,
      deletedFiles
    });
  } catch (error) {
    console.error('Error renaming and cleaning up images:', error);
    return res.status(500).json({
      success: false,
      message: 'Error renaming and cleaning up images',
      error: error.message
    });
  }
}
