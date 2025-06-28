import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './HallBookingManager.css';
import { NotificationContext } from '../contexts/NotificationContext';

const HallBookingManager = ({ hallId, hallName, formatDateForDisplay }) => {
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
    const { createNotification } = useContext(NotificationContext);

    // Fetch bookings when hallId changes
    useEffect(() => {
        if (hallId) {
            fetchBookings(hallId);
        } else {
            setBookings([]);
        }
    }, [hallId]);

    const fetchBookings = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:3000/api/bookings/hall/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            const mappedBookings = (response.data.data || []).map(backendBooking => {
                const eventDate = new Date(backendBooking.event_date);
                eventDate.setMinutes(eventDate.getMinutes() + eventDate.getTimezoneOffset());
                
                return {
                    id: backendBooking.id,
                    customerEmail: backendBooking.customerEmail,
                    eventDate: eventDate.toISOString().split('T')[0],
                    startTime: backendBooking.event_start_time || '',
                    endTime: backendBooking.event_end_time || '',
                    approval: backendBooking.approval,
                    total_hall_price: backendBooking.total_hall_price
                };
            });
    
            const sortedBookings = mappedBookings.sort((a, b) => {
                const dateA = new Date(a.eventDate);
                const dateB = new Date(b.eventDate);
                return dateA - dateB;
            });
    
            setBookings(sortedBookings);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
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
    
        const createLocalDate = (dateStr, timeStr = '00:00') => {
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hours, minutes] = timeStr.split(':').map(Number);
            return new Date(year, month - 1, day, hours, minutes);
        };
    
        const bookingStartTime = createLocalDate(newBooking.eventDate, newBooking.startTime);
        const bookingEndTime = createLocalDate(newBooking.eventDate, newBooking.endTime);
        const now = new Date();
    
        if (isNaN(bookingStartTime.getTime())) {
            setError('Invalid start time format (use HH:MM).');
            return;
        }
        if (isNaN(bookingEndTime.getTime())) {
            setError('Invalid end time format (use HH:MM).');
            return;
        }
    
        if (bookingStartTime >= bookingEndTime) {
            setError('End time must be after start time.');
            return;
        }
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventDay = createLocalDate(newBooking.eventDate);
        eventDay.setHours(0, 0, 0, 0);
    
        if (eventDay < today) {
            setError('Cannot book for past dates.');
            return;
        }
    
        if (eventDay.getTime() === today.getTime() && bookingStartTime < now) {
            setError('Cannot book past times for today.');
            return;
        }
    
        try {
            const token = localStorage.getItem('token');
            
            const formattedDate = `${bookingStartTime.getFullYear()}-${String(bookingStartTime.getMonth() + 1).padStart(2, '0')}-${String(bookingStartTime.getDate()).padStart(2, '0')}`;
            
            await axios.post(
                'http://localhost:3000/api/bookings',
                {
                    hallId: hallId,
                    customerEmail: newBooking.customerEmail,
                    eventDate: formattedDate,
                    startTime: newBooking.startTime.includes(':') ? 
                        newBooking.startTime : 
                        `${newBooking.startTime}:00`,
                    endTime: newBooking.endTime.includes(':') ? 
                        newBooking.endTime : 
                        `${newBooking.endTime}:00`
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
    
            await fetchBookings(hallId);
            await createNotification({
                title: 'New Booking Added',
                message: `A new booking for ${hallName} has been added!`,
                type: 'info',
                recipientType: 'owner',
                recipient: {
                    hallId: hallId
                }
            });
            
            setShowAddBookingModal(false);
            setNewBooking({
                customerEmail: '',
                eventDate: '',
                startTime: '',
                endTime: ''
            });
    
        } catch (err) {
            console.error('Failed to add booking:', err);
            setError(err.response?.data?.message || 'Failed to add booking. Please try again.');
            
            if (err.response?.status === 409) {
                setError('This time slot is already booked. Please choose another time.');
            } else if (err.response?.status === 400) {
                setError('Invalid booking request. Please check your inputs.');
            }
        }
    };

    const handleApproveBooking = async (bookingId) => {
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `http://localhost:3000/api/bookings/${bookingId}/status`,
                { status: 'approved' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            await fetchBookings(hallId);
            
            const approvedBooking = bookings.find(b => b.id === bookingId);
            
            if (approvedBooking) {
                await createNotification({
                    title: 'Booking Approved',
                    message: `Your booking for ${hallName} on ${approvedBooking.eventDate} has been approved`,
                    type: 'success',
                    recipientType: 'customer',
                    recipient: {
                        email: approvedBooking.customerEmail
                    }
                });
                
                await createNotification({
                    title: 'Booking Approved',
                    message: `You approved a booking for ${hallName} from ${approvedBooking.customerEmail}`,
                    type: 'info',
                    recipientType: 'owner',
                    recipient: {
                        hallId: hallId
                    }
                });
            }
        } catch (err) {
            console.error('Failed to approve booking:', err);
            setError(err.response?.data?.message || 'Failed to approve booking.');
        }
    };

    const handleUpdateBooking = async (e) => {
        e.preventDefault();
        setError(null);
    
        if (!editedBooking?.customerEmail || !editedBooking?.eventDate || !editedBooking?.startTime || !editedBooking?.endTime) {
            setError('Please fill in all booking fields.');
            return;
        }
    
        const createLocalDate = (dateStr, timeStr) => {
            const [year, month, day] = dateStr.split('-');
            const [hours, minutes] = timeStr.split(':');
            return new Date(year, month - 1, day, hours, minutes);
        };
    
        const bookingStartTime = createLocalDate(editedBooking.eventDate, editedBooking.startTime);
        const bookingEndTime = createLocalDate(editedBooking.eventDate, editedBooking.endTime);
        const now = new Date();
    
        if (isNaN(bookingStartTime.getTime())) {
            setError('Invalid start time format (use HH:MM).');
            return;
        }
        if (isNaN(bookingEndTime.getTime())) {
            setError('Invalid end time format (use HH:MM).');
            return;
        }
    
        if (bookingStartTime >= bookingEndTime) {
            setError('End time must be after start time.');
            return;
        }
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventDay = new Date(editedBooking.eventDate);
        eventDay.setHours(0, 0, 0, 0);
    
        if (eventDay < today) {
            setError('Cannot book for past dates.');
            return;
        }
    
        if (eventDay.getTime() === today.getTime() && bookingStartTime < now) {
            setError('Cannot book past times for today.');
            return;
        }
    
        try {
            const token = localStorage.getItem('token');
            
            const formattedDate = editedBooking.eventDate;
            
            await axios.patch(
                `http://localhost:3000/api/bookings/${editingBookingId}`,
                {
                    customerEmail: editedBooking.customerEmail,
                    eventDate: formattedDate,
                    startTime: editedBooking.startTime.includes(':') ? 
                        editedBooking.startTime : 
                        `${editedBooking.startTime}:00`,
                    endTime: editedBooking.endTime.includes(':') ? 
                        editedBooking.endTime : 
                        `${editedBooking.endTime}:00`
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );
    
            await fetchBookings(hallId);
            setEditingBookingId(null);
            setEditedBooking(null);
            
            await createNotification({
                title: 'Booking Updated',
                message: `Booking for ${hallName} has been updated`,
                type: 'info',
                recipientType: 'owner',
                recipient: {
                    hallId: hallId
                }
            });
    
        } catch (err) {
            console.error('Update booking error:', err);
            
            if (err.response?.status === 409) {
                setError('This time slot is already booked.');
            } else if (err.response?.status === 400) {
                setError('Invalid booking data. Please check your inputs.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to update booking. Please try again.');
            }
        }
    };

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
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

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