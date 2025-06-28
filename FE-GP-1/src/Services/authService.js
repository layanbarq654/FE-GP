// src/Services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });

    const token = response.data.accessToken || response.data.token;
    localStorage.setItem('token', token);

    // FIX: Correctly store the userType from the "type" field
    const userType = response.data.type || response.data.userType || response.data.user?.userType;
    if (userType) {
      localStorage.setItem('userType', userType);
    }

    return {
      success: true,
      token: token,
      user: response.data.user,
      userType: userType
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error ||
                         error.message || 
                         'Login failed';
    console.error('Login error details:', error.response?.data || error);
    throw new Error(errorMessage);
  }
};


export const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

// Add the getUserType function
export const getUserType = () => localStorage.getItem('userType');

export const getToken = () => localStorage.getItem('token');
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userType'); // Also clear userType on logout
};