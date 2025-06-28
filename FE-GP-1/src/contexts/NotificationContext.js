import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async (limit = 10, offset = 0) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/notifications`, {
        params: { limit, offset },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Transform the response to match your frontend expectations
      const transformedNotifications = response.data.notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: getFrontendType(notification.type_id), // Map backend type_id to frontend type
        read: notification.is_read,
        createdAt: notification.created_at
      }));
      
      setNotifications(transformedNotifications);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to map backend type_ids to frontend types
  const getFrontendType = (typeId) => {
    const typeMap = {
      1: 'info',     // BOOKING_CREATED
      2: 'success',  // BOOKING_APPROVED
      3: 'warning',  // BOOKING_REJECTED
      4: 'error'     // SYSTEM_NOTIFICATION
    };
    return typeMap[typeId] || 'info';
  };

  const updateUnreadCount = (notifs) => {
    const count = notifs.filter(n => !n.read).length;
    setUnreadCount(count);
  };

  const createNotification = async (notificationData) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      // Map frontend type to backend type_id
      const typeMap = {
        'info': 1,
        'success': 2,
        'warning': 3,
        'error': 4
      };
      
      const response = await axios.post('/api/notifications', {
        userId: notificationData.recipientType === 'customer' 
          ? userId 
          : notificationData.recipient.hallId,
        typeId: typeMap[notificationData.type] || 1,
        title: notificationData.title,
        message: notificationData.message,
        relatedId: notificationData.relatedId || null
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      // Update local state if the notification is for the current user
      const currentUserId = localStorage.getItem('userId');
      const isForCurrentUser = notificationData.recipientType === 'customer' || 
        notificationData.recipient.hallId === currentUserId;
      
      if (isForCurrentUser) {
        const newNotification = {
          id: response.data.data.notificationId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          read: false,
          createdAt: new Date().toISOString()
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
  
      return response.data;
    } catch (err) {
      console.error('Failed to create notification:', err);
      // Fallback to client-side notification
      const fallbackNotification = {
        id: Date.now(),
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        read: false,
        createdAt: new Date().toISOString()
      };
      
      setNotifications(prev => [fallbackNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      return { data: { notificationId: fallbackNotification.id } };
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setNotifications(prev =>
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch('/api/notifications/read-all', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        createNotification,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};