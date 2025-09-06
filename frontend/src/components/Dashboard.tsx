import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth, useUser } from '@clerk/clerk-react';
import { tasksApi, setClerkToken } from '../services/api';
import { Task, CreateTaskData, UpdateTaskData, BackendTaskData } from '../types';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import { Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [taskCategory, setTaskCategory] = useState<'all' | 'my' | 'assigned' | 'assigned-to-users'>('all');
  const [assignedByFilter, setAssignedByFilter] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [copyAnimation, setCopyAnimation] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<{id: string, name: string}[]>([]);
  const queryClient = useQueryClient();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // Funkcja do pobierania nazwy użytkownika po ID
  const getUserName = (userId: string): string => {
    if (userId === user?.id) {
      return user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Ty';
    }
    
    // Sprawdź czy ID zawiera nazwę w nawiasie (np. "user_123 (Jan Kowalski)")
    const match = userId.match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
      return match[2]; // Zwróć nazwę z nawiasu
    }
    
    // Sprawdź czy to email
    if (userId.includes('@')) {
      return userId;
    }
    
    return userNames[userId] || userId;
  };

  // Funkcja do pobierania pełnej informacji o użytkowniku (ID + nazwa/email)
  const getUserDisplayInfo = (userId: string): { id: string, name: string } => {
    if (userId === user?.id) {
      const name = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Ty';
      return { id: userId, name };
    }
    
    // Sprawdź czy to email
    if (userId.includes('@')) {
      return { id: userId, name: userId };
    }
    
    // Dla czystego ID, spróbuj znaleźć nazwę w userNames
    const name = userNames[userId];
    if (name && name !== userId) {
      return { id: userId, name };
    } else {
      // Jeśli nie ma nazwy, pokaż tylko ID
      return { id: userId, name: userId };
    }
  };

  // Funkcja do aktualizacji listy użytkowników, którzy przypisali mi zadania
  const updateAssignedUsers = (tasks: Task[]) => {
    const uniqueUsers = new Map<string, string>();
    
    tasks.forEach(task => {
      // Zbierz użytkowników, którzy przypisali mi zadania (nie tych, którym ja przypisałem)
      if (task.isAssignedToMe && task.clerkUserId !== user?.id) {
        const userName = getUserName(task.clerkUserId);
        uniqueUsers.set(task.clerkUserId, userName);
      }
    });
    
    const usersArray = Array.from(uniqueUsers.entries()).map(([id, name]) => ({ id, name }));
    setAssignedUsers(usersArray);
  };

  // Funkcja do usuwania użytkownika z listy przypisanych
  const removeAssignedUser = (userId: string) => {
    setAssignedUsers(prev => prev.filter(user => user.id !== userId));
  };

  // Funkcja do resetowania filtrów
  const resetFilters = () => {
    setTaskCategory('all');
    setAssignedByFilter(null);
  };

  // Ustawianie tokenu Clerk dla API
  useEffect(() => {
    const updateToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          setClerkToken(token);
        } catch (error) {
          console.error('Error getting Clerk token:', error);
          setClerkToken(null);
        }
      } else {
        setClerkToken(null);
      }
    };

    updateToken();
  }, [isSignedIn, getToken]);


  // Pobieranie zadań
  // Mapowanie enumów z backendu na frontend
  const mapTaskFromBackend = (task: any, currentUser?: any): Task => {
    const statusMap: Record<string, string> = {
      'DO_ZROBIENIA': 'do zrobienia',
      'W_TRAKCIE': 'w trakcie',
      'ZAKONCZONE': 'zakończone',
      'ANULOWANE': 'anulowane'
    };

    const priorityMap: Record<string, string> = {
      'NISKI': 'niski',
      'SREDNI': 'średni',
      'WYSOKI': 'wysoki',
      'KRYTYCZNY': 'krytyczny'
    };

    const currentUserId = currentUser?.id || user?.id;
    const currentUserEmail = currentUser?.primaryEmailAddress?.emailAddress || user?.primaryEmailAddress?.emailAddress;
    const currentUserName = currentUser?.firstName || currentUser?.username || currentUser?.fullName || user?.firstName || user?.username || user?.fullName;

    // Jeśli dane użytkownika nie są dostępne, zwróć zadanie bez kategoryzacji
    if (!currentUserId && !currentUserEmail && !currentUserName) {
      console.log('User data not available, returning task without categorization');
      return {
        ...task,
        status: statusMap[task.status] || 'do zrobienia',
        priority: priorityMap[task.priority] || 'średni',
        images: task.images || [],
        isAssignedToMe: false,
        isCreatedByMe: false,
        clerkUserId: task.clerkUserId
      };
    }

    // Debug logi można włączyć w razie potrzeby
    // console.log('=== MAP TASK FROM BACKEND DEBUG ===');
    // console.log('Original task:', task);
    // console.log('Current user ID:', currentUserId);
    // console.log('Task assignedTo:', task.assignedTo);
    // console.log('Task clerkUserId:', task.clerkUserId);
    const isCreatedByMe = currentUserId ? task.clerkUserId === currentUserId : false;
    
    // Sprawdź czy zadanie jest przypisane do mnie (uwzględniając różne formaty ID)
    let isAssignedToMe = false;
    if (task.assignedTo && (currentUserId || currentUserEmail || currentUserName)) {
      // Sprawdź dokładne dopasowanie (ID, email, nazwa)
      if (task.assignedTo === currentUserId || task.assignedTo === currentUserEmail || task.assignedTo === currentUserName) {
        isAssignedToMe = true;
      }
    }
    
    const mappedTask = {
      ...task,
      status: statusMap[task.status] || 'do zrobienia',
      priority: priorityMap[task.priority] || 'średni',
      images: task.images || [],
      assignedTo: task.assignedTo,
      isAssignedToMe: isAssignedToMe,
      isCreatedByMe: isCreatedByMe
    };

    return mappedTask;
  };

  // Filtrowanie zadań według kategorii
  const getFilteredTasks = () => {
    let filteredTasks = tasks;
    
    // Debug logi można włączyć w razie potrzeby
    // console.log('=== FILTER TASKS DEBUG ===');
    // console.log('Current category:', taskCategory);
    // console.log('Total tasks:', tasks.length);
    
    // Filtrowanie według głównej kategorii
    switch (taskCategory) {
      case 'my':
        filteredTasks = tasks.filter(task => task.isCreatedByMe);
        break;
      case 'assigned':
        filteredTasks = tasks.filter(task => task.isAssignedToMe);
        // Jeśli jest aktywny filtr "przypisane przez", dodatkowo filtruj
        if (assignedByFilter) {
          filteredTasks = filteredTasks.filter(task => task.clerkUserId === assignedByFilter);
        }
        break;
      case 'assigned-to-users':
        // Zadania które ja utworzyłem i przypisałem do innych
        filteredTasks = tasks.filter(task => {
          if (!task.isCreatedByMe || !task.assignedTo) return false;
          
          // Sprawdź czy nie jest przypisane do mnie
          return task.assignedTo !== user?.id && task.assignedTo !== user?.primaryEmailAddress?.emailAddress;
        });
        break;
      default:
        filteredTasks = tasks;
    }
    
    return filteredTasks;
  };

  // Pobieranie zadań - tylko gdy użytkownik jest zalogowany
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery<Task[], Error>(
    ['tasks', user?.id],
    () => {
      // Debug logi można włączyć w razie potrzeby
      // console.log('=== FETCHING TASKS ===');
      // console.log('User ID:', user?.id);
      
      return tasksApi.getAll({ 
        userEmail: user?.primaryEmailAddress?.emailAddress 
      }).then(res => {
        // console.log('Tasks API response:', res.data);
        return res.data.map(task => mapTaskFromBackend(task, user));
      });
    },
    {
      refetchOnWindowFocus: false,
      enabled: isSignedIn && !!user && !!user.id, // Pobieranie tylko gdy użytkownik jest zalogowany i mamy pełne dane użytkownika
      staleTime: 0, // Zawsze pobieraj świeże dane
    }
  );

  // Aktualizacja listy przypisanych użytkowników gdy zmieniają się zadania
  useEffect(() => {
    if (tasks.length > 0) {
      updateAssignedUsers(tasks);
    }
  }, [tasks, userNames]);

  // Usunięto problematyczny useEffect, który powodował nieskończoną pętlę

  // Mutacje
  const createTaskMutation = useMutation(
    (data: BackendTaskData) => tasksApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks', user?.id]);
        setShowTaskForm(false);
      },
    }
  );

  const updateTaskMutation = useMutation(
    ({ id, data }: { id: string; data: BackendTaskData }) => tasksApi.update(id, data),
    {
      onSuccess: (response) => {
        console.log('=== UPDATE TASK SUCCESS ===', response);
        queryClient.invalidateQueries(['tasks', user?.id]);
        setShowTaskForm(false);
        setEditingTask(undefined);
      },
      onError: (error) => {
        console.error('=== UPDATE TASK ERROR ===', error);
      }
    }
  );

  const deleteTaskMutation = useMutation(
    (id: string) => tasksApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks', user?.id]);
      },
    }
  );

  const mapTaskDataForBackend = (data: CreateTaskData): BackendTaskData => {
    const statusMap: Record<string, 'DO_ZROBIENIA' | 'W_TRAKCIE' | 'ZAKONCZONE' | 'ANULOWANE'> = {
      'do zrobienia': 'DO_ZROBIENIA',
      'w trakcie': 'W_TRAKCIE',
      'zakończone': 'ZAKONCZONE',
      'anulowane': 'ANULOWANE'
    };

    const priorityMap: Record<string, 'NISKI' | 'SREDNI' | 'WYSOKI' | 'KRYTYCZNY'> = {
      'niski': 'NISKI',
      'średni': 'SREDNI',
      'wysoki': 'WYSOKI',
      'krytyczny': 'KRYTYCZNY'
    };

    const result = {
      ...data,
      status: statusMap[data.status || 'do zrobienia'] || 'DO_ZROBIENIA',
      priority: priorityMap[data.priority || 'średni'] || 'SREDNI'
    };
    console.log('=== MAP TASK DATA DEBUG ===');
    console.log('Input data.status:', data.status);
    console.log('Input data.priority:', data.priority);
    console.log('Mapped result.status:', result.status);
    console.log('Mapped result.priority:', result.priority);
    return result;
  };

  const handleCreateTask = (data: CreateTaskData) => {
    const mappedData = mapTaskDataForBackend(data);
    createTaskMutation.mutate(mappedData);
  };

  const handleUpdateTask = (data: CreateTaskData) => {
    if (editingTask) {
      console.log('=== UPDATE TASK DEBUG (Frontend) ===');
      console.log('Original data from form:', data);
      const mappedData = mapTaskDataForBackend(data);
      console.log('Mapped data for backend:', mappedData);
      console.log('Editing task ID:', editingTask._id);
      updateTaskMutation.mutate({ id: editingTask._id, data: mappedData });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    const task = tasks.find(t => t._id === taskId);
    if (task) {
      const statusMap: Record<string, 'DO_ZROBIENIA' | 'W_TRAKCIE' | 'ZAKONCZONE' | 'ANULOWANE'> = {
        'do zrobienia': 'DO_ZROBIENIA',
        'w trakcie': 'W_TRAKCIE',
        'zakończone': 'ZAKONCZONE',
        'anulowane': 'ANULOWANE'
      };
      
      const mappedStatus = statusMap[status] || 'DO_ZROBIENIA';
      updateTaskMutation.mutate({
        id: taskId,
        data: { status: mappedStatus } as BackendTaskData
      });
    }
  };

  const openNewTaskForm = () => {
    setEditingTask(undefined);
    setShowTaskForm(true);
  };

  const closeTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
  };


  // Jeśli użytkownik nie jest zalogowany
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Zarządzanie Zadaniami</h1>
          <p className="text-gray-600 mb-8">
            Zaloguj się, aby zobaczyć i zarządzać swoimi zadaniami
          </p>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">
              Użyj przycisku "Zaloguj się" w górnym prawym rogu
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Nagłówek */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Zarządzanie Zadaniami</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Organizuj swoje zadania w prosty i efektywny sposób</p>
            
            {/* ID użytkownika */}
            {user && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Twoje ID:</span>
                    <code className="bg-blue-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                      {user.id} ({user.fullName || user.primaryEmailAddress?.emailAddress || 'Brak nazwy'})
                    </code>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.id);
                      setCopyAnimation(true);
                      setTimeout(() => setCopyAnimation(false), 1000);
                    }}
                    className={`text-sm font-medium transition-all duration-300 ${
                      copyAnimation 
                        ? 'text-green-600 scale-110' 
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                    title="Kopiuj ID"
                  >
                    {copyAnimation ? 'Skopiowano!' : 'Kopiuj'}
                  </button>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  💡 Użyj tego ID do przypisywania zadań innym użytkownikom
                </div>
              </div>
            )}
          </div>
          <button
            onClick={openNewTaskForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center gap-2"
          >
            <Plus size={20} />
            Nowe zadanie
          </button>
        </div>

        {/* Błędy */}
        {tasksError && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <div className="text-red-800">
              <h3 className="font-semibold">Błąd pobierania zadań:</h3>
              <p className="text-sm mt-1">
                {tasksError instanceof Error
                  ? tasksError.message
                  : (tasksError as any)?.response?.data?.message || 'Nieznany błąd'}
              </p>
            </div>
          </div>
        )}

        {/* Przyciski kategorii */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setTaskCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              taskCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Wszystkie ({tasks.length})
          </button>
          <button
            onClick={() => setTaskCategory('my')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              taskCategory === 'my'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Utworzone przeze mnie ({tasks.filter(t => t.isCreatedByMe).length})
          </button>
          <button
            onClick={() => setTaskCategory('assigned')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              taskCategory === 'assigned'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Przypisane do mnie ({tasks.filter(t => t.isAssignedToMe).length})
          </button>
          <button
            onClick={() => setTaskCategory('assigned-to-users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              taskCategory === 'assigned-to-users'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Przypisane do użytkowników ({tasks.filter(t => {
              if (!t.isCreatedByMe || !t.assignedTo) return false;
              const cleanAssignedTo = t.assignedTo.replace(/\s*\(.+?\)$/, '');
              return cleanAssignedTo !== user?.id && t.assignedTo !== user?.primaryEmailAddress?.emailAddress;
            }).length})
          </button>
        </div>

        {/* Podkategorie dla "Przypisane do mnie" */}
        {taskCategory === 'assigned' && assignedUsers.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Przypisane przez:</h3>
              {assignedByFilter && (
                <button
                  onClick={() => setAssignedByFilter(null)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Pokaż wszystkie
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAssignedByFilter(null)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  !assignedByFilter
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Wszystkie
                <span className="ml-1 text-xs opacity-75">
                  ({tasks.filter(t => t.isAssignedToMe).length})
                </span>
              </button>
              {assignedUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setAssignedByFilter(assignedByFilter === user.id ? null : user.id)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    assignedByFilter === user.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {user.name}
                  <span className="ml-1 text-xs opacity-75">
                    ({tasks.filter(t => t.isAssignedToMe && t.clerkUserId === user.id).length})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista zadań */}
        <TaskList
          tasks={getFilteredTasks()}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
          isLoading={tasksLoading}
          getUserName={getUserName}
        />

        {/* Modal formularza */}
        {showTaskForm && (
          <>
            {console.log('=== DASHBOARD RENDER DEBUG ===', { editingTask: editingTask?.title, isEditing: !!editingTask })}
            <TaskForm
              task={editingTask}
              onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
              onCancel={closeTaskForm}
              isLoading={createTaskMutation.isLoading || updateTaskMutation.isLoading}
              assignedUsers={assignedUsers}
              onRemoveAssignedUser={removeAssignedUser}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

