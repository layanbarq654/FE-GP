import axios from 'axios';

const BASE_URL = "http://localhost:3000/api/customer";



export const getAuthHeaders = async () => {
  let token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = tokenPayload.exp * 1000 < Date.now();

    if (isExpired) {
      token = await refreshToken();
    }
  } catch (err) {
    console.error('Token parsing error:', err);
    throw new Error('Invalid token');
  }

  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken
    });

    localStorage.setItem('token', response.data.token);
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data.token;
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
    window.location.href = '/login';
    throw err;
  }
};

// Hall Services
export const getRecommendedHalls = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/recommendations/halls`, headers);
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error("Error fetching recommended halls:", error);
    throw error;
  }
};

export const searchHalls = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to params if they exist
    if (filters.location) params.append('location', filters.location);
    if (filters.minCapacity) params.append('minCapacity', filters.minCapacity);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.date) params.append('date', filters.date);
    if (filters.startTime) params.append('startTime', filters.startTime);
    if (filters.endTime) params.append('endTime', filters.endTime);
    
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${BASE_URL}/search/halls?${params.toString()}`,
      headers
    );
    
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error("Error searching halls:", error);
    throw error;
  }
};

export const getHallDetails = async (hallId) => {
  console.log(`Fetching hall details for ID: ${hallId}`);
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${BASE_URL}/halls/${hallId}`,
      headers
    );
    console.log('API Response:', response);
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "No data received from server");
    }
    return response.data.data;
  } catch (error) {
    console.error("Error fetching hall details:", {
      hallId,
      status: error.response?.status,
      error: error.response?.data || error.message
    });
    throw new Error(
      error.response?.data?.message || 
      `Failed to load hall details (${error.message})`
    );
  }
};

export const getRecommendedThirdParties = async (hallId) => {
  try {
    console.log('Making API call with hallId:', hallId);
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${BASE_URL}/recommendations/third-parties?hallId=${hallId}`,
      headers
    );
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error("Full API error details:", {
      config: error.config,
      response: error.response
    });
    throw error;
  }
};

export const getThirdPartyDetails = async (companyId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${BASE_URL}/third-parties/${companyId}`,
      headers
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching third party details:", error);
    throw error;
  }
};

// Booking Services
export const createHallBooking = async (bookingData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${BASE_URL}/bookings/halls`,
      bookingData,
      headers
    );
    return response.data;
  } catch (error) {
    console.error("Error creating hall booking:", {
      data: bookingData,
      status: error.response?.status,
      error: error.response?.data || error.message
    });
    throw new Error(
      error.response?.data?.message || 
      `Failed to create booking (${error.message})`
    );
  }
};

export const getCustomerBookings = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${BASE_URL}/bookings`,
      headers
    );
    return response.data?.data || [];
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    throw error;
  }
};

export const bookThirdPartyService = async (bookingData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${BASE_URL}/bookings/${bookingData.bookingId}/services`,
      {
        companyId: bookingData.companyId,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime
      },
      headers
    );
    return response.data;
  } catch (error) {
    console.error('Booking Service Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    
    if (error.response?.status === 403) {
      throw new Error('Session expired. Please login again.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to book service');
  }
};

export const submitHallReview = async (reviewData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${BASE_URL}/rates/halls`,
      reviewData,
      headers
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
};

export const searchThirdParties = async (filters) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.city) params.append('city', filters.city);
    if (filters.hallId) params.append('hallId', filters.hallId);
    
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${BASE_URL}/search/third-parties?${params.toString()}`,
      headers
    );
    
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error("Error searching third parties:", error);
    throw error;
  }
};

export const getChatThreads = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${BASE_URL}/chat/threads`,
      headers
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching chat threads:", error);
    throw error;
  }
};

export const getChatMessages = async (threadId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${BASE_URL}/chat/threads/${threadId}/messages`,
      headers
    );
    return response.data?.data || [];
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    throw error;
  }
};

export const createChatThread = async (companyId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${BASE_URL}/chat/threads`,
      { companyId },
      headers
    );
    return response.data;
  } catch (error) {
    console.error("Error creating chat thread:", error);
    throw error;
  }
};
// In CustomerService.js
export const initiateServiceBookingChat = async (companyId, categoryName, startTime, endTime) => {
  const headers = await getAuthHeaders();
  const bookingDetails = `Hi, I want to book your ${categoryName} service from ${startTime} to ${endTime}.`;
  
  const threadResponse = await axios.post(
    `${BASE_URL}/chat/threads`,
    { companyId },
    headers
  );
  
  await axios.post(
    `${BASE_URL}/chat/threads/${threadResponse.data.threadId}/messages`,
    { message: bookingDetails },
    headers
  );
  
  return {
    threadId: threadResponse.data.threadId,
    recipientName: threadResponse.data.recipientName
  };
};