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
  const [teams, setTeams] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  
  const positions = ['ALL', 'C', 'PF', 'SF', 'SG', 'PG', 'P', '1B', '2B', '3B', 'SS', 'OF'];

  useEffect(() => {
    loadDraftState();
    loadAvailablePlayers();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      loadDraftState();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [leagueId]);

  const loadDraftState = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/draft/${leagueId}/state`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDraftState(response.data.state);
      setPicks(response.data.picks || []);
      setTeams(response.data.teams || []);
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
      
      setAvailablePlayers(response.data);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const startDraft = async () => {
    try {
      await axios.post(`${API_URL}/api/draft/${leagueId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      loadDraftState();
      alert('Draft started!');
    } catch (error) {
      console.error('Error starting draft:', error);
      alert(error.response?.data?.error || 'Failed to start draft');
    }
  };

  const makePick = async (playerId) => {
    try {
      await axios.post(`${API_URL}/api/draft/${leagueId}/pick`, 
        { playerId },
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

  if (!draftState) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Draft Room</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600 mb-4">Draft has not been started yet.</p>
          <button
            onClick={startDraft}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Start Draft
          </button>
        </div>
      </div>
    );
  }

  const currentTeam = teams.find(t => t.id === draftState.current_team_id);
  const draftComplete = draftState.status === 'completed';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Draft Room</h1>
        {draftComplete ? (
          <p className="text-green-600 text-xl mt-2">Draft Complete!</p>
        ) : (
          <div className="mt-2">
            <p className="text-lg">
              Round {draftState.current_round} - Pick {draftState.current_pick}
            </p>
            <p className="text-blue-600 font-semibold">
              On the Clock: {currentTeam?.name || 'Unknown Team'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draft Board */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Draft Board</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {picks.filter(p => p.player_id).map((pick) => (
                <div key={pick.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-gray-500">#{pick.pick_number}</span>
                    <span className="text-sm text-gray-600">Rd {pick.round}</span>
                    <span className="font-semibold">{pick.player_name}</span>
                    <span className="text-sm text-gray-600">{pick.position}</span>
                  </div>
                  <span className="text-sm text-blue-600">{pick.team_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Available Players */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Available Players</h2>
            
            {/* Filters */}
            <div className="mb-4 space-y-3">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* Player List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availablePlayers.map((player) => (
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

            {/* Draft Button */}
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
