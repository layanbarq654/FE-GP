import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CustomerProfile.css';

const BASE_URL = "http://localhost:3000/api/customer";

const CustomerProfile = () => {
  const [profile, setProfile] = useState({
    fname: '',
    mname: '',
    lname: '',
    email: '',
    city: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return {};
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();
      if (!headers.headers) return; // If no token

      const response = await axios.get(`${BASE_URL}/profile`, headers);
      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempImage(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const headers = getAuthHeaders();
      if (!headers.headers) return; // If no token

      const response = await axios.put(
        `${BASE_URL}/profile`,
        {
          fname: profile.fname,
          mname: profile.mname,
          lname: profile.lname,
          email: profile.email,
          city: profile.city
        },
        headers
      );
      
      if (response.data.success) {
        setIsEditing(false);
        setTempImage(null);
        // Refresh profile data
        await fetchProfile();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          &larr;
        </button>
        <h1>My Profile</h1>
      </div>

      <div className="profile-container">
        {loading && !isEditing ? (
          <div className="loading">Loading profile...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="profile-content">
            <div className="profile-image-section">
              <div className="profile-image-container">
                <img 
                  src={tempImage || profile.image_url || '/default-profile.jpg'} 
                  alt="Profile" 
                  className="profile-image"
                />
                {isEditing && (
                  <div className="image-upload">
                    <label htmlFor="profile-image-upload" className="upload-button">
                      Change Photo
                    </label>
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="fname"
                    value={profile.fname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    name="mname"
                    value={profile.mname}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lname"
                    value={profile.lname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={profile.city}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile(); // Reset to original data
                      setTempImage(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">First Name:</span>
                  <span className="info-value">{profile.fname}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Middle Name:</span>
                  <span className="info-value">{profile.mname || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Name:</span>
                  <span className="info-value">{profile.lname}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{profile.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">City:</span>
                  <span className="info-value">{profile.city || '-'}</span>
                </div>
                
                <button 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;