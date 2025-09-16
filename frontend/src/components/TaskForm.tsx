import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Task, CreateTaskData, ExternalUser } from '../types';
import { X, Plus } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { useUser } from '@clerk/clerk-react';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  externalUsers?: ExternalUser[];
  isAssignedUser?: boolean; // Czy użytkownik może edytować tylko status
}

const TaskForm: React.FC<TaskFormProps> = ({ 
  task, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  externalUsers = [],
  isAssignedUser = false
}) => {
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [images, setImages] = useState<string[]>(task?.images || []);
  const [newTag, setNewTag] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>(task?.assignedTo || []);
  const [assignedUserNote, setAssignedUserNote] = useState<string>(task?.assignedUserNote || '');
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<CreateTaskData>({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'do zrobienia',
      priority: task?.priority || 'średni',
      dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    }
  });

  // Reset formularza gdy zmienia się task
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      });
      setTags(task.tags || []);
      setImages(task.images || []);
      setAssignedTo(task.assignedTo || []);
      setAssignedUserNote(task.assignedUserNote || '');
    }
  }, [task, reset]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFormSubmit = (data: CreateTaskData) => {
    
    const submitData = {
      ...data,
      tags,
      images,
      assignedTo: assignedTo.length > 0 ? assignedTo : [],
      assignedUserNote: assignedUserNote.trim() || undefined,
      assignedUserNoteAuthor: assignedUserNote.trim() ? user?.id : undefined
    };
    
    // Debug log
    console.log('=== TASK FORM SUBMIT DEBUG ===');
    console.log('assignedUserNote:', assignedUserNote);
    console.log('assignedUserNoteAuthor:', user?.id);
    console.log('submitData:', submitData);
    
    onSubmit(submitData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow-xl w-full max-w-sm sm:max-w-lg max-h-[90vh] sm:max-h-[90vh] overflow-y-auto border dark:border-[#404040]">
        <div className="p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
            {isAssignedUser ? 'Zmień status zadania' : (task ? 'Edytuj zadanie' : 'Nowe zadanie')}
          </h2>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 sm:space-y-4">
            {/* Tytuł - tylko dla twórców */}
            {!isAssignedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tytuł *
                </label>
                <input
                  type="text"
                  {...register('title', { 
                    required: 'Tytuł jest wymagany',
                    maxLength: { value: 500, message: 'Tytuł nie może być dłuższy niż 500 znaków' }
                  })}
                  maxLength={500}
                  className="input text-base"
                  placeholder="Wprowadź tytuł zadania"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
            )}

            {/* Opis - tylko dla twórców */}
            {!isAssignedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opis
                </label>
                <textarea
                  {...register('description', {
                    maxLength: { value: 3000, message: 'Opis nie może być dłuższy niż 3000 znaków' }
                  })}
                  maxLength={3000}
                  rows={8}
                  className="input resize-y text-base"
                  placeholder="Wprowadź opis zadania (opcjonalnie)"
                  onChange={(e) => {
                    register('description').onChange(e);
                  }}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <p className="text-red-600 text-sm">{errors.description.message}</p>
                  )}
                  <p className="text-gray-500 text-xs ml-auto">
                    {watch('description')?.length || 0}/3000 znaków
                  </p>
                </div>
              </div>
            )}

            {/* Informacja o zadaniu dla przypisanych użytkowników */}
            {isAssignedUser && task && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-blue-800 dark:text-blue-400 text-sm">{task.description}</p>
                )}
              </div>
            )}

            {/* Status - zawsze widoczny */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select {...register('status')} className="input text-base">
                <option value="do zrobienia">Do zrobienia</option>
                <option value="w trakcie">W trakcie</option>
                <option value="zakończone">Zakończone</option>
                <option value="anulowane">Anulowane</option>
              </select>
            </div>

            {/* Priorytet - tylko dla twórców */}
            {!isAssignedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priorytet
                </label>
                <select {...register('priority')} className="input text-base">
                  <option value="niski">Niski</option>
                  <option value="średni">Średni</option>
                  <option value="wysoki">Wysoki</option>
                  <option value="krytyczny">Krytyczny</option>
                </select>
              </div>
            )}

            {/* Data termin - tylko dla twórców */}
            {!isAssignedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data termin
                </label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="input text-base"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {/* Przypisani użytkownicy - tylko dla twórców */}
            {!isAssignedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Przypisani użytkownicy
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const userId = e.target.value;
                    if (userId && !assignedTo.includes(userId)) {
                      setAssignedTo([...assignedTo, userId]);
                    }
                    e.target.value = "";
                  }}
                  className="input"
                >
                  <option value="">Wybierz użytkownika...</option>
                  {/* Opcja "Ja" */}
                  {user?.id && !assignedTo.includes(user.id) && (
                    <option value={user.id}>
                      Ja ({user.fullName || user.primaryEmailAddress?.emailAddress || 'Ty'})
                    </option>
                  )}
                  {/* Inni użytkownicy */}
                  {externalUsers.filter(user => user.isActive && !assignedTo.includes(user.id)).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.id})
                    </option>
                  ))}
                </select>
                
                {/* Lista przypisanych użytkowników */}
                {assignedTo.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {assignedTo.map((userId) => {
                      const externalUser = externalUsers.find(u => u.id === userId);
                      const isCurrentUser = userId === user?.id;
                      const displayName = isCurrentUser 
                        ? 'Ja' 
                        : externalUser 
                          ? externalUser.name 
                          : userId;
                      
                      return (
                        <span
                          key={userId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm rounded-full border border-blue-200 dark:border-blue-500/50"
                        >
                          {displayName}
                          <button
                            type="button"
                            onClick={() => setAssignedTo(assignedTo.filter(id => id !== userId))}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                
                {externalUsers.filter(user => user.isActive).length === 0 && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/50 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Brak użytkowników do przypisania.</strong>
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                       Aby dodać użytkowników, kliknij przycisk "Użytkownicy" w głównym menu.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Notatka od przypisanego użytkownika */}
            {isAssignedUser && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Twoja notatka/feedback
                </label>
                <textarea
                  value={assignedUserNote}
                  onChange={(e) => setAssignedUserNote(e.target.value)}
                  placeholder="Dodaj notatkę lub feedback do tego zadania..."
                  className="input min-h-[80px] resize-y"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {assignedUserNote.length}/1000 znaków
                </div>
              </div>
            )}

            {/* Tagi - tylko dla twórców */}
            {!isAssignedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tagi
                </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="input flex-1 text-base"
                  placeholder="Dodaj tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="btn btn-secondary px-3 py-2"
                  disabled={!newTag.trim()}
                >
                  <Plus size={18} />
                </button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm rounded-full border border-blue-200 dark:border-blue-500/50"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              </div>
            )}

            {/* Zdjęcia - tylko dla twórców */}
            {!isAssignedUser && (
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
              />
            )}

            {/* Przyciski */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary flex-1 py-3 text-base"
                disabled={isLoading}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1 py-3 text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Zapisywanie...' : (task ? 'Zapisz zmiany' : 'Utwórz zadanie')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;









