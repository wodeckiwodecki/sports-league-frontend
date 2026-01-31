import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect to dashboard since leagues are shown there
const LeagueList = () => {
  return <Navigate to="/dashboard" replace />;
};

export default LeagueList;
