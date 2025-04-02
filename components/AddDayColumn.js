import { FaPlus } from 'react-icons/fa';

export default function AddDayColumn({ onAddDay }) {
  return (
    <div className="day-column">
      <div className="column-header border-b">
        <div className="flex justify-center items-center h-full">
          <span className="text-gray-500">Добавить день</span>
        </div>
      </div>
      <div 
        className="day-column-empty"
        onClick={onAddDay}
      >
        <div className="flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
          <FaPlus size={24} className="mb-2" />
          <span>Добавить день</span>
        </div>
      </div>
    </div>
  );
}
