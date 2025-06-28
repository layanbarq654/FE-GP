import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../Services/authService';
import { getRecommendedHalls, searchHalls } from '../Services/CustomerService';
import axios from 'axios';
import NotificationIcon from '../components/NotificationIcon';
import './CustomerDashboard.css';
import CustomerProfile from './CustomerProfile';
import AIRecommendation from '../components/AIRecommendation/AIRecommendation';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [state, setState] = useState({
    halls: [],
    loading: {
      halls: true,
    },
    error: {
      halls: null,
    },
    filters: {
      location: '',
      date: '',
      startTime: '',
      endTime: '',
      guests: 1,
      maxPrice: ''
    }
  });

  // Chat related states with hardcoded data
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatThreads, setChatThreads] = useState([
    {
      id: 1,
      recipient_name: "Millinium",
      last_message: "We are looking forward to your visit",
      last_message_time: "2025-06-15T14:30:00Z",
      unread_count: 2,
      recipient_avatar: "/hall1.jpg"
    },
    {
      id: 2,
      recipient_name: "5 Stars Hall",
      last_message: "Hi, how can i help you?",
      last_message_time: "2025-06-15T09:15:00Z",
      unread_count: 0,
      recipient_avatar: "/hall2.jpg"
    },
    {
      id: 3,
      recipient_name: "Photo Magic",
      last_message: "The deposit has been received",
      last_message_time: "2025-06-14T16:45:00Z",
      unread_count: 1,
      recipient_avatar: "/hall3.jpg"
    }
  ]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeRecipient, setActiveRecipient] = useState(null);
  
  const mockChatMessages = {
    1: [
      {
        id: 101,
        sender_type: "customer",
        message: "Hi, were is the exact location of the hall?",
        sent_at: "2023-10-15T10:30:00Z",
        read_at: "2023-10-15T10:35:00Z"
      },
      {
        id: 102,
        sender_type: "owner",
        message: "Hello! Rafedia Street",
        sent_at: "2023-10-15T11:15:00Z",
        read_at: null
      },
      {
        id: 103,
        sender_type: "customer",
        message: "Thanks",
        sent_at: "2023-10-15T14:30:00Z",
        read_at: null
      },
      {
        id: 104,
        sender_type: "owner",
        message: "You're welcome!",
        sent_at: "2023-10-15T14:45:00Z",
        read_at: null
      },
      {
        id: 105,
        sender_type: "owner",
        message: "We are looking forward to your visit",
        sent_at: "2023-10-15T15:00:00Z",
        read_at: null
      }
    ],
    2: [
      {
        id: 201,
        sender_type: "customer",
        message: "Hi",
        sent_at: "2023-10-14T08:30:00Z",
        read_at: "2023-10-14T08:45:00Z"
      },
      {
        id: 202,
        sender_type: "owner",
        message: "Hi, how can i help you?",
        sent_at: "2023-10-14T09:15:00Z",
        read_at: null
      }
    ],
    3: [
      {
        id: 301,
        sender_type: "customer",
        message: "We've sent the deposit as discussed",
        sent_at: "2023-10-12T15:30:00Z",
        read_at: "2023-10-12T15:45:00Z"
      },
      {
        id: 302,
        sender_type: "owner",
        message: "The deposit has been received, thank you!",
        sent_at: "2023-10-12T16:45:00Z",
        read_at: null
      }
    ]
  };

  // Other states
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const [userCityId, setUserCityId] = useState(null);
  const [userBookings, setUserBookings] = useState([]);

  const BASE_URL = "http://localhost:3000/api/customer";

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      throw new Error('No authentication token found');
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    };
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const fetchChatThreads = async () => {
    setLoadingChats(true);
    // Simulate API call with hardcoded data
    setTimeout(() => {
      setLoadingChats(false);
    }, 500);
  };

  const fetchChatMessages = async (threadId, recipientName) => {
    setLoadingMessages(true);
    // Use hardcoded data
    setTimeout(() => {
      setChatMessages(mockChatMessages[threadId] || []);
      setActiveChat(threadId);
      setActiveRecipient(recipientName);
      setLoadingMessages(false);
    }, 500);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      sender_type: 'customer',
      message: newMessage,
      sent_at: new Date().toISOString(),
      read_at: null
    };
    
    // Optimistic update
    setChatMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Simulate server response
    setTimeout(() => {
      setChatMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, id: tempId + 1 } : msg
      ));
    }, 300);
  };

  const fetchHalls = async (useFilters = false) => {
    try {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, halls: true },
        error: { ...prev.error, halls: null }
      }));

      let data;
      if (useFilters) {
        const apiFilters = {
          location: state.filters.location,
          minCapacity: state.filters.guests,
          maxPrice: state.filters.maxPrice,
          date: state.filters.date,
          startTime: state.filters.startTime,
          endTime: state.filters.endTime
        };
        data = await searchHalls(apiFilters);
      } else {
        data = await getRecommendedHalls();
      }

      setState(prev => ({
        ...prev,
        halls: Array.isArray(data) ? data : [],
        loading: { ...prev.loading, halls: false }
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: { ...prev.error, halls: err.message },
        loading: { ...prev.loading, halls: false }
      }));
    }
  };

  const fetchUserBookings = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/bookings`,
        getAuthHeaders()
      );
      const bookings = response.data.data.map(booking => ({
        ...booking,
        hallId: booking.hall_id || booking.hallId
      }));
      setUserBookings(bookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setUserBookings([]);
    }
  };

  const verifyAuthAndFetch = async () => {
    const userType = localStorage.getItem("userType");
    if (userType !== "1") {
      navigate('/login');
      return;
    }
    
    try {
      const profileResponse = await axios.get(
        `${BASE_URL}/profile`,
        getAuthHeaders()
      );
      setUserCityId(profileResponse.data.city_id);
      await fetchUserBookings();
      await fetchHalls();
    } catch (err) {
      console.error("Error fetching user data:", err);
      await fetchHalls();
    }
  };

  useEffect(() => {
    verifyAuthAndFetch();
  }, [navigate]);

  useEffect(() => {
    if (showChatPopup) {
      fetchChatThreads();
    }
  }, [showChatPopup]);

  const handleSearch = () => {
    fetchHalls(true);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [name]: value }
    }));
  };

  const handleHallClick = (hallId) => {
    navigate(`/halls/${hallId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const StarRating = ({ rating }) => {
    const numericRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="star-rating">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star full">★</span>
        ))}
        {hasHalfStar && <span className="star half">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star empty">★</span>
        ))}
        <span className="rating-value">({numericRating.toFixed(1)})</span>
      </div>
    );
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth 
        : scrollLeft + clientWidth;
      carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="customer-dashboard">
      {/* Header Section */}
      <div className="dark-section">
        <div className="menu-container">
          <div className="menu">
            <div className="logo">Nadeem</div>
            <div className="header-right">
              <NotificationIcon userType="customer" />

              <div 
                className="header-icon" 
                onClick={() => setShowAIRecommendation(true)}
                title="AI Booking Plan"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <path d="M18 8l3 3-3 3"></path>
                  <path d="M6 8l-3 3 3 3"></path>
                </svg>
              </div>

              <div className="header-icon" onClick={() => navigate('/my-bookings')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              <div className="header-icon" onClick={() => setShowChatPopup(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {chatThreads.some(t => t.unread_count > 0) && (
                  <span className="notification-badge">
                    {chatThreads.reduce((sum, thread) => sum + thread.unread_count, 0)}
                  </span>
                )}
              </div>

              <div className="header-icon" onClick={() => navigate('/customer-profile')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <div className="header-icon" onClick={handleLogout}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="background-container">
        <div className="hero-text-container">
          <span>
            PLAN IT. BOOK IT.<br />
            CELEBRATE IT.<br />
            <button className="start-button" onClick={() => document.querySelector('.filtering').scrollIntoView({ behavior: 'smooth' })}>
              Get Started &gt;
            </button>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="filtering">
        <div className="filter-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="City or area"
            value={state.filters.location}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="event-date">Event Date</label>
          <input
            type="date"
            id="event-date"
            name="date"
            value={state.filters.date}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="start-hour">Start Hour</label>
          <input
            type="time"
            id="start-hour"
            name="startTime"
            value={state.filters.startTime}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="end-hour">End Hour</label>
          <input
            type="time"
            id="end-hour"
            name="endTime"
            value={state.filters.endTime}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="guests">Minimum Guests</label>
          <input
            type="number"
            id="guests"
            name="guests"
            min="1"
            value={state.filters.guests}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="maxPrice">Max Price/Hour ($)</label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            min="0"
            step="50"
            value={state.filters.maxPrice}
            onChange={handleFilterChange}
          />
        </div>
        <button className="search-button" onClick={handleSearch}>
          Search Halls
        </button>
      </div>

      {/* Halls Section with Carousel */}
      <div className="carousel-section">
        <h2>{state.filters.location ? `Halls in ${state.filters.location}` : 'Recommended Halls'}</h2>
        {state.loading.halls ? (
          <div className="loading">Loading halls...</div>
        ) : state.error.halls ? (
          <div className="error">{state.error.halls}</div>
        ) : state.halls.length === 0 ? (
          <div className="no-results">
            No halls found matching your criteria. Try adjusting your filters.
          </div>
        ) : (
          <div className="carousel-container">
            <button 
              className="carousel-button left" 
              onClick={() => scrollCarousel('left')}
            >
              &lt;
            </button>
            <div className="halls-carousel" ref={carouselRef}>
              {state.halls.map((hall) => (
                <div 
                  key={hall.id} 
                  className="hall-card"
                  onClick={() => handleHallClick(hall.id)}
                >
                  <div className="hall-image-container">
                    <img
                      src={hall.image_url || '/default-hall.jpg'}
                      alt={hall.name}
                      onError={(e) => {
                        e.target.src = '/default-hall.jpg';
                      }}
                    />
                  </div>
                  <div className="hall-info">
                    <h3>{hall.name}</h3>
                    <p className="location">
                      <i className="fas fa-map-marker-alt"></i> {hall.city_name}
                    </p>
                    <div className="rating-container">
                      <StarRating rating={hall.avg_rating} />
                      <span className="review-count">({hall.rating_count || 0} reviews)</span>
                    </div>
                    {hall.price_per_hour && (
                      <p className="price">From ${hall.price_per_hour}/hour</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button 
              className="carousel-button right" 
              onClick={() => scrollCarousel('right')}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* AI Recommendation Popup */}
      {showAIRecommendation && (
        <div className="ai-recommendation-popup">
          <div className="ai-popup-header">
            <h3>AI-Powered Booking Plan</h3>
            <button 
              className="close-ai-popup" 
              onClick={() => setShowAIRecommendation(false)}
            >
              ×
            </button>
          </div>
          <div className="ai-recommendation-content">
            <AIRecommendation 
              userCityId={userCityId} 
              userBookings={userBookings} 
            />
          </div>
        </div>
      )}

      {/* Chat Popup */}
      {showChatPopup && (
        <div className="chat-popup">
          <div className="chat-popup-header">
            {activeChat ? (
              <>
                <button 
                  className="back-button"
                  onClick={() => {
                    setActiveChat(null);
                    setChatMessages([]);
                    setActiveRecipient(null);
                  }}
                >
                  &larr;
                </button>
                <h3>{activeRecipient || 'Chat'}</h3>
              </>
            ) : (
              <h3>Your Chats</h3>
            )}
            <button 
              className="close-chat-popup" 
              onClick={() => {
                setShowChatPopup(false);
                setActiveChat(null);
                setChatMessages([]);
                setActiveRecipient(null);
              }}
            >
              ×
            </button>
          </div>
          
          {activeChat ? (
            <div className="chat-messages-container">
              <div className="messages-list">
                {loadingMessages ? (
                  <div className="loading-messages">Loading messages...</div>
                ) : chatMessages.length === 0 ? (
                  <div className="no-messages">No messages yet. Start the conversation!</div>
                ) : (
                  <>
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`message ${msg.sender_type === 'customer' ? 'sent' : 'received'}`}
                      >
                        <p>{msg.message}</p>
                        <span className="message-time">
                          {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender_type === 'customer' && msg.read_at && (
                          <span className="read-indicator">✓ Read</span>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              <div className="message-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button 
                  className="send-button"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-threads">
              {loadingChats ? (
                <div className="loading-chats">Loading chats...</div>
              ) : chatThreads.length === 0 ? (
                <div className="no-chats">You don't have any chats yet</div>
              ) : (
                chatThreads.map(thread => (
                  <div 
                    key={thread.id} 
                    className={`chat-thread ${thread.unread_count > 0 ? 'unread' : ''}`}
                    onClick={() => fetchChatMessages(thread.id, thread.recipient_name)}
                  >
                    <div className="chat-recipient">
                      {thread.recipient_name}
                      {thread.unread_count > 0 && (
                        <span className="unread-badge">{thread.unread_count}</span>
                      )}
                    </div>
                    <div className="chat-preview">
                      <p>{thread.last_message}</p>
                      <span>{new Date(thread.last_message_time).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {showProfilePopup && (
        <CustomerProfile onClose={() => setShowProfilePopup(false)} />
      )}

      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/help">Help Center</a></li>
              <li>Email: support@venuefinder.com</li>
              <li>Phone: +1 (555) 123-4567</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; {new Date().getFullYear()} VenueFinder. All rights reserved.</p>
            <div className="footer-links">
              <a href="/sitemap">Sitemap</a>
              <span className="divider">|</span>
              <a href="/accessibility">Accessibility</a>
              <span className="divider">|</span>
              <a href="/careers">Careers</a>
              <span className="divider">|</span>
              <a href="/blog">Blog</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerDashboard;