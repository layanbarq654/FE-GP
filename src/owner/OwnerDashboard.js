import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getOwnerHalls, createHall } from '../Services/hallService';
import './OwnerDashboard.css';
import Header from '../components/Header';

const OwnerDashboard = () => {
  // State for halls management
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHall, setSelectedHall] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedHall, setUpdatedHall] = useState(null);
  const [vacationLoading, setVacationLoading] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [vacationDates, setVacationDates] = useState([]);

const [newVacation, setNewVacation] = useState({
  date: '',
  hall_id: null
});

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

  // Helper functions
  const formatDateForDisplay = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateForAPI = (dateString) => {
    return new Date(dateString).toISOString();
  };

  const getDayName = (dayId) => days.find(d => d.id === dayId)?.name || '';

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
    } catch (err) {
      setError(err.message);
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update hall');
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
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete hall');
      }
    }
  };

  // Vacation management functions
  const fetchVacations = async (hallId) => {
    setVacationLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.get(
        `http://localhost:3000/api/vacations?hall_id=${hallId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status === 200 || status === 404
        }
      );
      
      setVacationDates(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Vacation fetch failed:', err);
      setVacationDates([]);
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load vacations');
      }
    } finally {
      setVacationLoading(false);
    }
  };

  const handleAddVacation = async () => {
    // Validate we have a selected hall
    if (!selectedHall || !selectedHall.id) {
      setError('Please select a hall first');
      return;
    }
  
    // Validate date
    if (!newVacation.date) {
      setError('Please select a date');
      return;
    }
  
    // Convert date to check if it's in the past
    const vacationDate = new Date(newVacation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    if (vacationDate < today) {
      setError('Vacation date cannot be in the past');
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/vacations',
        {
          hall_id: selectedHall.id,
          date: newVacation.date // Already in YYYY-MM-DD format from input
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
      setError(null);
    } catch (err) {
      console.error('Vacation submission error:', err);
      setError(err.response?.data?.message || 'Failed to add vacation date');
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vacation');
    }
  };

  const handleHallClick = async (hall) => {
    setSelectedHall(hall);
    setUpdatedHall({ ...hall });
    setEditMode(false);
    await fetchVacations(hall.id);
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
    const { name, value } = e.target;
    setNewVacation(prev => ({ 
      ...prev, 
      [name]: value,
      hall_id: selectedHall.id // Ensure hall_id is always set
    }));
  };

  if (loading) return <div className="loading">Loading halls...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <Header />
      <div className="owner-dashboard">
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
                onClick={() => setSelectedHall(null)}
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

                    <div className="detail-actions">
                      <button 
                        className="edit-button"
                        onClick={() => setEditMode(true)}
                      >
                        Edit
                      </button>
                      <button 
  className="vacation-button"
  onClick={() => {
    setNewVacation(prev => ({ ...prev, hall_id: selectedHall.id }));
    setShowVacationModal(true);
  }}
>
  <span className="plus-icon">+</span> Vacation Dates
</button>
                      <button 
                        className="delete-button"
                        onClick={handleDeleteHall}
                      >
                        Delete
                      </button>
                    </div>

                    {vacationLoading ? (
  <div className="loading-small">Loading vacations...</div>
) : vacationDates.length > 0 ? (
  <div className="vacation-list">
    <h4>Upcoming Vacation Dates:</h4>
    <ul>
      {vacationDates.map(vacation => (
        <li key={vacation.id}>
          {formatDateForDisplay(vacation.date)}
          <button 
            className="delete-vacation"
            onClick={() => handleDeleteVacation(vacation.id)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  </div>
) : (
  <p className="no-vacations">No vacation dates scheduled</p>
)}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Vacation Modal */}
        {showVacationModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <button 
        className="close-button"
        onClick={() => {
          setShowVacationModal(false);
          setError(null);
        }}
      >
        &times;
      </button>
      <h2>Add Vacation Date</h2>
      
      {error && <div className="error">{error}</div>}
      
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
      </div>
    </div>
  );
};

export default OwnerDashboard;