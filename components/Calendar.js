import { useState } from 'react';
import DayColumn from './DayColumn';
import { FaPlus } from 'react-icons/fa';

export default function Calendar({ days = [], projectId, isDemo, onUpdate }) {
  // Функция для создания пустого дня
  const createEmptyDay = (index) => {
    const today = new Date();
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    
    return {
      id: `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: date.toISOString().split('T')[0],
      socialNetwork: 'Telegram',
      contentType: 'Пост',
      images: [],
      text: '',
      lastModified: new Date().toISOString(),
      lastModifiedBy: 'system'
    };
  };

  // Обработчик обновления дня
  const handleDayUpdate = (index, updatedDay) => {
    const updatedDays = [...days];
    updatedDays[index] = {
      ...updatedDay,
      lastModified: new Date().toISOString()
    };
    onUpdate(updatedDays);
  };

  // Обработчик удаления дня
  const handleDeleteDay = (index) => {
    const updatedDays = days.filter((_, i) => i !== index);
    onUpdate(updatedDays);
  };

  // Обработчик добавления нового дня
  const handleAddDay = () => {
    if (days.length >= 14) return; // Максимум 14 дней
    
    const newDay = createEmptyDay(days.length);
    onUpdate([...days, newDay]);
  };

  return (
    <div className="calendar-grid">
      {/* Дни */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {days.map((day, index) => (
          <DayColumn
            key={day.id}
            day={day}
            index={index}
            onUpdate={(updatedDay) => handleDayUpdate(index, updatedDay)}
            onDelete={() => handleDeleteDay(index)}
            isReadOnly={isDemo}
            projectId={projectId}
          />
        ))}

        {/* Кнопка добавления нового дня */}
        {!isDemo && days.length < 14 && (
          <button
            onClick={handleAddDay}
            className="add-day-button flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors"
          >
            <FaPlus className="text-3xl text-gray-400 mb-2" />
            <span className="text-gray-600">Добавить день</span>
          </button>
        )}
      </div>
    </div>
  );
} 