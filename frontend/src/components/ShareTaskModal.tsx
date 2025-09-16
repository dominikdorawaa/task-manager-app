import React, { useState } from 'react';
import { Task } from '../types';
import { X, Share2, Users, Check } from 'lucide-react';

interface ShareTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onShare: (userIds: string[], message?: string) => void;
  availableUsers: { id: string; name: string }[];
  isLoading?: boolean;
}

const ShareTaskModal: React.FC<ShareTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onShare,
  availableUsers,
  isLoading = false
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !task) return null;

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    user.id !== task.clerkUserId // Nie można udostępnić zadania samemu sobie
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = () => {
    if (selectedUsers.length > 0) {
      onShare(selectedUsers, message.trim() || undefined);
      setSelectedUsers([]);
      setMessage('');
      setSearchTerm('');
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setMessage('');
    setSearchTerm('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#212121] rounded-lg shadow-xl max-w-md w-full border dark:border-[#404040]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#404040]">
          <div className="flex items-center gap-3">
            <Share2 className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Udostępnij zadanie
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Task info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-blue-800 dark:text-blue-400 text-sm line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* User search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Wyszukaj użytkowników
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Wpisz nazwę użytkownika..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* User list */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Wybierz użytkowników ({selectedUsers.length})
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-[#404040] rounded-lg">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Nie znaleziono użytkowników' : 'Brak dostępnych użytkowników'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer border-b border-gray-100 dark:border-[#404040] last:border-b-0 ${
                      selectedUsers.includes(user.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedUsers.includes(user.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedUsers.includes(user.id) && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-gray-900 dark:text-white">{user.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Wiadomość (opcjonalnie)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Dodaj wiadomość do udostępnienia..."
              rows={3}
              className="input resize-none"
              maxLength={200}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {message.length}/200 znaków
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-[#404040]">
          <button
            onClick={handleClose}
            className="btn btn-secondary flex-1"
            disabled={isLoading}
          >
            Anuluj
          </button>
          <button
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || isLoading}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Udostępnianie...
              </>
            ) : (
              <>
                <Share2 size={16} />
                Udostępnij ({selectedUsers.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareTaskModal;
