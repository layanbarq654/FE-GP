// src/services/hallService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/halls';

// In hallService.js, update the validateHallData function:
const validateHallData = (hall) => {
  if (!hall) return null;
  
  return {
    id: hall.id || null,
    name: hall.name || '',
    image_url: hall.image_url || '',
    price_per_hour: hall.price_per_hour !== undefined ? Number(hall.price_per_hour) : '',
    city_id: hall.city_id ? Number(hall.city_id) : 1,
    capacity: hall.capacity !== undefined ? Number(hall.capacity) : '',
    open_day: hall.open_day ? Number(hall.open_day) : 1,
    close_day: hall.close_day ? Number(hall.close_day) : 5,
    open_time: hall.open_time || '',
    close_time: hall.close_time || ''
  };
};

export const getOwnerHalls = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get(`${API_URL}/my-halls`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    // Normalize the response data
    const hallsData = Array.isArray(response.data) 
      ? response.data 
      : response.data?.halls || response.data?.data || [];
    
    return hallsData.map(hall => ({
      id: hall.id,
      name: hall.name,
      price_per_hour: hall.price_per_hour,
      city_id: hall.city_id,
      capacity: hall.capacity,
      open_day: hall.open_day,
      close_day: hall.close_day,
      open_time: hall.open_time,
      close_time: hall.close_time,
      image_url: hall.image_url
    }));
  } catch (error) {
    console.error('Fetch halls error:', error);
    return [];
  }
};

export const createHall = async (hallData) => {
  const token = localStorage.getItem('token');
  try {
    // Prepare data for backend
    const payload = {
      name: hallData.name,
      open_day: Number(hallData.open_day),
      close_day: Number(hallData.close_day),
      open_time: hallData.open_time,
      close_time: hallData.close_time,
      price_per_hour: Number(hallData.price_per_hour),
      city_id: Number(hallData.city_id),
      capacity: hallData.capacity ? Number(hallData.capacity) : null,
      image_url: hallData.image_url || null
    };

    const response = await axios.post(API_URL, payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return validateHallData(response.data);
  } catch (error) {
    console.error('Create hall error:', error);
    throw new Error(error.response?.data?.message || 'Failed to create hall');
  }
};

export const updateHall = async (hallId, hallData) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.patch(
      `${API_URL}/${hallId}`,
      hallData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return {
      id: hallId,
      name: response.data.name || hallData.name,
      price_per_hour: response.data.price_per_hour || hallData.price_per_hour,
      city_id: response.data.city_id || hallData.city_id,
      capacity: response.data.capacity || hallData.capacity,
      open_day: response.data.open_day || hallData.open_day,
      close_day: response.data.close_day || hallData.close_day,
      open_time: response.data.open_time || hallData.open_time,
      close_time: response.data.close_time || hallData.close_time,
      image_url: response.data.image_url || hallData.image_url
    };
  } catch (error) {
    console.error('Update hall error:', error);
    throw new Error(error.response?.data?.message || 'Failed to update hall');
  }
};