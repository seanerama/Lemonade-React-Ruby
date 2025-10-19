import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/Auth/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import GameSelect from './components/Game/GameSelect';
import HomeOffice from './components/Game/HomeOffice';
import Shopping from './components/Game/Shopping';
import Kitchen from './components/Game/Kitchen';
import Permits from './components/Game/Permits';
import ChooseLocation from './components/Game/ChooseLocation';
import Sell from './components/Game/Sell';
import Debug from './components/Game/Debug';
import Leaderboard from './components/Game/Leaderboard';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/game-select" 
            element={
              <ProtectedRoute>
                <GameSelect />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/home-office"
            element={
              <ProtectedRoute>
                <HomeOffice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopping"
            element={
              <ProtectedRoute>
                <Shopping />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute>
                <Kitchen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/permits"
            element={
              <ProtectedRoute>
                <Permits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/choose-location"
            element={
              <ProtectedRoute>
                <ChooseLocation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sell"
            element={
              <ProtectedRoute>
                <Sell />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug"
            element={
              <ProtectedRoute>
                <Debug />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;