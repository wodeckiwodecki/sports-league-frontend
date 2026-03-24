import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, ChevronRight, X, Zap } from 'lucide-react';

const Schedule = () => {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [league, setLeague] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDetail, setGameDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [leagueId]);

  const loadSchedule = async () => {
    try {
      const [gamesRes, leagueRes] = await Promise.all([
        api.games.getLeagueGames(leagueId),
        api.leagues.getById(leagueId)
      ]);
      setGames(gamesRes.data || []);
      setLeague(leagueRes.data);

      // Find user team
      if (user) {
        const teamsRes = await api.teams.getLeagueTeams(leagueId);
        const myTeam = (teamsRes.data || []).find(t => t.user_id === user.id);
        setUserTeam(myTeam);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading schedule:', err);
      setLoading(false);
    }
  };

  const openGame = async (game) => {
    if (game.status !== 'completed') return;
    setSelectedGame(game);
    setDetailLoading(true);
    try {
      const res = await api.games.getById(game.id);
      setGameDetail(res.data);
    } catch (err) {
      console.error('Error loading game detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = games.filter(g => {
    if (filter === 'UPCOMING') return g.status !== 'completed';
    if (filter === 'COMPLETED') return g.status === 'completed';
    return true;
  });

  const isMyGame = (game) => {
    if (!userTeam) return false;
    return game.home_team_id === userTeam.id || game.away_team_id === userTeam.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">{league?.name || 'League'} Schedule</h1>
              <p className="text-gray-400">Season {league?.current_season || 1}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['ALL', 'UPCOMING', 'COMPLETED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No games scheduled yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(game => (
              <div
                key={game.id}
                onClick={() => openGame(game)}
                className={`bg-gray-800 rounded-lg p-4 flex items-center justify-between transition-all ${
                  game.status === 'completed' ? 'cursor-pointer hover:bg-gray-700' : ''
                } ${isMyGame(game) ? 'border border-blue-500/40' : ''}`}
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="text-center w-16">
                    <p className="text-xs text-gray-500">Day</p>
                    <p className="text-white font-bold">{game.day}</p>
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                    <div className="text-right">
                      <p className={`font-semibold ${userTeam?.id === game.home_team_id ? 'text-blue-400' : 'text-white'}`}>
                        {game.home_team_name}
                      </p>
                    </div>

                    <div className="text-center">
                      {game.status === 'completed' ? (
                        <div>
                          <p className="text-2xl font-bold text-white">
                            {game.home_score} - {game.away_score}
                          </p>
                          <p className="text-xs text-gray-500">Final</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 font-medium">vs</p>
                      )}
                    </div>

                    <div className="text-left">
                      <p className={`font-semibold ${userTeam?.id === game.away_team_id ? 'text-blue-400' : 'text-white'}`}>
                        {game.away_team_name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  {isMyGame(game) && (
                    <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-full">Your game</span>
                  )}
                  {game.status === 'completed' && (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  {game.status !== 'completed' && (
                    <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-0.5 rounded-full">Upcoming</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Detail Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => { setSelectedGame(null); setGameDetail(null); }}>
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedGame.home_team_name} {selectedGame.home_score} – {selectedGame.away_score} {selectedGame.away_team_name}
                </h2>
                <p className="text-gray-400 text-sm">Day {selectedGame.day} · Season {selectedGame.season}</p>
              </div>
              <button onClick={() => { setSelectedGame(null); setGameDetail(null); }} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
              ) : gameDetail ? (
                <div className="space-y-6">
                  {gameDetail.narrative && (
                    <div>
                      <h3 className="text-white font-semibold mb-2">Game Recap</h3>
                      <p className="text-gray-300 leading-relaxed">{gameDetail.narrative}</p>
                    </div>
                  )}
                  {gameDetail.highlights?.length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-400" /> Highlights
                      </h3>
                      <ul className="space-y-2">
                        {gameDetail.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                            <span className="text-yellow-400 mt-0.5">•</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No game details available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
