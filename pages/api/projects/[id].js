import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');

export default async function handler(req, res) {
  const session = await getSession({ req });
  const { id } = req.query;
  const demoMode = req.query.demo === 'true';
  
  console.log('API request for project:', id);
  console.log('Session:', session ? { userId: session.user.id, username: session.user.username } : 'No session');
  console.log('Demo mode:', demoMode);
  
  // Если режим демонстрации и метод GET, разрешаем доступ без авторизации
  if (demoMode && req.method === 'GET') {
    return handleDemoMode(req, res, id);
  }
  
  // Для остальных запросов требуется авторизация
  if (!session) {
    console.log('Not authenticated, returning 401');
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    switch (req.method) {
      case 'GET':
        try {
          // Проверяем существование проекта
          const projectDir = path.join(PROJECTS_DIR, id);
          const accessFile = path.join(projectDir, 'access.json');
          const clientInfoFile = path.join(projectDir, 'client-info.json');
          const daysDir = path.join(projectDir, 'days');
          const orderFile = path.join(daysDir, 'order.json');

          // Читаем файл доступа
          const accessData = JSON.parse(await fs.readFile(accessFile, 'utf8'));
          
          // Проверяем, есть ли у пользователя доступ к проекту
          const userAccess = accessData.users.find(user => user.userId === session.user.id);
          
          if (!userAccess) {
            console.log('Access denied for user:', session.user.id);
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
          
          // Читаем информацию о клиенте
          const clientInfo = JSON.parse(await fs.readFile(clientInfoFile, 'utf8'));
          
          // Читаем порядок дней
          const orderData = JSON.parse(await fs.readFile(orderFile, 'utf8'));
          
          // Читаем все файлы дней
          const days = [];
          if (Array.isArray(orderData.order)) {
            for (const dayId of orderData.order) {
              try {
                const dayFile = path.join(daysDir, `${dayId}.json`);
                const dayData = JSON.parse(await fs.readFile(dayFile, 'utf8'));
                days.push(dayData);
              } catch (error) {
                console.error(`Error reading day file ${dayId}:`, error);
                // Пропускаем день с ошибкой и продолжаем
                continue;
              }
            }
          } else {
            console.warn('Order data is not an array:', orderData);
          }
          
          // Формируем объект проекта
          const project = {
            id: id,
            name: clientInfo.clientInfo.companyName || accessData.name,
            createdAt: accessData.createdAt,
            updatedAt: accessData.updatedAt,
            owner: accessData.owner,
            userRole: userAccess.role,
            clientInfo: clientInfo.clientInfo,
            days: days
          };
          
          res.status(200).json({ success: true, data: project });
        } catch (error) {
          console.error('Error reading project:', error);
          res.status(404).json({ success: false, message: 'Project not found' });
        }
        break;
        
      case 'PUT':
        try {
          const projectDir = path.join(PROJECTS_DIR, id);
          const accessFile = path.join(projectDir, 'access.json');
          
          // Читаем файл доступа
          const accessData = JSON.parse(await fs.readFile(accessFile, 'utf8'));
          
          // Проверяем, есть ли у пользователя доступ к проекту
          const userAccess = accessData.users.find(user => user.userId === session.user.id);
          
          if (!userAccess || (userAccess.role !== 'owner' && userAccess.role !== 'editor')) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
          
          // Обновляем данные проекта
          const { days, clientInfo } = req.body;
          
          if (clientInfo) {
            const clientInfoFile = path.join(projectDir, 'client-info.json');
            await fs.writeFile(clientInfoFile, JSON.stringify({
              clientInfo,
              lastModified: new Date().toISOString(),
              lastModifiedBy: session.user.id
            }, null, 2));
          }
          
          if (days) {
            const daysDir = path.join(projectDir, 'days');
            const orderFile = path.join(daysDir, 'order.json');
            
            // Обновляем порядок дней
            await fs.writeFile(orderFile, JSON.stringify({
              order: days.map(day => day.id),
              lastModified: new Date().toISOString(),
              lastModifiedBy: session.user.id
            }, null, 2));
            
            // Обновляем файлы дней
            for (const day of days) {
              const dayFile = path.join(daysDir, `${day.id}.json`);
              await fs.writeFile(dayFile, JSON.stringify(day, null, 2));
            }
          }
          
          // Обновляем время последнего изменения в access.json
          accessData.updatedAt = new Date().toISOString();
          await fs.writeFile(accessFile, JSON.stringify(accessData, null, 2));
          
          res.status(200).json({ success: true, data: req.body });
        } catch (error) {
          console.error('Error updating project:', error);
          res.status(400).json({ success: false, message: error.message });
        }
        break;
        
      default:
        res.status(405).json({ success: false, message: 'Method not allowed' });
        break;
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

function handleDemoMode(req, res, id) {
  // Implement demo mode if needed
  res.status(404).json({ success: false, message: 'Demo mode not implemented' });
}
