import React, { useState, useRef } from 'react';
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
  XCircle,
  Image as ImageIcon,
  User as UserIcon,
  Share2,
  CheckSquare,
  Square
} from 'lucide-react';
import clsx from 'clsx';
import { filesApi } from '../services/api';
import ImageModal from './ImageModal';
import { useUser } from '@clerk/clerk-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onView: (task: Task) => void;
  onShare?: (task: Task) => void;
  onTaskSelection?: (taskId: string) => void;
  isSelected?: boolean;
  getUserName: (userId: string) => string;
  getUserAvatar?: (userId: string) => string | null;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onView,
  onShare,
  onTaskSelection,
  isSelected = false,
  getUserName,
  getUserAvatar: getUserAvatarProp
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const { user: currentUser } = useUser();
  const [imageRetries, setImageRetries] = useState<Map<number, number>>(new Map());
  const imageClickRef = useRef(false);
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'zakończone';

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
    
    // Dla innych użytkowników, spróbuj pobrać z Clerk API
    // Na razie zwróć null, żeby pokazać domyślną ikonę
    return null;
  };
  
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

  const handleCardClick = () => {
    if (!imageClickRef.current) {
      onView(task);
    }
    imageClickRef.current = false;
  };

  const handleImageClick = (index: number) => {
    imageClickRef.current = true;
    openImageModal(index);
  };

  const handleImageError = (index: number) => {
    const currentRetries = imageRetries.get(index) || 0;
    
    if (currentRetries < 3) {
      // Retry loading the image
      setTimeout(() => {
        setImageRetries(prev => new Map(prev.set(index, currentRetries + 1)));
        setImageErrors(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 1000 * (currentRetries + 1)); // Exponential backoff
    } else {
      // Mark as permanently failed
      setImageErrors(prev => new Set(prev.add(index)));
    }
  };

  const retryImage = (index: number) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setImageRetries(prev => new Map(prev.set(index, 0)));
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

  return (
    <div 
      className={clsx(
        "card hover:shadow-md transition-shadow duration-200 border dark:border-[#404040] cursor-pointer relative",
        isOverdue && "border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-900/20",
        task.priority === 'krytyczny' && "border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-900/20",
        task.status === 'zakończone' && "border-green-300 bg-green-50 dark:border-green-500/50 dark:bg-green-900/20",
        task.isAssignedToMe && task.priority !== 'krytyczny' && task.status !== 'zakończone' && "border-blue-300 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-900/20"
      )}
      onClick={handleCardClick}
    >
      {/* Checkbox dla zaznaczania (tylko gdy jest włączony tryb zaznaczania) */}
      {onTaskSelection && task.isCreatedByMe && (
        <div className="absolute top-1 right-2 z-10 m-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTaskSelection(task._id);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors shadow-sm border border-gray-200 dark:border-[#404040] bg-white dark:bg-[#212121]"
          >
            {isSelected ? (
              <CheckSquare size={20} className="text-blue-600 dark:text-blue-400" />
            ) : (
              <Square size={20} className="text-gray-400 dark:text-gray-500" />
            )}
          </button>
        </div>
      )}

      {/* Etykiety dla zadań */}
      <div className="mb-2 flex flex-wrap gap-2">
        {task.isAssignedToMe && (
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-500/50">
            Przypisane do mnie
          </span>
        )}
        {task.isSharedWithMe && (
          <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full border border-green-200 dark:border-green-500/50">
            Udostępnione przez {getUserName(task.clerkUserId)}
          </span>
        )}
        {task.sharedWith && task.sharedWith.length > 0 && task.isCreatedByMe && (
          <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-500/50">
            Udostępnione: {task.sharedWith.map(userId => getUserName(userId)).join(', ')}
          </span>
        )}
      </div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
              {task.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            title={task.isAssignedToMe && !task.isCreatedByMe ? "Edytuj status zadania" : "Edytuj zadanie"}
          >
            <Edit size={16} />
          </button>
          {onShare && task.isCreatedByMe && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(task);
              }}
              className="p-1 transition-colors text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
              title="Udostępnij zadanie"
            >
              <Share2 size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id);
            }}
            disabled={task.isAssignedToMe && !task.isCreatedByMe}
            className={`p-1 transition-colors ${
              task.isAssignedToMe && !task.isCreatedByMe
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                : 'text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400'
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
            {task.status === 'anulowane' && <XCircle size={12} className="mr-1" />}
            {task.status}
          </span>
          <span className={clsx("badge", getPriorityColor(task.priority))}>
            {task.priority}
          </span>
        </div>

        {/* Data termin */}
        {task.dueDate && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Calendar size={14} className="mr-2" />
            <span className={clsx(isOverdue && "text-red-600 dark:text-red-400 font-medium")}>
              Termin: {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: pl })}
              {isOverdue && " (przekroczony)"}
            </span>
            {daysUntilDue !== null && !isOverdue && (
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-500/50">
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
            <Tag size={14} className="text-gray-400 dark:text-gray-500 mr-1" />
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-[#212121] dark:text-gray-300 rounded border border-gray-200 dark:border-[#404040]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Informacje o przypisaniu */}
        {(() => {
          // Konwersja assignedTo na tablicę jeśli nie jest
          const assignedUsers = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
          
          return assignedUsers.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              {/* Sekcja "Przypisane przez:" - pokazuje osobę która utworzyła zadanie */}
              {!task.isCreatedByMe && (
                <div>
                  <div className="flex items-center mb-1">
                    <UserIcon size={14} className="mr-2 flex-shrink-0" />
                    <span className="text-xs">Przypisane przez:</span>
                  </div>
                  <div className="ml-6 flex items-center space-x-2">
                    <div className="relative group">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-500/50 overflow-hidden">
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
                          size={16} 
                          className="text-blue-600 dark:text-blue-300"
                          style={{ display: getUserAvatar(task.clerkUserId) ? 'none' : 'flex' }}
                        />
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {getUserName(task.clerkUserId)}
                      </div>
                    </div>
                    <span className="font-medium text-blue-600 dark:text-blue-300 break-words text-xs">
                      {getUserName(task.clerkUserId)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Sekcja "Przypisane do:" - pokazuje osoby do których zadanie jest przypisane */}
              <div>
                <div className="flex items-center mb-1">
                  <UserIcon size={14} className="mr-2 flex-shrink-0" />
                  <span className="text-xs">Przypisane do:</span>
                </div>
                <div className="ml-6 flex flex-wrap gap-2">
                  {assignedUsers.map((userId, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="relative group">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-500/50 overflow-hidden">
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
                            size={16} 
                            className="text-blue-600 dark:text-blue-300"
                            style={{ display: getUserAvatar(userId) ? 'none' : 'flex' }}
                          />
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {getUserName(userId)}
                        </div>
                      </div>
                      <span className="font-medium text-blue-600 dark:text-blue-300 break-words text-xs">
                        {getUserName(userId)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Notatka od przypisanego użytkownika */}
        {(() => {
          // Debug log
          console.log('=== TASK CARD DEBUG ===');
          console.log('Task title:', task.title);
          console.log('task.assignedUserNote:', task.assignedUserNote);
          console.log('task.assignedUserNoteAuthor:', task.assignedUserNoteAuthor);
          return null;
        })()}
        {task.assignedUserNote && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-start mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Notatka od {getUserName(task.assignedUserNoteAuthor || '')}:
              </span>
            </div>
            <div className="ml-0 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-500/50">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {task.assignedUserNote}
              </p>
            </div>
          </div>
        )}

        {/* Zdjęcia */}
        {task.images && task.images.length > 0 && (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <ImageIcon size={14} className="mr-2" />
              <span>Zdjęcia ({task.images.length})</span>
            </div>
            <div className="grid grid-cols-3 gap-2 cursor-default">
              {task.images.slice(0, 3).map((image, index) => {
                const hasError = imageErrors.has(index);
                const retryCount = imageRetries.get(index) || 0;
                
                return (
                  <div key={index} className="relative w-full h-16">
                    {hasError ? (
                      <div 
                        className="w-full h-16 bg-gray-100 dark:bg-[#212121] rounded border border-gray-200 dark:border-[#404040] flex flex-col items-center justify-center text-xs text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                        onClick={() => retryImage(index)}
                        title="Kliknij aby spróbować ponownie"
                      >
                        <div className="text-center">
                          <div className="text-red-500 mb-1">⚠️</div>
                          <div className="text-xs">Błąd ładowania</div>
                          <div className="text-xs opacity-75">Kliknij aby spróbować</div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={filesApi.getImageUrl(image)}
                        alt={`Zdjęcie ${index + 1}`}
                        className="w-full h-16 object-cover rounded border border-gray-200 dark:border-white cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(index)}
                        onError={() => handleImageError(index)}
                        onLoad={() => {
                          // Clear any previous errors when image loads successfully
                          setImageErrors(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(index);
                            return newSet;
                          });
                        }}
                      />
                    )}
                    {retryCount > 0 && !hasError && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">
                        {retryCount}
                      </div>
                    )}
                  </div>
                );
              })}
              {task.images.length > 3 && (
                <div 
                  className="w-full h-16 bg-gray-100 dark:bg-[#212121] rounded border border-gray-200 dark:border-[#404040] flex items-center justify-center text-xs text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => handleImageClick(0)}
                >
                  +{task.images.length - 3} więcej
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data utworzenia */}
        <div className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
          Utworzono: {new Date(task.createdAt).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}
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










