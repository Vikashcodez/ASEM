import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    setUserRole(null);
    localStorage.clear();
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          !token ? <Login setToken={setToken} setUserRole={setUserRole} /> : <Navigate to="/" />
        } />
        <Route path="/" element={
          token ? (
            userRole === 'admin' ? 
              <AdminDashboard handleLogout={handleLogout} /> : 
              <EmployeeDashboard handleLogout={handleLogout} />
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;