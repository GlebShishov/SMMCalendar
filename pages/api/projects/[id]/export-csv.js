import dbConnect from '../../../../lib/dbConnect';
import Project from '../../../../models/Project';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;
  const isDemoMode = req.query.demo === 'true';

  try {
    await dbConnect();

    // Проверка авторизации (пропускаем в режиме демонстрации)
    if (!isDemoMode) {
      const session = await getSession({ req });
      if (!session) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    }

    // Находим проект по ID
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Проверка прав доступа (пропускаем в режиме демонстрации)
    if (!isDemoMode && project.userId.toString() !== session.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Генерируем CSV данные
    const csvRows = [];
    
    // Заголовок CSV
    csvRows.push(['День', 'Дата', 'Социальная сеть', 'Тип контента', 'Текст', 'Изображения'].join(','));
    
    // Данные проекта
    project.days.forEach((day, index) => {
      const date = day.date ? new Date(day.date).toLocaleDateString('ru-RU') : '';
      const socialNetwork = day.socialNetwork || '';
      const contentType = day.contentType || '';
      
      // Экранируем текст для CSV (заменяем кавычки и удаляем HTML-теги)
      let text = day.text || '';
      text = text.replace(/<[^>]*>/g, ''); // Удаляем HTML-теги
      text = text.replace(/"/g, '""'); // Экранируем кавычки
      
      // Если текст содержит запятые или переносы строк, заключаем его в кавычки
      if (text.includes(',') || text.includes('\\n') || text.includes('"')) {
        text = `"${text}"`;
      }
      
      // Объединяем URL изображений через точку с запятой
      const images = day.images ? day.images.join('; ') : '';
      
      csvRows.push([
        index + 1,
        date,
        socialNetwork,
        contentType,
        text,
        images
      ].join(','));
    });
    
    // Объединяем строки с переносами строк
    const csvContent = csvRows.join('\\n');
    
    // Отправляем CSV данные
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv"`);
    return res.status(200).send(csvContent);
    
  } catch (error) {
    console.error('Error exporting project to CSV:', error);
    return res.status(500).json({ success: false, message: 'Error exporting project to CSV' });
  }
}
