import React from 'react';
import { Task } from '../types';
import { Share2, Users, CheckSquare, X } from 'lucide-react';

interface ShareOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onShareSingle: () => void;
  onSelectMore: () => void;
  hasExternalUsers: boolean;
}

const ShareOptionsModal: React.FC<ShareOptionsModalProps> = ({
  isOpen,
  onClose,
  task,
  onShareSingle,
  onSelectMore,
  hasExternalUsers
}) => {
  if (!isOpen || !task) return null;

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
            onClick={onClose}
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

          {/* Options */}
          <div className="space-y-3">
            {hasExternalUsers ? (
              <>
                <button
                  onClick={onShareSingle}
                  className="w-full p-4 border border-gray-200 dark:border-[#404040] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Share2 className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Udostępnij to zadanie
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Wybierz użytkowników i udostępnij to konkretne zadanie
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={onSelectMore}
                  className="w-full p-4 border border-gray-200 dark:border-[#404040] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckSquare className="text-green-600 dark:text-green-400" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Zaznacz więcej zadań
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Dodaj to zadanie do zaznaczonych i wybierz więcej do udostępnienia
                      </p>
                    </div>
                  </div>
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <Users className="mx-auto text-gray-400 dark:text-gray-500 mb-3" size={48} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Brak użytkowników zewnętrznych
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Najpierw dodaj użytkowników zewnętrznych, aby móc udostępniać zadania.
                </p>
                <button
                  onClick={onSelectMore}
                  className="w-full p-4 border border-gray-200 dark:border-[#404040] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex items-center justify-center gap-3">
                    <CheckSquare className="text-green-600 dark:text-green-400" size={20} />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Zaznacz więcej zadań
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-[#404040]">
          <button
            onClick={onClose}
            className="w-full btn btn-secondary"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareOptionsModal;
