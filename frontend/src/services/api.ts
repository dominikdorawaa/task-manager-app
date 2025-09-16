import axios from 'axios';
import { Task, TaskStats, BackendTaskData } from '../types';


const API_BASE_URL = 'https://task-manager-app-9i97.onrender.com/api';

console.log('🔍 API_BASE_URL:', API_BASE_URL);
console.log('🔍 REACT_APP_API_URL env:', process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Funkcja do ustawiania tokenu Clerk
export const setClerkToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Zadania
export const tasksApi = {
  getAll: (params?: { status?: string; priority?: string; search?: string; sort?: string; order?: string; userEmail?: string }) =>
    api.get<Task[]>('/tasks', { params }),
  
  getById: (id: string) =>
    api.get<Task>(`/tasks/${id}`),
  
  create: (data: BackendTaskData) =>
    api.post<Task>('/tasks', data),
  
  update: (id: string, data: BackendTaskData) =>
    api.put<Task>(`/tasks/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
  
  getStats: () =>
    api.get<TaskStats>('/tasks/stats/summary'),
  
  share: (taskId: string, userIds: string[], message?: string) =>
    api.post(`/tasks/${taskId}/share`, { userIds, message }),
};

// API plików
export const filesApi = {
  upload: (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    
    return api.post<{ files: string[] }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  delete: (filename: string) => {
    const filenameOnly = filename.split('/').pop();
    return api.delete(`/files/images/${filenameOnly}`);
  },
  
  getImageUrl: (path: string) => {
    if (path.startsWith('http')) return path;
    // Usuń /api z początku path jeśli już jest w API_BASE_URL
    const cleanPath = path.startsWith('/api/') ? path.substring(4) : path;
    return `${API_BASE_URL}${cleanPath}`;
  },
};

// API użytkowników zewnętrznych
export const externalUsersApi = {
  getAll: (search?: string) =>
    api.get('/external-users', { params: { search } }),
  
  getActive: () =>
    api.get('/external-users/active'),
  
  getById: (id: string) =>
    api.get(`/external-users/${id}`),
  
  create: (userData: { id: string; name: string }) =>
    api.post('/external-users', userData),
  
  update: (id: string, userData: { id?: string; name?: string; isActive?: boolean }) =>
    api.put(`/external-users/${id}`, userData),
  
  delete: (id: string) =>
    api.delete(`/external-users/${id}`),
};

export default api;



