export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'do zrobienia' | 'w trakcie' | 'zakończone' | 'anulowane';
  priority: 'niski' | 'średni' | 'wysoki' | 'krytyczny';
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  images: string[];
  userId: string;
  assignedTo?: string[]; // Clerk User IDs użytkowników przypisanych do zadania
  assignedUserNote?: string; // Notatka od przypisanego użytkownika
  assignedUserNoteAuthor?: string; // ID użytkownika który dodał notatkę
  isAssignedToMe?: boolean; // Czy zadanie jest przypisane do mnie (nie utworzone przeze mnie)
  isCreatedByMe?: boolean; // Czy zadanie zostało utworzone przeze mnie
  clerkUserId: string; // ID użytkownika, który utworzył zadanie
  createdAt: string;
  updatedAt: string;
  // Nowe pola dla systemu udostępniania (opcjonalne, nie wpływają na istniejące dane)
  sharedWith?: string[]; // Lista ID użytkowników, którym zadanie jest udostępnione
  shareRequests?: string[]; // Lista ID użytkowników, którzy chcą zobaczyć zadanie
  isPublic?: boolean; // Czy zadanie jest publiczne
  isSharedWithMe?: boolean; // Czy zadanie zostało udostępnione mi przez kogoś
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: 'jasny' | 'ciemny' | 'system';
    language: 'pl' | 'en';
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  overdue: number;
  byStatus: Array<{
    _id: string;
    count: number;
  }>;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
  tags?: string[];
  images?: string[];
  assignedTo?: string[];
  assignedUserNote?: string;
  assignedUserNoteAuthor?: string;
}

// Typy dla danych wysyłanych do backendu (z angielskimi enumami)
export interface BackendTaskData {
  title: string;
  description?: string;
  status?: 'DO_ZROBIENIA' | 'W_TRAKCIE' | 'ZAKONCZONE' | 'ANULOWANE';
  priority?: 'NISKI' | 'SREDNI' | 'WYSOKI' | 'KRYTYCZNY';
  dueDate?: string;
  tags?: string[];
  images?: string[];
  assignedTo?: string[];
  assignedUserNote?: string;
  assignedUserNoteAuthor?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  completedAt?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Typy dla systemu udostępniania zadań
export interface ShareRequest {
  id: string;
  taskId: string;
  requesterId: string;
  requesterName: string;
  taskTitle: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ShareTaskData {
  taskId: string;
  userIds: string[];
  message?: string;
}

export interface RequestAccessData {
  taskId: string;
  message?: string;
}

// Typy dla zarządzania użytkownikami zewnętrznymi
export interface ExternalUser {
  id: string;
  name: string;
  avatar?: string; // URL do zdjęcia użytkownika
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExternalUserData {
  id: string;
  name: string;
  avatar?: string;
}

export interface UpdateExternalUserData {
  id?: string;
  name?: string;
  avatar?: string;
  isActive?: boolean;
}

// Typy dla systemu powiadomień
export interface Notification {
  id: string;
  type: 'task_shared' | 'task_assigned' | 'task_status_changed' | 'task_updated' | 'task_created';
  title: string;
  message: string;
  taskId?: string;
  taskTitle?: string;
  fromUserId?: string;
  fromUserName?: string;
  isRead: boolean;
  createdAt: string;
}



