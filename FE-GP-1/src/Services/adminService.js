import axios from 'axios';

const API_URL = 'http://localhost:3000/api/admin';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// Get all available statistics from existing endpoints
export const getAdminStats = async () => {
  try {
    // Get all users first
    const usersResponse = await axios.get(`${API_URL}/users`, getAuthHeaders());
    const allUsers = usersResponse.data.data;
    
    // Calculate counts from the users data
    const customerCount = allUsers.filter(user => user.type === 1).length;
    const ownerCount = allUsers.filter(user => user.type === 2).length;
    const providerCount = allUsers.filter(user => user.type === 3).length;
    
    return {
      totalUsers: allUsers.length,
      customerCount,
      ownerCount,
      providerCount,
      recentBookings: []
    };
    
  } catch (error) {
    console.error('Error calculating stats:', error);
    // Fallback mock data - using hardcoded values since we can't access the try block variables
    return {
      totalUsers: 0,
      customerCount: 0,
      ownerCount: 0,
      providerCount: 0,
      recentBookings: []
    };
  }
};

// Keep all your other existing service functions
export const getUsers = async () => {
  const response = await axios.get(`${API_URL}/users`, getAuthHeaders());
  return response.data.data;
};

export const getUsersByType = async (type) => {
  const response = await axios.get(
    `${API_URL}/users/type/${type}`,
    getAuthHeaders()
  );
  return response.data.data;
};


// Add this to your existing adminService.js
export const createUser = async (userData) => {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/auth/signup', 
      userData,
      getAuthHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Search users by email
export const searchUsersByEmail = async (email) => {
  try {
    const response = await axios.get(
      `${API_URL}/users/search`,
      {
        ...getAuthHeaders(),
        params: { email }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(
      `${API_URL}/users/${userId}`,
      userData,
      getAuthHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/users/${userId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Impersonate user
export const impersonateUser = async (userId) => {
  // Hardcoded user credentials
  const testUsers = {
    1: { // First test user
      email: "rahaf@gmail.com",
      password: "Rahaf12345"
    },
    2: { // Second test user
      email: "aya.ja@gmail.com", 
      password: "Aya12345"
    }
  };

  try {
    // Find the test user by ID
    const testUser = testUsers[userId];
    if (!testUser) {
      throw new Error(`No test user configured for ID ${userId}`);
    }

    // Simulate login with hardcoded credentials
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    // Clear current user data
    localStorage.clear();

    // Store new tokens (adjust based on your actual API response)
    localStorage.setItem('token', response.data.accessToken);
    localStorage.setItem('userType', response.data.user.type);
    localStorage.setItem('userId', response.data.user.id);

    return response.data;
  } catch (error) {
    console.error('Impersonation failed:', error);
    throw error;
  }
};

export default {
  getAdminStats,
  getUsers,
  getUsersByType,
  searchUsersByEmail,
  updateUser,
  deleteUser,
  impersonateUser,
  createUser
};