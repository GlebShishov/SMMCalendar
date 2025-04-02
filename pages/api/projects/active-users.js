// API для отслеживания активных пользователей в проекте
import { getSession } from 'next-auth/react';

// Хранилище активных пользователей и их состояний
// Формат: { projectId: { userId: { username, color, activeDay, lastActivity } } }
const activeUsers = {};

// Массив предопределенных цветов для пользователей
const userColors = [
  '#FF5733', // Красный
  '#33FF57', // Зеленый
  '#3357FF', // Синий
  '#FF33F5', // Розовый
  '#33FFF5', // Голубой
  '#F5FF33', // Желтый
  '#FF8333', // Оранжевый
  '#8333FF', // Фиолетовый
  '#33FF83', // Мятный
  '#FF3383'  // Малиновый
];

// Функция для получения случайного цвета из массива
function getRandomColor(projectId) {
  // Получаем все используемые цвета в проекте
  const usedColors = Object.values(activeUsers[projectId] || {})
    .map(user => user.color);
  
  // Фильтруем доступные цвета
  const availableColors = userColors.filter(color => !usedColors.includes(color));
  
  // Если есть доступные цвета, выбираем случайный из них
  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }
  
  // Если все цвета заняты, выбираем случайный из всего массива
  return userColors[Math.floor(Math.random() * userColors.length)];
}

// Очистка неактивных пользователей (вызывается периодически)
function cleanupInactiveUsers() {
  const now = Date.now();
  const inactivityThreshold = 5 * 60 * 1000; // 5 минут неактивности
  
  Object.keys(activeUsers).forEach(projectId => {
    Object.keys(activeUsers[projectId]).forEach(userId => {
      const user = activeUsers[projectId][userId];
      if (now - user.lastActivity > inactivityThreshold) {
        // Удаляем неактивного пользователя
        delete activeUsers[projectId][userId];
      }
    });
    
    // Если в проекте не осталось активных пользователей, удаляем запись о проекте
    if (Object.keys(activeUsers[projectId]).length === 0) {
      delete activeUsers[projectId];
    }
  });
}

// Запускаем очистку неактивных пользователей каждую минуту
setInterval(cleanupInactiveUsers, 60 * 1000);

export default async function handler(req, res) {
  // Проверяем авторизацию
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  const { projectId } = req.query;
  
  if (!projectId) {
    return res.status(400).json({ success: false, message: 'Project ID is required' });
  }
  
  // Инициализируем структуру для проекта, если она еще не существует
  if (!activeUsers[projectId]) {
    activeUsers[projectId] = {};
  }
  
  const userId = session.user.id;
  const username = session.user.username || session.user.name || session.user.email;
  
  // Обработка различных типов запросов
  switch (req.method) {
    case 'GET':
      // Возвращаем список активных пользователей в проекте
      return res.status(200).json({
        success: true,
        users: Object.values(activeUsers[projectId] || {})
      });
      
    case 'POST':
      // Обновляем статус пользователя
      const { activeDay } = req.body;
      
      // Если пользователь уже активен, обновляем его данные
      if (activeUsers[projectId][userId]) {
        activeUsers[projectId][userId] = {
          ...activeUsers[projectId][userId],
          activeDay,
          lastActivity: Date.now()
        };
      } else {
        // Добавляем нового пользователя
        activeUsers[projectId][userId] = {
          userId,
          username,
          color: getRandomColor(projectId),
          activeDay,
          lastActivity: Date.now()
        };
      }
      
      return res.status(200).json({
        success: true,
        user: activeUsers[projectId][userId],
        users: Object.values(activeUsers[projectId])
      });
      
    case 'DELETE':
      // Пользователь покидает проект или освобождает день
      if (activeUsers[projectId][userId]) {
        if (req.body.releaseDay) {
          // Освобождаем день, но оставляем пользователя активным
          activeUsers[projectId][userId].activeDay = null;
          activeUsers[projectId][userId].lastActivity = Date.now();
        } else {
          // Полностью удаляем пользователя из активных
          delete activeUsers[projectId][userId];
        }
      }
      
      return res.status(200).json({
        success: true,
        users: Object.values(activeUsers[projectId] || {})
      });
      
    default:
      return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
