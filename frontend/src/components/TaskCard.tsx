import React, { useState } from 'react';
import { Task } from '../types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { 
  Calendar, 
  Tag, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Image as ImageIcon,
  User as UserIcon
} from 'lucide-react';
import clsx from 'clsx';
import { filesApi } from '../services/api';
import ImageModal from './ImageModal';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  getUserName: (userId: string) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange,
  getUserName
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'zakończone';
  
  // Funkcja do obliczania dni do zakończenia
  const getDaysUntilDue = () => {
    if (!task.dueDate) return null;
    
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    
    // Ustaw godziny na 0, aby porównywać tylko daty
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const daysUntilDue = getDaysUntilDue();
  
  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };
  
  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };
  
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'krytyczny': return 'text-red-600 bg-red-100';
      case 'wysoki': return 'text-orange-600 bg-orange-100';
      case 'średni': return 'text-yellow-600 bg-yellow-100';
      case 'niski': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'zakończone': return 'text-green-600 bg-green-100';
      case 'w trakcie': return 'text-blue-600 bg-blue-100';
      case 'anulowane': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className={clsx(
      "card hover:shadow-md transition-shadow duration-200",
      isOverdue && "border-red-300 bg-red-50",
      task.isAssignedToMe && "border-blue-300 bg-blue-50"
    )}>
      {/* Etykieta dla zadań przypisanych */}
      {task.isAssignedToMe && (
        <div className="mb-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Przypisane do mnie
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onEdit(task)}
            disabled={task.isAssignedToMe && !task.isCreatedByMe}
            className={`p-1 transition-colors ${
              task.isAssignedToMe && !task.isCreatedByMe
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title={task.isAssignedToMe && !task.isCreatedByMe ? "Nie możesz edytować zadań przypisanych przez innych" : "Edytuj zadanie"}
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            disabled={task.isAssignedToMe && !task.isCreatedByMe}
            className={`p-1 transition-colors ${
              task.isAssignedToMe && !task.isCreatedByMe
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-400 hover:text-red-600'
            }`}
            title={task.isAssignedToMe && !task.isCreatedByMe ? "Nie możesz usuwać zadań przypisanych przez innych" : "Usuń zadanie"}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Status i Priorytet */}
        <div className="flex items-center justify-between">
          <span className={clsx("badge", getStatusColor(task.status))}>
            {task.status === 'do zrobienia' && <Clock size={12} className="mr-1" />}
            {task.status === 'w trakcie' && <AlertCircle size={12} className="mr-1" />}
            {task.status === 'zakończone' && <CheckCircle size={12} className="mr-1" />}
            {task.status}
          </span>
          <span className={clsx("badge", getPriorityColor(task.priority))}>
            {task.priority}
          </span>
        </div>

        {/* Data termin */}
        {task.dueDate && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar size={14} className="mr-2" />
            <span className={clsx(isOverdue && "text-red-600 font-medium")}>
              Termin: {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: pl })}
              {isOverdue && " (przekroczony)"}
            </span>
            {daysUntilDue !== null && !isOverdue && (
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {daysUntilDue === 0 ? "Dziś" : 
                 daysUntilDue === 1 ? "1 dzień" : 
                 `${daysUntilDue} dni`}
              </span>
            )}
          </div>
        )}

        {/* Tagi */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-1">
            <Tag size={14} className="text-gray-400 mr-1" />
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Przypisany użytkownik */}
        {task.assignedTo && (
          <div className="flex items-center text-sm text-gray-600">
            <UserIcon size={14} className="mr-2" />
            <span>
              {task.isAssignedToMe ? 'Przypisane przez:' : 'Przypisane do:'} 
              <span className="ml-1 font-medium text-blue-600">
                {task.isAssignedToMe ? getUserName(task.clerkUserId) : getUserName(task.assignedTo)}
              </span>
            </span>
          </div>
        )}

        {/* Zdjęcia */}
        {(() => {
          console.log('=== TASK CARD IMAGES DEBUG ===');
          console.log('Task:', task);
          console.log('Task images:', task.images);
          console.log('Images type:', typeof task.images);
          console.log('Images length:', task.images?.length);
          return null;
        })()}
        {task.images && task.images.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <ImageIcon size={14} className="mr-2" />
              <span>Zdjęcia ({task.images.length})</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {task.images.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={filesApi.getImageUrl(image)}
                  alt={`Zdjęcie ${index + 1}`}
                  className="w-full h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openImageModal(index)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ))}
              {task.images.length > 3 && (
                <div 
                  className="w-full h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => openImageModal(0)}
                >
                  +{task.images.length - 3} więcej
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data utworzenia */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          Utworzono: {format(new Date(task.createdAt), 'dd.MM.yyyy HH:mm', { locale: pl })}
        </div>
      </div>
      
      {/* Modal do wyświetlania zdjęć */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        images={task.images?.map(img => filesApi.getImageUrl(img)) || []}
        currentIndex={currentImageIndex}
        onIndexChange={setCurrentImageIndex}
      />
    </div>
  );
};

export default TaskCard;










