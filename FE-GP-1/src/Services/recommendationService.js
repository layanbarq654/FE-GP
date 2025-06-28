// src/services/recommendationService.js

// src/services/recommendationService.js
export const getLocalRecommendations = async (limit = 5) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');
    
    const response = await fetch(
      `http://localhost:3000/api/recommendations/local?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching local recommendations:', error);
    return [];
  }
};

// Similar updates for getCityRecommendations and getSimilarRecommendations
  
  export const getCityRecommendations = async (cityId, limit = 5) => {
    try {
      const response = await fetch(`http://localhost:3000/api/recommendations/city?cityId=${cityId}&limit=${limit}`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching city recommendations:', error);
      return [];
    }
  };
  
  export const getSimilarRecommendations = async (hallId, limit = 3) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      
      if (!hallId) {
        throw new Error('No hallId provided for similar recommendations');
      }
  
      const response = await fetch(
        `http://localhost:3000/api/recommendations/similar?hallId=${hallId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching similar recommendations:', error);
      return [];
    }
  };