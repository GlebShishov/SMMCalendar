import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    // Парсим форму с файлами
    const form = new IncomingForm({ multiples: true });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const { projectId, dayId } = fields;
    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Проверяем права доступа к проекту
    const projectDir = path.join(process.cwd(), 'projects', projectId);
    const accessFile = path.join(projectDir, 'access.json');
    
    try {
      const accessData = JSON.parse(await fs.readFile(accessFile, 'utf8'));
      const userAccess = accessData.users.find(user => user.userId === session.user.id);
      if (!userAccess || (userAccess.role !== 'owner' && userAccess.role !== 'editor')) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } catch (error) {
      console.error('Error checking access:', error);
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Создаем директорию для изображений, если её нет
    const imagesDir = path.join(projectDir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    // Обрабатываем каждый загруженный файл
    const uploadedUrls = [];
    for (const file of uploadedFiles) {
      if (!file) continue;

      try {
        // Проверяем тип файла
        const mimeType = file.mimetype || '';
        if (!mimeType.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.originalFilename}`);
          continue;
        }

        // Генерируем уникальное имя файла
        const fileExt = path.extname(file.originalFilename || '').toLowerCase();
        const fileName = `${dayId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExt}`;
        const filePath = path.join(imagesDir, fileName);

        // Копируем файл
        await fs.copyFile(file.filepath, filePath);

        // Формируем URL для доступа к изображению
        const imageUrl = `/projects/${projectId}/images/${fileName}`;
        uploadedUrls.push(imageUrl);

        // Очищаем временный файл
        await fs.unlink(file.filepath).catch(console.error);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    if (uploadedUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid images were uploaded' });
    }

    res.status(200).json({
      success: true,
      urls: uploadedUrls
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ success: false, message: 'Failed to upload files' });
  }
}
