import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerBookings, getRecommendedHalls } from '../Services/CustomerService';
import Header from '../components/Header';
import ChatPopup from '../components/ChatPopup';
import './MyBookingsPage.css';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [hallNameToIdMap, setHallNameToIdMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showChatPopup, setShowChatPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First fetch all halls to create name-to-ID mapping
        const halls = await getRecommendedHalls();
        const nameToId = {};
        halls.forEach(hall => {
          nameToId[hall.name] = hall.id;
        });
        setHallNameToIdMap(nameToId);
        
        // Then fetch bookings
        const bookingsData = await getCustomerBookings();
        setBookings(bookingsData);
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      approved: { class: 'approved', text: 'Approved' },
      waiting: { class: 'waiting', text: 'Pending' },
      rejected: { class: 'rejected', text: 'Rejected' }
    };
    const statusInfo = statusMap[status] || { class: 'waiting', text: 'Pending' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const handleBrowseServices = (booking) => {
    const hallId = hallNameToIdMap[booking.hall_name];
    if (!hallId) {
      alert('Hall information not available. Please try again later.');
      return;
    }
    navigate(`/halls/${hallId}/services`, {
      state: {
        hallBookingId: booking.id,
        hallBookingTimes: {
          startTime: booking.event_start_time,
          endTime: booking.event_end_time
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="bookings-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookings-container">
        <div className="error-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-button">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header onChatClick={() => setShowChatPopup(true)} />
    <div className="bookings-container">
      <header className="bookings-header">
        <button className="back-button" onClick={() => navigate(-1)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
        </button>
        <h2 className="page-title">My Bookings</h2>
      </header>

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.172 16.242L12 13.414L14.828 16.242L16.242 14.828L13.414 12L16.242 9.172L14.828 7.758L12 10.586L9.172 7.758L7.758 9.172L10.586 12L7.758 14.828L9.172 16.242ZM12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22Z" fill="#6B7280"/>
          </svg>
          <p>You don't have any bookings yet</p>
          <button 
            className="primary-button"
            onClick={() => navigate('/halls')}
          >
            Browse Halls
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h3 className="hall-name">{booking.hall_name}</h3>
                <div className="booking-meta">
                  <span className="booking-date">{formatDate(booking.event_date)}</span>
                  {getStatusBadge(booking.approval)}
                </div>
              </div>

              <div className="booking-details">
                <div className="time-price">
                  <div className="time-range">
                    {formatTime(booking.event_start_time)} - {formatTime(booking.event_end_time)}
                  </div>
                  <div className="total-price">${booking.total_hall_price}</div>
                </div>

                {booking.companies.length > 0 && (
                  <div className="companies-section">
                    <h4>Additional Services:</h4>
                    <div className="companies-list">
                      {booking.companies.map((company) => (
                        <div key={company.id} className="company-item">
                          <div className="company-info">
                            <span className="company-name">{company.company_name}</span>
                            <span className="company-category">{company.category_name}</span>
                          </div>
                          <div className="company-time-price">
                            <span className="company-time">
                              {formatTime(company.start_time)}-{formatTime(company.end_time)}
                            </span>
                            <span className="company-price">${company.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {showChatPopup && (
        <ChatPopup onClose={() => setShowChatPopup(false)} />
      )}
                {booking.approval === 'approved' && (
                  <button 
                    className="browse-services-btn"
                    onClick={() => handleBrowseServices(booking)}
                  >
                    Browse Services
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default MyBookingsPage;