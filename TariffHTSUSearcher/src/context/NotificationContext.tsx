import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  addNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifier = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifier must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000); // Notifications disappear after 5 seconds
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {/* Notification Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(n => {
          const baseClasses = 'px-4 py-3 rounded-lg shadow-lg text-white';
          const typeClasses = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
          };
          return (
            <div key={n.id} className={`${baseClasses} ${typeClasses[n.type]}`}>
              {n.message}
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};
