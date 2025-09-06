import React, { useState, useEffect } from 'react';
import { ChevronDown, User as UserIcon, X } from 'lucide-react';

interface UserSelectorProps {
  value?: string;
  onChange: (userId: string | undefined) => void;
  placeholder?: string;
  className?: string;
  assignedUsers?: {id: string, name: string}[];
  onRemoveAssignedUser?: (userId: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  value,
  onChange,
  placeholder = "Wybierz użytkownika...",
  className = "",
  assignedUsers = [],
  onRemoveAssignedUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(true); // Domyślnie tryb wpisywania

  // Pobieranie listy użytkowników z Clerk
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Brak listy użytkowników - tylko możliwość wpisania ID
        setAllUsers([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filtrowanie użytkowników na podstawie wyszukiwania
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUsers(filtered);
    }
  }, [searchTerm, allUsers]);

  const selectedUser = users.find(user => user.id === value);
  const isCustomValue = value && !selectedUser; // Jeśli mamy wartość ale nie ma jej na liście, to jest custom

  const handleSelect = (userId: string | undefined) => {
    onChange(userId);
    setIsOpen(false);
    setIsCustomMode(false);
    setCustomInput('');
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      // Sprawdź czy to email czy ID
      const isEmail = customInput.includes('@');
      const customUserId = isEmail ? customInput : customInput;
      
      onChange(customUserId);
      setIsOpen(false);
      setIsCustomMode(false);
      setCustomInput('');
    }
  };

  const handleCustomModeToggle = () => {
    setIsCustomMode(!isCustomMode);
    setSearchTerm('');
    setCustomInput('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
      >
        <div className="flex items-center">
          {selectedUser ? (
            <>
              <UserIcon size={16} className="mr-2 text-gray-400" />
              <span className="text-gray-900">{selectedUser.name}</span>
              <span className="ml-2 text-sm text-gray-500">({selectedUser.email})</span>
            </>
          ) : isCustomValue ? (
            <>
              <UserIcon size={16} className="mr-2 text-gray-400" />
              <span className="text-gray-900">{value}</span>
              <span className="ml-2 text-sm text-blue-500">
                {value?.includes('@') ? '(email)' : '(ID)'}
              </span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Ładowanie użytkowników...
              </div>
            ) : (
              <>
                {/* Pole wpisywania ID */}
                <div className="p-2 border-b border-gray-200">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Wpisz ID użytkownika (np. user_2abc3def4)..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      💡 <strong>Wskazówka:</strong> ID użytkownika znajdziesz w sekcji "Twoje ID" na górze strony. Możesz dodać nazwę w nawiasie dla łatwiejszej identyfikacji.
                    </div>
                    <button
                      type="button"
                      onClick={handleCustomSubmit}
                      disabled={!customInput.trim()}
                      className="w-full px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Przypisz
                    </button>
                  </div>
                </div>
                
                {/* Opcja "Brak przypisania" */}
                <button
                  type="button"
                  onClick={() => handleSelect(undefined)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center ${
                    !value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <UserIcon size={16} className="mr-2 text-gray-400" />
                  <span>Brak przypisania</span>
                </button>

                {/* Wcześniej przypisani użytkownicy */}
                {assignedUsers.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 border-t border-gray-200">
                      Wcześniej przypisani:
                    </div>
                    {assignedUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center px-3 py-2 hover:bg-gray-100 ${
                          value === user.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(user.id)}
                          className="flex items-center flex-1 text-left"
                        >
                          <UserIcon size={16} className="mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.id}</div>
                          </div>
                        </button>
                        {onRemoveAssignedUser && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveAssignedUser(user.id);
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Usuń z listy"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserSelector;
