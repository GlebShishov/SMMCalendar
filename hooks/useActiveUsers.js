import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export default function useActiveUsers(projectId) {
  const { data: session } = useSession();
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для получения списка активных пользователей
  const fetchActiveUsers = useCallback(async () => {
    if (!projectId || !session) return;
    
    try {
      const response = await fetch(`/api/projects/active-users?projectId=${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        setActiveUsers(data.users);
        
        // Находим текущего пользователя в списке
        const user = data.users.find(u => u.userId === session.user.id);
        if (user) {
          setCurrentUser(user);
        }
      } else {
        setError(data.message || 'Failed to fetch active users');
      }
    } catch (error) {
      console.error('Error fetching active users:', error);
      setError('Failed to fetch active users');
    } finally {
      setLoading(false);
    }
  }, [projectId, session]);

  // Функция для обновления статуса пользователя
  const updateUserStatus = useCallback(async (activeDay) => {
    if (!projectId || !session) return;
    
    try {
      const response = await fetch(`/api/projects/active-users?projectId=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activeDay })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActiveUsers(data.users);
        setCurrentUser(data.user);
        return data.user;
      } else {
        setError(data.message || 'Failed to update user status');
        return null;
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
      return null;
    }
  }, [projectId, session]);

  // Функция для освобождения дня
  const releaseDay = useCallback(async () => {
    if (!projectId || !session) return;
    
    try {
      const response = await fetch(`/api/projects/active-users?projectId=${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ releaseDay: true })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActiveUsers(data.users);
        
        // Обновляем информацию о текущем пользователе
        const user = data.users.find(u => u.userId === session.user.id);
        setCurrentUser(user || null);
        
        return true;
      } else {
        setError(data.message || 'Failed to release day');
        return false;
      }
    } catch (error) {
      console.error('Error releasing day:', error);
      setError('Failed to release day');
      return false;
    }
  }, [projectId, session]);

  // Функция для выхода пользователя из проекта
  const leaveProject = useCallback(async () => {
    if (!projectId || !session) return;
    
    try {
      const response = await fetch(`/api/projects/active-users?projectId=${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ releaseDay: false })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActiveUsers(data.users);
        setCurrentUser(null);
        return true;
      } else {
        setError(data.message || 'Failed to leave project');
        return false;
      }
    } catch (error) {
      console.error('Error leaving project:', error);
      setError('Failed to leave project');
      return false;
    }
  }, [projectId, session]);

  // Проверяем, заблокирован ли день другим пользователем
  const isDayLocked = useCallback((dayId) => {
    if (!activeUsers || activeUsers.length === 0) return false;
    
    // Проверяем, есть ли пользователь (не текущий), который редактирует этот день
    return activeUsers.some(user => 
      user.activeDay === dayId && 
      (!currentUser || user.userId !== currentUser.userId)
    );
  }, [activeUsers, currentUser]);

  // Получаем информацию о пользователе, который редактирует день
  const getDayEditor = useCallback((dayId) => {
    if (!activeUsers || activeUsers.length === 0) return null;
    
    return activeUsers.find(user => user.activeDay === dayId) || null;
  }, [activeUsers]);

  // Инициализация и периодическое обновление
  useEffect(() => {
    if (!projectId || !session) return;
    
    // Получаем начальный список пользователей
    fetchActiveUsers();
    
    // Устанавливаем интервал для периодического обновления
    const interval = setInterval(fetchActiveUsers, 5000); // Обновляем каждые 5 секунд
    
    // Очистка при размонтировании компонента
    return () => {
      clearInterval(interval);
      leaveProject(); // Автоматически выходим из проекта при закрытии
    };
  }, [projectId, session, fetchActiveUsers, leaveProject]);

  return {
    activeUsers,
    currentUser,
    loading,
    error,
    updateUserStatus,
    releaseDay,
    leaveProject,
    isDayLocked,
    getDayEditor
  };
}
