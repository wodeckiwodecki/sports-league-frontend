import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://sports-league-backend-production.up.railway.app';

const DraftRoom = () => {
  const { leagueId } = useParams();
  const { token } = useAuth();
  
  const [draftState, setDraftState] = useState(null);
  const [picks, setPicks] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [initializing, setInitializing] = useState(false);
  
  const positions = ['ALL', 'C', 'PF', 'SF', 'SG', 'PG', 'P', '1B', '2B', '3B', 'SS', 'OF'];

  useEffect(() => {
    loadDraftState();
    loadAvailablePlayers();
    
    const interval = setInterval(() => {
      loadDraftState();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [leagueId]);

  const loadDraftState = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/draft/${leagueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDraftState(response.data.draftState);
      setPicks(response.data.picks || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading draft state:', error);
      setLoading(false);
    }
  };

  const loadAvailablePlayers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/draft/${leagueId}/available-players`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { position: positionFilter !== 'ALL' ? positionFilter : null, search: searchTerm }
      });
      
      setAvailablePlayers(response.data.players || response.data || []);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const initializeAndStartDraft = async () => {
    setInitializing(true);
    try {
      // Step 1: Initialize
      await axios.post(`${API_URL}/api/draft/initialize`, 
        { 
          leagueId,
          settings: {
            rounds: 25,
            type: 'snake',
            timePerPick: 90
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Step 2: Start
      await axios.post(`${API_URL}/api/draft/start`, 
        { leagueId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      loadDraftState();
      alert('Draft started!');
    } catch (error) {
      console.error('Error starting draft:', error);
      alert(error.response?.data?.error || 'Failed to start draft');
    } finally {
      setInitializing(false);
    }
  };

  const makePick = async (playerId) => {
    try {
      await axios.post(`${API_URL}/api/draft/pick`, 
        { leagueId, playerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedPlayer(null);
      loadDraftState();
      loadAvailablePlayers();
    } catch (error) {
      console.error('Error making pick:', error);
      alert(error.response?.data?.error || 'Failed to make pick');
    }
  };

  useEffect(() => {
    loadAvailablePlayers();
  }, [positionFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading draft...</div>
      </div>
    );
  }

  if (!draftState || draftState.status === 'not_started') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Draft Room</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600 mb-4">Ready to start your draft?</p>
          <button
            onClick={initializeAndStartDraft}
            disabled={initializing}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {initializing ? 'Starting Draft...' : 'Start Draft'}
          </button>
        </div>
      </div>
    );
  }

  const draftComplete = draftState.status === 'completed';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Draft Room</h1>
        {draftComplete ? (
          <p className="text-green-600 text-xl mt-2">Draft Complete!</p>
        ) : (
          <div className="mt-2">
            <p className="text-lg">Pick {draftState.current_pick}</p>
            <p className="text-blue-600">Status: {draftState.status}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Draft Board</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {picks.length === 0 ? (
                <p className="text-gray-500">No picks yet...</p>
              ) : (
                picks.map((pick, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-gray-500">#{pick.pick_number || idx + 1}</span>
                      <span className="font-semibold">{pick.player_name || 'Pending...'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Available Players</h2>
            
            <div className="mb-4 space-y-3">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availablePlayers.slice(0, 50).map((player) => (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className={`p-3 rounded cursor-pointer border-2 ${
                    selectedPlayer?.id === player.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm text-gray-600">
                    {player.position} - {player.team}
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    OVR: {player.overall_rating}
                  </div>
                </div>
              ))}
            </div>

            {selectedPlayer && !draftComplete && (
              <button
                onClick={() => makePick(selectedPlayer.id)}
                className="w-full mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold"
              >
                Draft {selectedPlayer.name}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftRoom;
