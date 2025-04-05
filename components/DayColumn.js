import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { FaPlus, FaCopy, FaCalendarAlt, FaTrash, FaUpload, FaFacebook, FaInstagram, FaTwitter, FaTiktok, FaYoutube, FaVk, FaTelegram, FaPinterest, FaLinkedin, FaGlobe, FaRegNewspaper, FaRegCircle, FaRegFileAlt, FaRobot, FaClipboard, FaLock, FaUnlock, FaEdit, FaSave, FaTimes, FaImage, FaLink } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Image from 'next/image';

// Динамический импорт React-Quill (только на клиенте)
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="loading-editor">Загрузка редактора...</div>
});

// Импорт стилей React-Quill
import 'react-quill/dist/quill.snow.css';

// Модули для настройки панели инструментов Quill
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link'],
    ['clean']
  ]
};

// Форматы, которые будут доступны
const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link'
];

const socialNetworks = [
  'Instagram',
  'Facebook',
  'Twitter',
  'TikTok',
  'YouTube',
  'VK',
  'Telegram',
  'Pinterest',
  'LinkedIn',
  'Other'
];

// Объект для сопоставления социальных сетей с их иконками
const socialNetworkIcons = {
  'Instagram': <FaInstagram />,
  'Facebook': <FaFacebook />,
  'Twitter': <FaTwitter />,
  'TikTok': <FaTiktok />,
  'YouTube': <FaYoutube />,
  'VK': <FaVk />,
  'Telegram': <FaTelegram />,
  'Pinterest': <FaPinterest />,
  'LinkedIn': <FaLinkedin />,
  'Other': <FaGlobe />
};

// Типы контента
const contentTypes = [
  'Пост',
  'Сторис',
  'Статья'
];

// Объект для сопоставления типов контента с их иконками
const contentTypeIcons = {
  'Пост': <FaRegNewspaper />,
  'Сторис': <FaRegCircle />,
  'Статья': <FaRegFileAlt />
};

// Функция для форматирования даты в формате "23 января"
const formatDate = (date) => {
  if (!date) return '';
  
  const options = { day: 'numeric', month: 'long' };
  return new Date(date).toLocaleDateString('ru-RU', options);
};

// Добавляем компонент-обертку для ReactQuill
const QuillWrapper = ({ value, onChange, readOnly, placeholder }) => {
  const [isReady, setIsReady] = useState(false);
  const [editor, setEditor] = useState(null);

  // Обработчик для инициализации редактора
  const handleEditorInit = (editor) => {
    if (editor) {
      setEditor(editor);
      setIsReady(true);
    }
  };

  // Эффект для обработки изменений в редакторе
  useEffect(() => {
    if (editor && isReady) {
      const handleChange = () => {
        const content = editor.root.innerHTML;
        if (content !== value) {
          onChange(content);
        }
      };

      editor.on('text-change', handleChange);
      return () => {
        editor.off('text-change', handleChange);
      };
    }
  }, [editor, isReady, value, onChange]);

  // Добавляем стили для Quill при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!document.querySelector('link[href*="quill.snow.css"]')) {
        const link = document.createElement('link');
        link.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    }
  }, []);

  return (
    <div className="quill-editor-container">
      {typeof window !== 'undefined' && (
        <ReactQuill
          value={value}
          onChange={onChange}
          modules={quillModules}
          formats={quillFormats}
          readOnly={readOnly || !isReady}
          placeholder={placeholder}
          theme="snow"
          className={`bg-white rounded-lg ${readOnly ? 'opacity-75' : ''}`}
          onInit={handleEditorInit}
        />
      )}
    </div>
  );
};

