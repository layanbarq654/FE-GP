// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    
    // Debug: log the full response
    console.log('Login API Response:', response);
    
    // Check if response contains token
    if (!response.data.accessToken && !response.data.token) {
      throw new Error('No access token received');
    }
    
    // Store token
    const token = response.data.accessToken || response.data.token;
    localStorage.setItem('token', token);
    
    return {
      success: true,
      token: token,
      user: response.data.user // if your backend returns user data
    };
    
  } catch (error) {
    // More detailed error handling
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

export const getToken = () => localStorage.getItem('token');
export const logout = () => localStorage.removeItem('token');