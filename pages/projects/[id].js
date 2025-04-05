import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import DayColumn from '../../components/DayColumn';
import AddDayColumn from '../../components/AddDayColumn';
import ProjectSidebar from '../../components/ProjectSidebar';
import { FaEdit, FaTrash, FaShareAlt, FaEye, FaFileDownload, FaUsers } from 'react-icons/fa';
import Head from 'next/head';
import useActiveUsers from '../../hooks/useActiveUsers';
import useSocketIO from '../../hooks/useSocketIO';
import { toast } from 'react-hot-toast';
import Calendar from '../../components/Calendar';

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const projectNameInputRef = useRef(null);
  const demoMode = router.query.demo === 'true';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(false);

  // Используем хук для работы с активными пользователями
  const activeUsers = useActiveUsers(id);
  
  // Используем хук для работы с Socket.IO
  const { socket, isConnected } = useSocketIO(id);

  // Сохраняем ссылку на Socket.IO в глобальном объекте window
  useEffect(() => {
    if (socket) {
      globalThis.socketIO = socket;
    }
    
    return () => {
      // Очищаем ссылку при размонтировании компонента
      if (globalThis.socketIO === socket) {
        globalThis.socketIO = null;
      }
    };
  }, [socket]);

  // Redirect to login if not authenticated and not in demo mode
  useEffect(() => {
    if (!demoMode && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, demoMode]);

  // Загрузка данных проекта
  useEffect(() => {
    if (!id || !router.isReady) return;
    
    const fetchProject = async () => {
      try {
        // Добавляем параметр demo в запрос, если активен режим демонстрации
        const url = demoMode ? `/api/projects/${id}?demo=true` : `/api/projects/${id}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setProject(data.data);
        } else {
          throw new Error(data.message || 'Failed to load project');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        setError(error.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [id, router.isReady, demoMode]);

  // Обработка изменений в проекте через Socket.IO
  useEffect(() => {
    if (!socket || !isConnected || !project?.id) return;

    const handleProjectUpdate = (updatedProject) => {
      if (updatedProject.id === project.id) {
        setProject(prev => ({
          ...prev,
          ...updatedProject,
          days: updatedProject.days.map((day, index) => ({
            ...day,
            id: day.id || `day-${index}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
          }))
        }));
      }
    };

    socket.on('projectUpdate', handleProjectUpdate);
    return () => socket.off('projectUpdate', handleProjectUpdate);
  }, [socket, isConnected, project?.id]);

  // Обработка изменений в активных пользователях
  useEffect(() => {
    if (!socket || !isConnected || !project?.id) return;

    const handleActiveUsersUpdate = (users) => {
      if (activeUsers?.setActiveUsers) {
        activeUsers.setActiveUsers(users);
      }
    };

    socket.on('activeUsersUpdate', handleActiveUsersUpdate);
    return () => socket.off('activeUsersUpdate', handleActiveUsersUpdate);
  }, [socket, isConnected, project?.id, activeUsers]);

  // Обработка изменений в днях
  useEffect(() => {
    if (!socket || !isConnected || !project?.id) return;

    const handleDaysUpdate = (updatedDays) => {
      setProject(prev => ({
        ...prev,
        days: updatedDays.map((day, index) => ({
          ...day,
          id: day.id || `day-${index}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        }))
      }));
    };

    socket.on('daysUpdate', handleDaysUpdate);
    return () => socket.off('daysUpdate', handleDaysUpdate);
  }, [socket, isConnected, project?.id]);

  // Обновление данных дня
  const handleDayUpdate = async (index, updatedDay) => {
    if (!project) return;
    
    const updatedDays = [...project.days];
    updatedDays[index] = updatedDay;
    
    // Создаем глубокую копию проекта для обновления
    const updatedProject = {
      ...project,
      days: updatedDays.map(day => ({...day}))
    };
    
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProject)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProject(updatedProject);
      } else {
        setError('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project');
    }
  };

  // Обработчик событий реального времени для обновления изображений
  useEffect(() => {
    if (!socket || !project || !isConnected) return;
    
    const handleImageReorder = ({ dayId, images, userId }) => {
      // Игнорируем события от текущего пользователя
      if (userId === session?.user?.id) return;
      
      // Находим индекс дня по его ID
      const dayIndex = project.days.findIndex(day => day.id === dayId);
      if (dayIndex === -1) return;
      
      // Обновляем изображения в дне
      const updatedDay = {
        ...project.days[dayIndex],
        images
      };
      
      // Обновляем состояние проекта
      const updatedDays = [...project.days];
      updatedDays[dayIndex] = updatedDay;
      
      setProject({
        ...project,
        days: updatedDays
      });
    };
    
    socket.on('imageReorder', handleImageReorder);
    
    return () => {
      socket.off('imageReorder', handleImageReorder);
    };
  }, [socket, project, session, isConnected]);

  // Функция для удаления дня
  const handleDeleteDay = async (dayIndex) => {
    if (!project) return;
    
    // Подтверждение удаления
    if (!confirm(`Вы уверены, что хотите удалить день ${dayIndex + 1}?`)) {
      return;
    }
    
    // Создаем новый массив дней без удаляемого дня
    const updatedDays = [...project.days];
    updatedDays.splice(dayIndex, 1);
    
    try {
      // Обновляем проект на сервере
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...project,
          days: updatedDays
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Обновляем локальное состояние
        setProject({
          ...project,
          days: updatedDays
        });
      } else {
        setError('Failed to delete day');
      }
    } catch (error) {
      console.error('Error deleting day:', error);
      setError('Failed to delete day');
    }
  };

  // Функция для создания нового дня
  const handleAddDay = async () => {
    if (!project) return;
    
    // Создаем новый пустой день
    const newDay = createEmptyDay(project.days.length);
    
    // Добавляем его к текущим дням
    const updatedDays = [...project.days, newDay];
    
    try {
      // Обновляем проект на сервере
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...project,
          days: updatedDays
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Обновляем локальное состояние
        setProject({
          ...project,
          days: updatedDays
        });
      } else {
        setError('Failed to add new day');
      }
    } catch (error) {
      console.error('Error adding new day:', error);
      setError('Failed to add new day');
    }
  };

  // Функция для изменения названия проекта
  const handleRenameProject = async () => {
    if (!project || !newProjectName.trim() || newProjectName === project.name) {
      setIsEditingName(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${id}/update-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyName: newProjectName.trim()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProject({
          ...project,
          name: newProjectName.trim(),
          clientInfo: {
            ...project.clientInfo,
            companyName: newProjectName.trim()
          }
        });
        setIsEditingName(false);
        toast.success('Название проекта обновлено');
      } else {
        toast.error('Не удалось обновить название проекта');
      }
    } catch (error) {
      console.error('Error renaming project:', error);
      toast.error('Не удалось обновить название проекта');
    }
  };

  // Начать редактирование названия проекта
  const startEditingName = () => {
    if (demoMode) return;
    setNewProjectName(project.name);
    setIsEditingName(true);
    setTimeout(() => {
      if (projectNameInputRef.current) {
        projectNameInputRef.current.focus();
      }
    }, 0);
  };

  // Обработка нажатия клавиш при редактировании названия
  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRenameProject();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  // Обработчик обновления информации в боковой панели
  const handleProjectInfoUpdate = async (updatedInfo) => {
    if (!project || demoMode) return;
    
    try {
      const response = await fetch(`/api/projects/${id}/update-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedInfo)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProject({
          ...project,
          clientInfo: {
            ...project.clientInfo,
            ...updatedInfo
          }
        });
        toast.success('Информация о проекте обновлена');
      } else {
        toast.error('Не удалось обновить информацию о проекте');
      }
    } catch (error) {
      console.error('Error updating project info:', error);
      toast.error('Не удалось обновить информацию о проекте');
    }
  };

  // Функция для обновления URL Figma
  const handleUpdateFigmaUrl = async () => {
    if (!project) return;
    
    // Запрашиваем URL Figma у пользователя
    const figmaUrl = prompt('Введите URL Figma для проекта:', project.figmaUrl || '');
    
    // Если пользователь отменил ввод или ввел пустую строку, ничего не делаем
    if (figmaUrl === null) return;
    
    // Создаем обновленный проект
    const updatedProject = {
      ...project,
      figmaUrl
    };
    
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProject)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProject(updatedProject);
        alert('URL Figma успешно обновлен');
      } else {
        setError('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project');
    }
  };

  // Обработка выхода из страницы проекта
  useEffect(() => {
    // Функция для освобождения дня и выхода из проекта
    const handleBeforeUnload = () => {
      if (activeUsers && !demoMode) {
        activeUsers.leaveProject();
      }
    };

    // Добавляем обработчик события beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Очистка при размонтировании компонента
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Освобождаем день и выходим из проекта при размонтировании
      if (activeUsers && !demoMode) {
        activeUsers.leaveProject();
      }
    };
  }, [activeUsers, demoMode]);

  // Loading state
  if (loading) {
    return (
      <Layout title="Загрузка проекта - SMM Content Calendar">
        <div className="flex justify-center items-center h-screen">
          <div className="text-xl">Загрузка проекта...</div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout title="Ошибка - SMM Content Calendar">
        <div className="flex flex-col justify-center items-center h-screen">
          <div className="text-xl text-red-500 mb-4">Ошибка: {error}</div>
          <button
            onClick={() => router.push('/projects')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Вернуться к списку проектов
          </button>
        </div>
      </Layout>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <Layout title="Access Denied - SMM Content Calendar">
        <div className="w-full mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            You are not authorized to access this project.
          </div>
        </div>
      </Layout>
    );
  }

  // Only render if authenticated and project is loaded
  if (project) {
    return (
      <Layout title={`${project.name} - SMM Content Calendar`} showBackButton={!demoMode}>
        <Head>
          {demoMode && (
            <>
              <meta property="og:title" content={`${project.name} - SMM Content Calendar (Демонстрация)`} />
              <meta property="og:description" content="Просмотр контент-календаря в режиме демонстрации" />
            </>
          )}
        </Head>
        <div className="flex h-full">
          {/* Sidebar - показываем только в режиме редактирования */}
          {!demoMode && status === 'authenticated' && (
            <ProjectSidebar 
              project={project} 
              isCollapsed={isSidebarCollapsed} 
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onUpdateProject={handleProjectInfoUpdate}
              onUpdateFigmaUrl={handleUpdateFigmaUrl}
            />
          )}
          
          {/* Main content */}
          <div className="flex-1 overflow-x-auto">
            <div className="w-full mx-auto px-4 py-4">
              <div className="flex justify-between items-center mb-6">
                {isEditingName && !demoMode ? (
                  <div className="flex items-center">
                    <input
                      ref={projectNameInputRef}
                      type="text"
                      className="border border-gray-300 rounded px-3 py-2 mr-2"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onBlur={handleRenameProject}
                      onKeyDown={handleNameKeyDown}
                    />
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      onClick={handleRenameProject}
                    >
                      Сохранить
                    </button>
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold flex items-center">
                    <span>{project.name}</span>
                    {!demoMode && (
                      <button
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        onClick={startEditingName}
                        title="Редактировать название проекта"
                      >
                        <FaEdit />
                      </button>
                    )}
                  </h1>
                )}
                
                <div className="flex space-x-2">
                  {/* Индикатор активных пользователей */}
                  {!demoMode && (
                    <div className="relative">
                      <button
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded flex items-center"
                        onClick={() => setShowActiveUsers(!showActiveUsers)}
                        title="Активные пользователи"
                      >
                        <FaUsers className="mr-1" />
                        <span>{activeUsers.activeUsers?.length || 0}</span>
                      </button>
                      
                      {/* Выпадающий список активных пользователей */}
                      {showActiveUsers && activeUsers.activeUsers && activeUsers.activeUsers.length > 0 && (
                        <div className="active-users-indicator">
                          <h3 className="text-sm font-bold mb-2">Активные пользователи:</h3>
                          {activeUsers.activeUsers.map(user => (
                            <div key={user.userId} className="active-user-item">
                              <div 
                                className="user-color-dot" 
                                style={{ backgroundColor: user.color }}
                              ></div>
                              <span className="text-sm">{user.username}</span>
                              {user.activeDay && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (редактирует день {project.days.findIndex(d => d.id === user.activeDay) + 1})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {demoMode && (
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                      Режим демонстрации
                    </div>
                  )}
                  
                  {/* Кнопка экспорта в CSV (доступна в обоих режимах) */}
                  <button
                    onClick={() => {
                      // Создаем URL для скачивания с учетом режима демонстрации
                      const downloadUrl = demoMode 
                        ? `/api/projects/${id}/export-csv?demo=true` 
                        : `/api/projects/${id}/export-csv`;
                      
                      // Создаем временную ссылку для скачивания
                      const link = document.createElement('a');
                      link.href = downloadUrl;
                      link.setAttribute('download', `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200"
                    title="Скачать проект в CSV"
                  >
                    <FaFileDownload className="inline mr-1" /> Скачать CSV
                  </button>
                  
                  {!demoMode && (
                    <button
                      onClick={() => {
                        if (confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
                          fetch(`/api/projects/${id}`, { method: 'DELETE' })
                            .then(response => response.json())
                            .then(data => {
                              if (data.success) {
                                router.push('/projects');
                              } else {
                                setError('Failed to delete project');
                              }
                            })
                            .catch(error => {
                              console.error('Error deleting project:', error);
                              setError('Failed to delete project');
                            });
                        }
                      }}
                      className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200"
                      title="Удалить проект"
                    >
                      <FaTrash className="inline mr-1" /> Удалить проект
                    </button>
                  )}
                  
                  {!demoMode && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(demoLink);
                        alert('Ссылка на демонстрацию скопирована в буфер обмена');
                      }}
                      className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200"
                      title="Скопировать ссылку на демонстрацию"
                    >
                      <FaShareAlt className="inline mr-1" /> Скопировать ссылку на демонстрацию
                    </button>
                  )}
                </div>
              </div>
              
              {/* Calendar container */}
              <div className="calendar-container">
                <Calendar
                  days={project.days}
                  projectId={project.id}
                  isDemo={demoMode}
                  onUpdate={async (updatedDays) => {
                    if (demoMode) return;
                    
                    try {
                      const response = await fetch(`/api/projects/${id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ days: updatedDays })
                      });
                      
                      const result = await response.json();
                      
                      if (result.success) {
                        setProject({
                          ...project,
                          days: updatedDays
                        });
                        toast.success('Календарь обновлен');
                      } else {
                        toast.error('Не удалось обновить календарь');
                      }
                    } catch (error) {
                      console.error('Error updating calendar:', error);
                      toast.error('Не удалось обновить календарь');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
