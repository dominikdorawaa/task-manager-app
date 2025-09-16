import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth, useUser, SignInButton } from '@clerk/clerk-react';
import { tasksApi, externalUsersApi, setClerkToken } from '../services/api';
import { Task, CreateTaskData, BackendTaskData, ExternalUser, CreateExternalUserData, UpdateExternalUserData } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { useToast } from '../hooks/useToast';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import TaskModal from './TaskModal';
import ShareTaskModal from './ShareTaskModal';
import BulkShareModal from './BulkShareModal';
import ExternalUserManager from './ExternalUserManager';
import ToastContainer from './Toast';
import ConfirmModal from './ConfirmModal';
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { addNotification, notifications } = useNotifications();
  
  // Debug powiadomień
  useEffect(() => {
    console.log('=== NOTIFICATIONS DEBUG ===');
    console.log('Notifications count:', notifications.length);
    console.log('Notifications:', notifications);
  }, [notifications]);

  // Automatyczne odświeżanie danych co 30 sekund
  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing data...');
      queryClient.invalidateQueries(['tasks', user.id]);
      queryClient.invalidateQueries(['externalUsers']);
    }, 30000); // 30 sekund

    return () => clearInterval(interval);
  }, [isSignedIn, user?.id, queryClient]);

  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Funkcja do pokazywania modala potwierdzenia
  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmModalData({ title, message, onConfirm, type });
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalData(null);
  };


  // Funkcja do pobierania nazwy użytkownika po ID
  const getUserName = (userId: string): string => {
    if (userId === user?.id) {
      return 'Ja';
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

  // Funkcja do pobierania awatara użytkownika po ID
  const getUserAvatar = (userId: string): string | null => {
    if (userId === user?.id) {
      return user?.imageUrl || null;
    }
    
    // Sprawdź w externalUsers
    const externalUser = externalUsers.find(u => u.id === userId);
    if (externalUser?.avatar) {
      return externalUser.avatar;
    }
    
    return null;
  };

  // Funkcja pomocnicza do sprawdzania czy użytkownik jest w assignedTo
  const isUserAssigned = (assignedTo: string | string[] | undefined, userId: string): boolean => {
    if (!assignedTo) return false;
    const assignedUsers = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    return assignedUsers.includes(userId);
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
    // console.log('Original task:', task);
    // console.log('Current user ID:', currentUserId);
    // console.log('Task assignedTo:', task.assignedTo);
    // console.log('Task clerkUserId:', task.clerkUserId);
    const isCreatedByMe = currentUserId ? task.clerkUserId === currentUserId : false;
    
    // Sprawdź czy zadanie jest przypisane do mnie (uwzględniając różne formaty ID)
    let isAssignedToMe = false;
    if (task.assignedTo && (currentUserId || currentUserEmail || currentUserName)) {
      // Sprawdź dokładne dopasowanie (ID, email, nazwa)
      if (isUserAssigned(task.assignedTo, currentUserId || '') || isUserAssigned(task.assignedTo, currentUserEmail || '') || isUserAssigned(task.assignedTo, currentUserName || '')) {
        isAssignedToMe = true;
      }
    }
    
    // Sprawdź czy zadanie jest udostępnione mi (nie utworzone przeze mnie)
    let isSharedWithMe = false;
    if (task.sharedWith && task.sharedWith.length > 0 && !isCreatedByMe && (currentUserId || currentUserEmail || currentUserName)) {
      // Sprawdź czy moje ID/email/nazwa jest w sharedWith
      isSharedWithMe = task.sharedWith.some((sharedUserId: string) => 
        sharedUserId === currentUserId || 
        sharedUserId === currentUserEmail || 
        sharedUserId === currentUserName
      );
      
      // Debug dla sprawdzania isSharedWithMe
      if (task.sharedWith && task.sharedWith.length > 0) {
        console.log('=== IS SHARED WITH ME DEBUG ===');
        console.log('Task title:', task.title);
        console.log('task.sharedWith:', task.sharedWith);
        console.log('currentUserId:', currentUserId);
        console.log('currentUserEmail:', currentUserEmail);
        console.log('currentUserName:', currentUserName);
        console.log('isCreatedByMe:', isCreatedByMe);
        console.log('isSharedWithMe result:', isSharedWithMe);
        
        // Sprawdź dokładne porównania
        task.sharedWith.forEach((sharedUserId: string, index: number) => {
          console.log(`Comparison ${index}:`);
          console.log(`  sharedUserId: "${sharedUserId}"`);
          console.log(`  currentUserId: "${currentUserId}"`);
          console.log(`  currentUserEmail: "${currentUserEmail}"`);
          console.log(`  currentUserName: "${currentUserName}"`);
          console.log(`  matches userId: ${sharedUserId === currentUserId}`);
          console.log(`  matches email: ${sharedUserId === currentUserEmail}`);
          console.log(`  matches name: ${sharedUserId === currentUserName}`);
        });
      }
    }
    
    const mappedTask = {
      ...task,
      status: statusMap[task.status] || 'do zrobienia',
      priority: priorityMap[task.priority] || 'średni',
      images: task.images || [],
      assignedTo: task.assignedTo,
      assignedUserNote: task.assignedUserNote,
      assignedUserNoteAuthor: task.assignedUserNoteAuthor,
      isAssignedToMe: isAssignedToMe,
      isCreatedByMe: isCreatedByMe,
      isSharedWithMe: isSharedWithMe,
      sharedWith: task.sharedWith || []
    };

    // Debug dla sharedWith
    if (task.sharedWith && task.sharedWith.length > 0) {
      console.log('=== TASK MAPPING DEBUG ===');
      console.log('Task title:', task.title);
      console.log('Original sharedWith:', task.sharedWith);
      console.log('Mapped sharedWith:', mappedTask.sharedWith);
      console.log('isSharedWithMe:', isSharedWithMe);
      console.log('isCreatedByMe:', isCreatedByMe);
      console.log('Current user ID:', currentUserId);
      console.log('Current user email:', currentUserEmail);
      console.log('Current user name:', currentUserName);
    }

    return mappedTask;
  };

  // Filtrowanie zadań według kategorii
  const getFilteredTasks = () => {
    let filteredTasks = tasks;
    
    // Debug dla kategorii zadań
    console.log('=== TASK FILTERING DEBUG ===');
    console.log('Current category:', taskCategory);
    console.log('Total tasks:', tasks.length);
    console.log('Tasks with isSharedWithMe:', tasks.filter(t => t.isSharedWithMe).length);
    console.log('Tasks with sharedWith:', tasks.filter(t => t.sharedWith && t.sharedWith.length > 0).length);
    
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
        // Zadania które ja utworzyłem i które mają przypisanych użytkowników
        filteredTasks = tasks.filter(task => {
          if (!task.isCreatedByMe || !task.assignedTo) return false;
          
          // Sprawdź czy ma przypisanych użytkowników (włącznie ze mną)
          const assignedUsers = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
          return assignedUsers.length > 0;
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
  const { data: externalUsersData = [] } = useQuery<ExternalUser[], Error>(
    ['externalUsers'],
    () => externalUsersApi.getAll().then(res => res.data),
    {
      enabled: isSignedIn,
      staleTime: 60000, // 1 minuta
    }
  );

  // Aktualizuj timestamp gdy dane się zmieniają
  useEffect(() => {
    if (tasks.length > 0 || externalUsers.length > 0) {
      setLastUpdated(new Date());
    }
  }, [tasks, externalUsers]);

  // Aktualizacja external users gdy dane się zmienią
  useEffect(() => {
    console.log('=== EXTERNAL USERS DEBUG ===');
    console.log('External users data:', externalUsersData);
    console.log('External users count:', externalUsersData.length);
    setExternalUsers(externalUsersData);
    
    // Stwórz mapę userNames na podstawie external users
    const namesMap: Record<string, string> = {};
    externalUsersData.forEach(user => {
      namesMap[user.id] = user.name;
    });
    setUserNames(namesMap);
  }, [externalUsersData]);


  // Aktualizacja listy przypisanych użytkowników gdy zmieniają się zadania
  useEffect(() => {
    if (tasks.length > 0) {
      updateAssignedUsers(tasks);
    }
  }, [tasks, userNames]);

  // Generowanie powiadomień dla nowo udostępnionych zadań
  useEffect(() => {
    if (tasks.length > 0 && user?.id) {
      tasks.forEach(task => {
        // Sprawdź czy zadanie jest udostępnione mi i nie zostało utworzone przeze mnie
        if (task.isSharedWithMe && !task.isCreatedByMe && task.clerkUserId) {
          // Sprawdź czy to nowe udostępnione zadanie (możemy dodać logikę sprawdzania czy już było powiadomienie)
          const notificationKey = `shared_${task._id}_${user.id}`;
          const existingNotification = localStorage.getItem(notificationKey);
          
          if (!existingNotification) {
            // To nowe udostępnione zadanie - dodaj powiadomienie
            const fromUserName = getUserName(task.clerkUserId);
            addNotification({
              type: 'task_shared',
              title: 'Otrzymałeś nowe zadanie',
              message: `Zadanie "${task.title}" zostało udostępnione przez ${fromUserName}`,
              taskId: task._id,
              taskTitle: task.title,
              fromUserId: task.clerkUserId,
              fromUserName: fromUserName,
            });
            
            // Oznacz że powiadomienie zostało wysłane
            localStorage.setItem(notificationKey, 'true');
          }
        }
      });
    }
  }, [tasks, user?.id, addNotification]);

  // Generowanie powiadomień dla nowych zadań przypisanych do użytkownika
  useEffect(() => {
    if (tasks.length > 0 && user?.id) {
      tasks.forEach(task => {
        // Sprawdź czy zadanie jest przypisane do mnie i nie zostało utworzone przeze mnie
        if (task.isAssignedToMe && !task.isCreatedByMe && task.clerkUserId) {
          // Sprawdź czy to nowe przypisane zadanie
          const notificationKey = `assigned_${task._id}_${user.id}`;
          const existingNotification = localStorage.getItem(notificationKey);
          
          if (!existingNotification) {
            // To nowe przypisane zadanie - dodaj powiadomienie
            const fromUserName = getUserName(task.clerkUserId);
            addNotification({
              type: 'task_assigned',
              title: 'Nowe zadanie przypisane',
              message: `Zostało Ci przypisane nowe zadanie: "${task.title}"`,
              taskId: task._id,
              taskTitle: task.title,
              fromUserId: task.clerkUserId,
              fromUserName: fromUserName,
            });
            
            // Oznacz jako przetworzone
            localStorage.setItem(notificationKey, 'true');
          }
        }
      });
    }
  }, [tasks, user?.id, addNotification]);

  // Generowanie powiadomień dla nowych notatek od przypisanych użytkowników
  useEffect(() => {
    if (tasks.length > 0 && user?.id) {
      tasks.forEach(task => {
        // Sprawdź czy zadanie ma notatkę od przypisanego użytkownika
        if (task.assignedUserNote && task.assignedUserNoteAuthor && 
            task.assignedUserNoteAuthor !== user?.id && 
            task.clerkUserId === user?.id) { // Tylko dla twórców zadań
          
          const notificationKey = `note_${task._id}_${task.assignedUserNoteAuthor}`;
          const existingNotification = localStorage.getItem(notificationKey);
          
          if (!existingNotification) {
            // To nowa notatka od przypisanego użytkownika - dodaj powiadomienie
            const fromUserName = getUserName(task.assignedUserNoteAuthor);
            addNotification({
              type: 'task_updated',
              title: 'Nowa notatka do zadania',
              message: `${fromUserName} dodał notatkę do zadania "${task.title}": "${task.assignedUserNote.substring(0, 100)}${task.assignedUserNote.length > 100 ? '...' : ''}"`,
              taskId: task._id,
              taskTitle: task.title,
              fromUserId: task.assignedUserNoteAuthor,
              fromUserName: fromUserName,
            });
            
            // Zapisz w localStorage żeby nie pokazywać ponownie
            localStorage.setItem(notificationKey, 'true');
          }
        }
      });
    }
  }, [tasks, user?.id, addNotification]);

  // Usunięto problematyczny useEffect, który powodował nieskończoną pętlę

  // Mutacje
  const createTaskMutation = useMutation(
    (data: BackendTaskData) => tasksApi.create(data),
    {
      onSuccess: (response, variables) => {
        queryClient.invalidateQueries(['tasks', user?.id]);
        setShowTaskForm(false);
        
        // Toast notification o utworzeniu zadania
        showSuccess(
          'Zadanie zostało utworzone!',
          `Zadanie "${variables.title}" zostało pomyślnie utworzone.`
        );
        
        // Powiadomienia o nowych zadaniach są generowane automatycznie przez useEffect
      },
    }
  );

  const updateTaskMutation = useMutation(
    ({ id, data }: { id: string; data: BackendTaskData }) => tasksApi.update(id, data),
    {
      onSuccess: (response, variables) => {
        console.log('=== UPDATE TASK SUCCESS ===', response);
        // Natychmiastowe odświeżenie danych
        queryClient.invalidateQueries(['tasks', user?.id]);
        queryClient.refetchQueries(['tasks', user?.id]);
        setShowTaskForm(false);
        setEditingTask(undefined);
        
        // Dodaj powiadomienie o aktualizacji zadania
        const task = tasks.find(t => t._id === variables.id);
        if (task && task.assignedTo && !isUserAssigned(task.assignedTo, user?.id || '')) {
          addNotification({
            type: 'task_updated',
            title: 'Zadanie zostało zaktualizowane',
            message: `Zadanie "${variables.data.title}" zostało zaktualizowane`,
            taskId: variables.id,
            taskTitle: variables.data.title,
            fromUserId: user?.id,
            fromUserName: user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Ty',
          });
        }
      },
      onError: (error) => {
        console.error('=== UPDATE TASK ERROR ===', error);
      }
    }
  );

  const deleteTaskMutation = useMutation(
    (id: string) => tasksApi.delete(id),
    {
      onSuccess: (response, taskId) => {
        queryClient.invalidateQueries(['tasks', user?.id]);
        
        // Toast notification o usunięciu zadania
        const task = tasks.find(t => t._id === taskId);
        const taskTitle = task?.title || 'Zadanie';
        showSuccess(
          'Zadanie zostało usunięte!',
          `Zadanie "${taskTitle}" zostało pomyślnie usunięte.`
        );
      },
      onError: (error, taskId) => {
        const task = tasks.find(t => t._id === taskId);
        const taskTitle = task?.title || 'Zadanie';
        showError(
          'Błąd usuwania zadania',
          `Nie udało się usunąć zadania "${taskTitle}".`
        );
      }
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
    return result;
  };

  const handleCreateTask = (data: CreateTaskData) => {
    const mappedData = mapTaskDataForBackend(data);
    createTaskMutation.mutate(mappedData);
  };

  const handleUpdateTask = (data: CreateTaskData) => {
    if (editingTask) {
      const mappedData = mapTaskDataForBackend(data);
      updateTaskMutation.mutate({ id: editingTask._id, data: mappedData });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t._id === taskId);
    const taskTitle = task?.title || 'to zadanie';
    
    showConfirmDialog(
      'Usuń zadanie',
      `Czy na pewno chcesz usunąć zadanie "${taskTitle}"? Ta operacja jest nieodwracalna.`,
      () => {
        deleteTaskMutation.mutate(taskId);
        closeConfirmModal();
      },
      'danger'
    );
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
      
      // Dodaj powiadomienie o zmianie statusu
      if (task.assignedTo && !isUserAssigned(task.assignedTo, user?.id || '')) {
        const statusText = {
          'do zrobienia': 'Do zrobienia',
          'w trakcie': 'W trakcie',
          'zakończone': 'Zakończone',
          'anulowane': 'Anulowane'
        }[status] || status;
        
        addNotification({
          type: 'task_status_changed',
          title: 'Status zadania został zmieniony',
          message: `Status zadania "${task.title}" został zmieniony na "${statusText}"`,
          taskId: taskId,
          taskTitle: task.title,
          fromUserId: user?.id,
          fromUserName: user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Ty',
        });
      }
      
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
      console.log('=== FRONTEND SHARE DEBUG ===');
      console.log('Udostępnianie zadania:', {
        taskId: sharingTask._id,
        userIds,
        message,
        taskTitle: sharingTask.title,
        taskClerkUserId: sharingTask.clerkUserId
      });
      
      const response = await tasksApi.share(sharingTask._id, userIds, message);
      
      console.log('Share response:', response.data);
      
      if (response.data.success) {
        console.log('Share successful, refreshing tasks...');
        // Odśwież listę zadań
        queryClient.invalidateQueries(['tasks']);
        
        // Dodatkowo odśwież dane po krótkiej przerwie
        setTimeout(() => {
          console.log('Force refreshing tasks after share...');
          queryClient.invalidateQueries(['tasks']);
        }, 1000);
        
        // Dodaj powiadomienie dla każdego użytkownika, któremu udostępniono zadanie
        userIds.forEach(userId => {
          const userName = getUserName(userId);
          addNotification({
            type: 'task_shared',
            title: 'Zadanie zostało udostępnione',
            message: `Zadanie "${sharingTask.title}" zostało udostępnione użytkownikowi ${userName}`,
            taskId: sharingTask._id,
            taskTitle: sharingTask.title,
            fromUserId: user?.id,
            fromUserName: user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Ty',
          });
        });
        
        showSuccess(
          'Zadanie zostało udostępnione!',
          `Zadanie "${sharingTask.title}" zostało udostępnione ${userIds.length} użytkownikom.`
        );
        closeShareModal();
      } else {
        console.error('Share failed:', response.data);
        showError('Błąd udostępniania', response.data.message);
      }
    } catch (error: any) {
      console.error('=== SHARE ERROR ===');
      console.error('Błąd udostępniania:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      showError('Błąd udostępniania', `Wystąpił błąd podczas udostępniania zadania: ${error.response?.data?.message || error.message}`);
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
        showSuccess(
          'Zadania zostały udostępnione!',
          `${successCount} zadań zostało udostępnione ${userIds.length} użytkownikom.`
        );
      }
      
      if (errorCount > 0) {
        showError('Błąd udostępniania', `${errorCount} zadań nie udało się udostępnić.`);
      }
      
      closeBulkShareModal();
      exitSelectionMode();
    } catch (error) {
      console.error('Błąd masowego udostępniania:', error);
      showError('Błąd udostępniania', 'Wystąpił błąd podczas masowego udostępniania zadań.');
    }
  };

  // Funkcje do zarządzania użytkownikami zewnętrznymi
  const handleAddExternalUser = async (userData: CreateExternalUserData) => {
    try {
      console.log('=== ADD EXTERNAL USER DEBUG ===');
      console.log('Dodawanie użytkownika zewnętrznego:', userData);
      
      const response = await externalUsersApi.create(userData);
      
      console.log('Create user response:', response.data);
      
      if (response.data.success) {
        // Odśwież listę użytkowników
        queryClient.invalidateQueries(['externalUsers']);
        showSuccess('Użytkownik został dodany!', `Użytkownik ${userData.name} został pomyślnie dodany.`);
      } else {
        console.error('Create user failed:', response.data);
        showError('Błąd dodawania użytkownika', response.data.message);
      }
    } catch (error: any) {
      console.error('=== ADD USER ERROR ===');
      console.error('Błąd dodawania użytkownika:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      showError('Błąd dodawania użytkownika', `Wystąpił błąd podczas dodawania użytkownika: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateExternalUser = async (id: string, userData: UpdateExternalUserData) => {
    try {
      console.log('Aktualizacja użytkownika zewnętrznego:', { id, userData });
      
      const response = await externalUsersApi.update(id, userData);
      
      if (response.data.success) {
        // Odśwież listę użytkowników
        queryClient.invalidateQueries(['externalUsers']);
        showSuccess('Użytkownik został zaktualizowany!', 'Dane użytkownika zostały pomyślnie zaktualizowane.');
      } else {
        showError('Błąd aktualizacji użytkownika', response.data.message);
      }
    } catch (error) {
      console.error('Błąd aktualizacji użytkownika:', error);
      showError('Błąd aktualizacji użytkownika', 'Wystąpił błąd podczas aktualizacji użytkownika.');
    }
  };

  const handleDeleteExternalUser = async (id: string) => {
    const user = externalUsers.find(u => u.id === id);
    if (!user) return;
    
    showConfirmDialog(
      'Usuń użytkownika',
      `Czy na pewno chcesz usunąć użytkownika "${user.name}"? Ta operacja jest nieodwracalna.`,
      () => {
        performDeleteExternalUser(id);
        closeConfirmModal();
      },
      'danger'
    );
  };

  const performDeleteExternalUser = async (id: string) => {
    const user = externalUsers.find(u => u.id === id);
    if (!user) return;
    
    try {
      console.log('Usuwanie użytkownika zewnętrznego:', id);
      
      const response = await externalUsersApi.delete(id);
      
      if (response.data.success) {
        // Odśwież listę użytkowników
        queryClient.invalidateQueries(['externalUsers']);
        showSuccess('Użytkownik został usunięty!', `Użytkownik ${user.name} został pomyślnie usunięty.`);
      } else {
        showError('Błąd usuwania użytkownika', response.data.message);
      }
    } catch (error) {
      console.error('Błąd usuwania użytkownika:', error);
      showError('Błąd usuwania użytkownika', 'Wystąpił błąd podczas usuwania użytkownika.');
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
      {lastUpdated && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Ostatnio zaktualizowane: {lastUpdated.toLocaleTimeString('pl-PL')}
        </p>
      )}
      
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
              <span className="sm:hidden">Do użytkowników</span>               ({tasks.filter(t => {
                if (!t.isCreatedByMe || !t.assignedTo) return false;
                return !isUserAssigned(t.assignedTo, user?.id || '') && !isUserAssigned(t.assignedTo, user?.primaryEmailAddress?.emailAddress || '');
              }).length})
            </button>
            <button
              onClick={() => {
                console.log('=== CLICKING SHARED CATEGORY ===');
                console.log('Tasks with isSharedWithMe:', tasks.filter(t => t.isSharedWithMe));
                setTaskCategory('shared');
              }}
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
          getUserAvatar={getUserAvatar}
        />

        {/* Modal formularza */}
        {showTaskForm && (
          <>
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
          getUserAvatar={getUserAvatar}
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
        <>
          {console.log('=== SHARE MODAL DEBUG ===', {
            sharingTask: sharingTask.title,
            externalUsersCount: externalUsers.length,
            availableUsers: externalUsers.map(user => ({ id: user.id, name: user.name }))
          })}
          <ShareTaskModal
            isOpen={showShareModal}
            onClose={closeShareModal}
            task={sharingTask}
            onShare={handleShare}
            availableUsers={externalUsers.map(user => ({ id: user.id, name: user.name }))}
            isLoading={false}
          />
        </>
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Confirm Modal */}
      {showConfirmModal && confirmModalData && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={closeConfirmModal}
          onConfirm={confirmModalData.onConfirm}
          title={confirmModalData.title}
          message={confirmModalData.message}
          type={confirmModalData.type}
          confirmText="Usuń"
          cancelText="Anuluj"
        />
      )}
    </div>
  );
};

export default Dashboard;

