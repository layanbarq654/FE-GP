import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../Services/authService';
import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`admin-container ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Dashboard</h2>
          <button 
            className="toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button onClick={() => navigate('/admin/dashboard')}>
                <i className="fas fa-tachometer-alt"></i>
                {sidebarOpen && ' Dashboard'}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/admin/users')}>
                <i className="fas fa-users"></i>
                {sidebarOpen && ' User Management'}
              </button>
            </li>
            <li>
              <button onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                {sidebarOpen && ' Logout'}
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;