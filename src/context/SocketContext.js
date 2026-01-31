import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to WebSocket
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  }, [user]);

  const joinLeague = (leagueId) => {
    if (socket && connected) {
      socket.emit('join_league', leagueId);
    }
  };

  const leaveLeague = (leagueId) => {
    if (socket && connected) {
      socket.emit('leave_league', leagueId);
    }
  };

  const joinTeam = (teamId) => {
    if (socket && connected) {
      socket.emit('join_team', teamId);
    }
  };

  const value = {
    socket,
    connected,
    joinLeague,
    leaveLeague,
    joinTeam
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
