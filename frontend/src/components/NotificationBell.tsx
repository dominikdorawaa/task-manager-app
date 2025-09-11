import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Notification } from '../types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_shared':
        return '🔗';
      case 'task_assigned':
        return '👤';
      case 'task_status_changed':
        return '📝';
      case 'task_updated':
        return '✏️';
      case 'task_created':
        return '➕';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'task_shared':
        return 'text-purple-600 dark:text-purple-400';
      case 'task_assigned':
        return 'text-blue-600 dark:text-blue-400';
      case 'task_status_changed':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'task_updated':
        return 'text-green-600 dark:text-green-400';
      case 'task_created':
        return 'text-indigo-600 dark:text-indigo-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#212121] dark:hover:bg-[#2a2a2a] transition-colors"
        title="Powiadomienia"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#212121] rounded-lg shadow-lg border border-gray-200 dark:border-[#404040] z-20 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#404040]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Powiadomienia
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Oznacz wszystkie jako przeczytane
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Brak powiadomień
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            {notification.taskTitle && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Zadanie: {notification.taskTitle}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {format(new Date(notification.createdAt), 'dd.MM.yyyy HH:mm', { locale: pl })}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                                title="Oznacz jako przeczytane"
                              >
                                <Check size={14} className="text-green-600 dark:text-green-400" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteNotification(notification.id)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                              title="Usuń powiadomienie"
                            >
                              <X size={14} className="text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
