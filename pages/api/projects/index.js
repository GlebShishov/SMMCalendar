import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  switch (req.method) {
    case 'GET':
      try {
        // Получаем список всех директорий проектов
        const projectDirs = await fs.readdir(PROJECTS_DIR);
        const projects = [];

        // Для каждой директории проекта читаем информацию
        for (const dir of projectDirs) {
          // Пропускаем файл projects.json
          if (dir === 'projects.json') continue;
          
          try {
            const accessFile = path.join(PROJECTS_DIR, dir, 'access.json');
            const clientInfoFile = path.join(PROJECTS_DIR, dir, 'client-info.json');
            const daysDir = path.join(PROJECTS_DIR, dir, 'days');
            const orderFile = path.join(daysDir, 'order.json');

            // Читаем файл доступа
            const accessData = JSON.parse(await fs.readFile(accessFile, 'utf8'));
            
            // Проверяем, есть ли у пользователя доступ к проекту
            const hasAccess = accessData.users.some(user => user.userId === session.user.id);
            
            if (hasAccess) {
              // Читаем информацию о клиенте
              const clientInfo = JSON.parse(await fs.readFile(clientInfoFile, 'utf8'));
              
              // Читаем порядок дней
              const orderData = JSON.parse(await fs.readFile(orderFile, 'utf8'));
              
              // Получаем роль пользователя
              const userRole = accessData.users.find(user => user.userId === session.user.id)?.role || 'viewer';
              
              // Формируем объект проекта
              projects.push({
                id: dir,
                name: clientInfo.clientInfo.companyName || accessData.name,
                createdAt: accessData.createdAt,
                updatedAt: accessData.updatedAt,
                owner: accessData.owner,
                role: userRole
              });
            }
          } catch (error) {
            console.error(`Error reading project ${dir}:`, error);
            // Пропускаем проект с ошибкой и продолжаем
            continue;
          }
        }

        res.status(200).json({ success: true, data: projects });
      } catch (error) {
        console.error('Error reading projects:', error);
        res.status(500).json({ success: false, message: 'Failed to load projects' });
      }
      break;

    case 'POST':
      try {
        const { name } = req.body;
        if (!name) {
          return res.status(400).json({ success: false, message: 'Project name is required' });
        }

        // Создаем уникальный ID проекта
        const projectId = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
        const projectDir = path.join(PROJECTS_DIR, projectId);

        // Создаем структуру директорий
        await fs.mkdir(projectDir, { recursive: true });
        await fs.mkdir(path.join(projectDir, 'days'), { recursive: true });
        await fs.mkdir(path.join(projectDir, 'images'), { recursive: true });

        // Создаем файл доступа
        const accessData = {
          owner: session.user.id,
          users: [session.user.id],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await fs.writeFile(
          path.join(projectDir, 'access.json'),
          JSON.stringify(accessData, null, 2)
        );

        // Создаем базовый файл с информацией о клиенте
        const clientInfo = {
          clientInfo: {
            companyName: name,
            website: '',
            contacts: {
              phone: '',
              email: '',
              address: ''
            },
            socialMedia: {
              telegram: '',
              instagram: '',
              vk: '',
              facebook: ''
            },
            brandInfo: {
              description: '',
              usp: [],
              targetAudience: '',
              priceRange: ''
            },
            contentGuidelines: {
              tone: '',
              preferredTopics: [],
              forbiddenTopics: [],
              hashtagsToUse: []
            },
            designPreferences: {
              brandColors: [],
              fonts: {
                primary: '',
                secondary: ''
              },
              logo: {
                main: '',
                alternative: ''
              }
            }
          },
          lastModified: new Date().toISOString(),
          lastModifiedBy: session.user.id
        };
        await fs.writeFile(
          path.join(projectDir, 'client-info.json'),
          JSON.stringify(clientInfo, null, 2)
        );

        // Создаем файл порядка дней
        const orderData = {
          order: [],
          lastModified: new Date().toISOString(),
          lastModifiedBy: session.user.id
        };
        await fs.writeFile(
          path.join(projectDir, 'days', 'order.json'),
          JSON.stringify(orderData, null, 2)
        );

        res.status(201).json({
          success: true,
          data: {
            id: projectId,
            name: name,
            createdAt: accessData.createdAt,
            updatedAt: accessData.updatedAt,
            owner: session.user.id
          }
        });
      } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ success: false, message: 'Failed to create project' });
      }
      break;

    default:
      res.status(405).json({ success: false, message: 'Method not allowed' });
      break;
  }
}
