import { useState, useEffect } from 'react';
import { FaCopy, FaChevronLeft, FaChevronRight, FaGlobe, FaBuilding, FaInfoCircle, FaPalette, FaSave, FaEdit } from 'react-icons/fa';

const ProjectSidebar = ({ project, isCollapsed, onToggleCollapse, onUpdateProject, onUpdateFigmaUrl }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: project.companyName || '',
    companyDescription: project.companyDescription || '',
    companyWebsite: project.companyWebsite || '',
    imagePrompt: project.imagePrompt || '',
    socialLinks: project.socialLinks ? 
      (project.socialLinks instanceof Map ? 
        Object.fromEntries(project.socialLinks) : 
        project.socialLinks) : {}
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Update form data when project changes
  useEffect(() => {
    setFormData({
      companyName: project.companyName || '',
      companyDescription: project.companyDescription || '',
      companyWebsite: project.companyWebsite || '',
      imagePrompt: project.imagePrompt || '',
      socialLinks: project.socialLinks ? 
        (project.socialLinks instanceof Map ? 
          Object.fromEntries(project.socialLinks) : 
          project.socialLinks) : {}
    });
  }, [project]);

  // Функция для копирования текста в буфер обмена
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} скопирован в буфер обмена`);
  };

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Обработчик изменения социальных сетей
  const handleSocialLinkChange = (network, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [network]: value
      }
    }));
  };

  // Сохранение данных
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const response = await fetch(`/api/projects/${project._id}/update-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveMessage('Информация успешно сохранена');
        setIsEditing(false);
        
        // Вызываем callback для обновления проекта в родительском компоненте
        if (onUpdateProject) {
          onUpdateProject(formData);
        }
      } else {
        setSaveMessage(`Ошибка: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving project info:', error);
      setSaveMessage('Ошибка при сохранении данных');
    } finally {
      setIsSaving(false);
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    }
  };

  // Социальные сети для выбора
  const availableSocialNetworks = [
    'Instagram', 'Facebook', 'Twitter', 'TikTok', 'YouTube', 
    'Telegram', 'VK', 'LinkedIn', 'Pinterest'
  ];

  // Helper function to get social links as an array
  const getSocialLinksArray = () => {
    if (!project.socialLinks) return [];
    
    if (project.socialLinks instanceof Map) {
      return Array.from(project.socialLinks.entries())
        .filter(([_, url]) => url)
        .map(([network, url]) => ({ network, url }));
    } else {
      return Object.entries(project.socialLinks)
        .filter(([_, url]) => url)
        .map(([network, url]) => ({ network, url }));
    }
  };

  // Helper function to check if there are any social links
  const hasSocialLinks = () => {
    if (!project.socialLinks) return false;
    
    if (project.socialLinks instanceof Map) {
      return Array.from(project.socialLinks.values()).some(url => url);
    } else {
      return Object.values(project.socialLinks).some(url => url);
    }
  };

  const handleOpenFigma = (url) => {
    if (url) {
      try {
        // Проверяем, начинается ли URL с figma:// или содержит figma.com
        if (url.startsWith('figma://') || url.includes('figma.com')) {
          // Используем window.open вместо window.location.href
          window.open(url, '_blank');
        } else {
          // Если URL не соответствует формату Figma, открываем в новом окне
          window.open(url, '_blank');
        }
      } catch (error) {
        console.error('Ошибка при открытии Figma:', error);
        alert('Произошла ошибка при открытии Figma');
      }
    }
  };

  return (
    <div 
      className={`project-sidebar bg-white border-r border-gray-200 h-full transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-80'
      }`}
    >
      <div className="flex justify-between p-2 border-b border-gray-200">
        {!isCollapsed && (
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            title={isEditing ? "Отменить редактирование" : "Редактировать информацию"}
          >
            {isEditing ? "Отмена" : <FaEdit />}
          </button>
        )}
        <button 
          onClick={onToggleCollapse} 
          className="text-gray-500 hover:text-gray-700 focus:outline-none ml-auto"
          title={isCollapsed ? "Развернуть панель" : "Свернуть панель"}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Информация о проекте</h2>
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center"
                title="Сохранить изменения"
              >
                <FaSave className="mr-1" /> Сохранить
              </button>
            )}
          </div>
          
          {saveMessage && (
            <div className={`mb-3 p-2 rounded text-sm ${saveMessage.includes('Ошибка') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {saveMessage}
            </div>
          )}
          
          {/* Название компании */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaBuilding className="inline mr-1" /> Название компании
            </label>
            <div className="flex">
              {isEditing ? (
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите название компании"
                />
              ) : (
                <>
                  <input
                    type="text"
                    value={project.companyName || ''}
                    readOnly
                    className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(project.companyName || '', 'Название компании')}
                    className="ml-2 bg-gray-100 text-gray-600 p-2 rounded hover:bg-gray-200"
                    title="Скопировать название компании"
                  >
                    <FaCopy />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Чем занимается компания */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaInfoCircle className="inline mr-1" /> Чем занимается компания
            </label>
            <div className="flex">
              {isEditing ? (
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Опишите деятельность компании"
                />
              ) : (
                <>
                  <textarea
                    value={project.companyDescription || ''}
                    readOnly
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(project.companyDescription || '', 'Описание компании')}
                    className="ml-2 bg-gray-100 text-gray-600 p-2 rounded hover:bg-gray-200 self-start"
                    title="Скопировать описание компании"
                  >
                    <FaCopy />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Сайт компании */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaGlobe className="inline mr-1" /> Сайт компании
            </label>
            <div className="flex">
              {isEditing ? (
                <input
                  type="text"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              ) : (
                <>
                  <input
                    type="text"
                    value={project.companyWebsite || ''}
                    readOnly
                    className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(project.companyWebsite || '', 'Сайт компании')}
                    className="ml-2 bg-gray-100 text-gray-600 p-2 rounded hover:bg-gray-200"
                    title="Скопировать сайт компании"
                  >
                    <FaCopy />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Ссылки на социальные сети */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ссылки на социальные сети
            </label>
            {isEditing ? (
              <div className="border border-gray-200 rounded-md p-2">
                {availableSocialNetworks.map(network => (
                  <div key={network} className="mb-2">
                    <label className="block text-xs text-gray-600 mb-1">{network}</label>
                    <input
                      type="text"
                      value={formData.socialLinks[network] || ''}
                      onChange={(e) => handleSocialLinkChange(network, e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`https://${network.toLowerCase()}.com/...`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
                {getSocialLinksArray().map(({ network, url }) => (
                  <div key={network} className="flex items-center justify-between py-1">
                    <span className="text-sm">{network}</span>
                    <button
                      onClick={() => copyToClipboard(url, `Ссылка на ${network}`)}
                      className="bg-gray-100 text-gray-600 p-1 rounded hover:bg-gray-200"
                      title={`Скопировать ссылку на ${network}`}
                    >
                      <FaCopy />
                    </button>
                  </div>
                ))}
                
                {!hasSocialLinks() && (
                  <p className="text-sm text-gray-500">Нет добавленных ссылок</p>
                )}
                
                {hasSocialLinks() && (
                  <button
                    onClick={() => copyToClipboard(
                      getSocialLinksArray()
                        .map(({ network, url }) => `${network}: ${url}`)
                        .join('\n'),
                      'Все ссылки на социальные сети'
                    )}
                    className="mt-2 w-full bg-gray-100 text-gray-600 p-1 rounded hover:bg-gray-200 text-sm"
                    title="Скопировать все ссылки"
                  >
                    <FaCopy className="inline mr-1" /> Скопировать все ссылки
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Промт для создания изображений */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaPalette className="inline mr-1" /> Промт для создания изображений
            </label>
            <div className="flex">
              {isEditing ? (
                <textarea
                  name="imagePrompt"
                  value={formData.imagePrompt}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите промт для генерации изображений"
                />
              ) : (
                <>
                  <textarea
                    value={project.imagePrompt || ''}
                    readOnly
                    rows={4}
                    className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(project.imagePrompt || '', 'Промт для создания изображений')}
                    className="ml-2 bg-gray-100 text-gray-600 p-2 rounded hover:bg-gray-200 self-start"
                    title="Скопировать промт"
                  >
                    <FaCopy />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Figma URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaGlobe className="inline mr-1" /> Figma URL
            </label>
            <div className="flex">
              {project.figmaUrl ? (
                <>
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenFigma(project.figmaUrl);
                    }}
                    className="website-link"
                  >
                    Открыть Figma
                  </a>
                  <button 
                    className="copy-button"
                    onClick={() => copyToClipboard(project.figmaUrl, 'URL Figma')}
                    title="Копировать URL Figma"
                  >
                    <FaCopy />
                  </button>
                </>
              ) : (
                <span className="text-gray-400">Не указан</span>
              )}
              <button 
                className="edit-button ml-2"
                onClick={onUpdateFigmaUrl}
                title="Редактировать URL Figma"
              >
                <FaEdit />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;
