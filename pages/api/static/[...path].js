import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  const { path: pathSegments } = req.query;

  // Проверяем, что путь содержит как минимум projectId и имя файла
  if (!pathSegments || pathSegments.length < 2) {
    return res.status(400).json({ success: false, message: 'Invalid path' });
  }

  const [projectId, ...filePath] = pathSegments;
  const projectDir = path.join(process.cwd(), 'projects', projectId);

  try {
    // Проверяем права доступа к проекту
    const accessFile = path.join(projectDir, 'access.json');
    const accessData = JSON.parse(await fs.readFile(accessFile, 'utf8'));

    // Проверяем, есть ли у пользователя доступ к проекту
    if (!session || !accessData.users.includes(session.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Формируем путь к файлу
    const filePath = path.join(projectDir, 'images', pathSegments.slice(1).join('/'));

    // Проверяем существование файла
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Определяем MIME-тип файла
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };

    // Читаем и отправляем файл
    const file = await fs.readFile(filePath);
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.send(file);
  } catch (error) {
    console.error('Error serving static file:', error);
    res.status(500).json({ success: false, message: 'Failed to serve file' });
  }
} 