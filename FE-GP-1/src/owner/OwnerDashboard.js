import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getOwnerHalls, createHall } from '../Services/hallService';
import './OwnerDashboard.css';
import HeaderOwner from '../components/HeaderOwner';
import HallBookingManager from './HallBookingManager';
import { getUserType } from '../Services/authService';
import OwnerProfile from '../components/OwnerProfile';

const OwnerDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userType = getUserType();
    console.log('OwnerDashboard - userType:', userType);
    if (userType !== '2') {
      console.warn('Unauthorized access, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  // State for halls management
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHall, setSelectedHall] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedHall, setUpdatedHall] = useState(null);
  const [hallRatingsData, setHallRatingsData] = useState({});
  const [pendingBookingsCount, setPendingBookingsCount] = useState({});
  
  // Profile management state
  const [showProfileSection, setShowProfileSection] = useState(false);

  // Vacation management state
  const [showVacationSection, setShowVacationSection] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [vacationDates, setVacationDates] = useState([]);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [editingVacationId, setEditingVacationId] = useState(null);
  const [editVacationDate, setEditVacationDate] = useState('');
  const [showVacationMenu, setShowVacationMenu] = useState(null);
  const [vacationError, setVacationError] = useState(null);
  const [vacationLoading, setVacationLoading] = useState(false);
  const [newVacation, setNewVacation] = useState({
    date: '',
    hall_id: null
  });

  // Booking management state
  const [showBookingSection, setShowBookingSection] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [newHall, setNewHall] = useState({
    name: '',
    open_day: 1,
    close_day: 5,
    open_time: '08:00',
    close_time: '22:00',
    price_per_hour: '',
    city_id: 1,
    capacity: '',
    image_url: ''
  });

  // Available options
  const cities = [
    { id: 1, name: 'Nablus' },
    { id: 2, name: 'Ramallah' },
    { id: 3, name: 'Jenin' }
  ];

  const days = [
    { id: 1, name: 'Saturday' },
    { id: 2, name: 'Sunday' },
    { id: 3, name: 'Monday' },
    { id: 4, name: 'Tuesday' },
    { id: 5, name: 'Wednesday' },
    { id: 6, name: 'Thursday' },
    { id: 7, name: 'Friday' }
  ];

  const StarRating = ({ rating, totalRatings }) => {
    if (rating === undefined || rating === null) {
      return (
        <div className="star-rating">
          <span className="rating-value">(No ratings yet)</span>
        </div>
      );
    }
  
    const numericRating = typeof rating === 'number' ? rating : parseFloat(rating);
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
        <span className="rating-value">
          ({numericRating.toFixed(1)} • {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'})
        </span>
      </div>
    );
  };

  const fetchHallRating = async (hallId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3000/api/rates/hall/${hallId}/average`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setHallRatingsData(prev => ({
        ...prev,
        [hallId]: {
          average: parseFloat(response.data.data?.average_rating) || 0,
          total: response.data.data?.total_ratings || 0,
          range: response.data.data?.rating_range || { min: 1, max: 5 },
          firstDate: response.data.data?.first_rating_date,
          lastDate: response.data.data?.last_rating_date
        }
      }));
    } catch (err) {
      console.error('Error fetching rating:', err);
      setHallRatingsData(prev => ({
        ...prev,
        [hallId]: {
          average: 0,
          total: 0,
          range: { min: 1, max: 5 },
          firstDate: null,
          lastDate: null
        }
      }));
    }
  };

  const fetchPendingBookingsCount = async (hallId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3000/api/bookings/hall/${hallId}/pending-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setPendingBookingsCount(prev => ({
        ...prev,
        [hallId]: response.data.count || 0
      }));
    } catch (err) {
      console.error('Error fetching pending bookings count:', err);
      setPendingBookingsCount(prev => ({
        ...prev,
        [hallId]: 0
      }));
    }
  };

  // Helper functions
  const getVacationStatus = (dateString) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const vacationDate = new Date(dateString);
    vacationDate.setUTCHours(0, 0, 0, 0);

    if (vacationDate < today) return 'Past';
    if (vacationDate > today) return 'Upcoming';
    return 'Active';
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Adjust for timezone offset
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('en-GB'); // Shows DD/MM/YYYY format
};

  const getDayName = (dayId) => days.find(d => d.id === dayId)?.name || '';

  const addNotification = (message) => {
    const notification = { id: Date.now(), message };
    setNotifications(prev => [notification, ...prev].slice(0, 3)); // Keep only last 3 notifications
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Fetch halls on component mount
  useEffect(() => {
    const fetchHalls = async () => {
      try {
        setLoading(true);
        const hallsData = await getOwnerHalls();
  
        if (!hallsData || !Array.isArray(hallsData)) {
          console.warn('Invalid halls data received');
          setHalls([]);
          return;
        }
  
        setHalls(hallsData);
        setError(null);
        
        // Fetch ratings and pending bookings count for each hall
        hallsData.forEach(hall => {
          fetchHallRating(hall.id);
          fetchPendingBookingsCount(hall.id);
        });
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load halls');
        setHalls([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchHalls();
  }, []);

  // Fetch vacations when a hall is selected
  useEffect(() => {
    if (selectedHall) {
      fetchVacations(selectedHall.id);
      fetchPendingBookingsCount(selectedHall.id); // Refresh pending count when hall is selected
    } else {
      setVacationDates([]);
      setVacationError(null);
      setVacationLoading(false);
      setShowVacationSection(false);
      setShowBookingSection(false);
    }
  }, [selectedHall]);

  // Hall CRUD operations
  const handleCreateHall = async (e) => {
    e.preventDefault();
    try {
      const createdHall = await createHall(newHall);
      setHalls(prevHalls => [...prevHalls, createdHall]);
      setShowCreateModal(false);
      setNewHall({
        name: '',
        open_day: 1,
        close_day: 5,
        open_time: '08:00',
        close_time: '22:00',
        price_per_hour: '',
        city_id: 1,
        capacity: '',
        image_url: ''
      });
      setError(null);
      addNotification('Hall created successfully!');
    } catch (err) {
      setError(err.message || 'Failed to create hall');
      addNotification('Failed to create hall');
    }
  };

  const handleUpdateHall = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:3000/api/halls/${selectedHall.id}`,
        updatedHall,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setHalls(halls.map(hall =>
        hall.id === selectedHall.id ? response.data : hall
      ));
      setSelectedHall(response.data);
      setEditMode(false);
      setError(null);
      addNotification('Hall updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update hall');
      addNotification('Failed to update hall');
    }
  };

  const handleDeleteHall = async () => {
    if (window.confirm('Are you sure you want to delete this hall?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://localhost:3000/api/halls/${selectedHall.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setHalls(halls.filter(hall => hall.id !== selectedHall.id));
        setSelectedHall(null);
        setError(null);
        addNotification('Hall deleted successfully!');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete hall');
        addNotification('Failed to delete hall');
      }
    }
  };

  // Vacation management functions
  const fetchVacations = async (hallId) => {
    setVacationLoading(true);
    setVacationError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setVacationError('Authentication required');
        setVacationDates([]);
        return;
      }

      const response = await axios.get(
        `http://localhost:3000/api/vacations/hall/${hallId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const upcomingVacations = (response.data.data || [])
        .filter(vacation => {
          let vacationDate;
          try {
            const [year, month, day] = vacation.date.split('-');
            vacationDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
            vacationDate.setUTCHours(0,0,0,0);
          } catch (e) {
            console.error('Error parsing vacation date for filtering:', vacation.date, e);
            return false;
          }
          return vacationDate >= today;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setVacationDates(upcomingVacations);
    } catch (err) {
      console.error('Error fetching vacations:', err);
      setVacationError(err.response?.data?.message || 'Failed to load vacations');
      setVacationDates([]);
    } finally {
      setVacationLoading(false);
    }
  };

  const handleAddVacation = async () => {
    if (!selectedHall || !selectedHall.id) {
      setVacationError('Please select a hall first');
      return;
    }

    if (!newVacation.date) {
      setVacationError('Please select a date');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (newVacation.date < today) {
      setVacationError('Vacation date cannot be in the past');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/vacations',
        {
          hall_id: selectedHall.id,
          date: newVacation.date
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchVacations(selectedHall.id);
      setShowVacationModal(false);
      setNewVacation({ date: '', hall_id: null });
      setVacationError(null);
      addNotification('Vacation date added successfully!');
    } catch (err) {
      console.error('Vacation submission error:', err);
      setVacationError(err.response?.data?.message || 'Failed to add vacation date');
      addNotification('Failed to add vacation date');
    }
  };

  const handleUpdateVacation = async () => {
    if (!editVacationDate) {
      setVacationError('Please select a date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/vacations/${editingVacationId}`,
        { date: editVacationDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchVacations(selectedHall.id);
      setEditingVacationId(null);
      setShowVacationMenu(null);
      setVacationError(null);
      addNotification('Vacation date updated successfully!');
    } catch (err) {
      setVacationError(err.response?.data?.message || 'Failed to update vacation');
      addNotification('Failed to update vacation date');
    }
  };

  const handleDeleteVacation = async (vacationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3000/api/vacations/${vacationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await fetchVacations(selectedHall.id);
      setShowVacationMenu(null);
      setVacationError(null);
      addNotification('Vacation date deleted successfully!');
    } catch (err) {
      setVacationError(err.response?.data?.message || 'Failed to delete vacation');
      addNotification('Failed to delete vacation date');
    }
  };

  const handleHallClick = (hall) => {
    setSelectedHall(hall);
    setShowProfileSection(false);
    setUpdatedHall({ ...hall });
    setEditMode(false);
    setShowVacationSection(false);
    setShowBookingSection(false);
    setShowActionDropdown(false);
    setShowProfileSection(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHall(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedHall(prev => ({ ...prev, [name]: value }));
  };

  const handleVacationDateChange = (e) => {
    setNewVacation({
      ...newVacation,
      date: e.target.value,
      hall_id: selectedHall?.id
    });
  };

  if (loading) return <div className="loading">Loading halls...</div>;
  if (error && !halls.length) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <HeaderOwner onProfileIconClick={() => {
        setShowProfileSection(!showProfileSection);
        setSelectedHall(null);
        setShowVacationSection(false);
        setShowBookingSection(false);
      }} />
      
      <div className="owner-dashboard">
        {/* Notifications container - top right corner */}
        <div className="notifications-container">
          {notifications.map(notification => (
            <div key={notification.id} className="notification-item">
              {notification.message}
              <button 
                className="notification-close"
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {showProfileSection ? (
          <div className="profile-section">
            <OwnerProfile />
          </div>
        ) : (
          <>
            <h1>My Halls</h1>
            {halls.length === 0 && !loading ? (
              <div className="no-halls">
                <p>You don't have any halls yet.</p>
                <button
                  className="create-first-hall"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Your First Hall
                </button>
              </div>
            ) : (
              <div className="halls-grid">
                {halls.map((hall) => (
                  <div
                    key={hall.id || `hall-${Math.random()}`}
                    className="hall-card"
                    onClick={() => handleHallClick(hall)}
                  >
                    {pendingBookingsCount[hall.id] > 0 && (
                      <div className="pending-booking-badge">
                        {pendingBookingsCount[hall.id]}
                      </div>
                    )}
                    <img
                      src={hall.image_url || '/default-hall.jpg'}
                      alt={hall.name}
                      className="hall-image"
                      onError={(e) => {
                        e.target.src = '/default-hall.jpg';
                      }}
                    />
                    <div className="hall-info">
                      <h3>{hall.name}</h3>
                      <p>${hall.price_per_hour}/hour</p>
                      <p>{cities.find(c => c.id === hall.city_id)?.name || 'Unknown'}</p>
                      {hallRatingsData[hall.id] === undefined ? (
                        <div className="rating-loading">Loading rating...</div>
                      ) : (
                        <StarRating 
                          rating={hallRatingsData[hall.id]?.average} 
                          totalRatings={hallRatingsData[hall.id]?.total} 
                        />
                      )}
                    </div>
                  </div>
                ))}

                <div
                  className="hall-card add-card"
                  onClick={() => setShowCreateModal(true)}
                >
                  <div className="add-icon">+</div>
                  <p>Add New Hall</p>
                </div>
              </div>
            )}

            {/* Create Hall Modal */}
            {showCreateModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <button
                    className="close-button"
                    onClick={() => setShowCreateModal(false)}
                  >
                    &times;
                  </button>
                  <h2>Create New Hall</h2>
                  <form onSubmit={handleCreateHall}>
                    <div className="form-group">
                      <label>Hall Name</label>
                      <input
                        type="text"
                        name="name"
                        value={newHall.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Opening Day</label>
                        <select
                          name="open_day"
                          value={newHall.open_day}
                          onChange={handleInputChange}
                          required
                        >
                          {days.map(day => (
                            <option key={day.id} value={day.id}>{day.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Closing Day</label>
                        <select
                          name="close_day"
                          value={newHall.close_day}
                          onChange={handleInputChange}
                          required
                        >
                          {days.map(day => (
                            <option key={day.id} value={day.id}>{day.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Opening Time</label>
                        <input
                          type="time"
                          name="open_time"
                          value={newHall.open_time}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Closing Time</label>
                        <input
                          type="time"
                          name="close_time"
                          value={newHall.close_time}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Price Per Hour ($)</label>
                        <input
                          type="number"
                          name="price_per_hour"
                          value={newHall.price_per_hour}
                          onChange={handleInputChange}
                          required
                          min="0"
                        />
                      </div>
                      <div className="form-group">
                        <label>Capacity</label>
                        <input
                          type="number"
                          name="capacity"
                          value={newHall.capacity}
                          onChange={handleInputChange}
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>City</label>
                      <select
                        name="city_id"
                        value={newHall.city_id}
                        onChange={handleInputChange}
                        required
                      >
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Image URL (optional)</label>
                      <input
                        type="url"
                        name="image_url"
                        value={newHall.image_url}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <button type="submit" className="submit-button">
                      Create Hall
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Hall Details/Edit Modal */}
            {selectedHall && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <button
                    className="close-button"
                    onClick={() => {
                      setSelectedHall(null);
                      setEditingVacationId(null);
                      setShowVacationSection(false);
                      setShowBookingSection(false);
                      setVacationError(null);
                      setVacationDates([]);
                    }}
                  >
                    &times;
                  </button>

                  {editMode ? (
                    <>
                      <h2>Edit Hall</h2>
                      <form onSubmit={handleUpdateHall}>
                        <div className="form-group">
                          <label>Hall Name</label>
                          <input
                            type="text"
                            name="name"
                            value={updatedHall.name}
                            onChange={handleUpdateInputChange}
                            required
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Opening Day</label>
                            <select
                              name="open_day"
                              value={updatedHall.open_day}
                              onChange={handleUpdateInputChange}
                              required
                            >
                              {days.map(day => (
                                <option key={day.id} value={day.id}>{day.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Closing Day</label>
                            <select
                              name="close_day"
                              value={updatedHall.close_day}
                              onChange={handleUpdateInputChange}
                              required
                            >
                              {days.map(day => (
                                <option key={day.id} value={day.id}>{day.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Opening Time</label>
                            <input
                              type="time"
                              name="open_time"
                              value={updatedHall.open_time}
                              onChange={handleUpdateInputChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Closing Time</label>
                            <input
                              type="time"
                              name="close_time"
                              value={updatedHall.close_time}
                              onChange={handleUpdateInputChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Price Per Hour ($)</label>
                            <input
                              type="number"
                              name="price_per_hour"
                              value={updatedHall.price_per_hour}
                              onChange={handleUpdateInputChange}
                              required
                              min="0"
                            />
                          </div>
                          <div className="form-group">
                            <label>Capacity</label>
                            <input
                              type="number"
                              name="capacity"
                              value={updatedHall.capacity}
                              onChange={handleUpdateInputChange}
                              required
                              min="1"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>City</label>
                          <select
                            name="city_id"
                            value={updatedHall.city_id}
                            onChange={handleUpdateInputChange}
                            required
                          >
                            {cities.map(city => (
                              <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Image URL (optional)</label>
                          <input
                            type="url"
                            name="image_url"
                            value={updatedHall.image_url}
                            onChange={handleUpdateInputChange}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>

                        <div className="form-actions">
                          <button type="submit" className="submit-button">
                            Save Changes
                          </button>
                          <button
                            type="button"
                            className="cancel-button"
                            onClick={() => setEditMode(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <>
                      <h2>Hall Details</h2>
                      <div className="hall-details">
                        <img
                          src={selectedHall.image_url || '/default-hall.jpg'}
                          alt={selectedHall.name}
                          className="detail-image"
                        />
                        <div className="detail-info">
                          <h3>{selectedHall.name}</h3>
                          <p><strong>Price:</strong> ${selectedHall.price_per_hour}/hour</p>
                          <p><strong>Location:</strong> {cities.find(c => c.id === selectedHall.city_id)?.name}</p>
                          <p><strong>Capacity:</strong> {selectedHall.capacity} people</p>
                          <p><strong>Opening Hours:</strong> {getDayName(selectedHall.open_day)} at {selectedHall.open_time?.substring(0, 5)}</p>
                          <p><strong>Closing Hours:</strong> {getDayName(selectedHall.close_day)} at {selectedHall.close_time?.substring(0, 5)}</p>
                        </div>

                        {showVacationSection && (
                          <div className="vacation-management">
                            <div className="vacation-header">
                              <h3>Upcoming Vacation Dates</h3>
                              <button
                                className="add-vacation-btn"
                                onClick={() => setShowVacationModal(true)}
                              >
                                + Add Vacation
                              </button>
                            </div>

                            {vacationLoading ? (
                              <div className="loading-small">Loading vacations...</div>
                            ) : (
                              <>
                                {vacationError && (
                                  <div className="error-message">
                                    {vacationError}
                                  </div>
                                )}
                                <div className="vacation-list-container">
                                  {vacationDates.length > 0 ? (
                                    <ul className="vacation-list">
                                      {vacationDates.map(vacation => (
                                        <li key={vacation.id} className="vacation-item">
                                          <div className="vacation-info">
                                            <span className="vacation-date">
                                              {formatDateForDisplay(vacation.date)}
                                            </span>
                                            <span className={`vacation-status ${getVacationStatus(vacation.date).toLowerCase()}`}>
                                              {getVacationStatus(vacation.date)}
                                            </span>
                                          </div>
                                          <div className="vacation-actions">
                                            {editingVacationId === vacation.id ? (
                                              <div className="edit-vacation-form">
                                                <input
                                                  type="date"
                                                  value={editVacationDate}
                                                  onChange={(e) => setEditVacationDate(e.target.value)}
                                                  min={new Date().toISOString().split('T')[0]}
                                                />
                                                <button
                                                  className="save-btn"
                                                  onClick={handleUpdateVacation}
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  className="cancel-btn"
                                                  onClick={() => setEditingVacationId(null)}
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            ) : (
                                              <>
                                                <button
                                                  onClick={() => {
                                                    setEditingVacationId(vacation.id);
                                                    setEditVacationDate(vacation.date);
                                                  }}
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  className="delete-btn"
                                                  onClick={() => handleDeleteVacation(vacation.id)}
                                                >
                                                  Delete
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="no-vacations">No upcoming vacation dates scheduled</p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {showBookingSection && selectedHall && (
                          <HallBookingManager
                            hallId={selectedHall.id}
                            hallName={selectedHall.name}
                            formatDateForDisplay={formatDateForDisplay}
                            refreshPendingCount={() => fetchPendingBookingsCount(selectedHall.id)}
                          />
                        )}

                        <div className="detail-actions">
                          <button
                            className="edit-button"
                            onClick={() => setEditMode(true)}
                          >
                            Edit
                          </button>

                          <div className="action-dropdown-container">
                            <button
                              className="vacation-button"
                              onClick={() => setShowActionDropdown(!showActionDropdown)}
                            >
                              <span className="plus-icon">+</span>
                            </button>

                            {showActionDropdown && (
                              <div className="action-dropdown">
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setShowVacationSection(true);
                                    setShowBookingSection(false);
                                    setShowActionDropdown(false);
                                  }}
                                >
                                  Vacation
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setShowBookingSection(true);
                                    setShowVacationSection(false);
                                    setShowActionDropdown(false);
                                  }}
                                >
                                  Booking
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            className="delete-button"
                            onClick={handleDeleteHall}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Vacation Modal */}
            {showVacationModal && (
              <div className="modal-overlay">
                <div className="modal-content vacation-modal">
                  <button
                    className="close-button"
                    onClick={() => {
                      setShowVacationModal(false);
                      setVacationError(null);
                    }}
                  >
                    &times;
                  </button>
                  <h2>Add Vacation Date</h2>

                  {vacationError && <div className="error-message">{vacationError}</div>}

                  <div className="form-group">
                    <label>Vacation Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={newVacation.date}
                      onChange={handleVacationDateChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <button
                    className="submit-button"
                    onClick={handleAddVacation}
                    disabled={!newVacation.date}
                  >
                    Add Vacation Date
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;