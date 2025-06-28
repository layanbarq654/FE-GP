import React, { useState } from 'react';
import './NotificationIcon.css';

const NotificationIcon = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Fake notifications data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Booking Approved',
      message: 'Your booking has been approved! Check it',
      type_id: 2, // booking approved type
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'New Message',
      message: 'You have a new message from the host',
      type_id: 1, // info type
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: 3,
      title: 'Reminder',
      message: 'Your booking starts tomorrow',
      type_id: 3, // warning type
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, is_read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      is_read: true
    })));
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setShowDropdown(false);
  };

  // Notification icon mapping
  const NotificationIcon = ({ typeId }) => {
    const iconMap = {
      1: { color: '#1890ff', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
      2: { color: '#52c41a', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
      3: { color: '#faad14', paths: [
        'M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5z',
        'M12 16c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-6c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1s-1-.45-1-1v-3c0-.55.45-1 1-1z'
      ]},
      4: { color: '#f5222d', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' }
    };
    
    const icon = iconMap[typeId] || iconMap[1];
    
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={icon.color}>
        {Array.isArray(icon.paths) ? (
          icon.paths.map((path, i) => <path key={i} d={path} />)
        ) : (
          <path d={icon.path} />
        )}
      </svg>
    );
  };

  return (
    <div className="notification-container">
      <div 
        className="notification-icon"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#333" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button 
                className="notification-clear"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                aria-label="Mark all as read"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div className="notification-empty">
              No new notifications
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Notification: ${notification.title}`}
                >
                  <div className="notification-icon-container">
                    <NotificationIcon typeId={notification.type_id} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-footer">
                      <div className="notification-time">
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                      {!notification.is_read && (
                        <span className="notification-unread-dot" aria-hidden="true"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;