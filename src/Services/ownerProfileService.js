// src/Services/ownerProfileService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/profile';

export const getOwnerProfile = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // Return the data property if it exists, otherwise return the whole response
        return response.data?.data || response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
};


export const updateOwnerProfile = async (profileData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(API_URL, profileData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data?.data || response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
};