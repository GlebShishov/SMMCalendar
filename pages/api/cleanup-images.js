import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

// Директория с загруженными изображениями
const uploadDir = path.join(process.cwd(), 'public/uploads');

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
  const usedImages = new Set();
  
  projects.forEach(project => {
    if (project.days && Array.isArray(project.days)) {
      project.days.forEach(day => {
        if (day.images && Array.isArray(day.images)) {
          day.images.forEach(imagePath => {
            // Получаем только имя файла из пути
            const filename = path.basename(imagePath);
            usedImages.add(filename);
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
    
    // Удаляем неиспользуемые изображения
    const deletedFiles = await deleteUnusedImages(allFiles, usedImages);
    
    return res.status(200).json({
      success: true,
      message: `Cleaned up ${deletedFiles.length} unused images`,
      deletedFiles
    });
  } catch (error) {
    console.error('Error cleaning up images:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cleaning up images',
      error: error.message
    });
  }
}
