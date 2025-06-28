// src/components/ProfileDisplay.js
import React, { useState, useEffect } from 'react';
import { getThirdPartyProfile, updateThirdPartyProfile } from '../Services/companyService';
import { logout } from '../Services/authService';
import { useNavigate } from 'react-router-dom';
import './ProfileDisplay.css';

const LOCATION_OPTIONS = [
    { name: "Nablus", value: 1 },
    { name: "Ramallah", value: 2 },
    { name: "Jenin", value: 3 }
];

const ProfileDisplay = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editableProfileData, setEditableProfileData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const profileData = await getThirdPartyProfile();
            setProfile(profileData);
            setEditableProfileData(profileData);
        } catch (err) {
            console.error('Error fetching profile:', err);
            if (err.response?.status === 401) {
                logout();
                navigate('/login');
                setError('Session expired. Please log in again.');
            } else {
                setError(err.message || 'Failed to load profile.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleEditClick = () => {
        setEditMode(true);
        setEditableProfileData({ ...profile });
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditableProfileData({ ...profile });
        setError(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditableProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = async () => {
        setError(null);
        setIsSaving(true);
        try {
            const dataToUpdate = {
                fname: editableProfileData.fname,
                lname: editableProfileData.lname,
                image_url: editableProfileData.image_url,
                city_id: Number(editableProfileData.city_id),
            };

            const updatedProfile = await updateThirdPartyProfile(dataToUpdate);
            setProfile(updatedProfile);
            setEditableProfileData(updatedProfile);
            setEditMode(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="pd-loading-container">
                <div className="pd-loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error && !editMode) {
        return (
            <div className="pd-error-container">
                <div className="pd-error-icon">!</div>
                <p className="pd-error-message">{error}</p>
                <button onClick={fetchProfile} className="pd-retry-button">
                    Try Again
                </button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="pd-no-data">
                <p>No profile data available.</p>
                <button onClick={fetchProfile} className="pd-retry-button">
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className={`pd-profile-container ${editMode ? 'pd-edit-mode' : ''}`}>
            <div className="pd-profile-card">
                <div className="pd-profile-header">
                    <h2>My Profile</h2>
                </div>

                {error && editMode && (
                    <div className="pd-error-message-container">
                        <div className="pd-error-icon">!</div>
                        <p className="pd-error-message">{error}</p>
                    </div>
                )}

                {editMode ? (
                    <div className="pd-edit-form">
                        <div className="pd-form-row">
                            <div className="pd-form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="fname"
                                    value={editableProfileData?.fname || ''}
                                    onChange={handleInputChange}
                                    className="pd-input"
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div className="pd-form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="lname"
                                    value={editableProfileData?.lname || ''}
                                    onChange={handleInputChange}
                                    className="pd-input"
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        <div className="pd-form-group">
                            <label>Profile Image URL</label>
                            <input
                                type="text"
                                name="image_url"
                                value={editableProfileData?.image_url || ''}
                                onChange={handleInputChange}
                                className="pd-input"
                                placeholder="https://example.com/profile.jpg"
                            />
                            {editableProfileData?.image_url && (
                                <div className="pd-image-preview-container">
                                    <p className="pd-image-preview-label">Preview:</p>
                                    <img 
                                        src={editableProfileData.image_url} 
                                        alt="Profile preview" 
                                        className="pd-image-preview" 
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pd-form-group">
                            <label>City</label>
                            <select
                                name="city_id"
                                value={editableProfileData?.city_id || ''}
                                onChange={handleInputChange}
                                className="pd-select"
                            >
                                <option value="" disabled>Select your city</option>
                                {LOCATION_OPTIONS.map(city => (
                                    <option key={city.value} value={city.value}>{city.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pd-form-actions">
                            <button 
                                onClick={handleSaveClick} 
                                className="pd-save-button"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="pd-saving-spinner"></span> Saving...
                                    </>
                                ) : 'Save Changes'}
                            </button>
                            <button 
                                onClick={handleCancelEdit} 
                                className="pd-cancel-button"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="pd-profile-content">
                        <div className="pd-profile-image-container">
                            {profile.image_url ? (
                                <img 
                                    src={profile.image_url} 
                                    alt="Profile" 
                                    className="pd-profile-image" 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/150';
                                    }}
                                />
                            ) : (
                                <div className="pd-profile-image-placeholder">
                                    <i className="pd-user-icon"></i>
                                </div>
                            )}
                        </div>

                        <div className="pd-profile-details">
                            <div className="pd-detail-item">
                                <span className="pd-detail-label">First Name</span>
                                <span className="pd-detail-value">{profile.fname}</span>
                            </div>
                            <div className="pd-detail-item">
                                <span className="pd-detail-label">Last Name</span>
                                <span className="pd-detail-value">{profile.lname}</span>
                            </div>
                            <div className="pd-detail-item">
                                <span className="pd-detail-label">City</span>
                                <span className="pd-detail-value">{profile.city_name}</span>
                            </div>
                        </div>

                        <div className="pd-view-actions">
                            <button onClick={handleEditClick} className="pd-edit-button">
                                <i className="pd-edit-icon"></i> Edit Profile
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileDisplay;