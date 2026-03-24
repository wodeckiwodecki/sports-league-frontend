import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Trophy, Clock, User, Search } from 'lucide-react';

const DraftRoomMultiplayer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [draftState, setDraftState] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [draftPicks, setDraftPicks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [pickLoading, setPickLoading] = useState(false);
  const [autoPickLoading, setAutoPickLoading] = useState(false);

  useEffect(() => {
    loadDraftData();
    const interval = setInterval(loadDraftData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  // AI autopick for non-user turns
  useEffect(() => {
    if (!draftState || !league || autoPickLoading) return;
    const currentPick = draftState.current_pick || draftState.currentPick;
    if (!currentPick) return;
    const userTeam = teams.find(t => t.user_id === user?.id);
    const isUserTurn = userTeam && (currentPick.team_id === userTeam.id || currentPick === userTeam.id);
    if (isUserTurn) return;

    // Not user's turn — trigger autopick after short delay
    const timer = setTimeout(async () => {
      setAutoPickLoading(true);
      try {
        const teamId = currentPick.team_id || currentPick;
        await api.draft.autoPick(id, teamId);
        await loadDraftData();
      } catch (err) {
        console.error('Autopick error:', err);
      } finally {
        setAutoPickLoading(false);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [draftState?.current_pick, draftState?.currentPick]);
  
  const loadDraftData = async () => {
    try {
      // Load league first so we know the sport before fetching players
      const leagueRes = await api.leaguesV2.getById(id);
      const leagueData = leagueRes.data?.league || leagueRes.data;
      const teams = leagueRes.data?.teams || [];
      const sport = leagueData?.sport || 'MLB';

      const [draftRes, playersRes] = await Promise.all([
        api.draft.getState(id).catch(() => ({ data: null })),
        api.players.getAll({ sport, limit: 2000 })
      ]);

      setLeague(leagueData);
      setTeams(teams);
      setDraftState(draftRes.data);
      setAvailablePlayers(playersRes.data || []);

      if (draftRes.data?.picks) {
        setDraftPicks(draftRes.data.picks);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading draft data:', error);
      setLoading(false);
    }
  };
  
  const startDraft = async () => {
    try {
      await api.draft.initialize(id, {
        draftType: league.league_settings.draftType,
        rounds: league.league_settings.draftRounds
      });
      await api.draft.start(id);
      await loadDraftData();
    } catch (error) {
      console.error('Error starting draft:', error);
      alert('Failed to start draft');
    }
  };
  
  const makePick = async (playerId) => {
    if (!isMyPick()) return;
    
    setPickLoading(true);
    try {
      const userTeam = teams.find(t => t.user_id === user?.id);
      await api.draft.makePick(id, userTeam.id, playerId);
      await loadDraftData();
    } catch (error) {
      console.error('Error making pick:', error);
      alert('Failed to make pick');
    } finally {
      setPickLoading(false);
    }
  };
  
  const isMyPick = () => {
    if (!draftState?.currentPick || !user) return false;
    const userTeam = teams.find(t => t.user_id === user?.id);
    return draftState.currentPick.team_id === userTeam?.id;
  };
  
  const getCurrentPickInfo = () => {
    if (!draftState?.currentPick) return null;
    const team = teams.find(t => t.id === draftState.currentPick.team_id);
    return {
      round: draftState.currentPick.round,
      pick: draftState.currentPick.overall_pick,
      team: team
    };
  };
  
  const filteredPlayers = availablePlayers.filter(p => {
    const isDrafted = draftPicks.some(pick => pick.player_id === p.id);
    if (isDrafted) return false;
    
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (positionFilter !== 'ALL' && p.position !== positionFilter) {
      return false;
    }
    
    return true;
  });
  
  const positions = league?.sport === 'NBA'
    ? ['ALL', 'PG', 'SG', 'SF', 'PF', 'C']
    : ['ALL', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Failed to load draft room</p>
          <button
            onClick={() => { setLoading(true); loadDraftData(); }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const pickInfo = getCurrentPickInfo();
  const myPick = isMyPick();
  
  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <Trophy className="inline h-8 w-8 mr-2" />
                {league?.name || 'Loading...'} - Draft Room
              </h1>
              <p className="text-green-100">
                {league?.league_settings?.draftType === 'snake' ? 'Snake Draft' : 'Linear Draft'} • {league?.league_settings?.draftRounds || 0} Rounds
              </p>
            </div>
            
            {!draftState && (
              <button
                onClick={startDraft}
                className="px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-green-50 font-semibold"
              >
                Start Draft
              </button>
            )}
          </div>
        </div>
        
        {draftState && pickInfo && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Pick</p>
                <p className="text-2xl font-bold text-white">
                  Round {pickInfo.round} - Pick {pickInfo.pick}
                </p>
                <p className="text-green-400 mt-1">
                  {pickInfo.team?.name}
                  {myPick && ' - YOUR PICK!'}
                </p>
              </div>

              {autoPickLoading && !myPick && (
                <div className="flex items-center gap-3 bg-purple-900/30 border border-purple-500/30 rounded-lg px-4 py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                  <span className="text-purple-300 text-sm font-medium">AI is picking…</span>
                </div>
              )}

              {myPick && (
                <div className="text-right">
                  <Clock className="h-12 w-12 text-yellow-400 animate-pulse" />
                  <p className="text-yellow-400 font-semibold mt-2">Your Turn!</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {draftState ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Available Players</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search players..."
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredPlayers.slice(0, 50).map(player => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        myPick ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer' : 'bg-gray-700'
                      }`}
                      onClick={() => myPick && makePick(player.id)}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                          <User className="h-6 w-6 text-gray-300" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{player.name}</p>
                          <p className="text-gray-400 text-sm">{player.team} • {player.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Overall</p>
                          <p className="text-lg font-bold text-white">{player.overall_rating || 75}</p>
                        </div>
                        {myPick && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              makePick(player.id);
                            }}
                            disabled={pickLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Draft
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Picks</h2>
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {draftPicks.slice().reverse().map((pick, idx) => {
                  const team = teams.find(t => t.id === pick.team_id);
                  const player = availablePlayers.find(p => p.id === pick.player_id);
                  
                  return (
                    <div key={idx} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Pick {pick.overall_pick}</span>
                        <span className="text-xs text-gray-400">Round {pick.round}</span>
                      </div>
                      <p className="text-white font-semibold text-sm">{player?.name || 'Unknown'}</p>
                      <p className="text-gray-400 text-xs">{team?.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Draft Not Started</h3>
            <p className="text-gray-400 mb-6">
              The commissioner needs to start the draft when all teams are ready
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftRoomMultiplayer;
