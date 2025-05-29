import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HallBookingManager.css';

const HallBookingManager = ({ hallId, hallName, addNotification, formatDateForDisplay }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddBookingModal, setShowAddBookingModal] = useState(false);
    const [newBooking, setNewBooking] = useState({
        customerEmail: '',
        eventDate: '',
        startTime: '',
        endTime: ''
    });
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [editedBooking, setEditedBooking] = useState(null);


    // Fetch bookings when hallId changes
    useEffect(() => {
        if (hallId) {
            console.log('DEBUG: useEffect triggered for hallId:', hallId);
            fetchBookings(hallId);
        } else {
            setBookings([]);
            console.log('DEBUG: hallId is null, clearing bookings.');
        }
    }, [hallId]);

    const fetchBookings = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            console.log('DEBUG: Attempting to fetch bookings for hallId:', id);
            const response = await axios.get(
                `http://localhost:3000/api/bookings/hall/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('DEBUG: Raw API Response:', response);
            console.log('DEBUG: API Response data.data:', response.data.data);

            const mappedBookings = (response.data.data || []).map(backendBooking => ({
                id: backendBooking.id,
                customerEmail: backendBooking.customerEmail,
                eventDate: backendBooking.event_date,
                startTime: backendBooking.event_start_time || '',
                endTime: backendBooking.event_end_time || '',
                approval: backendBooking.approval,
                total_hall_price: backendBooking.total_hall_price
            }));

            const sortedBookings = mappedBookings.sort((a, b) => {
                const dateA = (a.eventDate && a.startTime) ? new Date(`${a.eventDate.split('T')[0]}T${a.startTime}`) : new Date(0);
                const dateB = (b.eventDate && b.endTime) ? new Date(`${b.eventDate.split('T')[0]}T${b.endTime}`) : new Date(0);

                if (a.approval === 'waiting' && b.approval !== 'waiting') return -1;
                if (a.approval !== 'waiting' && b.approval === 'waiting') return 1;

                return dateA - dateB;
            });

            console.log('DEBUG: Setting bookings state to:', sortedBookings);
            setBookings(sortedBookings);

        } catch (err) {
            console.error('ERROR: Failed to fetch bookings:', err.response?.data || err.message || err);
            setError(err.response?.data?.message || 'Failed to load bookings.');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNewBookingChange = (e) => {
        const { name, value } = e.target;
        setNewBooking(prev => ({ ...prev, [name]: value }));
    };

    const handleEditedBookingChange = (e) => {
        const { name, value } = e.target;
        setEditedBooking(prev => ({ ...prev, [name]: value }));
    };

    const handleAddBooking = async (e) => {
        e.preventDefault();
        setError(null);

        if (!newBooking.customerEmail || !newBooking.eventDate || !newBooking.startTime || !newBooking.endTime) {
            setError('Please fill in all booking fields.');
            return;
        }

        const bookingStartTime = new Date(`${newBooking.eventDate}T${newBooking.startTime}`);
        const bookingEndTime = new Date(`${newBooking.eventDate}T${newBooking.endTime}`);
        const now = new Date();

        if (bookingStartTime.toString() === 'Invalid Date' || bookingEndTime.toString() === 'Invalid Date') {
             setError('Invalid date or time format.');
             return;
        }

        if (bookingStartTime >= bookingEndTime) {
            setError('Start time cannot be after or equal to end time.');
            return;
        }

        const today = new Date();
        today.setHours(0,0,0,0);
        const eventDay = new Date(newBooking.eventDate);
        eventDay.setHours(0,0,0,0);

        if (eventDay < today) {
            setError('Event date cannot be in the past.');
            return;
        }

        if (eventDay.getTime() === today.getTime() && bookingStartTime < now) {
            setError('For today\'s date, start time cannot be in the past.');
            return;
        }


        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:3000/api/bookings',
                {
                    hallId: hallId,
                    customerEmail: newBooking.customerEmail,
                    eventDate: newBooking.eventDate,
                    startTime: newBooking.startTime + ':00',
                    endTime: newBooking.endTime + ':00'
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            await fetchBookings(hallId);
            addNotification(`A new booking for ${hallName}, check it!`);
            setShowAddBookingModal(false);
            setNewBooking({
                customerEmail: '',
                eventDate: '',
                startTime: '',
                endTime: ''
            });
        } catch (err) {
            console.error('ERROR: Failed to add booking:', err.response?.data || err.message || err);
            setError(err.response?.data?.message || 'Failed to add booking.');
        }
    };

    const handleApproveBooking = async (bookingId) => {
        setError(null);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `http://localhost:3000/api/bookings/${bookingId}/status`,
                { status: 'approved' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchBookings(hallId);
        } catch (err) {
            console.error('ERROR: Failed to approve booking:', err.response?.data || err.message || err);
            setError(err.response?.data?.message || 'Failed to approve booking.');
        }
    };

    const handleUpdateBooking = async (e) => {
        e.preventDefault();
        setError(null);

        if (!editedBooking?.customerEmail || !editedBooking?.eventDate || !editedBooking?.startTime || !editedBooking?.endTime) {
            setError('Please fill in all booking fields for update.');
            return;
        }

        const bookingStartTime = new Date(`${editedBooking.eventDate}T${editedBooking.startTime}`);
        const bookingEndTime = new Date(`${editedBooking.eventDate}T${editedBooking.endTime}`);
        const now = new Date();

        if (bookingStartTime.toString() === 'Invalid Date' || bookingEndTime.toString() === 'Invalid Date') {
             setError('Invalid date or time format in edit form.');
             return;
        }

        if (bookingStartTime >= bookingEndTime) {
            setError('Start time cannot be after or equal to end time.');
            return;
        }

        const today = new Date();
        today.setHours(0,0,0,0);
        const eventDay = new Date(editedBooking.eventDate);
        eventDay.setHours(0,0,0,0);

        if (eventDay < today) {
            setError('Event date cannot be in the past.');
            return;
        }

        if (eventDay.getTime() === today.getTime() && bookingStartTime < now) {
            setError('For today\'s date, start time cannot be in the past.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `http://localhost:3000/api/bookings/${editingBookingId}`,
                {
                    customerEmail: editedBooking.customerEmail,
                    eventDate: editedBooking.eventDate,
                    startTime: editedBooking.startTime + ':00',
                    endTime: editedBooking.endTime + ':00'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchBookings(hallId);
            setEditingBookingId(null);
            setEditedBooking(null);
        } catch (err) {
            console.error('ERROR: Failed to update booking:', err.response?.data || err.message || err);
            setError(err.response?.data?.message || 'Failed to update booking.');
        }
    };

    // The handleDeleteBooking function is now removed, as it's not used.
    // If you need to re-add delete functionality later, you'd add this function back
    // along with the button in the JSX.


    if (loading) return <div className="loading-small">Loading bookings...</div>;
    if (error && bookings.length === 0) return <div className="error-message">{error}</div>;

    return (
        <div className="booking-management">
            <div className="booking-header">
                <h3>Bookings for {hallName}</h3>
                <button
                    className="add-booking-btn"
                    onClick={() => { setShowAddBookingModal(true); setError(null); }}
                >
                    + Add Booking
                </button>
            </div>

            {error && bookings.length > 0 && <div className="error-message">{error}</div>}

            {bookings.length === 0 && !loading && !error ? (
                <p className="no-bookings">No bookings found for this hall.</p>
            ) : (
                <ul className="booking-list">
                    {bookings.map(booking => (
                        <li key={booking.id} className="booking-item">
                            {editingBookingId === booking.id ? (
                                <form onSubmit={handleUpdateBooking} className="edit-booking-form">
                                    <input
                                        type="email"
                                        name="customerEmail"
                                        value={editedBooking?.customerEmail || ''}
                                        onChange={handleEditedBookingChange}
                                        placeholder="Customer Email"
                                        required
                                    />
                                    <input
                                        type="date"
                                        name="eventDate"
                                        value={editedBooking?.eventDate || ''}
                                        onChange={handleEditedBookingChange}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={editedBooking?.startTime || ''}
                                        onChange={handleEditedBookingChange}
                                        required
                                    />
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={editedBooking?.endTime || ''}
                                        onChange={handleEditedBookingChange}
                                        required
                                    />
                                    <button type="submit" className="save-btn">Save</button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingBookingId(null); setEditedBooking(null); setError(null); }}
                                        className="cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                </form>
                            ) : (
                                <div className="booking-details">
                                    <p><strong>Customer:</strong> {booking.customerEmail}</p>
                                    <p><strong>Date:</strong> {formatDateForDisplay(booking.eventDate)}</p>
                                    <p><strong>Time:</strong> {(booking.startTime || '').substring(0, 5)} - {(booking.endTime || '').substring(0, 5)}</p>
                                    <p><strong>Status:</strong> <span className={`booking-status ${booking.approval}`}>
                                        {booking.approval}
                                    </span></p>
                                    <div className="booking-actions">
                                        {booking.approval === 'waiting' && (
                                            <button
                                                className="approve-btn"
                                                onClick={() => handleApproveBooking(booking.id)}
                                            >
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            className="edit-btn"
                                            onClick={() => {
                                                setEditingBookingId(booking.id);
                                                setEditedBooking({
                                                    customerEmail: booking.customerEmail,
                                                    eventDate: booking.eventDate?.split('T')[0] || '',
                                                    startTime: (booking.startTime || '').substring(0, 5),
                                                    endTime: (booking.endTime || '').substring(0, 5)
                                                });
                                            }}
                                        >
                                            Edit
                                        </button>
                                        {/* DELETE BUTTON REMOVED */}
                                        {/* <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteBooking(booking.id)}
                                        >
                                            Delete
                                        </button> */}
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* Add Booking Modal */}
            {showAddBookingModal && (
                <div className="modal-overlay">
                    <div className="modal-content booking-modal">
                        <button
                            className="close-button"
                            onClick={() => { setShowAddBookingModal(false); setError(null); }}
                        >
                            &times;
                        </button>
                        <h2>Add New Booking</h2>
                        {error && <div className="error-message">{error}</div>}
                        <form onSubmit={handleAddBooking}>
                            <div className="form-group">
                                <label>Customer Email *</label>
                                <input
                                    type="email"
                                    name="customerEmail"
                                    value={newBooking.customerEmail}
                                    onChange={handleNewBookingChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Event Date *</label>
                                <input
                                    type="date"
                                    name="eventDate"
                                    value={newBooking.eventDate}
                                    onChange={handleNewBookingChange}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="form-group">
                                <label>Start Time *</label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={newBooking.startTime}
                                    onChange={handleNewBookingChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Time *</label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={newBooking.endTime}
                                    onChange={handleNewBookingChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-button">Add Booking</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HallBookingManager;