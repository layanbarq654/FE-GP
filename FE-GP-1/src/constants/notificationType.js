// src/constants/notificationTypes.js
export const NOTIFICATION_TYPES = {
    BOOKING_CREATED: 1,
    BOOKING_APPROVED: 2,
    BOOKING_REJECTED: 3,
    SYSTEM_NOTIFICATION: 4
  };
  
  export const getNotificationTypeName = (id) => {
    const types = {
      1: 'Booking Created',
      2: 'Booking Approved',
      3: 'Booking Rejected',
      4: 'System Notification'
    };
    return types[id] || 'Notification';
  };