export default function DayColumn({ day, index, data = {}, onUpdate, isReadOnly, onDelete, project, activeUsers, socket }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { id: projectId } = router.query;
  const [socialNetwork, setSocialNetwork] = useState(data?.socialNetwork || 'Telegram');
  const [contentType, setContentType] = useState(data?.contentType || 'text');
  const [images, setImages] = useState(data?.images || []);
  const [text, setText] = useState(data?.text || '');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(data?.date ? new Date(data.date) : new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);
  const datePickerRef = useRef(null);
  const dateInputRef = useRef(null);
  const columnRef = useRef(null);
  const quillRef = useRef(null);
  
  // Получаем информацию о том, кто редактирует этот день
  const dayEditor = activeUsers?.getDayEditor ? activeUsers.getDayEditor(day?.id) : null;
  
  // Проверяем, заблокирован ли день другим пользователем
  const isDayLocked = activeUsers?.isDayLocked ? activeUsers.isDayLocked(day?.id) : false;
  
  // Определяем, может ли текущий пользователь редактировать этот день
  const canEdit = !isReadOnly && !isDayLocked;
  
  // Определяем, редактирует ли текущий пользователь этот день
  const isEditingByCurrentUser = dayEditor && activeUsers?.currentUser && dayEditor.userId === activeUsers.currentUser.userId;
  
  const [isActive, setIsActive] = useState(Boolean(data?.text || (data?.images && data?.images.length > 0)));
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [dateInputValue, setDateInputValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [showChatGptModal, setShowChatGptModal] = useState(false);
  const [chatGptPrompt, setChatGptPrompt] = useState('');
  const [isProcessingChatGpt, setIsProcessingChatGpt] = useState(false);
  const textAreaRef = useRef(null);
  
  // Состояние для отображения выпадающего списка социальных сетей
  const [showSocialNetworkDropdown, setShowSocialNetworkDropdown] = useState(false);

  // Состояние для отображения выпадающего списка типов контента
  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);

  // Функция для отображения иконки текущей социальной сети
  const renderSocialNetworkIcon = () => {
    if (data?.socialNetwork && socialNetworkIcons[data.socialNetwork]) {
      return socialNetworkIcons[data.socialNetwork];
    }
    return <FaGlobe />;
  };

  // Функция для отображения иконки текущего типа контента
  const renderContentTypeIcon = () => {
    if (data?.contentType && contentTypeIcons[data.contentType]) {
      return contentTypeIcons[data.contentType];
    }
    return <FaRegNewspaper />;
  };

  // Функция для закрытия выпадающего списка при клике вне его
  useEffect(() => {
    function handleClickOutside(event) {
      if (socialNetworkRef.current && !socialNetworkRef.current.contains(event.target)) {
        setShowSocialNetworkDropdown(false);
      }
      if (contentTypeRef.current && !contentTypeRef.current.contains(event.target)) {
        setShowContentTypeDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Референс для выпадающего списка социальных сетей
  const socialNetworkRef = useRef(null);
  
  // Референс для выпадающего списка типов контента
  const contentTypeRef = useRef(null);
  
  // Инициализация даты при загрузке компонента
  useEffect(() => {
    if (!data.date) {
      // Если дата не установлена, устанавливаем текущую дату + index дней
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + index);
      onUpdate(index, {
        ...data,
        date: newDate.toISOString().split('T')[0]
      });
    }
  }, []);
  
  // Инициализация Socket.IO при монтировании компонента
  useEffect(() => {
    if (!socket || !projectId) return;

    // Присоединяемся к комнате проекта
    socket.emit('join-project', projectId);

    // Подписываемся на обновления изображений
    socket.on('imageReorder', ({ dayId, images, userId }) => {
      if (dayId === day.id && userId !== session?.user?.id) {
        onUpdate(index, {
          ...data,
          images
        });
      }
    });

    return () => {
      socket.off('imageReorder');
    };
  }, [socket, projectId, day.id, session?.user?.id]);

  // Функция для отправки обновлений изображений
  const emitImageReorder = (images) => {
    if (!socket || !projectId) return;

    socket.emit('reorder-images', {
      projectId,
      dayId: day.id,
      images,
      userId: session?.user?.id
    });
  };
  
  // Handle creating a new column content
  const handleCreateContent = () => {
    if (isReadOnly) {
      toast.error('Этот день заблокирован для редактирования');
      return;
    }
    setIsActive(true);
    onUpdate(index, {
      ...data,
      socialNetwork: data.socialNetwork || 'Telegram',
      contentType: data.contentType || 'Пост',
      images: data.images || [],
      text: data.text || ''
    });
  };
  
  // Handle social network change
  const handleSocialNetworkChange = (e) => {
    if (isReadOnly) return;
    
    onUpdate(index, {
      ...data,
      socialNetwork: e.target.value
    });
    
    // Закрываем выпадающий список после выбора
    setShowSocialNetworkDropdown(false);
  };
  
  // Handle content type change
  const handleContentTypeChange = (e) => {
    if (isReadOnly) return;
    
    onUpdate(index, {
      ...data,
      contentType: e.target.value
    });
    
    // Закрываем выпадающий список после выбора
    setShowContentTypeDropdown(false);
  };
  
  // Обновляем handleTextChange для автоматического сохранения
  const handleTextChange = (value) => {
    if (isReadOnly || isDayLocked) return;
    
    setText(value);
    // Автоматически сохраняем изменения
    onUpdate(index, {
      ...data,
      text: value,
      images,
      socialNetwork,
      contentType,
      lastModified: new Date().toISOString()
    });
  };
  
  // Handle image drop
  const handleDrop = (e) => {
    if (isReadOnly || isDayLocked) return;
    e.preventDefault();
    setIsDraggingOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileInputChange({ target: { files } });
    }
  };
  
  // Обновляем handleFileInputChange для автоматического сохранения
  const handleFileInputChange = async (e) => {
    if (isReadOnly) return;
    
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const projectName = projectId || 'unnamed';
    const currentDate = data.date || new Date().toISOString().split('T')[0];
    const baseIndex = data.images.length;
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('file', file);
    });
    
    formData.append('projectName', projectName);
    formData.append('date', currentDate);
    formData.append('dayIndex', index);
    formData.append('baseIndex', baseIndex);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      
      const newImages = [...data.images, ...result.urls];
      setImages(newImages);
      onUpdate(index, {
        ...data,
        images: newImages,
        lastModified: new Date().toISOString()
      });
      
      e.target.value = null;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Ошибка при загрузке изображений');
    }
  };

  // Handle image area click
  const handleImageAreaClick = () => {
    if (isReadOnly) return;
    fileInputRef.current.click();
  };

  // Обновляем handleDeleteImage для автоматического сохранения
  const handleDeleteImage = async (imageUrl) => {
    if (isReadOnly) return;
    
    const newImages = images.filter(img => img !== imageUrl);
    setImages(newImages);
    
    // Сохраняем изменения
    const updatedData = {
      ...data,
      images: newImages,
      socialNetwork,
      contentType,
      text,
      lastModified: new Date().toISOString(),
      lastModifiedBy: session?.user?.id || 'unknown'
    };
    
    await onUpdate(index, updatedData);
  };

  // Open file dialog
  const openFileDialog = () => {
    if (isReadOnly) return;
    
    fileInputRef.current.click();
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    if (isReadOnly || isDayLocked) return;
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  // Upload image to server
  const uploadImage = async (file) => {
    if (isReadOnly) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        onUpdate(index, {
          ...data,
          images: [...data.images, result.urls[0]]
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };
  
  // Upload multiple images to server
  const uploadMultipleImages = async (files) => {
    if (isReadOnly) return;
    
    // Проверка, что все файлы - изображения
    const allImages = Array.from(files).every(file => file.type.startsWith('image/'));
    if (!allImages) {
      alert('Only image files are allowed');
      return;
    }
    
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('file', file);
    });
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        onUpdate(index, {
          ...data,
          images: [...data.images, ...result.urls]
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };
  
  // Copy images to clipboard
  const copyImagesToClipboard = async () => {
    try {
      if (data.images.length === 0) return;
      
      // Если изображение только одно
      if (data.images.length === 1) {
        const imageUrl = data.images[0];
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const item = new ClipboardItem({
          [blob.type]: blob
        });
        
        await navigator.clipboard.write([item]);
        toast.success('Успешно скопировано');
        return;
      }
      
      // Если изображений несколько, объединяем их в одно
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const loadedImages = [];
      
      // Загружаем все изображения
      for (const url of data.images) {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Для работы с изображениями с других доменов
        
        // Создаем промис для загрузки изображения
        await new Promise((resolve, reject) => {
          img.onload = () => {
            loadedImages.push(img);
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load image: ${url}`);
            reject(new Error(`Failed to load image: ${url}`));
          };
          img.src = url;
        }).catch(err => console.error(err));
      }
      
      if (loadedImages.length === 0) {
        throw new Error('Failed to load any images');
      }
      
      // Определяем размеры canvas
      const padding = 10; // Отступ между изображениями
      const maxWidth = 1200; // Максимальная ширина
      let totalWidth = 0;
      let maxHeight = 0;
      
      // Вычисляем общую ширину и максимальную высоту
      for (const img of loadedImages) {
        totalWidth += img.width + padding;
        maxHeight = Math.max(maxHeight, img.height);
      }
      
      // Устанавливаем размеры canvas
      canvas.width = Math.min(totalWidth - padding, maxWidth);
      canvas.height = maxHeight;
      
      // Рисуем изображения на canvas
      let x = 0;
      for (const img of loadedImages) {
        // Если изображение выходит за пределы максимальной ширины, прекращаем
        if (x + img.width > maxWidth) break;
        
        ctx.drawImage(img, x, 0, img.width, img.height);
        x += img.width + padding;
      }
      
      // Конвертируем canvas в blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      // Копируем в буфер обмена
      const item = new ClipboardItem({
        [blob.type]: blob
      });
      
      await navigator.clipboard.write([item]);
      toast.success('Успешно скопировано');
    } catch (error) {
      console.error('Error copying images to clipboard:', error);
      
      // Запасной вариант - копируем URL
      try {
        const imageUrls = data.images.join('\n');
        await navigator.clipboard.writeText(imageUrls);
        toast.success('Успешно скопировано');
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        toast.error('Ошибка при копировании');
      }
    }
  };
  
  // Copy single image to clipboard
  const handleCopyImage = async (imageIndex) => {
    try {
      if (!data.images[imageIndex]) return;
      
      const imageUrl = data.images[imageIndex];
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const item = new ClipboardItem({
        [blob.type]: blob
      });
      
      await navigator.clipboard.write([item]);
      toast.success('Успешно скопировано');
    } catch (error) {
      console.error('Error copying image to clipboard:', error);
      
      // Запасной вариант - копируем URL
      try {
        const imageUrl = data.images[imageIndex];
        await navigator.clipboard.writeText(imageUrl);
        toast.success('Успешно скопировано');
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        toast.error('Ошибка при копировании');
      }
    }
  };
  
  // Copy text to clipboard
  const copyTextToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(data.text);
      toast.success('Успешно скопировано');
    } catch (error) {
      console.error('Error copying text:', error);
      toast.error('Ошибка при копировании');
    }
  };
  
  // Copy entire day content to clipboard
  const copyEntireDayContent = async () => {
    try {
      // Создаем текстовый контент
      const textContent = 
        `День ${index + 1} - ${formatDate(data.date)}\n` +
        (data.socialNetwork ? `Социальная сеть: ${data.socialNetwork}\n\n` : '') +
        (data.text || '');
      
      // Если есть изображения, копируем их вместе с текстом
      if (data.images.length > 0) {
        try {
          // Используем тот же подход, что и в функции copyImagesToClipboard
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          // Создаем промис для загрузки изображения
          const imageLoadPromise = new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = data.images[0];
          });
          
          // Ждем загрузки изображения
          await imageLoadPromise;
          
          // Создаем canvas и рисуем изображение
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Преобразуем canvas в blob
          const blob = await new Promise(resolve => canvas.toBlob(resolve));
          
          // Копируем изображение в буфер обмена
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/plain': new Blob([textContent], { type: 'text/plain' }),
              [blob.type]: blob
            })
          ]);
          
          toast.success('Успешно скопировано');
        } catch (imageError) {
          console.error('Error copying image:', imageError);
          // Если не удалось скопировать изображение, копируем только текст
          await navigator.clipboard.writeText(textContent);
          toast.success('Успешно скопировано');
        }
      } else {
        // Если нет изображений, копируем только текст
        await navigator.clipboard.writeText(textContent);
        toast.success('Успешно скопировано');
      }
    } catch (error) {
      console.error('Error copying day content:', error);
      toast.error('Ошибка при копировании');
    }
  };
  
  // Начать редактирование даты
  const startEditingDate = () => {
    if (isReadOnly) return;
    
    setIsEditingDate(true);
    setDateInputValue(data.date || '');
    
    // Фокус на поле ввода даты после рендеринга
    setTimeout(() => {
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
    }, 0);
  };
  
  // Сохранить дату
  const saveDate = () => {
    if (isReadOnly) return;
    
    // Проверка валидности даты
    if (dateInputValue) {
      onUpdate(index, {
        ...data,
        date: dateInputValue
      });
    }
    
    setIsEditingDate(false);
  };
  
  // Обработка нажатия клавиш при редактировании даты
  const handleDateKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveDate();
    } else if (e.key === 'Escape') {
      setIsEditingDate(false);
    }
  };
  
  // Handle image container click
  const handleImageContainerClick = (idx) => {
    if (isReadOnly) return;
    setHoveredImageIndex(idx);
    fileInputRef.current.click();
  };

  // Функции для drag and drop изображений
  const handleImageDragStart = (e, idx) => {
    if (isReadOnly) {
      e.preventDefault();
      return;
    }
    
    // Сохраняем индекс перетаскиваемого изображения и ID колонки
    e.dataTransfer.setData('text/plain', JSON.stringify({
      columnIndex: index,
      imageIndex: idx,
      imageUrl: data.images[idx],
      dayId: data.id || index.toString() // Используем ID дня или индекс как идентификатор
    }));
    e.dataTransfer.effectAllowed = 'move';
    
    // Добавляем класс для визуального эффекта
    e.target.classList.add('dragging');
  };
  
  const handleImageDragOver = (e, idx) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Добавляем визуальный эффект для зоны сброса
    e.currentTarget.classList.add('drop-target');
  };
  
  const handleImageDragLeave = (e) => {
    if (isReadOnly) return;
    
    // Убираем визуальный эффект
    e.currentTarget.classList.remove('drop-target');
  };
  
  const handleImageDrop = (e, toIndex) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    e.currentTarget.classList.remove('drop-target');
    
    try {
      // Получаем данные перетаскиваемого изображения
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { columnIndex: fromColumnIndex, imageIndex: fromIndex, imageUrl, dayId } = dragData;
      
      // Если перетаскивание происходит в пределах одной колонки
      if (fromColumnIndex === index) {
        // Если индексы разные, меняем изображения местами
        if (fromIndex !== toIndex) {
          moveImage(fromIndex, toIndex);
        }
      } else {
        // Перетаскивание между разными колонками
        // Создаем уникальную копию URL изображения
        const uniqueImageUrl = createUniqueImageUrl(imageUrl);
        
        // Добавляем изображение в текущую колонку
        const currentImages = [...(data.images || [])];
        
        // Если есть целевой индекс, вставляем изображение в указанную позицию
        if (toIndex !== undefined && currentImages.length > 0) {
          currentImages.splice(toIndex, 0, uniqueImageUrl);
        } else {
          // Иначе добавляем в конец массива
          currentImages.push(uniqueImageUrl);
        }
        
        console.log('Moving image to empty area', {
          fromColumnIndex,
          fromIndex,
          imageUrl,
          uniqueImageUrl,
          newImages: currentImages
        });
        
        // Обновляем текущую колонку
        onUpdate(index, {
          ...data,
          images: currentImages
        });
        
        // Отправляем событие об изменении порядка изображений через Socket.IO
        if (socket && projectId) {
          socket.emitImageReorder(data.id, currentImages);
        }
        
        // Находим все колонки
        const allColumns = document.querySelectorAll('.day-column');
        
        // Ищем колонку с нужным индексом
        const sourceColumn = Array.from(allColumns).find(
          col => col.dataset.columnIndex === fromColumnIndex.toString()
        );
        
        if (sourceColumn) {
          console.log('Found source column:', sourceColumn);
          
          // Создаем и отправляем событие для обновления колонки
          const event = new CustomEvent('updateColumn', { 
            detail: { columnIndex: fromColumnIndex, imageIndex: fromIndex } 
          });
          sourceColumn.dispatchEvent(event);
        } else {
          console.error('Source column not found:', columnIndex);
        }
      }
    } catch (error) {
      console.error('Error during drag and drop:', error);
    }
  };
  
  const handleImageDragEnd = (e) => {
    if (isReadOnly) return;
    
    // Убираем визуальный эффект
    e.target.classList.remove('dragging');
    
    // Убираем класс drop-target со всех элементов
    document.querySelectorAll('.image-container').forEach(el => {
      el.classList.remove('drop-target');
    });
  };

  // Обновляем исходной колонки при перетаскивании
  const updateSourceColumn = (imageIndex) => {
    if (isReadOnly) return;
    
    const newImages = [...data.images];
    newImages.splice(imageIndex, 1);
    
    console.log('Updating source column, remaining images:', newImages.length);
    
    // Обновляем колонку с новым массивом изображений
    onUpdate(index, {
      ...data,
      images: newImages
    });
    
    // Отправляем событие об изменении порядка изображений через Socket.IO
    if (socket && projectId) {
      socket.emitImageReorder(data.id, newImages);
    }
  };

  // Обновляем функцию moveImage для автоматического сохранения
  const moveImage = (fromIndex, toIndex) => {
    if (isReadOnly) return;
    
    const newImages = [...data.images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    // Обновляем состояние и сохраняем
    setImages(newImages);
    onUpdate(index, {
      ...data,
      images: newImages,
      lastModified: new Date().toISOString()
    });
    
    // Отправляем событие об изменении порядка изображений
    emitImageReorder(newImages);
  };

  // Render image grid
  const renderImageGrid = () => {
    const images = data.images;
    
    // Если нет изображений, возвращаем пустой div
    if (!images || images.length === 0) {
      return <div className="empty-grid"></div>;
    }
    
    // Определяем стиль сетки в зависимости от количества изображений
    let gridStyle = {};
    
    if (images.length === 1) {
      // Одно изображение занимает всю область
      gridStyle = { gridTemplateColumns: '1fr' };
    } else if (images.length === 2) {
      // Два изображения в два столбца
      gridStyle = { gridTemplateColumns: '1fr 1fr' };
    } else if (images.length === 3) {
      // Три изображения в сетке 2x2 (три занятых, одна пустая)
      gridStyle = { 
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr'
      };
    } else {
      // Четыре и более изображений в сетке 2x2 или больше
      gridStyle = { 
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: `repeat(${Math.ceil(images.length / 2)}, 1fr)`
      };
    }
    
    return (
      <div className="image-grid" style={gridStyle}>
        {images.map((image, idx) => (
          <div 
            key={`${index}-${idx}-${image}`} 
            className="image-container relative"
            draggable={!isReadOnly}
            onDragStart={(e) => handleImageDragStart(e, idx)}
            onDragOver={(e) => handleImageDragOver(e, idx)}
            onDragLeave={handleImageDragLeave}
            onDrop={(e) => handleImageDrop(e, idx)}
            onDragEnd={handleImageDragEnd}
            onMouseEnter={() => setHoveredImageIndex(idx)}
            onMouseLeave={() => setHoveredImageIndex(null)}
            onClick={!isReadOnly ? () => handleImageContainerClick(idx) : undefined}
          >
            <img 
              src={image} 
              alt={`Image ${idx + 1}`} 
              className="image-preview"
              onError={(e) => {
                console.error(`Failed to load image: ${image}`);
                e.target.src = '/placeholder-image.jpg'; // Fallback image
              }}
            />
            {hoveredImageIndex === idx && !isReadOnly && (
              <button 
                className="delete-image-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(image);
                }}
                title="Удалить изображение"
              >
                <FaTrash />
              </button>
            )}
            {hoveredImageIndex === idx && !isReadOnly && (
              <button 
                className="copy-image-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyImage(idx);
                }}
                title="Копировать изображение"
              >
                <FaCopy />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Функция для открытия Figma
  const handleOpenFigma = () => {
    console.log('handleOpenFigma вызван, project:', project);
    
    // Получаем URL Figma из проекта
    const figmaUrl = project?.figmaUrl;
    console.log('figmaUrl:', figmaUrl);
    
    if (figmaUrl) {
      try {
        // Проверяем, начинается ли URL с figma:// или содержит figma.com
        if (figmaUrl.startsWith('figma://') || figmaUrl.includes('figma.com')) {
          console.log('Открываем Figma через window.open:', figmaUrl);
          // Используем window.open вместо window.location.href
          window.open(figmaUrl, '_blank');
        } else {
          console.log('Открываем URL в новом окне:', figmaUrl);
          // Если URL не соответствует формату Figma, открываем в новом окне
          window.open(figmaUrl, '_blank');
        }
      } catch (error) {
        console.error('Ошибка при открытии Figma:', error);
        alert('Произошла ошибка при открытии Figma');
      }
    } else {
      console.log('URL Figma не указан');
      alert('URL Figma не указан в настройках проекта');
    }
  };

  // Функция для генерации изображения через ChatGPT
  const handleGenerateImage = async () => {
    console.log('handleGenerateImage вызван');
    
    try {
      // Формируем промт для генерации изображения
      const prompt = `Создай изображение для ${data.socialNetwork || 'социальной сети'}, тип контента: ${data.contentType || 'Пост'}, тема: ${data.text?.substring(0, 100) || 'Не указана'}`;
      console.log('Сформирован промт:', prompt);
      
      try {
        // Копируем промт в буфер обмена
        await navigator.clipboard.writeText(prompt);
        console.log('Промт скопирован в буфер обмена');
        
        // Уведомляем пользователя
        toast.success('Промпт скопирован');
        
        // Открываем ChatGPT в новом окне
        console.log('Открываем ChatGPT');
        window.open('https://chat.openai.com/', '_blank');
      } catch (clipboardError) {
        console.error('Ошибка при копировании в буфер обмена:', clipboardError);
        toast.error('Не удалось скопировать промпт в буфер обмена');
        window.open('https://chat.openai.com/', '_blank');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Произошла ошибка при генерации изображения');
    }
  };

  // Render image upload area
  const renderImageUpload = () => {
    return (
      <div className="image-upload-container">
        <div className="image-upload-header">
          <div className="flex justify-between items-center">
            <span className="font-medium">Изображения</span>
            <div className="flex">
              {/* Кнопка "Скопировать весь контент дня" удалена */}
            </div>
          </div>
        </div>
        
        {/* Панель инструментов для создания изображений */}
        {!isReadOnly && (
          <div id="image-create-tools" className="image-create-tools mb-3">
            <div className="flex justify-between items-center">
              <button 
                className="image-tool-button"
                onClick={handleImageAreaClick}
                title="Загрузить изображение"
                disabled={isReadOnly}
              >
                <span className="image-tool-icon">+</span>
              </button>
              
              <button 
                className="image-tool-button"
                onClick={() => handleOpenFigma()}
                title="Открыть Figma"
                disabled={isReadOnly || !project?.figmaUrl}
              >
                <span className="image-tool-icon">
                  <svg viewBox="0 0 38 57" className="figma-icon">
                    <path fill="#1ABCFE" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/>
                    <path fill="#0ACF83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/>
                    <path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/>
                    <path fill="#F24E1E" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/>
                    <path fill="#A259FF" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/>
                  </svg>
                </span>
              </button>
              
              <button 
                className="image-tool-button"
                onClick={handleGenerateImage}
                title="Сгенерировать изображение"
                disabled={isReadOnly}
              >
                <span className="image-tool-icon">
                  <svg viewBox="0 0 24 24" className="chatgpt-icon">
                    <path fill="currentColor" d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.5093-2.6067-1.4997z"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>
        )}
        
        <div className="image-upload-content">
          {data.images && data.images.length > 0 ? (
            <div className="image-grid">
              {renderImageGrid()}
            </div>
          ) : (
            <div 
              className={`image-upload-placeholder ${!isReadOnly ? 'cursor-pointer' : ''}`}
              onDragOver={handleEmptyAreaDragOver}
              onDragLeave={handleEmptyAreaDragLeave}
              onDrop={handleEmptyAreaDrop}
              onClick={!isReadOnly ? handleImageAreaClick : undefined}
            >
              {!isReadOnly ? (
                <>
                  <FaUpload className="image-upload-icon" />
                  <div className="image-upload-text">
                    Нажмите, чтобы загрузить изображения
                  </div>
                </>
              ) : (
                <div className="image-upload-text">
                  Нет изображений
                </div>
              )}
            </div>
          )}
        </div>
        
        {!isReadOnly && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        )}
      </div>
    );
  };

  // Обработчики для пустой области загрузки
  const handleEmptyAreaDragOver = (e) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drop-target-empty');
  };
  
  const handleEmptyAreaDragLeave = (e) => {
    if (isReadOnly) return;
    
    e.currentTarget.classList.remove('drop-target-empty');
  };
  
  const handleEmptyAreaDrop = (e) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    setIsDraggingOver(false);
    
    try {
      // Получаем данные перетаскиваемого изображения
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { columnIndex: fromColumnIndex, imageIndex: fromIndex, imageUrl, dayId } = dragData;
      
      // Создаем уникальную копию URL изображения
      const uniqueImageUrl = createUniqueImageUrl(imageUrl);
      
      // Добавляем изображение в текущую колонку
      const currentImages = [...(data.images || [])];
      currentImages.push(uniqueImageUrl);
      
      console.log('Moving image to empty area', {
        fromColumnIndex,
        fromIndex,
        imageUrl,
        uniqueImageUrl,
        newImages: currentImages
      });
      
      // Обновляем текущую колонку
      onUpdate(index, {
        ...data,
        images: currentImages
      });
      
      // Отправляем событие об изменении порядка изображений через Socket.IO
      if (socket && projectId) {
        socket.emitImageReorder(data.id, currentImages);
      }
      
      // Находим все колонки
      const allColumns = document.querySelectorAll('.day-column');
      
      // Ищем колонку с нужным индексом
      const sourceColumn = Array.from(allColumns).find(
        col => col.dataset.columnIndex === fromColumnIndex.toString()
      );
      
      if (sourceColumn) {
        console.log('Found source column:', sourceColumn);
        
        // Создаем и отправляем событие для обновления колонки
        const event = new CustomEvent('updateColumn', { 
          detail: { columnIndex: fromColumnIndex, imageIndex: fromIndex } 
        });
        sourceColumn.dispatchEvent(event);
      } else {
        console.error('Source column not found:', columnIndex);
      }
    } catch (error) {
      console.error('Error during drag and drop to empty area:', error);
    }
  };
  
  // Функция для копирования ссылки на демонстрацию
  const handleCopyPrompt = async () => {
    try {
      // Формируем URL демонстрации
      const demoUrl = `${window.location.origin}/projects/${projectId}/demo`;
      
      // Копируем URL в буфер обмена
      await navigator.clipboard.writeText(demoUrl);
      
      // Показываем уведомление об успехе
      toast.success('Ссылка скопирована');
      
      // Открываем демо в новом окне
      window.open(demoUrl, '_blank');
    } catch (error) {
      console.error('Error copying demo link:', error);
      toast.error('Ошибка при копировании ссылки');
    }
  };

  // Функция для сохранения изменений
  const handleSave = async () => {
    try {
      const updatedDay = {
        ...data,
        text,
        images,
        socialNetwork,
        contentType,
        lastModified: new Date().toISOString()
      };

      onUpdate(updatedDay);
      setIsEditing(false);
      toast.success('Изменения сохранены');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Не удалось сохранить изменения');
    }
  };

  // Функция для отмены изменений
  const handleCancel = () => {
    setText(data.text || '');
    setImages(data.images || []);
    setSocialNetwork(data.socialNetwork || 'Telegram');
    setContentType(data.contentType || 'Пост');
    setIsEditing(false);
    toast('Редактирование отменено', { icon: '⚠️' });
  };

  // Функция для удаления дня
  const handleDeleteDay = async () => {
    try {
      if (onDelete) {
        const result = await onDelete(index);
        if (result?.success) {
          toast.success('День успешно удален');
        } else {
          toast.error('Ошибка при удалении дня');
        }
      }
    } catch (error) {
      console.error('Error deleting day:', error);
      toast.error('Ошибка при удалении дня');
    }
  };
  
  // Рендер заголовка колонки с датой
  const renderColumnHeader = () => {
    return (
      <div className="column-header flex justify-between items-center p-2 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          {isEditingDate ? (
          <div className="date-input-container">
            <input
              ref={dateInputRef}
              type="date"
                className="date-input px-2 py-1 border rounded hover:border-blue-500 focus:border-blue-500 focus:outline-none"
              value={dateInputValue}
              onChange={(e) => setDateInputValue(e.target.value)}
                onBlur={handleDateInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDateInputBlur();
                  } else if (e.key === 'Escape') {
                    setIsEditingDate(false);
                    setDateInputValue(data.date);
                  }
                }}
            />
          </div>
        ) : (
            <button
              onClick={() => !isReadOnly && setIsEditingDate(true)}
              className={`date-display px-2 py-1 rounded ${
                !isReadOnly ? 'hover:bg-gray-200 cursor-pointer' : 'cursor-default'
              } transition-colors duration-200`}
              title={isReadOnly ? undefined : "Нажмите для изменения даты"}
              disabled={isReadOnly}
            >
              {formatDate(data.date)}
            </button>
          )}
          
          <div className="flex items-center space-x-2">
          <button 
              className={`social-network-select px-2 py-1 rounded ${
                !isReadOnly ? 'hover:bg-gray-200 cursor-pointer' : 'cursor-default'
              } transition-colors duration-200`}
              onClick={() => {
                if (!isReadOnly) {
                  const networks = ['Telegram', 'Instagram', 'VK'];
                  const currentIndex = networks.indexOf(socialNetwork);
                  const nextIndex = (currentIndex + 1) % networks.length;
                  setSocialNetwork(networks[nextIndex]);
                }
              }}
              title={isReadOnly ? undefined : "Нажмите для смены соц. сети"}
              disabled={isReadOnly}
            >
              {socialNetwork === 'Telegram' && <FaTelegram className="text-[#0088cc]" />}
              {socialNetwork === 'Instagram' && <FaInstagram className="text-[#E1306C]" />}
              {socialNetwork === 'VK' && <FaVk className="text-[#4C75A3]" />}
            </button>

            <button
              className={`content-type-select px-2 py-1 rounded ${
                !isReadOnly ? 'hover:bg-gray-200 cursor-pointer' : 'cursor-default'
              } transition-colors duration-200 text-sm`}
              onClick={() => {
                if (!isReadOnly) {
                  const types = ['Пост', 'Сторис', 'Рилс'];
                  const currentIndex = types.indexOf(contentType);
                  const nextIndex = (currentIndex + 1) % types.length;
                  setContentType(types[nextIndex]);
                }
              }}
              title={isReadOnly ? undefined : "Нажмите для смены типа контента"}
              disabled={isReadOnly}
            >
              {contentType}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isReadOnly && (
            <button
              onClick={handleDeleteDay}
              className="delete-button p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors duration-200"
            title="Удалить день"
          >
              <FaTrash size={14} />
          </button>
        )}
          {isDayLocked && (
            <div className="locked-indicator flex items-center text-yellow-500" title={`Редактируется пользователем ${getDayEditor(index)?.name}`}>
              <FaLock size={14} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Empty column state
  if (!isActive) {
    return (
      <div 
        className="day-column"
        data-column-index={index}
        onClick={handleCreateContent}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {renderColumnHeader()}
        <div className="day-column-empty">
          <FaPlus size={24} className="text-gray-400" />
        </div>
      </div>
    );
  }
  
  // Active column state
  return (
    <div 
      ref={columnRef}
      className={`day-column relative ${isActive ? 'active' : ''} ${isDraggingOver ? 'dragging-over' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={isActive ? undefined : handleCreateContent}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderColumnHeader()}
      
      <div className="day-content">
        {isActive ? (
          <>
            {/* Область для изображений */}
        {renderImageUpload()}
            
            {/* Текстовый редактор */}
            <div className="post-text-editor mb-4">
              {/* Показываем панель инструментов только если это не демо-режим */}
              {!isReadOnly && (
              <div id="post-text-functions" className="chatgpt-button-container flex items-center justify-between mb-2">
                  <div className="flex space-x-2">
                <button
                  className="chatgpt-button flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  onClick={() => setShowChatGptModal(true)}
                  title="Улучшить текст с помощью ChatGPT"
                >
                      <FaRobot />
                </button>
                <button
                  className="chatgpt-button flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  onClick={copyTextToClipboard}
                  title="Скопировать текст в буфер обмена"
                >
                      <FaCopy />
                </button>
              </div>
                  <button
                    className="chatgpt-button flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    onClick={handleCopyPrompt}
                    title="Скопировать ссылку на демонстрацию"
                  >
                    <FaGlobe />
                  </button>
        </div>
      )}
      
              <div className="relative">
                <QuillWrapper
                  value={text}
                  onChange={handleTextChange}
                  readOnly={isReadOnly || isDayLocked}
                  placeholder="Введите текст поста..."
                />
              </div>
              </div>
              
            {/* Кнопки управления */}
            <div className="flex justify-between mt-4">
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
                  disabled={isReadOnly || isDayLocked}
                >
                  <FaSave className="mr-2" />
                  Сохранить
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
                >
                  <FaTimes className="mr-2" />
                  Отмена
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            className="empty-day-content"
            onClick={handleCreateContent}
            onDragOver={handleEmptyAreaDragOver}
            onDragLeave={handleEmptyAreaDragLeave}
            onDrop={handleEmptyAreaDrop}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <FaPlus className="text-3xl mb-2" />
              <span>Создать контент</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
