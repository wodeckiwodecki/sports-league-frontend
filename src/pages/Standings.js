import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const Standings = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const [standings, setStandings] = useState([]);
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStandings();
  }, [leagueId]);

  const loadStandings = async () => {
    try {
      const [standingsRes, leagueRes] = await Promise.all([
        api.games.getStandings(leagueId),
        api.leagues.getById(leagueId)
      ]);
      setStandings(standingsRes.data || []);
      setLeague(leagueRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading standings:', err);
      setLoading(false);
    }
  };

  const getPct = (w, l) => {
    const total = w + l;
    if (total === 0) return '.000';
    return (w / total).toFixed(3).replace(/^0/, '');
  };

  const getGB = (leader, team) => {
    if (!leader || team.id === leader.id) return '-';
    const gb = ((leader.wins - team.wins) + (team.losses - leader.losses)) / 2;
    return gb % 1 === 0 ? gb.toString() : gb.toFixed(1);
  };

  const getStreakIcon = (streak) => {
    if (!streak) return <Minus className="h-4 w-4 text-gray-400" />;
    if (streak > 0) return <TrendingUp className="h-4 w-4 text-green-400" />;
    return <TrendingDown className="h-4 w-4 text-red-400" />;
  };

  const playoffCutoff = league?.league_settings?.playoffTeams || 8;
  const leader = standings[0];

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
        <div className="flex items-center mb-8">
          <Trophy className="h-8 w-8 text-yellow-400 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-white">{league?.name || 'League'} Standings</h1>
            <p className="text-gray-400">Season {league?.current_season || 1} · Day {league?.current_day || 0}</p>
          </div>
        </div>

        {standings.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No standings yet — season hasn't started</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-8">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Team</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">W</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">L</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">PCT</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">GB</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">STK</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => {
                    const isPlayoffLine = index === playoffCutoff - 1;
                    return (
                      <React.Fragment key={team.id}>
                        <tr
                          className={`border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                            team.is_user_team ? 'bg-blue-900/20' : ''
                          }`}
                          onClick={() => navigate(`/team/${team.id}`)}
                        >
                          <td className="px-4 py-3 text-gray-400 text-sm font-medium">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                                index < playoffCutoff ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                              }`}>
                                {team.abbreviation || team.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className={`font-semibold ${team.is_user_team ? 'text-blue-400' : 'text-white'}`}>
                                  {team.name}
                                  {team.is_user_team && <span className="ml-2 text-xs text-blue-400">(You)</span>}
                                </p>
                                <p className="text-xs text-gray-500">{team.owner_username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-white font-semibold">{team.wins || 0}</td>
                          <td className="px-4 py-3 text-center text-white font-semibold">{team.losses || 0}</td>
                          <td className="px-4 py-3 text-center text-gray-300">{getPct(team.wins || 0, team.losses || 0)}</td>
                          <td className="px-4 py-3 text-center text-gray-300">{getGB(leader, team)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getStreakIcon(team.streak)}
                              <span className={`text-sm font-medium ${team.streak > 0 ? 'text-green-400' : team.streak < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {team.streak ? `${Math.abs(team.streak)}` : '-'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {isPlayoffLine && (
                          <tr>
                            <td colSpan={7} className="px-4 py-1">
                              <div className="border-t border-dashed border-blue-500/50 flex items-center gap-2">
                                <span className="text-xs text-blue-400 whitespace-nowrap">— Playoff cutoff</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Standings;
