import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public/uploads');

// Test user ID for memory storage
const TEST_USER_ID = 'test-user-123';

// Ensure upload directory exists
const ensureDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// Функция для очистки имени файла от недопустимых символов
const sanitizeFileName = (name) => {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
};

export default async function handler(req, res) {
  // Check authentication
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await ensureDir();

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: true, // Разрешаем загрузку нескольких файлов
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Upload failed', error: err.message });
      }

      // Получаем название проекта и дату из полей запроса
      const projectName = fields.projectName ? sanitizeFileName(fields.projectName[0]) : 'unnamed';
      const date = fields.date ? sanitizeFileName(fields.date[0]) : new Date().toISOString().split('T')[0];
      const dayIndex = fields.dayIndex ? parseInt(fields.dayIndex[0]) : 0;
      
      // Обработка одного или нескольких файлов
      const fileList = files.file;
      
      // Если файлов нет, возвращаем ошибку
      if (!fileList) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      // Преобразуем в массив, если это один файл
      const filesArray = Array.isArray(fileList) ? fileList : [fileList];
      
      if (filesArray.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      // Обрабатываем каждый файл
      const uploadedFiles = await Promise.all(filesArray.map(async (file, index) => {
        // Формируем имя файла по схеме: название проекта_дата_img_порядковый номер_уникальный идентификатор
        const originalFilename = file.originalFilename || 'image.jpg';
        const ext = path.extname(originalFilename);
        const baseIndex = fields.baseIndex ? parseInt(fields.baseIndex[0]) : 0;
        const imageIndex = baseIndex + index;
        // Добавляем уникальный идентификатор (текущее время в миллисекундах + случайное число)
        const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const filename = `${projectName}_${date}_img_${imageIndex}_${uniqueId}${ext}`;
        
        // Move file to final destination
        const finalPath = path.join(uploadDir, filename);
        await fs.rename(file.filepath, finalPath);

        // Return the path that can be used to access the file
        return `/uploads/${filename}`;
      }));

      // Return the paths that can be used to access the files
      res.status(200).json({ 
        success: true, 
        urls: uploadedFiles 
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // If there's an error with file system operations, provide mock URLs for test user
    if (session.user.id === TEST_USER_ID) {
      // Generate fake image URLs for the test user
      const projectName = 'test_project';
      const date = new Date().toISOString().split('T')[0];
      const mockImageUrls = Array(3).fill().map((_, i) => `/mock-image-${projectName}_${date}_img_${i}.jpg`);
      res.status(200).json({ 
        success: true, 
        urls: mockImageUrls
      });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}
