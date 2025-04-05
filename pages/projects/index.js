import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { FaPlus, FaFileUpload, FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Default empty days structure
const createEmptyDays = () => {
  return Array(7).fill().map((_, index) => ({
    socialNetwork: 'Telegram',
    contentType: 'Пост',
    images: [],
    text: '',
    date: (() => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return date.toISOString().split('T')[0];
    })()
  }));
};

export default function Projects() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch projects
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.data);
      } else {
        setError('Failed to load projects');
      }
    } catch (error) {
      setError('An error occurred while fetching projects');
      console.error('Fetch projects error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new empty project
  const handleCreateEmptyProject = async () => {
    try {
      const name = prompt('Введите название компании:');
      if (!name) {
        toast('Создание проекта отменено', {
          icon: '⚠️',
          duration: 2000,
        });
        return;
      }
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Проект успешно создан');
        router.push(`/projects/${result.data.id}`);
      } else {
        toast.error('Ошибка при создании проекта');
      }
    } catch (error) {
      toast.error('Ошибка при создании проекта');
      console.error('Create project error:', error);
    }
  };

  // Handle CSV import
  const handleCsvImport = () => {
    document.getElementById('csv-file-input').click();
  };

  // Handle file selection for CSV import
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/projects/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Проект успешно импортирован');
        router.push(`/projects/${result.data._id}`);
      } else {
        toast.error('Ошибка при импорте проекта');
      }
    } catch (error) {
      toast.error('Ошибка при импорте проекта');
      console.error('Import error:', error);
    }
  };

  // Handle Google Sheets import
  const handleGoogleSheetsImport = async () => {
    try {
      const response = await fetch('/api/projects/google-sheets-import', {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Проект успешно импортирован из Google Sheets');
        router.push(`/projects/${result.data._id}`);
      } else {
        toast.error('Ошибка при импорте из Google Sheets');
      }
    } catch (error) {
      toast.error('Ошибка при импорте из Google Sheets');
      console.error('Google Sheets import error:', error);
    }
  };

  // Loading state
  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <Layout title="Projects - SMM Content Calendar">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading...</p>
        </div>
      </Layout>
    );
  }

  // Only render if authenticated
  if (status === 'authenticated') {
    return (
      <Layout title="Projects - SMM Content Calendar">
        <div className="projects-container">
          <h1 className="text-2xl font-bold mb-6">Ваши проекты</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* Create button */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={handleCreateEmptyProject}
              className="flex items-center bg-primary text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <FaPlus className="mr-2" /> Создать новый проект
            </button>
          </div>
          
          {/* Projects list */}
          {projects.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">У вас пока нет проектов.</p>
              <p className="text-gray-500 mt-2">Создайте новый проект, чтобы начать работу!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="project-card bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <h2 className="text-lg font-semibold mb-2">{project.name}</h2>
                  <p className="text-sm text-gray-500">
                    Создан: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Обновлен: {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return null;
}
