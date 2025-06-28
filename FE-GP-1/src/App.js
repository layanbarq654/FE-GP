// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './register/Login';
import SignUp from './register/SignUp';
import OwnerDashboard from './owner/OwnerDashboard';
import ThirdPartyDashboard from './ThirdParty/ThirdPartyDashboard';
import CustomerDashboard from './Customer/CustomerDashboard';
import AdminLayout from './Admin/AdminLayout';
import AdminDashboard from './Admin/AdminDashboard';
import UserManagement from './Admin/UserManagement';
import HallDetailsPage from './Customer/HallDetailsPage';
import BookingPage from './Customer/BookingPage';
import ThirdPartiesPage from './Customer/ThirdPartiesPage';
import MyBookingsPage from './Customer/MyBookingsPage';
import CustomerProfile from './Customer/CustomerProfile';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Customer Routes */}
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/halls/:id" element={<HallDetailsPage />} />
          <Route path="/halls/:id/book" element={<BookingPage />} />
          <Route path="/customer-profile" element={<CustomerProfile />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/halls/:hallId/services" element={<ThirdPartiesPage />} />
          
          {/* Owner Routes */}
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          
          {/* Third Party Routes */}
          <Route path="/thirdparty/dashboard" element={<ThirdPartyDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route index element={<Navigate to="/admin/dashboard" />} />
          </Route>
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </NotificationProvider>
  );
}

export default App;