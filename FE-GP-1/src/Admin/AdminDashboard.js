import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats } from '../Services/adminService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    customerCount: 0,
    ownerCount: 0,
    providerCount: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
        console.error("Using fallback data due to:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      {error && <div className="error-alert">{error}</div>}
      
      <div className="stats-grid">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          onClick={() => navigate('/admin/users')}
        />
        <StatCard 
          title="Customers" 
          value={stats.customerCount}
          onClick={() => navigate('/admin/users?type=1')}
        />
        <StatCard 
          title="Hall Owners" 
          value={stats.ownerCount}
          onClick={() => navigate('/admin/users?type=2')}
        />
        <StatCard 
          title="Service Providers" 
          value={stats.providerCount}
          onClick={() => navigate('/admin/users?type=3')}
        />
      </div>
    </div>
  );
};

// Optional: Extract StatCard as a separate component
const StatCard = ({ title, value, onClick }) => (
  <div className="stat-card" onClick={onClick}>
    <h3>{title}</h3>
    <p>{value}</p>
  </div>
);

export default AdminDashboard;