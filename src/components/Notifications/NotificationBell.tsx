import React, { useState } from 'react';
import NotificationPanel from './NotificationPanel';
import { Notification } from './notificationsData';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  notifications: Notification[];
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const togglePanel = () => setIsOpen(!isOpen);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePanel();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" aria-haspopup="true">
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-live="polite"
        onClick={togglePanel}
        onKeyDown={handleKeyDown}
      >
        <Bell className="h-6 w-6 text-gray-600" aria-hidden="true" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ring-2 ring-white text-white bg-red-600 animate-pulse motion-reduce:animate-none motion-reduce:bg-red-700 motion-reduce:ring-red-100"
            role="status"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <NotificationPanel notifications={notifications} onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default NotificationBell;
