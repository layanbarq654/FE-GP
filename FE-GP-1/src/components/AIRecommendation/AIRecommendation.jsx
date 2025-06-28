// src/components/AIRecommendation/AIRecommendation.jsx
import React, { useState, useEffect } from 'react';
import { getLocalRecommendations, getCityRecommendations, getSimilarRecommendations } from '../../Services/recommendationService';

const AIRecommendation = ({ userCityId, userBookings = [] }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('local');
  const [error, setError] = useState(null);

  const fetchRecommendations = async (type) => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to view recommendations');

      switch (type) {
        case 'local':
          data = await getLocalRecommendations();
          break;
        case 'city':
          if (userCityId) {
            data = await getCityRecommendations(userCityId);
          }
          break;
        case 'similar':
          if (userBookings.length > 0) {
            // Get the most recent booking with a valid hallId
            const recentBooking = userBookings.find(booking => booking.hallId);
            if (!recentBooking) {
              throw new Error('No valid bookings found');
            }
            data = await getSimilarRecommendations(recentBooking.hallId);
          } else {
            throw new Error('No booking history available');
          }
          break;
        default:
          data = await getLocalRecommendations();
      }
      
      setRecommendations(data);
      setActiveTab(type);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load local recommendations by default
    fetchRecommendations('local');
  }, []);

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'local': return 'Near You';
      case 'city': return 'In Your City';
      case 'similar': return 'Similar to Your Bookings';
      default: return tab;
    }
  };

  return (
    <div className="ai-recommendation">
      <h2>AI-Powered Hall Recommendations</h2>
      
      <div className="recommendation-tabs">
        <button 
          onClick={() => fetchRecommendations('local')}
          className={activeTab === 'local' ? 'active' : ''}
        >
          Near You
        </button>
        
        {userCityId && (
          <button 
            onClick={() => fetchRecommendations('city')}
            className={activeTab === 'city' ? 'active' : ''}
          >
            In Your City
          </button>
        )}
        
        {userBookings.length > 0 && (
          <button 
            onClick={() => fetchRecommendations('similar')}
            className={activeTab === 'similar' ? 'active' : ''}
          >
            Similar to Your Bookings
          </button>
        )}
      </div>
      
      {loading && <div className="loading">Loading recommendations...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && recommendations.length === 0 && (
        <div className="no-results">No recommendations found for this category.</div>
      )}
      
      <div className="recommendation-list">
        {recommendations.map((hall) => (
          <div key={hall.id} className="hall-card">
            <img src={hall.image_url} alt={hall.name} className="hall-image" />
            <div className="hall-info">
              <h3>{hall.name}</h3>
              <p>📍 {hall.city_name}</p>
              <p>⏰ {hall.open_time} - {hall.close_time}</p>
              <p>💰 ${hall.price_per_hour}/hour</p>
              <p>👥 Capacity: {hall.capacity}</p>
              <button className="book-button">Book Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendation;