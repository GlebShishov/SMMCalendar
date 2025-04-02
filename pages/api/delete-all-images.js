import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

// Директория с загруженными изображениями
const uploadDir = path.join(process.cwd(), 'public/uploads');

// Удаление всех изображений
const deleteAllImages = async () => {
  try {
    // Проверяем существование директории
    await fs.access(uploadDir);
    
    // Получаем список всех файлов
    const files = await fs.readdir(uploadDir);
    const deletedFiles = [];
    
    // Удаляем каждый файл
    for (const file of files) {
      try {
        await fs.unlink(path.join(uploadDir, file));
        deletedFiles.push(file);
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    }
    
    return deletedFiles;
  } catch (error) {
    console.error('Error accessing upload directory:', error);
    return [];
  }
};

// Очистка проектов от изображений
const clearProjectImages = () => {
  // Получаем все тестовые проекты
  if (!global.testUserProjects) {
    return 0;
  }
  
  let updatedProjects = 0;
  
  // Очищаем массивы изображений во всех днях всех проектов
  global.testUserProjects.forEach(project => {
    if (project.days && Array.isArray(project.days)) {
      project.days.forEach(day => {
        if (day.images && Array.isArray(day.images) && day.images.length > 0) {
          day.images = [];
          updatedProjects++;
        }
      });
    }
  });
  
  // Сохраняем обновленные проекты
  if (typeof global.saveTestProjects === 'function') {
    global.saveTestProjects();
  }
  
  return updatedProjects;
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
    // Удаляем все изображения из директории
    const deletedFiles = await deleteAllImages();
    
    // Очищаем проекты от изображений
    const updatedProjects = clearProjectImages();
    
    // Возвращаем результат
    res.status(200).json({
      success: true,
      deletedFiles,
      deletedCount: deletedFiles.length,
      updatedProjects
    });
  } catch (error) {
    console.error('Error deleting images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete images',
      error: error.message
    });
  }
}
