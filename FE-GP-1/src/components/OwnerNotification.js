import React, { useState } from 'react';
import './NotificationIcon.css'; // Reuse the same CSS file

const OwnerNotificationIcon = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Owner-specific fake notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Booking',
      message: 'You have new booking for Hayat Nablus, Check it',
      type_id: 1, // booking notification type
      is_read: false,
      created_at: new Date().toISOString()
    }
  ]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({
      ...n,
      is_read: true
    })));
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setShowDropdown(false);
  };

  // Notification icon mapping for owner
  const NotificationIcon = ({ typeId }) => {
    const iconMap = {
      1: { color: '#1890ff', icon: '📅' }, // Booking
    };
    
    const icon = iconMap[typeId] || iconMap[1];
    
    return (
      <span 
        className="notification-icon-badge"
        style={{ color: icon.color, fontSize: '20px' }}
      >
        {icon.icon}
      </span>
    );
  };

  return (
    <div className="notification-container">
      <div 
        className="notification-icon"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Owner Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown owner-notifications">
          <div className="notification-header">
            <h4>Owner Notifications</h4>
            {unreadCount > 0 && (
              <button 
                className="notification-clear"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
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
                        <span className="notification-unread-dot"></span>
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

export default OwnerNotificationIcon;