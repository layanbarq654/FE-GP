// src/utils/authRedirect.js
import { getUserType } from '../Services/authService';

export const getAuthRedirectPath = () => {
  const userType = getUserType();
  
  switch(userType) {
    case '1':  // Customer
      return '/customer/dashboard';
    case '2':  // Owner
      return '/owner/dashboard';
    case '3':  // Third Party
      return '/thirdparty/dashboard';
    case '4':  // Admin
      return '/admin/dashboard';
    default:
      return '/login';
  }
};

export const requireAuth = (navigate) => {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return false;
  }
  return true;
};