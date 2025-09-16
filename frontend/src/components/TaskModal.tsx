import React from 'react';
import { Task } from '../types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { 
  X, 
  Calendar, 
  Tag, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  XCircle,
  User as UserIcon,
  Edit,
  Trash2
} from 'lucide-react';
import clsx from 'clsx';
import { filesApi } from '../services/api';
import ImageModal from './ImageModal';
import ConfirmModal from './ConfirmModal';
import { useUser } from '@clerk/clerk-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  getUserName: (userId: string) => string;
  getUserAvatar?: (userId: string) => string | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  task, 
  onEdit, 
  onDelete,
  getUserName,
  getUserAvatar: getUserAvatarProp
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const { user: currentUser } = useUser();

  if (!isOpen || !task) return null;

  // Funkcja do pobierania awatara użytkownika
  const getUserAvatar = (userId: string): string | null => {
    // Jeśli to aktualny użytkownik, użyj jego awatara
    if (userId === currentUser?.id && currentUser?.imageUrl) {
      return currentUser.imageUrl;
    }
    
    // Użyj funkcji przekazanej przez props
    if (getUserAvatarProp) {
      return getUserAvatarProp(userId);
    }
    
    // Dla innych użytkowników, na razie zwróć null
    return null;
  };

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
      case 'krytyczny': return 'text-red-500 bg-red-50 dark:text-red-300 dark:bg-red-900/30';
      case 'wysoki': return 'text-orange-500 bg-orange-50 dark:text-orange-300 dark:bg-orange-900/30';
      case 'średni': return 'text-yellow-500 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-900/30';
      case 'niski': return 'text-green-500 bg-green-50 dark:text-green-300 dark:bg-green-900/30';
      default: return 'text-gray-500 bg-gray-50 dark:text-gray-300 dark:bg-gray-800/50';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'zakończone': return 'text-green-500 bg-green-50 dark:text-green-300 dark:bg-green-900/30';
      case 'w trakcie': return 'text-blue-500 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30';
      case 'anulowane': return 'text-red-500 bg-red-50 dark:text-red-300 dark:bg-red-900/30';
      default: return 'text-blue-500 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30';
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      setShowConfirmModal(true);
    }
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(task._id);
      onClose();
      setShowConfirmModal(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className={clsx(
            "bg-white dark:bg-[#212121] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border dark:border-[#404040]",
            isOverdue && "border-red-300 dark:border-red-500/50",
            task.priority === 'krytyczny' && "border-red-300 dark:border-red-500/50",
            task.status === 'zakończone' && "border-green-300 dark:border-green-500/50",
            task.isAssignedToMe && task.priority !== 'krytyczny' && task.status !== 'zakończone' && "border-blue-300 dark:border-blue-500/50"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-[#404040]">
            <div className="flex-1">
              {/* Etykieta dla zadań przypisanych */}
              {task.isAssignedToMe && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-500/50">
                    Przypisane do mnie
                  </span>
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {task.title}
              </h2>
              
              {/* Status i Priorytet */}
              <div className="flex items-center gap-3 mb-4">
                <span className={clsx("badge text-sm", getStatusColor(task.status))}>
                  {task.status === 'do zrobienia' && <Clock size={14} className="mr-1" />}
                  {task.status === 'w trakcie' && <AlertCircle size={14} className="mr-1" />}
                  {task.status === 'zakończone' && <CheckCircle size={14} className="mr-1" />}
                  {task.status === 'anulowane' && <XCircle size={14} className="mr-1" />}
                  {task.status}
                </span>
                <span className={clsx("badge text-sm", getPriorityColor(task.priority))}>
                  {task.priority}
                </span>
              </div>
            </div>
            
            {/* Przyciski akcji */}
            <div className="flex items-center gap-2 ml-4">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-2 transition-colors rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                  title={task.isAssignedToMe && !task.isCreatedByMe ? "Edytuj status zadania" : "Edytuj zadanie"}
                >
                  <Edit size={20} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={task.isAssignedToMe && !task.isCreatedByMe}
                  className={`p-2 transition-colors rounded-lg ${
                    task.isAssignedToMe && !task.isCreatedByMe
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                      : 'text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  title={task.isAssignedToMe && !task.isCreatedByMe ? "Nie możesz usuwać zadań przypisanych przez innych" : "Usuń zadanie"}
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors rounded-lg"
                title="Zamknij"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Opis */}
            {task.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Opis</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {task.description}
                </p>
              </div>
            )}

            {/* Data termin */}
            {task.dueDate && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Termin</h3>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Calendar size={18} className="mr-3" />
                  <div className="flex items-center gap-3">
                    <span className={clsx(isOverdue && "text-red-600 dark:text-red-400 font-medium")}>
                      {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: pl })}
                      {isOverdue && " (przekroczony)"}
                    </span>
                    {daysUntilDue !== null && !isOverdue && (
                      <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-500/50">
                        {daysUntilDue === 0 ? "Dziś" : 
                         daysUntilDue === 1 ? "1 dzień" : 
                         `${daysUntilDue} dni`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tagi */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tagi</h3>
                <div className="flex items-center flex-wrap gap-2">
                  <Tag size={18} className="text-gray-400 dark:text-gray-500 mr-2" />
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-[#181818] dark:text-gray-300 rounded border border-gray-200 dark:border-[#404040]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Informacje o przypisaniu */}
            {task.assignedTo && (
              <div className="space-y-4">
                {/* Sekcja "Przypisane przez:" - pokazuje osobę która utworzyła zadanie */}
                {!task.isCreatedByMe && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Przypisane przez:
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-500/50 overflow-hidden">
                          {getUserAvatar(task.clerkUserId) ? (
                            <img 
                              src={getUserAvatar(task.clerkUserId)!} 
                              alt={getUserName(task.clerkUserId)}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextElement) {
                                  nextElement.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <UserIcon 
                            size={20} 
                            className="text-blue-600 dark:text-blue-300"
                            style={{ display: getUserAvatar(task.clerkUserId) ? 'none' : 'flex' }}
                          />
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {getUserName(task.clerkUserId)}
                        </div>
                      </div>
                      <span className="font-medium text-blue-600 dark:text-blue-300">
                        {getUserName(task.clerkUserId)}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Sekcja "Przypisane do:" - pokazuje osoby do których zadanie jest przypisane */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Przypisane do:
                  </h3>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const assignedUsers = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
                      
                      return assignedUsers.map((userId, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="relative group">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-500/50 overflow-hidden">
                              {getUserAvatar(userId) ? (
                                <img 
                                  src={getUserAvatar(userId)!} 
                                  alt={getUserName(userId)}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (nextElement) {
                                      nextElement.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <UserIcon 
                                size={20} 
                                className="text-blue-600 dark:text-blue-300"
                                style={{ display: getUserAvatar(userId) ? 'none' : 'flex' }}
                              />
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              {getUserName(userId)}
                            </div>
                          </div>
                          <span className="font-medium text-blue-600 dark:text-blue-300">
                            {getUserName(userId)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Notatka od przypisanego użytkownika */}
            {task.assignedUserNote && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Notatka od {getUserName(task.assignedUserNoteAuthor || '')}
                </h3>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-500/50">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {task.assignedUserNote}
                  </p>
                </div>
              </div>
            )}

            {/* Zdjęcia */}
            {task.images && task.images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Zdjęcia ({task.images.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {task.images.map((image, index) => (
                    <img
                      key={index}
                      src={filesApi.getImageUrl(image)}
                      alt={`Zdjęcie ${index + 1}`}
                      className="w-full h-24 object-cover rounded border border-gray-200 dark:border-[#404040] cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openImageModal(index)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Metadane */}
            <div className="pt-4 border-t border-gray-200 dark:border-[#404040]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <span className="font-medium">Utworzono:</span>
                  <div>{new Date(task.createdAt).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}</div>
                </div>
                {task.updatedAt !== task.createdAt && (
                  <div>
                    <span className="font-medium">Ostatnia aktualizacja:</span>
                    <div>{new Date(task.updatedAt).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}</div>
                  </div>
                )}
                {task.completedAt && (
                  <div>
                    <span className="font-medium">Zakończono:</span>
                    <div>{new Date(task.completedAt).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Usuń zadanie"
        message={`Czy na pewno chcesz usunąć zadanie "${task.title}"? Ta operacja jest nieodwracalna.`}
        type="danger"
        confirmText="Usuń"
        cancelText="Anuluj"
      />
    </>
  );
};

export default TaskModal;
