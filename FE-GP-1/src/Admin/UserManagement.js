import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  getUsers, 
  getUsersByType, 
  searchUsersByEmail,
  deleteUser,
  updateUser,
  createUser
} from '../Services/adminService';
import UserModal from './UserModal';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [impersonating, setImpersonating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const typeFilter = queryParams.get('type');

  // Hardcoded test users (first two in table)
  const testUsers = {
    9: { // Must match actual user ID in your database
      email: "rahaf@gmail.com",
      password: "Rahaf12345",
      type: 1 
    },
    18: { // Must match actual user ID in your database
      email: "aya.ja@gmail.com",
      password: "Aya12345",
      type: 2
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        let data;
        
        if (searchEmail) {
          data = await searchUsersByEmail(searchEmail);
        } else if (typeFilter) {
          data = await getUsersByType(typeFilter);
        } else {
          data = await getUsers();
        }
        
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [typeFilter, searchEmail]);

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleImpersonate = async (userId) => {
    try {
      setImpersonating(true);
      setError('');
  
      const testUser = testUsers[userId];
      if (!testUser) {
        throw new Error('Impersonation only available for test accounts');
      }
  
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
  
      const { accessToken, refreshToken, type } = data;
  
      if (!accessToken || type === undefined) {
        throw new Error('Invalid login response');
      }
  
      localStorage.clear();
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userType', type);
  
      // Redirect based on user type
      const redirectPath = getDashboardPath(type);
      window.location.href = redirectPath;
      
    } catch (err) {
      setError(err.message || 'Impersonation failed');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
    } finally {
      setImpersonating(false);
    }
  };
  
  // Helper function to determine dashboard path
  const getDashboardPath = (userType) => {
    switch(userType) {
      case 1: // Customer
        return '/customer/dashboard';
      case 2: // Hall Owner
        return '/owner/dashboard';
      case 3: // Service Provider
        return '/thirdparty/dashboard';
      case 4: // Admin
        return '/admin';
      default:
        return '/';
    }
  };
  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedUser(null);
    setError('');
  };

  const handleUserUpdate = async (updatedUser) => {
    try {
      setError('');
      let result;
      
      if (selectedUser) {
        result = await updateUser(selectedUser.id, updatedUser);
        setUsers(users.map(user => 
          user.id === selectedUser.id ? result : user
        ));
      } else {
        result = await createUser(updatedUser);
        setUsers([...users, result]);
      }
      
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="user-management">
      <div className="user-header">
        <h1>User Management</h1>
        <button className="create-btn" onClick={handleCreate}>
          Create New User
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="user-filters">
        <div className="filter-group">
          <label>Filter by Type:</label>
          <select 
            value={typeFilter || ''} 
            onChange={(e) => navigate(`/admin/users?type=${e.target.value}`)}
          >
            <option value="">All Users</option>
            <option value="1">Customers</option>
            <option value="2">Hall Owners</option>
            <option value="3">Service Providers</option>
            <option value="4">Admins</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Search by Email:</label>
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Enter email..."
          />
          <button 
            onClick={() => setSearchEmail('')}
            disabled={!searchEmail}
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={testUsers[user.id] ? 'test-user' : ''}>
                <td>{user.id}</td>
                <td>{`${user.fname} ${user.lname}`}</td>
                <td>{user.email}</td>
                <td>
                  {user.type === 1 ? 'Customer' : 
                   user.type === 2 ? 'Hall Owner' : 
                   user.type === 3 ? 'Service Provider' : 'Admin'}
                </td>
                <td className="actions">
                  <button onClick={() => handleEdit(user)}>Edit</button>
                  <button
                    onClick={() => handleImpersonate(user.id)}
                    disabled={impersonating || !testUsers[user.id]}
                    className={!testUsers[user.id] ? '' : ''}
                  >
                    {impersonating ? 'Logging in...' : 'Impersonate'}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <UserModal 
          user={selectedUser}
          onClose={handleModalClose}
          onSave={handleUserUpdate}
        />
      )}
    </div>
  );
};

export default UserManagement;