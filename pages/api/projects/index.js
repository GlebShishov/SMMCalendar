import dbConnect from '../../../lib/dbConnect';
import Project from '../../../models/Project';
import { getSession } from 'next-auth/react';
import fs from 'fs';
import path from 'path';

// In-memory projects storage for test users
const TEST_USER_IDS = ['test-user-123', 'test-user-222'];

// File to store test user projects
const TEST_PROJECTS_FILE = path.join(process.cwd(), 'test-projects.json');

// Load test projects from file or initialize empty array
let testUserProjects = [];
try {
  if (fs.existsSync(TEST_PROJECTS_FILE)) {
    const data = fs.readFileSync(TEST_PROJECTS_FILE, 'utf8');
    testUserProjects = JSON.parse(data);
    console.log('Loaded test projects from file');
  }
} catch (error) {
  console.error('Error loading test projects:', error);
  testUserProjects = [];
}

// Save test projects to file
const saveTestProjects = () => {
  try {
    fs.writeFileSync(TEST_PROJECTS_FILE, JSON.stringify(testUserProjects, null, 2), 'utf8');
    console.log('Saved test projects to file');
  } catch (error) {
    console.error('Error saving test projects:', error);
  }
};

// Находим проект "Agarto test" у пользователя 123
const user123Id = 'test-user-123';
const user222Id = 'test-user-222';
const agartoTestProject = testUserProjects.find(p => p.name === 'Agarto test' && p.owner === user123Id);

// Если проект существует у пользователя 123, создаем его копию для пользователя 222
if (agartoTestProject) {
  console.log('Found "Agarto test" project for user 123:', agartoTestProject._id);
  
  // Удаляем старый проект "Agarto test" у пользователя 222, если он существует
  testUserProjects = testUserProjects.filter(p => !(p.name === 'Agarto test' && p.owner === user222Id));
  
  // Создаем новый проект для пользователя 222 с тем же ID и содержимым
  const sharedProject = {
    ...JSON.parse(JSON.stringify(agartoTestProject)), // Глубокое копирование объекта
    owner: user222Id
  };
  
  // Проверяем, нет ли уже такого проекта
  if (!testUserProjects.some(p => p._id === sharedProject._id && p.owner === user222Id)) {
    testUserProjects.push(sharedProject);
    console.log('Created shared "Agarto test" project for user 222 with ID:', sharedProject._id);
  }
  
  // Сохраняем изменения
  saveTestProjects();
} else {
  console.log('No "Agarto test" project found for user 123');
}

// Make projects available globally
global.testUserProjects = testUserProjects;
global.saveTestProjects = saveTestProjects;

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  // Check authentication
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Handle test users separately (no DB connection needed)
  if (TEST_USER_IDS.includes(session.user.id)) {
    return handleTestUser(req, res, session);
  }
  
  // For regular users, use MongoDB
  try {
    await dbConnect();

    switch (req.method) {
      case 'GET':
        try {
          const projects = await Project.find({ owner: session.user.id });
          res.status(200).json({ success: true, data: projects });
        } catch (error) {
          res.status(400).json({ success: false, message: error.message });
        }
        break;
        
      case 'POST':
        try {
          const project = await Project.create({
            ...req.body,
            owner: session.user.id
          });
          res.status(201).json({ success: true, data: project });
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
    return handleTestUser(req, res, session);
  }
}

// Handle test user with in-memory storage
function handleTestUser(req, res, session) {
  console.log(`Handling ${req.method} request for user ${session.user.id}`);
  console.log(`Current projects: ${testUserProjects.length}`);
  
  switch (req.method) {
    case 'GET':
      // Фильтруем проекты по владельцу для отображения в списке проектов
      const userProjects = testUserProjects.filter(p => p.owner === session.user.id);
      console.log(`Found ${userProjects.length} projects for user ${session.user.id}`);
      
      res.status(200).json({ 
        success: true, 
        data: userProjects
      });
      break;
      
    case 'POST':
      const newProject = {
        _id: `project-${Date.now()}`,
        ...req.body,
        owner: session.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      testUserProjects.push(newProject);
      global.testUserProjects = testUserProjects;
      global.saveTestProjects();
      res.status(201).json({ success: true, data: newProject });
      break;
      
    default:
      res.status(405).json({ success: false, message: 'Method not allowed' });
      break;
  }
}
