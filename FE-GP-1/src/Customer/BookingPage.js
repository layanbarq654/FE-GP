import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createHallBooking } from '../Services/CustomerService';
import './BookingPage.css';


const daysOfWeek = ['', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const shortDays = ['', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const BookingPage = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const hall = state?.data || {};

  // Extract hall schedule
  const openingTime = hall.open_time?.substring(0, 5) || '09:00';
  const closingTime = hall.close_time?.substring(0, 5) || '23:00';
  const openDay = hall.open_day || 2;
  const closeDay = hall.close_day || 6;
  const vacationDays = hall.vacation_days?.map(date => date.split('T')[0]) || [];
  const existingBookings = hall.upcoming_bookings || [];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const convertToCustomDay = (jsDay) => jsDay === 0 ? 2 : jsDay === 6 ? 1 : jsDay + 2;

  // Generate time slots based on hall opening hours
  useEffect(() => {
    const [openingHour] = openingTime.split(':').map(Number);
    const [closingHour] = closingTime.split(':').map(Number);
    const slots = [];
    for (let hour = openingHour; hour <= closingHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    setTimeSlots(slots);
  }, [openingTime, closingTime]);

  // Generate week days for the calendar view
  useEffect(() => {
    const days = [];
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    setWeekDays(days);
  }, [selectedDate]);

  // Check if a time slot is available
  const isSlotAvailable = (date, time, isHalfHour = false) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = convertToCustomDay(date.getDay());
    const [hours] = time.split(':').map(Number);
    const minutes = isHalfHour ? 30 : 0;

    // Check if the hall is open on this day
    if (dayOfWeek < openDay || dayOfWeek > closeDay) return false;
    if (vacationDays.includes(dateStr)) return false;

    // Check if within operating hours
    const slotTime = hours * 60 + minutes;
    const [openingHour, openingMinute] = openingTime.split(':').map(Number);
    const openingTimeMinutes = openingHour * 60 + openingMinute;
    const [closingHour, closingMinute] = closingTime.split(':').map(Number);
    const closingTimeMinutes = closingHour * 60 + closingMinute;
    if (slotTime < openingTimeMinutes || slotTime >= closingTimeMinutes) return false;

    // Check against existing bookings
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hours, minutes + (isHalfHour ? 30 : 60), 0, 0);

    return !existingBookings.some(booking => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      return (slotStart < bookingEnd && slotEnd > bookingStart);
    });
  };

  const handleDateChange = (e) => {
    const localDate = new Date(e.target.value);
    setSelectedDate(localDate);
    setStartTime('');
    setEndTime('');
  };

  const handleSlotClick = (date, time) => {
    const [hours] = time.split(':').map(Number);
    const isClosingHour = hours === parseInt(closingTime.split(':')[0], 10);
    if (!isSlotAvailable(date, time) || isClosingHour) return;
  
    setSelectedDate(date);
    
    if (!startTime) {
      setStartTime(`${hours.toString().padStart(2, '0')}:00`);
    } else if (!endTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      
      if (hours === startHour) {
        setStartTime(startMinute === 0 
          ? `${startHour.toString().padStart(2, '0')}:30`
          : `${startHour.toString().padStart(2, '0')}:00`);
      } else {
        setEndTime(`${hours.toString().padStart(2, '0')}:00`);
      }
    } else {
      setStartTime(`${hours.toString().padStart(2, '0')}:00`);
      setEndTime('');
    }
  };

  const handleGuestCountChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value, 10) || 1);
    setGuestCount(Math.min(value, hall.capacity || Infinity));
  };

  const handleConfirmBooking = async () => {
    setError('');
    if (!startTime || !endTime) return setError('Please select both start and end times');
    if (startTime >= endTime) return setError('End time must be after start time');
    if (guestCount < 1) return setError('Guest count must be at least 1');
  
    setIsLoading(true);
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      const result = await createHallBooking({
        hallId: parseInt(id),
        eventDate: formattedDate,
        startTime: startTime,
        endTime: endTime,
        guestCount: guestCount
      });
  
      setBookingDetails({
        hallName: hall.name,
        date: formattedDate,
        day: daysOfWeek[convertToCustomDay(selectedDate.getDay())],
        startTime,
        endTime,
        guestCount
      });
      setShowConfirmation(true);
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeDisplay = (time) => {
    const [hours, minutes] = time?.split(':') || ['00', '00'];
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    const customDay = convertToCustomDay(date.getDay());
    return `${shortDays[customDay]} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="booking-container">
      <header className="booking-header">
        <button className="back-button" onClick={() => navigate(-1)}> 
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg> Back
        </button>
        <div className="header-content">
          <h2 className="booking-title">Booking Details</h2>
        </div>
      </header>

      <div className="booking-content">
        <div className="form-section">
          <div className="form-card">
            <div className="form-group">
              <label className="input-label">Date</label>
              <div className="input-wrapper">
                <input
                  type="date"
                  className="modern-input"
                  value={formatDateForInput(selectedDate)}
                  onChange={handleDateChange}
                  min={formatDateForInput(new Date())}
                />
              </div>
            </div>

            <div className="time-range-grid">
              <div className="form-group">
                <label className="input-label">Start Time</label>
                <div className="input-wrapper">
                  <input
                    type="time"
                    className="modern-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    step="1800"
                    min={openingTime}
                    max={closingTime}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">End Time</label>
                <div className="input-wrapper">
                  <input
                    type="time"
                    className="modern-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    step="1800"
                    min={openingTime}
                    max={closingTime}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Number of Guests</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  className="modern-input"
                  min="1"
                  max={hall.capacity || 500}
                  value={guestCount}
                  onChange={handleGuestCountChange}
                />
                {hall.capacity && <div className="capacity-badge">Max: {hall.capacity}</div>}
              </div>
            </div>
            <div className="action-bar">
              <button 
                className="primary-button"
                onClick={handleConfirmBooking}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="spinner" viewBox="0 0 50 50">
                      <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>

          {error && <div className="error-card">{error}</div>}
        </div>
        
        <div className="time-grid-section">
          <div className="time-grid-container">
            <div className="time-table vertical">
              <div className="header-row">
                <div className="header-cell day-label">Date</div>
                {timeSlots.map(time => (
                  <div key={time} className="header-cell">
                    {parseInt(time.split(':')[0], 10)}
                  </div>
                ))}
              </div>

              {weekDays.map(day => {
                const dateStr = day.toISOString().split('T')[0];
                const customDay = convertToCustomDay(day.getDay());
                const isOperatingDay = customDay >= openDay && customDay <= closeDay;
                const isVacationDay = vacationDays.includes(dateStr);
                const isAvailableDay = isOperatingDay && !isVacationDay;

                return (
                  <div key={day.toString()} className="row">
                    <div className={`day-cell ${day.toDateString() === selectedDate.toDateString() ? 'selected-day' : ''} ${!isAvailableDay ? 'closed-day' : ''}`}>
                      {formatDateDisplay(day)}
                      {!isAvailableDay && (
                        <span className="day-status">
                          {isVacationDay ? 'Vacation' : 'Closed'}
                        </span>
                      )}
                    </div>

                    {timeSlots.map(time => {
                      const [hours] = time.split(':').map(Number);
                      const isClosingHour = hours === parseInt(closingTime.split(':')[0], 10);
                      const available = isAvailableDay && (isClosingHour || isSlotAvailable(day, time));

                      return (
                        <div
                          key={`${day}-${time}`}
                          className={`slot-cell ${available ? '' : 'unavailable'} ${isClosingHour ? 'closing-hour' : ''}`}
                          onClick={() => handleSlotClick(day, time)}
                        >
                          {startTime && endTime && day.toDateString() === selectedDate.toDateString() && 
                            parseInt(time.split(':')[0]) >= parseInt(startTime.split(':')[0]) && 
                            parseInt(time.split(':')[0]) < parseInt(endTime.split(':')[0]) && (
                            <div className="selection-indicator"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-popup">
            <div className="popup-header">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Booking Confirmed!</h3>
            </div>
            <div className="popup-content">
              <p>Your booking for <strong>{bookingDetails?.hallName}</strong> is confirmed</p>
              <div className="booking-summary">
                <p><strong>{bookingDetails?.day}</strong>, {bookingDetails?.date}</p>
                <p>{formatTimeDisplay(bookingDetails?.startTime)} - {formatTimeDisplay(bookingDetails?.endTime)}</p>
                <p>Guests {bookingDetails?.guestCount}</p>
              </div>
            </div>
            <div className="popup-actions">
              <button 
                className="view-bookings-button"
                onClick={() => navigate('/my-bookings')}
              >
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;