// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './register/Login';
import SignUp from './register/SignUp';
import OwnerDashboard from './owner/OwnerDashboard';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
      </Routes>
    </div>
  );
}

export default App;