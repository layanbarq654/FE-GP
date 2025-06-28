import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHallDetails } from '../Services/CustomerService';
import './HallDetailsPage.css';
import Header from '../components/Header';
import ChatPopup from '../components/ChatPopup';

const HallDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    value: 0,
    feedback: ''
  });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState('');

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const mapDayNumberToName = (dayNumber) => {
    const days = {
      1: 'Saturday',
      2: 'Sunday',
      3: 'Monday',
      4: 'Tuesday',
      5: 'Wednesday',
      6: 'Thursday',
      7: 'Friday'
    };
    return days[dayNumber] || '';
  };

  const handleBookClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: `/halls/${id}/book` } });
      return;
    }
    
    navigate(`/halls/${id}/book`, { 
      state: { 
        hall: {
          ...hall,
          id: id
        } 
      } 
    });
  }; 

  const handleStartChat = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: `/halls/${id}` } });
      return;
    }
    setShowChatPopup(true);
  };
        
  const formatAvailability = (hall) => {
    if (!hall) return 'Not available';

    const timeRange = hall.open_time && hall.close_time 
      ? `${formatTime(hall.open_time)} - ${formatTime(hall.close_time)}`
      : '';

    if (hall.operating_days) {
      const dayNumbers = hall.operating_days.split(',').map(Number);
      const days = dayNumbers.map(mapDayNumberToName).filter(Boolean);
      
      if (dayNumbers.length === 7) return (
        <div className="availability-display">
          <div className="availability-days">Open every day</div>
          <div className="availability-time">{timeRange}</div>
        </div>
      );
      
      if (dayNumbers.includes(1) && dayNumbers.includes(2) && dayNumbers.length === 2) return (
        <div className="availability-display">
          <div className="availability-days">Weekends</div>
          <div className="availability-time">{timeRange}</div>
        </div>
      );
      
      if (dayNumbers.length === 5 && !dayNumbers.includes(1) && !dayNumbers.includes(2)) return (
        <div className="availability-display">
          <div className="availability-days">Weekdays (Saturday to Wednesday)</div>
          <div className="availability-time">{timeRange}</div>
        </div>
      );
      
      if (dayNumbers.length === 6 && !dayNumbers.includes(7)) return (
        <div className="availability-display">
          <div className="availability-days">Saturday to Thursday</div>
          <div className="availability-time">{timeRange}</div>
        </div>
      );

      return (
        <div className="availability-display">
          <div className="availability-days">{days.join(', ')}</div>
          <div className="availability-time">{timeRange}</div>
        </div>
      );
    }
    
    return (
      <div className="availability-display">
        <div className="availability-time">{timeRange}</div>
      </div>
    );
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    try {
      setReviewError('');
      setReviewSuccess('');
      
      if (reviewForm.value === 0) {
        throw new Error('Please select a star rating');
      }

      if (!reviewForm.feedback.trim()) {
        throw new Error('Please write your feedback');
      }

      // Create a new review object
      const newReview = {
        customer_name: "You",
        value: reviewForm.value,
        feedback: reviewForm.feedback,
        created_at: new Date().toISOString()
      };

      // Update the hall state to include the new review
      setHall(prevHall => ({
        ...prevHall,
        recent_reviews: [newReview, ...(prevHall.recent_reviews || [])]
      }));
      
      setReviewSuccess('Thank you for your feedback!');
      setReviewForm({
        value: 0,
        feedback: ''
      });
      setShowReviewForm(false);
      
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    }
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStarClick = (ratingValue) => {
    setReviewForm(prev => ({
      ...prev,
      value: ratingValue
    }));
  };

  const renderStaticStars = (rating) => {
    return (
      <div className="static-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star-filled' : 'star-empty'}>
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchHallDetails = async () => {
      try {
        setLoading(true);
        const data = await getHallDetails(id);
        setHall(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHallDetails();
  }, [id]);

  if (loading) return <div className="loading">Loading hall details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!hall) return <div className="error">Hall not found</div>;

  return (
    <div> 
      <Header 
        onProfileIconClick={() => console.log('Profile clicked')}
        onChatClick={() => setShowChatPopup(true)}
      />
      <div className="hall-details-container">
        <div className="navigation-container">
          <button className="back-button" onClick={() => navigate(-1)}>
            &larr;
          </button>
        </div>

        <div className="hall-header">
          <h1>{hall.name}</h1>
          <p className="location">
            <i className="fas fa-map-marker-alt"></i> {hall.city_name}
          </p>
        </div>

        <div className="hall-main">
          <div className="left-column">
            <div className="image-container">
              <img
                className="hall-image"
                src={hall.image_url || '/default-hall.jpg'}
                alt={hall.name}
                onError={(e) => { e.target.src = '/default-hall.jpg'; }}
              />
            </div>

            <div className="hall-info-box">
              <section className="info-section">
                <h2>About This Hall</h2>
              </section>

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Capacity</span>
                  <span className="info-value">{hall.capacity || 'N/A'} people</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Price</span>
                  <span className="info-value">${hall.price_per_hour || 'N/A'}/hour</span>
                </div>
                <div className="info-item availability-item">
                  <span className="info-label">Availability</span>
                  <span className="info-value">
                    {formatAvailability(hall)}
                  </span>
                </div>
                {hall.features?.length > 0 && (
                  <div className="info-item">
                    <span className="info-label">Features</span>
                    <span className="info-value">{hall.features.join(', ')}</span>
                  </div>
                )}
              </div>
                
              <div className="action-buttons">
                <button className="book-button" onClick={handleBookClick}>Start Booking</button>
                <button 
                  className="chat-button" 
                  onClick={handleStartChat}
                  disabled={startingChat}
                >
                  {startingChat ? 'Starting Chat...' : 'Chat with Owner'}
                </button>
                {chatError && <div className="error-message">{chatError}</div>}
              </div>
            </div>
          </div>

          <div className="right-column">
            <section className="reviews-section">
              <div className="reviews-header">
                <h3>Customer Reviews</h3>
                <button 
                  className="write-review-btn"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? 'Cancel' : 'Write a Review'}
                </button>
              </div>
              {showChatPopup && (
                <ChatPopup onClose={() => setShowChatPopup(false)} />
              )}

              {showReviewForm && (
                <form onSubmit={handleReviewSubmit} className="review-form">
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${star <= reviewForm.value ? 'filled' : ''}`}
                          onClick={() => handleStarClick(star)}
                        >
                          {star <= reviewForm.value ? '★' : '☆'}
                        </span>
                      ))}
                      <span className="rating-text">
                        {reviewForm.value === 0 ? 'Select rating' : `${reviewForm.value} star${reviewForm.value !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <textarea
                      name="feedback"
                      value={reviewForm.feedback}
                      onChange={handleReviewChange}
                      rows="4"
                      placeholder="Share your experience with this hall..."
                      required
                    />
                  </div>
                  {reviewError && (
                    <div className="error-message">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {reviewError}
                    </div>
                  )}
                  {reviewSuccess && (
                    <div className="success-message">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 4L12 14.01L9 11.01" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {reviewSuccess}
                    </div>
                  )}
                  <button type="submit" className="submit-review-btn">
                    Submit Review
                  </button>
                </form>
              )}

              <div className="reviews-container">
                {hall.recent_reviews?.length > 0 ? (
                  hall.recent_reviews.map((review, idx) => (
                    <div key={idx} className="review-box">
                      <div className="review-header">
                        <strong>{review.customer_name}</strong>
                        <div className="rating">
                          {renderStaticStars(review.value)}
                          <span className="rating-text">({review.value}/5)</span>
                        </div>
                      </div>
                      <p className="review-content">{review.feedback}</p>
                      <small className="review-date">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </small>
                    </div>
                  ))
                ) : (
                  <p className="no-reviews">No reviews yet. Be the first to review!</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallDetailsPage;