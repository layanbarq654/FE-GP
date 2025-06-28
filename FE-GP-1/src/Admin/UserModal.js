import { useState, useEffect } from 'react';
import { createUser, updateUser } from '../Services/adminService';
import './UserModal.css';

const UserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fname: '',
    mname: '',
    lname: '',
    email: '',
    password: '',
    city_id: 1,
    type: 1
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fname: user.fname || '',
        mname: user.mname || '',
        lname: user.lname || '',
        email: user.email || '',
        password: '',
        city_id: user.city_id || 1,
        type: user.type || 1
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

// In your UserModal.js, update the handleSubmit function:
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    let result;
    if (user) {
      result = await updateUser(user.id, formData);
    } else {
      // For new users, we need to include the password confirmation
      const userData = {
        ...formData,
        password_confirmation: formData.password // Add this if your API requires it
      };
      result = await createUser(userData);
    }
    onSave(result);
  } catch (err) {
    setError(err.response?.data?.message || err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? 'Edit User' : 'Create New User'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="fname"
              value={formData.fname}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Middle Name</label>
            <input
              type="text"
              name="mname"
              value={formData.mname}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lname"
              value={formData.lname}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              placeholder={user ? 'Leave blank to keep unchanged' : ''}
            />
          </div>
          
          <div className="form-group">
            <label>City ID</label>
            <input
              type="number"
              name="city_id"
              value={formData.city_id}
              onChange={handleChange}
              required
              min="1"
            />
          </div>
          
          <div className="form-group">
            <label>User Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="1">Customer</option>
              <option value="2">Hall Owner</option>
              <option value="3">Service Provider</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;