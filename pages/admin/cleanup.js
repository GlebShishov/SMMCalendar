import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function CleanupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [deleteAllResult, setDeleteAllResult] = useState(null);

  // Редирект на страницу логина, если пользователь не авторизован
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Функция для запуска процесса очистки и переименования изображений
  const runCleanup = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/rename-and-cleanup-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Произошла ошибка при очистке изображений');
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
      setError('Произошла ошибка при очистке изображений');
    } finally {
      setLoading(false);
    }
  };

  // Функция для удаления всех изображений
  const deleteAllImages = async () => {
    try {
      setDeleteAllLoading(true);
      setError(null);
      setDeleteAllResult(null);

      const response = await fetch('/api/delete-all-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setDeleteAllResult(data);
      } else {
        setError(data.message || 'Произошла ошибка при удалении всех изображений');
      }
    } catch (error) {
      console.error('Error deleting all images:', error);
      setError('Произошла ошибка при удалении всех изображений');
    } finally {
      setDeleteAllLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Очистка и переименование изображений</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <p className="mb-4">
            Эта страница позволяет выполнить очистку неиспользуемых изображений и переименование существующих изображений
            по схеме: <code>название_проекта_дата_img_порядковый_номер</code>.
          </p>
          
          <button
            onClick={runCleanup}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 mr-4"
          >
            {loading ? 'Выполняется...' : 'Запустить очистку и переименование'}
          </button>
          
          <button
            onClick={deleteAllImages}
            disabled={deleteAllLoading}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {deleteAllLoading ? 'Удаление...' : 'Удалить все изображения'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-bold mb-2">{result.message}</p>
            
            {result.deletedFiles && result.deletedFiles.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold">Удаленные файлы ({result.deletedFiles.length}):</h3>
                <ul className="list-disc pl-6 mt-2 max-h-40 overflow-y-auto">
                  {result.deletedFiles.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.renamedFiles && result.renamedFiles.length > 0 && (
              <div>
                <h3 className="font-bold">Переименованные файлы ({result.renamedFiles.length}):</h3>
                <ul className="list-disc pl-6 mt-2 max-h-40 overflow-y-auto">
                  {result.renamedFiles.map((file, index) => (
                    <li key={index}>
                      {file.oldFileName} → {file.newFileName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {deleteAllResult && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-bold mb-2">Все изображения успешно удалены</p>
            
            {deleteAllResult.deletedFiles && deleteAllResult.deletedFiles.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold">Удаленные файлы ({deleteAllResult.deletedFiles.length}):</h3>
                <ul className="list-disc pl-6 mt-2 max-h-40 overflow-y-auto">
                  {deleteAllResult.deletedFiles.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {deleteAllResult.updatedProjects > 0 && (
              <p>Обновлено проектов: {deleteAllResult.updatedProjects}</p>
            )}
          </div>
        )}
        
        <div className="mt-6">
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
