import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  getRecommendedThirdParties, 
  getThirdPartyDetails, 
  bookThirdPartyService, 
  searchThirdParties 
} from '../Services/CustomerService';
import Header from '../components/Header';
import './ThirdPartiesPage.css';
import ChatPopup from '../components/ChatPopup';

const ThirdPartiesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hallId } = useParams();
  const [thirdParties, setThirdParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [bookingData, setBookingData] = useState({
    startTime: '',
    endTime: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    type: '',
    city: ''
  });
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [fakeChatData, setFakeChatData] = useState({
    threads: [],
    messages: []
  });

  // Get hall booking info from location state
  const { hallBookingId, hallBookingTimes } = location.state || {};

  useEffect(() => {
    if (!hallId) {
      setError("Missing hall ID parameter");
      setLoading(false);
      return;
    }
  
    fetchThirdParties();
  }, [hallId, searchFilters]);

  const fetchThirdParties = async () => {
    try {
      setLoading(true);
      let data;
      
      if (searchFilters.type || searchFilters.city) {
        data = await searchThirdParties({
          type: searchFilters.type,
          city: searchFilters.city,
          hallId: hallId
        });
      } else {
        data = await getRecommendedThirdParties(hallId);
      }
      
      setThirdParties(data);
    } catch (err) {
      console.error('Error fetching third parties:', err);
      setError(err.message || 'Failed to load third parties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchThirdParties();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setSearchFilters({
      type: '',
      city: ''
    });
  };

  const handleCompanyClick = async (companyId) => {
    try {
      const companyDetails = await getThirdPartyDetails(companyId);
      setSelectedCompany(companyDetails);
      setBookingData({ startTime: '', endTime: '' });
      setBookingError('');
      setShowDetailsPopup(true);
    } catch (err) {
      setError(err.message || 'Failed to load company details');
    }
  };

  const handleBookService = async () => {
    try {
      if (!localStorage.getItem('token')) {
        navigate('/login');
        return;
      }

      if (!hallBookingId) {
        throw new Error("Missing hall booking reference");
      }

      if (!bookingData.startTime || !bookingData.endTime) {
        throw new Error("Please select both start and end times");
      }

      if (bookingData.startTime >= bookingData.endTime) {
        throw new Error("End time must be after start time");
      }

      const formatTime = (t) => t.length === 5 ? `${t}:00` : t;

      await bookThirdPartyService({
        bookingId: hallBookingId,
        companyId: selectedCompany.id,
        startTime: formatTime(bookingData.startTime),
        endTime: formatTime(bookingData.endTime)
      });

      setShowDetailsPopup(false);
      navigate('/my-bookings', { 
        state: { 
          success: true,
          message: "Service booked successfully!"
        } 
      });
    } catch (err) {
      if (err.message.includes('Session expired')) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setBookingError(err.message);
      }
    }
  };

  const handleChatAndBook = () => {
    if (!bookingData.startTime || !bookingData.endTime) {
      setBookingError("Please select both start and end times before chatting");
      return;
    }

    // Create fake chat thread
    const fakeThread = {
      id: Date.now(),
      recipient_name: selectedCompany.name,
      last_message: `Booking request for ${bookingData.startTime} to ${bookingData.endTime}`,
      last_message_time: new Date().toISOString(),
      unread_count: 0
    };

    // Create initial message
    const initialMessage = {
      id: 1,
      sender_type: 'customer',
      message: `Hi, I want to book your ${selectedCompany.category_name} service from ${bookingData.startTime} to ${bookingData.endTime}.`,
      sent_at: new Date().toISOString(),
      read_at: null
    };

    // Set fake chat data
    setFakeChatData({
      threads: [fakeThread],
      messages: [initialMessage]
    });

    // Open chat popup
    setShowChatPopup(true);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (!hallId) {
    return (
      <div className="error-message">
        <p>Missing hall ID parameter</p>
        <button onClick={() => navigate('/my-bookings')}>
          Back to My Bookings
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="third-parties-container">
        <Header />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading third party services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="third-parties-container">
        <Header />
        <div className="error-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>{error}</p>
          <button onClick={handleBackClick} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header onChatClick={() => setShowChatPopup(true)} />
      <div className="third-parties-container">
        <div className="page-header-container">
          <div className="page-header-left">
            <button className="back-button" onClick={handleBackClick}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h2 className="page-title">Recommended Services</h2>
          </div>
          
          <div className="filter-section">
            <div className="filter-control">
              <select
                id="type"
                name="type"
                value={searchFilters.type}
                onChange={handleFilterChange}
                className="compact-select"
              >
                <option value="">All Types</option>
                <option value="catering">Catering</option>
                <option value="photography">Photography</option>
                <option value="decoration">Decoration</option>
                <option value="music">Music</option>
              </select>
            </div>
            
            <div className="filter-control">
              <input
                type="text"
                id="city"
                name="city"
                placeholder="City"
                value={searchFilters.city}
                onChange={handleFilterChange}
                className="compact-input"
              />
            </div>
          </div>
        </div>

        <div className="third-parties-grid">
          {thirdParties.length > 0 ? (
            thirdParties.map((service) => (
              <div key={service.id} className="service-card" onClick={() => handleCompanyClick(service.id)}>
                <div className="service-image">
                  <img 
                    src={service.image_url || '/default-service.jpg'} 
                    alt={service.name}
                    onError={(e) => { e.target.src = '/default-service.jpg'; }}
                  />
                </div>
                <div className="service-info">
                  <h3 className="service-name">{service.name}</h3>
                  <div className="service-meta">
                    <span className="service-category">{service.category_name}</span>
                    <span className="service-location">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#6B7280"/>
                      </svg>
                      {service.city_name}
                    </span>
                  </div>
                  <div className="service-price">${service.price_per_party} per event</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No services found matching your criteria.</p>
              <button onClick={resetFilters} className="reset-button">
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        {showChatPopup && (
          <ChatPopup 
            onClose={() => setShowChatPopup(false)}
            initialThreadId={fakeChatData.threads[0]?.id}
            initialRecipient={selectedCompany?.name}
            initialMessages={fakeChatData.messages}
          />
        )}

        {showDetailsPopup && selectedCompany && (
          <div className="company-details-popup">
            <div className="popup-content">
              <button 
                className="close-popup"
                onClick={() => setShowDetailsPopup(false)}
              >
                &times;
              </button>

              <div className="company-header">
                <h3>{selectedCompany.name}</h3>
                <div className="company-meta">
                  <span className="category">{selectedCompany.category_name}</span>
                  <span className="location">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#6B7280"/>
                    </svg>
                    {selectedCompany.city_name}
                  </span>
                </div>
              </div>

              <div className="company-details">
                <div className="detail-item">
                  <span className="label">Price:</span>
                  <span className="value">${selectedCompany.price_per_party} per event</span>
                </div>

                <div className="booking-form">
                  <h4>Book This Service</h4>
                  
                  <div className="time-selection">
                    <div className="form-group">
                      <label>Start Time ({hallBookingTimes.startTime} - {hallBookingTimes.endTime})</label>
                      <input
                        type="time"
                        value={bookingData.startTime}
                        min={hallBookingTimes.startTime}
                        max={hallBookingTimes.endTime}
                        onChange={(e) => {
                          setBookingData({
                            ...bookingData,
                            startTime: e.target.value,
                            endTime: e.target.value >= bookingData.endTime ? '' : bookingData.endTime
                          });
                          setBookingError('');
                        }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>End Time</label>
                      <input
                        type="time"
                        value={bookingData.endTime}
                        min={bookingData.startTime || hallBookingTimes.startTime}
                        max={hallBookingTimes.endTime}
                        onChange={(e) => {
                          setBookingData({
                            ...bookingData,
                            endTime: e.target.value
                          });
                          setBookingError('');
                        }}
                        required
                      />
                    </div>
                  </div>

                  {bookingError && (
                    <div className="error-message">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {bookingError}
                    </div>
                  )}

                  <button 
                    className="combined-button"
                    onClick={handleChatAndBook}
                    disabled={!bookingData.startTime || !bookingData.endTime}
                  >
                    <span>Chat with owner and book</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 10H8.01M12 10H12.01M16 10H16.01M9 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V14C21 15.1046 20.1046 16 19 16H14L9 21V16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThirdPartiesPage;