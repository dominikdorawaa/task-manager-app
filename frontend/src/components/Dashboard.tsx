import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth, useUser, SignInButton } from '@clerk/clerk-react';
import { tasksApi, externalUsersApi, setClerkToken } from '../services/api';
import { Task, CreateTaskData, UpdateTaskData, BackendTaskData, ExternalUser, CreateExternalUserData, UpdateExternalUserData } from '../types';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import TaskModal from './TaskModal';
import ShareTaskModal from './ShareTaskModal';
import BulkShareModal from './BulkShareModal';
import ExternalUserManager from './ExternalUserManager';
import ShareOptionsModal from './ShareOptionsModal';
import { Plus, Share2, X, Users, Copy, Eye, EyeOff } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskCategory, setTaskCategory] = useState<'all' | 'my' | 'assigned' | 'assigned-to-users' | 'shared'>('all');
  const [assignedByFilter, setAssignedByFilter] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [copyAnimation, setCopyAnimation] = useState(false);
  const [showUserId, setShowUserId] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<{id: string, name: string}[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [selectedTasksForBulkShare, setSelectedTasksForBulkShare] = useState<Set<string>>(new Set());
  const [showBulkShareModal, setShowBulkShareModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [externalUsers, setExternalUsers] = useState<ExternalUser[]>([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
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
      case 'shared':
        // Zadania udostępnione mi przez innych
        filteredTasks = tasks.filter(task => task.isSharedWithMe);
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

  // Query do pobierania użytkowników zewnętrznych
  const { data: externalUsersData = [], isLoading: externalUsersLoading } = useQuery<ExternalUser[], Error>(
    ['externalUsers'],
    () => externalUsersApi.getAll().then(res => res.data),
    {
      enabled: isSignedIn,
      staleTime: 60000, // 1 minuta
    }
  );

  // Aktualizacja external users gdy dane się zmienią
  useEffect(() => {
    setExternalUsers(externalUsersData);
  }, [externalUsersData]);

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
        // Natychmiastowe odświeżenie danych
        queryClient.invalidateQueries(['tasks', user?.id]);
        queryClient.refetchQueries(['tasks', user?.id]);
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

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setViewingTask(null);
  };

  // Funkcje dla systemu udostępniania
  const handleShareTask = (task: Task) => {
    setSharingTask(task);
    setShowShareOptions(true);
  };

  const handleShareSingle = () => {
    setShowShareOptions(false);
    setShowShareModal(true);
  };

  const handleSelectMore = () => {
    if (sharingTask) {
      setShowShareOptions(false);
      setIsSelectionMode(true);
      setSelectedTasksForBulkShare(new Set([sharingTask._id]));
    }
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSharingTask(null);
  };

  const closeShareOptions = () => {
    setShowShareOptions(false);
    setSharingTask(null);
  };

  const closeBulkShareModal = () => {
    setShowBulkShareModal(false);
    setSelectedTasksForBulkShare(new Set());
  };

  const handleTaskSelection = (taskId: string) => {
    setSelectedTasksForBulkShare(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleBulkShare = () => {
    setShowBulkShareModal(true);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedTasksForBulkShare(new Set());
  };

  // Funkcja udostępniania zadania
  const handleShare = async (userIds: string[], message?: string) => {
    if (!sharingTask) return;
    
    try {
      console.log('Udostępnianie zadania:', {
        taskId: sharingTask._id,
        userIds,
        message
      });
      
      const response = await tasksApi.share(sharingTask._id, userIds, message);
      
      if (response.data.success) {
        // Odśwież listę zadań
        queryClient.invalidateQueries(['tasks']);
        
        alert(`Zadanie "${sharingTask.title}" zostało udostępnione ${userIds.length} użytkownikom!`);
        closeShareModal();
      } else {
        alert(`Błąd: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Błąd udostępniania:', error);
      alert('Wystąpił błąd podczas udostępniania zadania.');
    }
  };

  const handleBulkShareAction = async (userIds: string[], message?: string) => {
    try {
      console.log('Masowe udostępnianie zadań:', {
        taskIds: Array.from(selectedTasksForBulkShare),
        userIds,
        message
      });
      
      // Udostępnij każde zadanie osobno
      const promises = Array.from(selectedTasksForBulkShare).map(taskId => 
        tasksApi.share(taskId, userIds, message)
      );
      
      const results = await Promise.allSettled(promises);
      
      let successCount = 0;
      let errorCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Błąd udostępniania zadania ${Array.from(selectedTasksForBulkShare)[index]}:`, result);
        }
      });
      
      if (successCount > 0) {
        // Odśwież listę zadań
        queryClient.invalidateQueries(['tasks']);
        alert(`${successCount} zadań zostało udostępnione ${userIds.length} użytkownikom!`);
      }
      
      if (errorCount > 0) {
        alert(`${errorCount} zadań nie udało się udostępnić.`);
      }
      
      closeBulkShareModal();
      exitSelectionMode();
    } catch (error) {
      console.error('Błąd masowego udostępniania:', error);
      alert('Wystąpił błąd podczas masowego udostępniania zadań.');
    }
  };

  // Funkcje do zarządzania użytkownikami zewnętrznymi
  const handleAddExternalUser = async (userData: CreateExternalUserData) => {
    try {
      console.log('Dodawanie użytkownika zewnętrznego:', userData);
      
      const response = await externalUsersApi.create(userData);
      
      if (response.data.success) {
        // Odśwież listę użytkowników
        queryClient.invalidateQueries(['externalUsers']);
        alert(`Użytkownik ${userData.name} został dodany!`);
      } else {
        alert(`Błąd: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Błąd dodawania użytkownika:', error);
      alert('Wystąpił błąd podczas dodawania użytkownika.');
    }
  };

  const handleUpdateExternalUser = async (id: string, userData: UpdateExternalUserData) => {
    try {
      console.log('Aktualizacja użytkownika zewnętrznego:', { id, userData });
      
      const response = await externalUsersApi.update(id, userData);
      
      if (response.data.success) {
        // Odśwież listę użytkowników
        queryClient.invalidateQueries(['externalUsers']);
        alert('Użytkownik został zaktualizowany!');
      } else {
        alert(`Błąd: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Błąd aktualizacji użytkownika:', error);
      alert('Wystąpił błąd podczas aktualizacji użytkownika.');
    }
  };

  const handleDeleteExternalUser = async (id: string) => {
    const user = externalUsers.find(u => u.id === id);
    if (!user) return;
    
    const confirmed = window.confirm(`Czy na pewno chcesz usunąć użytkownika "${user.name}"?`);
    if (!confirmed) return;
    
    try {
      console.log('Usuwanie użytkownika zewnętrznego:', id);
      
      const response = await externalUsersApi.delete(id);
      
      if (response.data.success) {
        // Odśwież listę użytkowników
        queryClient.invalidateQueries(['externalUsers']);
        alert(`Użytkownik ${user.name} został usunięty!`);
      } else {
        alert(`Błąd: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Błąd usuwania użytkownika:', error);
      alert('Wystąpił błąd podczas usuwania użytkownika.');
    }
  };



  // Jeśli użytkownik nie jest zalogowany
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="max-w-md w-full text-center px-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Taskyy</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Zaloguj się, aby zobaczyć i zarządzać swoimi zadaniami
          </p>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-white">
            <SignInButton mode="modal">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors border border-blue-500">
                Zaloguj się
              </button>
            </SignInButton>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Lub zarejestruj się, jeśli nie masz jeszcze konta
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212121]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


{/* Nagłówek */}
<div className="mb-8">
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
    <div className="flex-1">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Taskyy</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">Organizuj swoje zadania w prosty i efektywny sposób</p>
      
      {/* ID użytkownika */}
      {user && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-[#181818] border border-blue-200 dark:border-[#404040] rounded-lg max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-blue-900 dark:text-blue-400">Twoje ID:</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">
              {showUserId ? user.id : '••••••••••'}
            </span>
            <button
              onClick={() => setShowUserId(!showUserId)}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title={showUserId ? "Ukryj ID" : "Pokaż ID"}
            >
              {showUserId ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.id);
                setCopyAnimation(true);
                setTimeout(() => setCopyAnimation(false), 1000);
              }}
              className={`p-1 transition-all duration-300 ${
                copyAnimation 
                  ? 'text-green-600 scale-110' 
                  : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
              title="Kopiuj ID"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            💡 Przekaż to ID osobie, która chce Ci przypisać zadanie
          </div>
        </div>
      )}
    </div>
    
    {/* Przyciski akcji */}
    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
      {/* Przyciski trybu zaznaczania */}
      {isSelectionMode && (
        <div className="flex gap-2">
          {selectedTasksForBulkShare.size > 0 && (
            <>
              <button
                onClick={handleBulkShare}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded flex items-center gap-2 text-sm border border-green-500"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Udostępnij ({selectedTasksForBulkShare.size})</span>
                <span className="sm:hidden">Share ({selectedTasksForBulkShare.size})</span>
              </button>
            </>
          )}
          <button
            onClick={exitSelectionMode}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded flex items-center gap-2 text-sm border border-red-500"
          >
            <X size={16} />
            <span className="hidden sm:inline">Anuluj zaznaczanie</span>
            <span className="sm:hidden">Anuluj</span>
          </button>
        </div>
      )}
      
      {/* Przycisk zarządzania użytkownikami */}
      <button
        onClick={() => setShowUserManager(true)}
        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded flex items-center gap-2 text-sm border border-gray-500"
      >
        <Users size={16} />
        <span className="hidden sm:inline">Użytkownicy</span>
        <span className="sm:hidden">Users</span>
      </button>
      
      {/* Przycisk Nowe zadanie */}
      <button
        onClick={openNewTaskForm}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2 text-sm sm:text-base border border-blue-500"
      >
        <Plus size={18} className="sm:w-5 sm:h-5" />
        <span className="hidden xs:inline">Nowe zadanie</span>
        <span className="xs:hidden">Nowe</span>
      </button>
    </div>
  </div>
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
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTaskCategory('all')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base border ${
                taskCategory === 'all'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-gray-200 dark:bg-[#181818] text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-[#2a2a2a] border-gray-300 dark:border-[#404040]'
              }`}
            >
              Wszystkie ({tasks.length})
            </button>
            <button
              onClick={() => setTaskCategory('my')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base border ${
                taskCategory === 'my'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-gray-200 dark:bg-[#181818] text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-[#2a2a2a] border-gray-300 dark:border-[#404040]'
              }`}
            >
              <span className="hidden sm:inline">Utworzone przeze mnie</span>
              <span className="sm:hidden">Moje</span> ({tasks.filter(t => t.isCreatedByMe).length})
            </button>
            <button
              onClick={() => setTaskCategory('assigned')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base border ${
                taskCategory === 'assigned'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-gray-200 dark:bg-[#181818] text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-[#2a2a2a] border-gray-300 dark:border-[#404040]'
              }`}
            >
              <span className="hidden sm:inline">Przypisane do mnie</span>
              <span className="sm:hidden">Przypisane</span> ({tasks.filter(t => t.isAssignedToMe).length})
            </button>
            <button
              onClick={() => setTaskCategory('assigned-to-users')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base border ${
                taskCategory === 'assigned-to-users'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-gray-200 dark:bg-[#181818] text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-[#2a2a2a] border-gray-300 dark:border-[#404040]'
              }`}
            >
              <span className="hidden sm:inline">Przypisane do użytkowników</span>
              <span className="sm:hidden">Do użytkowników</span> ({tasks.filter(t => {
                if (!t.isCreatedByMe || !t.assignedTo) return false;
                const cleanAssignedTo = t.assignedTo.replace(/\s*\(.+?\)$/, '');
                return cleanAssignedTo !== user?.id && t.assignedTo !== user?.primaryEmailAddress?.emailAddress;
              }).length})
            </button>
            <button
              onClick={() => setTaskCategory('shared')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base border ${
                taskCategory === 'shared'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-gray-200 dark:bg-[#181818] text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-[#2a2a2a] border-gray-300 dark:border-[#404040]'
              }`}
            >
              <span className="hidden sm:inline">Udostępnione mi</span>
              <span className="sm:hidden">Udostępnione</span> ({tasks.filter(t => t.isSharedWithMe).length})
            </button>
          </div>
        </div>

        {/* Podkategorie dla "Przypisane do mnie" */}
        {taskCategory === 'assigned' && assignedUsers.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Przypisane przez:</h3>
              {assignedByFilter && (
                <button
                  onClick={() => setAssignedByFilter(null)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Pokaż wszystkie
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAssignedByFilter(null)}
                className={`px-3 py-1 text-sm rounded-full transition-colors border ${
                  !assignedByFilter
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 dark:bg-[#181818] dark:text-white dark:border-[#404040] dark:hover:bg-[#2a2a2a]'
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
                  className={`px-3 py-1 text-sm rounded-full transition-colors border ${
                    assignedByFilter === user.id
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 dark:bg-[#181818] dark:text-white dark:border-[#404040] dark:hover:bg-[#2a2a2a]'
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
          onView={handleViewTask}
          onShare={handleShareTask}
          onTaskSelection={isSelectionMode ? handleTaskSelection : undefined}
          selectedTasks={isSelectionMode ? selectedTasksForBulkShare : new Set()}
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
              externalUsers={externalUsers}
              isAssignedUser={editingTask?.isAssignedToMe && !editingTask?.isCreatedByMe}
            />
          </>
        )}

        {/* Modal podglądu zadania */}
        <TaskModal
          isOpen={showTaskModal}
          onClose={closeTaskModal}
          task={viewingTask}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          getUserName={getUserName}
        />
      </div>

      {/* Modal opcji udostępniania */}
      {showShareOptions && sharingTask && (
        <ShareOptionsModal
          isOpen={showShareOptions}
          onClose={closeShareOptions}
          task={sharingTask}
          onShareSingle={handleShareSingle}
          onSelectMore={handleSelectMore}
          hasExternalUsers={externalUsers.length > 0}
        />
      )}

      {/* Modal udostępniania pojedynczego zadania */}
      {showShareModal && sharingTask && (
        <ShareTaskModal
          isOpen={showShareModal}
          onClose={closeShareModal}
          task={sharingTask}
          onShare={handleShare}
          availableUsers={externalUsers.map(user => ({ id: user.id, name: user.name }))}
          isLoading={false}
        />
      )}

      {/* Modal masowego udostępniania */}
      {showBulkShareModal && (
        <BulkShareModal
          isOpen={showBulkShareModal}
          onClose={closeBulkShareModal}
          selectedTasks={Array.from(selectedTasksForBulkShare).map(id => 
            tasks.find(t => t._id === id)!
          ).filter(Boolean)}
          onShare={handleBulkShareAction}
          availableUsers={externalUsers.map(user => ({ id: user.id, name: user.name }))}
          isLoading={false}
        />
      )}

      {/* Modal zarządzania użytkownikami zewnętrznymi */}
      {showUserManager && (
        <ExternalUserManager
          isOpen={showUserManager}
          onClose={() => setShowUserManager(false)}
          users={externalUsers}
          onAddUser={handleAddExternalUser}
          onUpdateUser={handleUpdateExternalUser}
          onDeleteUser={handleDeleteExternalUser}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default Dashboard;

