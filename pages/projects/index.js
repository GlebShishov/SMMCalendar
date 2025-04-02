import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { FaPlus, FaFileUpload, FaGoogle } from 'react-icons/fa';

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
      const name = prompt('Enter a name for your new project:');
      if (!name) return;
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          days: createEmptyDays()
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        router.push(`/projects/${result.data._id}`);
      } else {
        setError('Failed to create project');
      }
    } catch (error) {
      setError('An error occurred while creating the project');
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
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('importType', 'csv');
    
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Create a new project with the imported data
        const name = prompt('Enter a name for your imported project:');
        if (!name) return;
        
        // Ensure imported data has 7 days
        let importedDays = result.data;
        if (!importedDays || !Array.isArray(importedDays) || importedDays.length === 0) {
          importedDays = createEmptyDays();
        } else if (importedDays.length < 7) {
          // Add empty days if needed
          const emptyDays = Array(7 - importedDays.length).fill().map((_, index) => ({
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
          importedDays = [...importedDays, ...emptyDays];
        }
        
        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            days: importedDays
          }),
        });
        
        const projectResult = await projectResponse.json();
        
        if (projectResult.success) {
          router.push(`/projects/${projectResult.data._id}`);
        } else {
          setError('Failed to create project from import');
        }
      } else {
        setError('Failed to import data');
      }
    } catch (error) {
      setError('An error occurred during import');
      console.error('Import error:', error);
    }
    
    // Reset file input
    e.target.value = null;
  };

  // Handle Google Sheets import
  const handleGoogleSheetsImport = async () => {
    const url = prompt('Enter the Google Sheets URL:');
    if (!url) return;
    
    const formData = new FormData();
    formData.append('importType', 'googleSheets');
    formData.append('url', url);
    
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Create a new project with the imported data
        const name = prompt('Enter a name for your imported project:');
        if (!name) return;
        
        // Ensure imported data has 7 days
        let importedDays = result.data;
        if (!importedDays || !Array.isArray(importedDays) || importedDays.length === 0) {
          importedDays = createEmptyDays();
        } else if (importedDays.length < 7) {
          // Add empty days if needed
          const emptyDays = Array(7 - importedDays.length).fill().map((_, index) => ({
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
          importedDays = [...importedDays, ...emptyDays];
        }
        
        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            days: importedDays
          }),
        });
        
        const projectResult = await projectResponse.json();
        
        if (projectResult.success) {
          router.push(`/projects/${projectResult.data._id}`);
        } else {
          setError('Failed to create project from import');
        }
      } else {
        setError('Failed to import data from Google Sheets');
      }
    } catch (error) {
      setError('An error occurred during Google Sheets import');
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
          <h1 className="text-2xl font-bold mb-6">Your Projects</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* Create/Import buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={handleCreateEmptyProject}
              className="flex items-center bg-primary text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <FaPlus className="mr-2" /> Create Empty Project
            </button>
            
            <button
              onClick={handleCsvImport}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              <FaFileUpload className="mr-2" /> Import from CSV/Excel
            </button>
            
            <button
              onClick={handleGoogleSheetsImport}
              className="flex items-center bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              <FaGoogle className="mr-2" /> Import from Google Sheets
            </button>
            
            {/* Hidden file input for CSV import */}
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          {/* Projects list */}
          {projects.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">You don't have any projects yet.</p>
              <p className="text-gray-500 mt-2">Create a new project to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="project-card"
                  onClick={() => router.push(`/projects/${project._id}`)}
                >
                  <h2 className="text-lg font-semibold mb-2">{project.name}</h2>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(project.updatedAt).toLocaleDateString()}
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
