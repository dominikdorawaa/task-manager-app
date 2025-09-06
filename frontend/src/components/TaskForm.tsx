import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Task, CreateTaskData } from '../types';
import { X, Plus } from 'lucide-react';
import ImageUpload from './ImageUpload';
import UserSelector from './UserSelector';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  assignedUsers?: {id: string, name: string}[];
  onRemoveAssignedUser?: (userId: string) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ 
  task, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  assignedUsers = [],
  onRemoveAssignedUser
}) => {
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [images, setImages] = useState<string[]>(task?.images || []);
  const [newTag, setNewTag] = useState('');
  const [assignedTo, setAssignedTo] = useState<string | undefined>(task?.assignedTo);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
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
      setAssignedTo(task.assignedTo);
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
    console.log('=== TASK FORM SUBMIT DEBUG ===');
    console.log('Form data:', data);
    console.log('Tags:', tags);
    console.log('Images:', images);
    const submitData = {
      ...data,
      tags,
      images,
      assignedTo
    };
    console.log('Final submit data:', submitData);
    onSubmit(submitData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {task ? 'Edytuj zadanie' : 'Nowe zadanie'}
          </h2>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Tytuł */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł *
              </label>
              <input
                type="text"
                {...register('title', { required: 'Tytuł jest wymagany' })}
                className="input"
                placeholder="Wprowadź tytuł zadania"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Opis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="input resize-none"
                placeholder="Wprowadź opis zadania (opcjonalnie)"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select {...register('status')} className="input">
                <option value="do zrobienia">Do zrobienia</option>
                <option value="w trakcie">W trakcie</option>
                <option value="zakończone">Zakończone</option>
                <option value="anulowane">Anulowane</option>
              </select>
            </div>

            {/* Priorytet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorytet
              </label>
              <select {...register('priority')} className="input">
                <option value="niski">Niski</option>
                <option value="średni">Średni</option>
                <option value="wysoki">Wysoki</option>
                <option value="krytyczny">Krytyczny</option>
              </select>
            </div>

            {/* Data termin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data termin
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Przypisany użytkownik */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Przypisany użytkownik
              </label>
              <UserSelector
                value={assignedTo}
                onChange={setAssignedTo}
                placeholder="Wybierz użytkownika..."
                className="w-full"
                assignedUsers={assignedUsers}
                onRemoveAssignedUser={onRemoveAssignedUser}
              />
            </div>

            {/* Tagi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tagi
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="input flex-1"
                  placeholder="Dodaj tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="btn btn-secondary px-3"
                  disabled={!newTag.trim()}
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Zdjęcia */}
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />

            {/* Przyciski */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary flex-1"
                disabled={isLoading}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
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









