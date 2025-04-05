import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

export default function useActiveUsers(projectId) {
  const { data: session } = useSession();
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isOnline, setIsOnline] = useState(true); // По умолчанию считаем, что онлайн

  // Инициализируем состояние подключения после монтирования компонента
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => {
        setIsOnline(true);
        fetchActiveUsers(); // Обновляем данные при восстановлении соединения
      };
      
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Инициализация socket с обработкой ошибок
  useEffect(() => {
    if (!projectId || !session || !isOnline) return;

    let newSocket;
    try {
      newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        query: {
          projectId,
          userId: session.user.id
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Socket initialization error:', error);
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [projectId, session, isOnline]);

  // Функция для получения списка активных пользователей с обработкой ошибок
  const fetchActiveUsers = useCallback(async () => {
    if (!projectId || !session || !isOnline) {
      setLoading(false);
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

      const response = await fetch(`/api/projects/active-users?projectId=${projectId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setActiveUsers(data.users);
        const user = data.users.find(u => u.userId === session.user.id);
        if (user) {
          setCurrentUser(user);
        }
      } else {
        setError(data.message || 'Failed to fetch active users');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout');
        setError('Request timeout');
      } else {
        console.error('Error fetching active users:', error);
        setError('Failed to fetch active users');
      }
      // При ошибке сохраняем последнее известное состояние
    } finally {
      setLoading(false);
    }
  }, [projectId, session, isOnline]);

  // Функция для обновления статуса пользователя с обработкой ошибок
  const updateUserStatus = useCallback(async (activeDay) => {
    if (!projectId || !session || !isOnline) return null;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`/api/projects/active-users?projectId=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activeDay }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setActiveUsers(data.users);
        setCurrentUser(data.user);
        return data.user;
      }
      
      setError(data.message || 'Failed to update user status');
      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Превышено время ожидания запроса');
      } else {
        console.error('Error updating user status:', error);
        toast.error('Ошибка обновления статуса');
      }
      return null;
    }
  }, [projectId, session, isOnline]);

  // Функция для освобождения дня с обработкой ошибок
  const releaseDay = useCallback(async () => {
    if (!projectId || !session || !isOnline) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`/api/projects/active-users?projectId=${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ releaseDay: true }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setActiveUsers(data.users);
        const user = data.users.find(u => u.userId === session.user.id);
        setCurrentUser(user || null);
        return true;
      }
      
      setError(data.message || 'Failed to release day');
      return false;
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Превышено время ожидания запроса');
      } else {
        console.error('Error releasing day:', error);
        toast.error('Ошибка при освобождении дня');
      }
      return false;
    }
  }, [projectId, session, isOnline]);

  // Функция для выхода из проекта с обработкой ошибок
  const leaveProject = useCallback(async () => {
    if (!projectId || !session) return false;
    
    try {
      // Сначала пробуем освободить день, если он активен
      if (currentUser?.activeDay) {
        await releaseDay();
      }

      // Отправляем событие о выходе через socket, если он доступен
      if (socket && socket.connected) {
        socket.emit('leaveProject', { projectId });
      }

      // Очищаем локальное состояние
      setCurrentUser(null);
      setActiveUsers(prev => prev.filter(u => u.userId !== session.user.id));

      // Если онлайн, отправляем запрос на сервер
      if (isOnline) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`/api/projects/active-users?projectId=${projectId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ releaseDay: false }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          return true;
        }
      }

      return true; // Возвращаем true даже в оффлайн режиме, так как локальное состояние обновлено
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Превышено время ожидания запроса');
      } else {
        console.error('Error leaving project:', error);
        toast.error('Ошибка при выходе из проекта');
      }
      return false;
    }
  }, [projectId, session, currentUser, socket, isOnline, releaseDay]);

  // Проверка блокировки дня
  const isDayLocked = useCallback((dayId) => {
    if (!activeUsers || activeUsers.length === 0) return false;
    return activeUsers.some(user => 
      user.activeDay === dayId && 
      (!currentUser || user.userId !== currentUser.userId)
    );
  }, [activeUsers, currentUser]);

  // Получение информации о редакторе
  const getDayEditor = useCallback((dayId) => {
    if (!activeUsers || activeUsers.length === 0) return null;
    return activeUsers.find(user => user.activeDay === dayId) || null;
  }, [activeUsers]);

  // Периодическое обновление списка активных пользователей
  useEffect(() => {
    if (!isOnline) return;

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 30000); // Каждые 30 секунд

    return () => clearInterval(interval);
  }, [fetchActiveUsers, isOnline]);

  return {
    activeUsers,
    currentUser,
    loading,
    error,
    updateUserStatus,
    releaseDay,
    leaveProject,
    isDayLocked,
    getDayEditor,
    isOnline
  };
}
