import dbConnect from '../../../lib/dbConnect';
import Project from '../../../models/Project';
import { getSession } from 'next-auth/react';

// In-memory projects storage for test users
const TEST_USER_IDS = ['test-user-123', 'test-user-222'];
// This is imported from the index.js file at runtime
// We're declaring it here for clarity but it will use the same array
let testUserProjects = global.testUserProjects || [];
if (!global.testUserProjects) {
  global.testUserProjects = testUserProjects;
}

// Save function from index.js
const saveTestProjects = global.saveTestProjects || (() => {
  console.error('saveTestProjects function not available');
});

export default async function handler(req, res) {
  const session = await getSession({ req });
  const { id } = req.query;
  const demoMode = req.query.demo === 'true';
  
  console.log('API request for project:', id);
  console.log('Session:', session ? { userId: session.user.id, username: session.user.username } : 'No session');
  console.log('Demo mode:', demoMode);
  
  // Если режим демонстрации и метод GET, разрешаем доступ без авторизации
  if (demoMode && req.method === 'GET') {
    // Для демо-режима используем тестовые проекты
    return handleDemoMode(req, res, id);
  }
  
  // Для остальных запросов требуется авторизация
  if (!session) {
    console.log('Not authenticated, returning 401');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Handle test user separately (no DB connection needed)
  if (TEST_USER_IDS.includes(session.user.id)) {
    console.log('Handling test user:', session.user.id);
    return handleTestUser(req, res, session, id);
  }
  
  // For regular users, use MongoDB
  try {
    await dbConnect();

    switch (req.method) {
      case 'GET':
        try {
          const project = await Project.findOne({ 
            _id: id,
            owner: session.user.id
          });
          
          if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
          }
          
          res.status(200).json({ success: true, data: project });
        } catch (error) {
          res.status(400).json({ success: false, message: error.message });
        }
        break;
        
      case 'PUT':
        try {
          const project = await Project.findOneAndUpdate(
            { _id: id, owner: session.user.id },
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
          );
          
          if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
          }
          
          res.status(200).json({ success: true, data: project });
        } catch (error) {
          res.status(400).json({ success: false, message: error.message });
        }
        break;
        
      case 'DELETE':
        try {
          const deletedProject = await Project.findOneAndDelete({ 
            _id: id,
            owner: session.user.id
          });
          
          if (!deletedProject) {
            return res.status(404).json({ success: false, message: 'Project not found' });
          }
          
          res.status(200).json({ success: true, data: {} });
        } catch (error) {
          res.status(400).json({ success: false, message: error.message });
        }
        break;
        
      default:
        res.status(405).json({ success: false, message: 'Method not allowed' });
        break;
    }
  } catch (error) {
    console.error('Database connection error:', error);
    // Fall back to in-memory storage for all users if DB connection fails
    return handleTestUser(req, res, session, id);
  }
}

// Handle test user with in-memory storage
function handleTestUser(req, res, session, id) {
  // Make sure we have the latest projects
  testUserProjects = global.testUserProjects || [];
  
  console.log(`Handling ${req.method} request for project ${id}`);
  console.log(`Current projects: ${testUserProjects.length}`);
  console.log('Test user projects:', testUserProjects.map(p => ({ id: p._id, name: p.name, owner: p.owner })));
  
  switch (req.method) {
    case 'GET':
      // Изменяем логику поиска проекта - ищем проект по ID без проверки владельца
      const project = testUserProjects.find(p => p._id === id);
      
      if (!project) {
        console.log(`Project not found: ${id}`);
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      
      // Возвращаем копию проекта с владельцем текущего пользователя
      // Это позволит обоим пользователям редактировать один и тот же проект
      const projectCopy = {
        ...JSON.parse(JSON.stringify(project)),
        owner: session.user.id
      };
      
      console.log(`Project found: ${projectCopy.name}, returning with owner: ${projectCopy.owner}`);
      res.status(200).json({ success: true, data: projectCopy });
      break;
      
    case 'PUT':
      const projectIndex = testUserProjects.findIndex(p => p._id === id);
      
      if (projectIndex === -1) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      
      // Сохраняем текущего владельца проекта
      const originalOwner = testUserProjects[projectIndex].owner;
      
      // Обновляем проект, сохраняя оригинального владельца
      testUserProjects[projectIndex] = {
        ...testUserProjects[projectIndex],
        ...req.body,
        owner: originalOwner, // Сохраняем оригинального владельца
        updatedAt: new Date().toISOString()
      };
      
      console.log(`Project updated: ${testUserProjects[projectIndex].name}, original owner: ${originalOwner}`);
      
      // Update global reference and save to file
      global.testUserProjects = testUserProjects;
      if (typeof global.saveTestProjects === 'function') {
        global.saveTestProjects();
      }
      
      // Возвращаем копию проекта с владельцем текущего пользователя
      const updatedProjectCopy = {
        ...JSON.parse(JSON.stringify(testUserProjects[projectIndex])),
        owner: session.user.id
      };
      
      res.status(200).json({ success: true, data: updatedProjectCopy });
      break;
      
    case 'DELETE':
      const projectToDelete = testUserProjects.find(p => p._id === id);
      
      if (!projectToDelete) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      
      testUserProjects = testUserProjects.filter(p => p._id !== id);
      
      // Update global reference and save to file
      global.testUserProjects = testUserProjects;
      if (typeof global.saveTestProjects === 'function') {
        global.saveTestProjects();
      }
      
      res.status(200).json({ success: true, data: {} });
      break;
      
    default:
      res.status(405).json({ success: false, message: 'Method not allowed' });
      break;
  }
}

// Handle demo mode
function handleDemoMode(req, res, id) {
  // Для режима демонстрации используем все проекты без проверки владельца
  console.log('Demo mode activated for project ID:', id);
  console.log('Available test projects:', testUserProjects.length);
  
  // Проверяем, существуют ли проекты
  if (!testUserProjects || testUserProjects.length === 0) {
    console.log('No test projects available');
    return res.status(404).json({ 
      success: false, 
      message: 'No projects available in demo mode'
    });
  }
  
  // Если запрашивается конкретный проект
  if (id) {
    // Пытаемся найти проект по ID без проверки владельца
    let project = testUserProjects.find(p => p._id === id);
    
    // Если проект не найден по точному совпадению, пробуем найти по частичному совпадению
    if (!project) {
      console.log('Trying partial match for ID:', id);
      project = testUserProjects.find(p => p._id && p._id.toString().includes(id));
    }
    
    // Если проект все еще не найден, возвращаем первый проект (для демонстрации)
    if (!project && testUserProjects.length > 0) {
      console.log('Using first available project for demo');
      project = testUserProjects[0];
    }
    
    if (project) {
      console.log(`Returning project: ${project.name}`);
      return res.status(200).json({ success: true, data: project });
    }
  }
  
  // Если проект не найден, возвращаем ошибку
  console.log('Project not found in demo mode');
  return res.status(404).json({ success: false, message: 'Project not found' });
}
