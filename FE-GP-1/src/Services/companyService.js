// src/services/companyService.js
import axios from 'axios'; // Keep this, as apiCall uses axios directly
import { getToken } from './authService';
// REMOVE THIS LINE: import api from './api'; // This line is causing the error

// Define specific base URLs for different API sections
const API_COMPANIES_URL = 'http://localhost:3000/api/third-party/companies';
const API_PROFILE_URL = 'http://localhost:3000/api/third-party/profile'; // Endpoint for third-party user profile

/**
 * Helper function to standardize API calls, handle authentication, and errors.
 * @param {string} method - HTTP method (e.g., 'get', 'post', 'patch', 'delete').
 * @param {string} url - The full URL for the API endpoint.
 * @param {Object} [data=null] - Data payload for 'post' or 'patch' requests.
 * @returns {Promise<Object>} The response data from the API.
 * @throws {Error} If the API call fails or authentication token is missing.
 */
const apiCall = async (method, url, data = null) => {
    const token = getToken(); // Get token from authService
    if (!token) {
        const error = new Error('Authentication required');
        error.response = { status: 401, data: { message: 'Authentication token missing.' } };
        throw error;
    }

    try {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        let response;
        switch (method.toLowerCase()) {
            case 'get':
                response = await axios.get(url, config);
                break;
            case 'post':
                response = await axios.post(url, data, config);
                break;
            case 'patch': // Correctly handles PATCH
                response = await axios.patch(url, data, config);
                break;
            case 'put':
                response = await axios.put(url, data, config);
                break;
            case 'delete':
                response = await axios.delete(url, config);
                break;
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
        return response.data; // apiCall already returns response.data, so other functions don't need .data.data
    } catch (error) {
        console.error(`API Call Error (${method} ${url}):`, error.response?.data || error.message || error);
        throw error;
    }
};

// --- API Functions for Managing Third-Party Companies ---

export const getThirdPartyCompanies = async () => {
    const response = await apiCall('get', API_COMPANIES_URL);
    return response.data || []; // apiCall returns response.data, so check response.data.data
};

export const createThirdPartyCompany = async (companyData) => {
    const response = await apiCall('post', API_COMPANIES_URL, companyData);
    return response.data; // apiCall returns response.data, so check response.data.data
};

export const updateThirdPartyCompany = async (companyId, updatedData) => {
    const response = await apiCall('patch', `${API_COMPANIES_URL}/${companyId}`, updatedData);
    return response; // apiCall returns response.data, this was already correct to return the full response from apiCall
};

export const deleteThirdPartyCompany = async (companyId) => {
    const response = await apiCall('delete', `${API_COMPANIES_URL}/${companyId}`);
    return response; // apiCall returns response.data, this was already correct to return the full response from apiCall
};

// --- API Functions for Third-Party User Profile ---

export const getThirdPartyProfile = async () => {
    const response = await apiCall('get', API_PROFILE_URL);
    return response.data; // apiCall returns response.data, so check response.data.data
};

// MODIFIED: To use the existing apiCall helper
export const getCompanyBookings = async (companyId) => {
    try {
        // Use apiCall instead of a direct axios or 'api' instance
        const response = await apiCall('get', `${API_COMPANIES_URL}/${companyId}/bookings`);
        // apiCall already returns response.data, so you just need to access its 'data' property
        return response.data; // Assumes your backend returns { success: true, data: [...] }
    } catch (error) {
        console.error(`Error fetching bookings for company ${companyId}:`, error);
        throw error;
    }
};

/**
 * Updates the profile data for the authenticated third-party user using PATCH.
 * Corresponds to: PATCH /api/third-party/profile
 * @param {Object} profileData - The updated profile data.
 * @returns {Promise<Object>} A promise that resolves to the updated profile data.
 */
export const updateThirdPartyProfile = async (profileData) => {
    const response = await apiCall('patch', API_PROFILE_URL, profileData);
    return response.data; // apiCall returns response.data, so check response.data.data
};