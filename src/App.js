import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeagueList from './pages/LeagueList';
import CreateLeague from './pages/CreateLeague';
import LeagueDashboard from './pages/LeagueDashboard';
import TeamRoster from './pages/TeamRoster';
import DraftRoom from './pages/DraftRoom';
import TradeCenter from './pages/TradeCenter';
import FreeAgents from './pages/FreeAgents';
import Schedule from './pages/Schedule';
import Standings from './pages/Standings';
import PlayerProfile from './pages/PlayerProfile';

// NEW Multiplayer Pages
import CreateMultiplayerLeague from './pages/CreateMultiplayerLeague';
import MultiplayerLeagueDashboard from './pages/MultiplayerLeagueDashboard';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/leagues" element={<PrivateRoute><LeagueList /></PrivateRoute>} />
        
        {/* OLD Single-player League Routes */}
        <Route path="/leagues/create" element={<PrivateRoute><CreateLeague /></PrivateRoute>} />
        <Route path="/league/:leagueId" element={<PrivateRoute><LeagueDashboard /></PrivateRoute>} />
        <Route path="/league/:leagueId/team/:teamId" element={<PrivateRoute><TeamRoster /></PrivateRoute>} />
        <Route path="/league/:leagueId/draft" element={<PrivateRoute><DraftRoom /></PrivateRoute>} />
        <Route path="/league/:leagueId/trades" element={<PrivateRoute><TradeCenter /></PrivateRoute>} />
        <Route path="/league/:leagueId/free-agents" element={<PrivateRoute><FreeAgents /></PrivateRoute>} />
        <Route path="/league/:leagueId/schedule" element={<PrivateRoute><Schedule /></PrivateRoute>} />
        <Route path="/league/:leagueId/standings" element={<PrivateRoute><Standings /></PrivateRoute>} />
        <Route path="/league/:leagueId/player/:playerId" element={<PrivateRoute><PlayerProfile /></PrivateRoute>} />
        
        {/* NEW Multiplayer League Routes */}
        <Route path="/multiplayer/create" element={<PrivateRoute><CreateMultiplayerLeague /></PrivateRoute>} />
        <Route path="/multiplayer-league/:id" element={<PrivateRoute><MultiplayerLeagueDashboard /></PrivateRoute>} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
