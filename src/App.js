// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './register/Login';
import SignUp from './register/SignUp';
import OwnerDashboard from './owner/OwnerDashboard';
import ThirdPartyDashboard from './ThirdParty/ThirdPartyDashboard';
import CustomerDashboard from './Customer/CustomerDashboard';
import AdminDashboard from './Admin/AdminDashboard';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/thirdparty/dashboard" element={<ThirdPartyDashboard />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;