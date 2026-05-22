import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const { token, user, loading, logout } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          !token ? <Login /> : <Navigate to="/" />
        } />
        <Route path="/" element={
          token ? (
            user?.role === 'admin' ? 
              <AdminDashboard handleLogout={logout} /> : 
              <EmployeeDashboard handleLogout={logout} />
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;