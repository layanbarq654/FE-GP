import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { logout } from '../Services/authService';
import {
    getThirdPartyCompanies,
    createThirdPartyCompany,
    updateThirdPartyCompany,
    deleteThirdPartyCompany,
    getCompanyBookings
} from '../Services/companyService';
import ProfileDisplay from '../components/ProfileDisplay';

import './ThirdPartyDashboard.css';

const CATEGORY_OPTIONS = [
    { id: 1, name: "Catering" },
    { id: 2, name: "Decoration" },
    { id: 3, name: "Photography" },
    { id: 4, name: "Music/DJ" },
    { id: 5, name: "Event Planning" }
];
const LOCATION_OPTIONS = [
    { name: "Nablus", value: 1 },
    { name: "Ramallah", value: 2 },
    { name: "Jenin", value: 3 }
];

const ThirdPartyDashboard = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newCompanyData, setNewCompanyData] = useState({
        name: '',
        category_id: CATEGORY_OPTIONS[0]?.id || 1,
        city_id: LOCATION_OPTIONS[0]?.value || 1,
        price_per_party: '',
        image_url: ''
    });
    const [editingCompany, setEditingCompany] = useState(null);
    const [updatedCompanyData, setUpdatedCompanyData] = useState(null);

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showCompanyFormModal, setShowCompanyFormModal] = useState(false);

    // NEW STATES for Company Details Modal
    const [showCompanyDetailsModal, setShowCompanyDetailsModal] = useState(false);
    const [selectedCompanyForDetails, setSelectedCompanyForDetails] = useState(null);

    // Existing States for Booking Details Modal
    const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
    const [currentCompanyBookings, setCurrentCompanyBookings] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState(null);
    const [selectedCompanyForBookings, setSelectedCompanyForBookings] = useState(null);


    useEffect(() => {
        const fetchCompanies = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getThirdPartyCompanies();
                setCompanies(data);
            } catch (err) {
                console.error('Failed to fetch companies:', err);
                setError('Failed to load companies.');
                if (err.response && err.response.status === 401) {
                    logout();
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, [navigate]);

    const handleCreateCompanyChange = (e) => {
        const { name, value } = e.target;
        setNewCompanyData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateCompanySubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await createThirdPartyCompany(newCompanyData);
            const updatedCompanies = await getThirdPartyCompanies();
            setCompanies(updatedCompanies);
            setNewCompanyData({
                name: '',
                category_id: CATEGORY_OPTIONS[0]?.id || 1,
                city_id: LOCATION_OPTIONS[0]?.value || 1,
                price_per_party: '',
                image_url: ''
            });
            alert('Company created successfully!');
            setShowCompanyFormModal(false);
        } catch (err) {
            console.error('Error creating company:', err);
            setError(`Failed to create company: ${err.message || 'Unknown error'}`);
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            setError(null);
            try {
                await deleteThirdPartyCompany(companyId);
                setCompanies(prevCompanies => prevCompanies.filter(comp => comp.id !== companyId));
                alert('Company deleted successfully!');
                handleCloseCompanyDetailsModal(); // Close details modal if company is deleted
            } catch (err) {
                console.error('Error deleting company:', err);
                setError(`Failed to delete company: ${err.message || 'Unknown error'}`);
            }
        }
    };

    const handleEditClick = (company) => {
        const category_id = CATEGORY_OPTIONS.find(opt => opt.name === company.category)?.id || CATEGORY_OPTIONS[0]?.id || 1;
        const city_id = LOCATION_OPTIONS.find(opt => opt.name === company.city)?.value || LOCATION_OPTIONS[0]?.value || 1;

        setEditingCompany(company);
        setUpdatedCompanyData({
            ...company,
            category_id: category_id,
            city_id: city_id
        });
        setShowCompanyFormModal(true);
        handleCloseCompanyDetailsModal(); // Close details modal when opening edit form
    };

    const handleUpdateCompanyChange = (e) => {
        const { name, value } = e.target;
        setUpdatedCompanyData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateCompanySubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!updatedCompanyData) return;

        try {
            const updatedFields = {
                name: updatedCompanyData.name,
                category_id: Number(updatedCompanyData.category_id),
                city_id: Number(updatedCompanyData.city_id),
                price_per_party: Number(updatedCompanyData.price_per_party),
                image_url: updatedCompanyData.image_url,
            };
            await updateThirdPartyCompany(updatedCompanyData.id, updatedFields);

            const updatedCompanies = await getThirdPartyCompanies();
            setCompanies(updatedCompanies);

            setEditingCompany(null);
            setUpdatedCompanyData(null);
            alert('Company updated successfully!');
            setShowCompanyFormModal(false);
        } catch (err) {
            console.error('Error updating company:', err);
            setError(`Failed to update company: ${err.message || 'Unknown error'}`);
        }
    };

    const handleOpenCreateCompanyModal = () => {
        setEditingCompany(null);
        setNewCompanyData({
            name: '',
            category_id: CATEGORY_OPTIONS[0]?.id || 1,
            city_id: LOCATION_OPTIONS[0]?.value || 1,
            price_per_party: '',
            image_url: ''
        });
        setShowCompanyFormModal(true);
        setError(null);
    };

    const handleCloseCompanyFormModal = () => {
        setShowCompanyFormModal(false);
        setEditingCompany(null);
        setUpdatedCompanyData(null);
        setError(null);
    };

    // --- NEW: Company Details Modal Handlers ---
    const handleCardClick = (company) => {
        setSelectedCompanyForDetails(company);
        setShowCompanyDetailsModal(true);
    };

    const handleCloseCompanyDetailsModal = () => {
        setShowCompanyDetailsModal(false);
        setSelectedCompanyForDetails(null);
    };

    // --- Booking Details Handlers ---
    const handleViewBookingsClick = async (company) => {
        handleCloseCompanyDetailsModal(); // Close the details modal first
        setSelectedCompanyForBookings(company);
        setShowBookingDetailsModal(true);
        setBookingLoading(true);
        setBookingError(null);
        setCurrentCompanyBookings([]);

        try {
            const bookings = await getCompanyBookings(company.id);
            setCurrentCompanyBookings(bookings);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            setBookingError('Failed to load bookings. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleCloseBookingDetailsModal = () => {
        setShowBookingDetailsModal(false);
        setSelectedCompanyForBookings(null);
        setCurrentCompanyBookings([]);
        setBookingError(null);
    };

    const handleProfileIconClick = () => {
        setShowProfileModal(true);
    };

    const handleCloseProfileModal = () => {
        setShowProfileModal(false);
    };

    return (
        <div className="tp-dashboard-container">
            <Header onProfileIconClick={handleProfileIconClick} />

            <div className="tp-main-content">
                <h2>My Companies</h2><br/>

                {error && <div className="tp-error">{error}</div>}
                {loading && <div className="tp-loading">Loading companies...</div>}

                {!loading && companies.length === 0 ? (
                    <div className="tp-no-companies">
                        <p>You don't have any companies yet.</p>
                        <button
                            className="tp-create-first-company-btn"
                            onClick={handleOpenCreateCompanyModal}
                        >
                            Create Your First Company
                        </button>
                    </div>
                ) : (
                    <div className="tp-companies-grid">
                        {companies.map((company) => (
                            <div
                                key={company.id}
                                className="tp-company-card"
                                onClick={() => handleCardClick(company)} // NEW: Click card to open details modal
                            >
                                <img
                                    src={company.image_url || '/default-company.jpg'}
                                    alt={company.name}
                                    className="tp-company-image"
                                    onError={(e) => {
                                        e.target.src = '/default-company.jpg';
                                    }}
                                />
                                <div className="tp-company-info">
                                    <h3>{company.name}</h3>
                                    <p>${company.price_per_party} / party</p>
                                    <p>Category: {company.category || 'Unknown'}</p>
                                    <p>City: {company.city || 'Unknown'}</p>
                                    <p>Total Bookings: {company.total_bookings}</p>
                                </div>
                                {/* REMOVED buttons from here - they will be in the details modal */}
                            </div>
                        ))}

                        <div
                            className="tp-company-card tp-add-card"
                            onClick={handleOpenCreateCompanyModal}
                        >
                            <div className="tp-add-icon">+</div>
                            <p>Add New Company</p>
                        </div>
                    </div>
                )}

                {/* Create/Edit Company Form Modal (remains unchanged functionality) */}
                {showCompanyFormModal && (
                    <div className="tp-modal-overlay">
                        <div className="tp-modal-content">
                            <button
                                className="tp-close-button"
                                onClick={handleCloseCompanyFormModal}
                            >
                                &times;
                            </button>
                            <h2>{editingCompany ? 'Edit Company' : 'Create New Company'}</h2>
                            <form onSubmit={editingCompany ? handleUpdateCompanySubmit : handleCreateCompanySubmit}>
                                <div className="tp-form-group">
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editingCompany ? updatedCompanyData?.name || '' : newCompanyData.name}
                                        onChange={editingCompany ? handleUpdateCompanyChange : handleCreateCompanyChange}
                                        required
                                    />
                                </div>

                                <div className="tp-form-row">
                                    <div className="tp-form-group">
                                        <label>Category</label>
                                        <select
                                            name="category_id"
                                            value={editingCompany ? updatedCompanyData?.category_id || '' : newCompanyData.category_id}
                                            onChange={editingCompany ? handleUpdateCompanyChange : handleCreateCompanyChange}
                                            required
                                        >
                                            {CATEGORY_OPTIONS.map(option => (
                                                <option key={option.id} value={option.id}>{option.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="tp-form-group">
                                        <label>City</label>
                                        <select
                                            name="city_id"
                                            value={editingCompany ? updatedCompanyData?.city_id || '' : newCompanyData.city_id}
                                            onChange={editingCompany ? handleUpdateCompanyChange : handleCreateCompanyChange}
                                            required
                                        >
                                            {LOCATION_OPTIONS.map(city => (
                                                <option key={city.value} value={city.value}>{city.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="tp-form-group">
                                    <label>Price Per Party ($)</label>
                                    <input
                                        type="number"
                                        name="price_per_party"
                                        value={editingCompany ? updatedCompanyData?.price_per_party || '' : newCompanyData.price_per_party}
                                        onChange={editingCompany ? handleUpdateCompanyChange : handleCreateCompanyChange}
                                        required
                                        min="0"
                                    />
                                </div>

                                <div className="tp-form-group">
                                    <label>Image URL (optional)</label>
                                    <input
                                        type="url"
                                        name="image_url"
                                        value={editingCompany ? updatedCompanyData?.image_url || '' : newCompanyData.image_url}
                                        onChange={editingCompany ? handleUpdateCompanyChange : handleCreateCompanyChange}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div className="tp-form-actions">
                                    <button type="submit" className="tp-submit-button">
                                        {editingCompany ? 'Save Changes' : 'Create Company'}
                                    </button>
                                    {editingCompany && (
                                        <button
                                            type="button"
                                            className="tp-cancel-button"
                                            onClick={handleCloseCompanyFormModal}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* NEW: Company Details Modal */}
                {showCompanyDetailsModal && selectedCompanyForDetails && (
                    <div className="tp-modal-overlay">
                        <div className="tp-modal-content tp-company-details-modal-content">
                            <button
                                className="tp-close-button"
                                onClick={handleCloseCompanyDetailsModal}
                            >
                                &times;
                            </button>
                            <h2>{selectedCompanyForDetails.name}</h2><br/>
                            <div className="tp-details-info">
                                <img
                                    src={selectedCompanyForDetails.image_url || '/default-company.jpg'}
                                    alt={selectedCompanyForDetails.name}
                                    className="tp-details-image"
                                    onError={(e) => { e.target.src = '/default-company.jpg'; }}
                                />
                                <div className='tp-details-text'>
                                <p><strong>Price:</strong> ${selectedCompanyForDetails.price_per_party} / party</p>
                                <p><strong>Category:</strong> {selectedCompanyForDetails.category || 'Unknown'}</p>
                                <p><strong>City:</strong> {selectedCompanyForDetails.city || 'Unknown'}</p>
                                <p><strong>Total Bookings:</strong> {selectedCompanyForDetails.total_bookings}</p>
                            </div>
                            </div>
                            <br/>
                            {/* Buttons inside the details modal */}
                            <div className="tp-company-card-actions tp-details-actions"> {/* Reusing action styles */}
                                <button
                                    className="tp-action-button tp-view-bookings-button"
                                    onClick={(e) => { e.stopPropagation(); handleViewBookingsClick(selectedCompanyForDetails); }}
                                >
                                    View Bookings
                                </button>
                                <button
                                    className="tp-action-button tp-edit-button"
                                    onClick={(e) => { e.stopPropagation(); handleEditClick(selectedCompanyForDetails); }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="tp-action-button tp-delete-button"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCompany(selectedCompanyForDetails.id); }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Details Modal (remains unchanged functionality) */}
                {showBookingDetailsModal && selectedCompanyForBookings && (
                    <div className="tp-modal-overlay">
                        <div className="tp-modal-content tp-booking-modal-content">
                            <button
                                className="tp-close-button"
                                onClick={handleCloseBookingDetailsModal}
                            >
                                &times;
                            </button>
                            <h2>Bookings for {selectedCompanyForBookings.name}</h2>
                            {bookingLoading && <p>Loading bookings...</p>}
                            {bookingError && <p className="tp-error">{bookingError}</p>}
                            {!bookingLoading && !bookingError && currentCompanyBookings.length === 0 && (
                                <p>No bookings found for this company.</p>
                            )}
                            {!bookingLoading && !bookingError && currentCompanyBookings.length > 0 && (
                                <div className="tp-bookings-list">
                                    {currentCompanyBookings.map(booking => (
                                        <div key={booking.id} className="tp-booking-item">
                                            <p><strong>Booking ID:</strong> {booking.id}</p>
                                            <p><strong>Event Date:</strong> {new Date(booking.eventDate).toLocaleDateString()}</p>
                                            <p><strong>Client Name:</strong> {booking.clientName}</p>
                                            <p><strong>Status:</strong> {booking.status}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Profile Modal (remains unchanged) */}
                {showProfileModal && (
                    <div className="tp-modal-overlay">
                        <div className="tp-modal-content">
                            <button
                                className="tp-close-button"
                                onClick={handleCloseProfileModal}
                            >
                                &times;
                            </button>
                            <ProfileDisplay />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThirdPartyDashboard;