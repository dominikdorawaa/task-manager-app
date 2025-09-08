import React, { useState } from 'react';
import { ExternalUser, CreateExternalUserData, UpdateExternalUserData } from '../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  User, 
  X,
  Save,
  Copy
} from 'lucide-react';

interface ExternalUserManagerProps {
  isOpen: boolean;
  onClose: () => void;
  users: ExternalUser[];
  onAddUser: (userData: CreateExternalUserData) => void;
  onUpdateUser: (id: string, userData: UpdateExternalUserData) => void;
  onDeleteUser: (id: string) => void;
  isLoading?: boolean;
}

const ExternalUserManager: React.FC<ExternalUserManagerProps> = ({
  isOpen,
  onClose,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ExternalUser | null>(null);
  const [formData, setFormData] = useState<CreateExternalUserData>({
    id: '',
    name: ''
  });

  if (!isOpen) return null;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddUser = () => {
    if (formData.id && formData.name) {
      onAddUser(formData);
      setFormData({
        id: '',
        name: ''
      });
      setShowAddForm(false);
    }
  };

  const handleUpdateUser = () => {
    if (editingUser && formData.id && formData.name) {
      onUpdateUser(editingUser.id, formData);
      setEditingUser(null);
      setFormData({
        id: '',
        name: ''
      });
    }
  };

  const handleEditUser = (user: ExternalUser) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      name: user.name
    });
    setShowAddForm(false);
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      // Można dodać toast notification tutaj
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setShowAddForm(false);
    setFormData({
      id: '',
      name: ''
    });
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#212121] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] border dark:border-[#404040] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#404040]">
          <div className="flex items-center gap-3">
            <User className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Zarządzanie użytkownikami zewnętrznymi
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-[#404040] space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Szukaj użytkowników..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>


            {/* Add User Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Dodaj użytkownika
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingUser) && (
          <div className="p-6 border-b border-gray-200 dark:border-[#404040] bg-gray-50 dark:bg-[#1a1a1a]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingUser ? 'Edytuj użytkownika' : 'Dodaj nowego użytkownika'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Imię/Nickname *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input"
                  placeholder="Jan Kowalski"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID użytkownika *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  className="input"
                  placeholder="user_123456789"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 To ID będzie używane do przypisywania zadań temu użytkownikowi
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                className="btn btn-primary flex items-center gap-2"
                disabled={!formData.name || !formData.id}
              >
                <Save size={16} />
                {editingUser ? 'Zapisz zmiany' : 'Dodaj użytkownika'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn btn-secondary"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        {!(showAddForm || editingUser) && (
          <div className="flex-1 overflow-y-auto p-6">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nie znaleziono użytkowników' : 'Brak użytkowników zewnętrznych'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    user.isActive 
                      ? 'border-gray-200 dark:border-[#404040] bg-white dark:bg-[#212121]' 
                      : 'border-gray-300 dark:border-[#505050] bg-gray-50 dark:bg-[#1a1a1a] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </h4>
                      {!user.isActive && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 mt-1 inline-block">
                          Nieaktywny
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edytuj"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Usuń"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <span className="truncate">ID: {user.id}</span>
                      <button
                        onClick={() => handleCopyId(user.id)}
                        className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Kopiuj ID"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-[#404040]">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Łącznie: {users.length} użytkowników
            </div>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalUserManager;
