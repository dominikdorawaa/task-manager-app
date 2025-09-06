import React, { useState } from 'react';
import { Task } from '../types';
import TaskCard from './TaskCard';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  isLoading?: boolean;
  getUserName: (userId: string) => string;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
  getUserName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'priority' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtrowanie zadań
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sortowanie zadań
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];

    // Specjalne sortowanie dla priorytetu
    if (sortBy === 'priority') {
      const priorityOrder = { 'krytyczny': 4, 'wysoki': 3, 'średni': 2, 'niski': 1 };
      aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
      bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
    }

    // Specjalne sortowanie dla dat
    if (sortBy === 'dueDate' || sortBy === 'createdAt') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">Brak zadań</div>
        <p className="text-gray-500">Utwórz swoje pierwsze zadanie, aby rozpocząć!</p>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">Nie znaleziono zadań</div>
        <p className="text-gray-500">Spróbuj zmienić filtry lub wyszukiwanie.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtry i wyszukiwanie */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Wyszukiwanie */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Wyszukaj zadania..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Filtr statusu */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">Wszystkie statusy</option>
            <option value="do zrobienia">Do zrobienia</option>
            <option value="w trakcie">W trakcie</option>
            <option value="zakończone">Zakończone</option>
            <option value="anulowane">Anulowane</option>
          </select>

          {/* Filtr priorytetu */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input"
          >
            <option value="">Wszystkie priorytety</option>
            <option value="niski">Niski</option>
            <option value="średni">Średni</option>
            <option value="wysoki">Wysoki</option>
            <option value="krytyczny">Krytyczny</option>
          </select>

          {/* Sortowanie */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input flex-1"
            >
              <option value="createdAt">Data utworzenia</option>
              <option value="dueDate">Data termin</option>
              <option value="priority">Priorytet</option>
              <option value="title">Tytuł</option>
            </select>
            <button
              onClick={toggleSortOrder}
              className="btn btn-secondary px-3"
              title={sortOrder === 'asc' ? 'Sortuj malejąco' : 'Sortuj rosnąco'}
            >
              {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </button>
          </div>
        </div>

        {/* Liczba wyników */}
        <div className="mt-4 text-sm text-gray-500">
          Znaleziono {filteredTasks.length} z {tasks.length} zadań
        </div>
      </div>

      {/* Lista zadań */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            getUserName={getUserName}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;










