// src/components/OwnerProfile.js
import React, { useState, useEffect } from 'react';
import { getOwnerProfile, updateOwnerProfile } from '../Services/ownerProfileService';
import { logout } from '../Services/authService';
import { useNavigate } from 'react-router-dom';
import './OwnerProfile.css';

const LOCATION_OPTIONS = [
    { name: "Nablus", value: 1 },
    { name: "Ramallah", value: 2 },
    { name: "Jenin", value: 3 }
];

const OwnerProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editableProfileData, setEditableProfileData] = useState({
        fname: '',
        mname: '',
        lname: '',
        email: '',
        city_id: '',
        current_password: '',
        new_password: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getOwnerProfile();
            console.log('Full API response:', response); // Debug log
            
            // Extract the profile data from the response
            const profileData = response.data || response; // Handle both nested and direct responses
            
            const completeProfile = {
                fname: profileData.fname || '',
                mname: profileData.mname || '',
                lname: profileData.lname || '',
                email: profileData.email || '',
                city_id: profileData.city_id || '',
                current_password: '',
                new_password: ''
            };
            
            console.log('Processed profile data:', completeProfile); // Debug log
            setProfile(completeProfile);
            setEditableProfileData(completeProfile);
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
        setEditableProfileData({
            ...profile,
            current_password: '',
            new_password: ''
        });
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditableProfileData({
            ...profile,
            current_password: '',
            new_password: ''
        });
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
            const response = await updateOwnerProfile(editableProfileData);
            const updatedData = response.data || response; // Handle both nested and direct responses
            
            const updatedProfile = {
                ...updatedData,
                current_password: '',
                new_password: ''
            };
            
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

    console.log('Current profile state:', profile);
    console.log('Editable profile data:', editableProfileData);

    if (loading) {
        return (
            <div className="op-loading-container">
                <div className="op-loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error && !editMode) {
        return (
            <div className="op-error-container">
                <div className="op-error-icon">!</div>
                <p className="op-error-message">{error}</p>
                <button onClick={fetchProfile} className="op-retry-button">
                    Try Again
                </button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="op-no-data">
                <p>No profile data available.</p>
                <button onClick={fetchProfile} className="op-retry-button">
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className={`op-profile-container ${editMode ? 'op-edit-mode' : ''}`}>
            <div className="op-profile-card">
                <div className="op-profile-header">
                    <h2>Owner Profile</h2>
                </div>

                {error && editMode && (
                    <div className="op-error-message-container">
                        <div className="op-error-icon">!</div>
                        <p className="op-error-message">{error}</p>
                    </div>
                )}

                {editMode ? (
                    <div className="op-edit-form">
                        <div className="op-form-row">
                            <div className="op-form-group">
                                <label>First Name</label>
                                <input
    type="text"
    name="fname"
    value={editableProfileData.fname || ''}
    onChange={handleInputChange}
    className="op-input"
    placeholder="Enter first name"
/>
                            </div>
                            <div className="op-form-group">
                                <label>Middle Name</label>
                                <input
                                    type="text"
                                    name="mname"
                                    value={editableProfileData?.mname || ''}
                                    onChange={handleInputChange}
                                    className="op-input"
                                    placeholder="Enter middle name"
                                />
                            </div>
                        </div>

                        <div className="op-form-row">
                            <div className="op-form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="lname"
                                    value={editableProfileData?.lname || ''}
                                    onChange={handleInputChange}
                                    className="op-input"
                                    placeholder="Enter last name"
                                />
                            </div>
                            <div className="op-form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editableProfileData?.email || ''}
                                    onChange={handleInputChange}
                                    className="op-input"
                                    placeholder="Enter email"
                                />
                            </div>
                        </div>

                        <div className="op-form-group">
                            <label>City</label>
                            <select
                                name="city_id"
                                value={editableProfileData?.city_id || ''}
                                onChange={handleInputChange}
                                className="op-select"
                            >
                                <option value="" disabled>Select your city</option>
                                {LOCATION_OPTIONS.map(city => (
                                    <option key={city.value} value={city.value}>{city.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="op-form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="current_password"
                                value={editableProfileData?.current_password || ''}
                                onChange={handleInputChange}
                                className="op-input"
                                placeholder="Enter current password"
                            />
                            <small className="op-input-hint">Required for password changes</small>
                        </div>

                        <div className="op-form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="new_password"
                                value={editableProfileData?.new_password || ''}
                                onChange={handleInputChange}
                                className="op-input"
                                placeholder="Enter new password"
                            />
                            <small className="op-input-hint">Leave blank to keep current password</small>
                        </div>

                        <div className="op-form-actions">
                            <button 
                                onClick={handleSaveClick} 
                                className="op-save-button"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="op-saving-spinner"></span> Saving...
                                    </>
                                ) : 'Save Changes'}
                            </button>
                            <button 
                                onClick={handleCancelEdit} 
                                className="op-cancel-button"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="op-profile-content">
                        <div className="op-profile-details">
                            <div className="op-detail-item">
                                <span className="op-detail-label">First Name</span>
                                <span className="op-detail-value">{profile.fname}</span>
                            </div>
                            {profile.mname && (
                                <div className="op-detail-item">
                                    <span className="op-detail-label">Middle Name</span>
                                    <span className="op-detail-value">{profile.mname}</span>
                                </div>
                            )}
                            <div className="op-detail-item">
                                <span className="op-detail-label">Last Name</span>
                                <span className="op-detail-value">{profile.lname}</span>
                            </div>
                            <div className="op-detail-item">
                                <span className="op-detail-label">Email</span>
                                <span className="op-detail-value">{profile.email}</span>
                            </div>
                            <div className="op-detail-item">
                                <span className="op-detail-label">City</span>
                                <span className="op-detail-value">
                                    {LOCATION_OPTIONS.find(c => c.value === profile.city_id)?.name || 'Not specified'}
                                </span>
                            </div>
                        </div>

                        <div className="op-view-actions">
                            <button onClick={handleEditClick} className="op-edit-button">
                                <i className="op-edit-icon"></i> Edit Profile
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerProfile;