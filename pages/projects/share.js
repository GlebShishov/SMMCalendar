import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { FaCopy, FaEye, FaExternalLinkAlt } from 'react-icons/fa';

export default function ShareProjects() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Редирект на страницу логина, если пользователь не авторизован
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Загрузка проектов пользователя
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchProjects = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/projects');
          
          if (!response.ok) {
            throw new Error('Failed to fetch projects');
          }
          
          const data = await response.json();
          
          if (data.success) {
            setProjects(data.data || []);
          } else {
            setError(data.message || 'Failed to fetch projects');
          }
        } catch (error) {
          console.error('Error fetching projects:', error);
          setError('Failed to fetch projects');
        } finally {
          setLoading(false);
        }
      };
      
      fetchProjects();
    }
  }, [status]);

  // Копирование демо-ссылки в буфер обмена
  const copyDemoLink = (projectId) => {
    const baseUrl = window.location.origin;
    const demoLink = `${baseUrl}/projects/${projectId}?demo=true`;
    
    navigator.clipboard.writeText(demoLink)
      .then(() => {
        alert('Ссылка на демонстрацию скопирована в буфер обмена');
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        alert('Не удалось скопировать ссылку. Попробуйте еще раз.');
      });
  };

  // Открытие проекта в режиме демонстрации
  const openDemoMode = (projectId) => {
    window.open(`/projects/${projectId}?demo=true`, '_blank');
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Поделиться проектами - SMM Content Calendar">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Поделиться проектами</h1>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Загрузка...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Поделиться проектами - SMM Content Calendar">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Поделиться проектами</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
          <button
            onClick={() => router.push('/projects')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Вернуться к проектам
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Поделиться проектами - SMM Content Calendar">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Поделиться проектами</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <p className="mb-4">
            На этой странице вы можете создать ссылки для демонстрации ваших проектов.
            Демонстрационные ссылки позволяют просматривать проекты без необходимости входа в систему,
            но с ограниченной функциональностью (только просмотр и копирование).
          </p>
        </div>
        
        {projects.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-600">У вас пока нет проектов для демонстрации.</p>
            <button
              onClick={() => router.push('/projects')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Создать новый проект
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project._id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold truncate">{project.name}</h2>
                  <p className="text-sm text-gray-500">
                    {project.days ? `${project.days.length} дней` : '0 дней'}
                  </p>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => copyDemoLink(project._id)}
                      className="flex items-center justify-center bg-blue-100 text-blue-600 px-3 py-2 rounded hover:bg-blue-200"
                    >
                      <FaCopy className="mr-2" /> Скопировать демо-ссылку
                    </button>
                    
                    <button
                      onClick={() => openDemoMode(project._id)}
                      className="flex items-center justify-center bg-green-100 text-green-600 px-3 py-2 rounded hover:bg-green-200"
                    >
                      <FaEye className="mr-2" /> Открыть в режиме демонстрации
                    </button>
                    
                    <button
                      onClick={() => router.push(`/projects/${project._id}`)}
                      className="flex items-center justify-center bg-gray-100 text-gray-600 px-3 py-2 rounded hover:bg-gray-200"
                    >
                      <FaExternalLinkAlt className="mr-2" /> Открыть для редактирования
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8">
          <button
            onClick={() => router.push('/projects')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Вернуться к проектам
          </button>
        </div>
      </div>
    </Layout>
  );
}
