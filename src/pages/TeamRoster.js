import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Users, DollarSign, Trophy, ArrowLeft, ChevronRight } from 'lucide-react';

const TeamRoster = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const loadTeam = async () => {
    try {
      const teamRes = await api.teams.getById(teamId);
      const data = teamRes.data;
      setTeam(data);
      setRoster(data.roster || data.players || []);

      // Load upcoming games
      if (data.league_id) {
        const gamesRes = await api.games.getLeagueGames(data.league_id);
        const upcoming = (gamesRes.data || [])
          .filter(g => g.status !== 'completed' && (g.home_team_id === parseInt(teamId) || g.away_team_id === parseInt(teamId)))
          .slice(0, 3);
        setSchedule(upcoming);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading team:', err);
      setLoading(false);
    }
  };

  const getOverallColor = (ovr) => {
    if (ovr >= 90) return 'text-green-400';
    if (ovr >= 80) return 'text-blue-400';
    if (ovr >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const totalPayroll = roster.reduce((sum, p) => sum + (p.contract_salary || p.salary || 0), 0);
  const salaryCap = team?.salary_cap || 120000000;
  const capPct = Math.min(100, (totalPayroll / salaryCap) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Team not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{team.name}</h1>
                <p className="text-blue-100">{team.owner_username && `GM: ${team.owner_username}`}</p>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-white">{team.wins || 0}</p>
                <p className="text-blue-100 text-sm">Wins</p>
              </div>
              <div className="text-blue-300 text-3xl font-bold">-</div>
              <div>
                <p className="text-3xl font-bold text-white">{team.losses || 0}</p>
                <p className="text-blue-100 text-sm">Losses</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Salary Cap */}
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-green-400" />
              <h2 className="text-white font-semibold">Salary Cap</h2>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              ${(totalPayroll / 1000000).toFixed(1)}M
              <span className="text-gray-400 text-base font-normal"> / ${(salaryCap / 1000000).toFixed(0)}M</span>
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${capPct > 90 ? 'bg-red-500' : capPct > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${capPct}%` }}
              />
            </div>
            <p className="text-gray-400 text-xs mt-1">{(salaryCap - totalPayroll > 0) ? `$${((salaryCap - totalPayroll) / 1000000).toFixed(1)}M cap space` : 'Over cap'}</p>
          </div>

          {/* Roster size */}
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-blue-400" />
              <h2 className="text-white font-semibold">Roster</h2>
            </div>
            <p className="text-2xl font-bold text-white">{roster.length} <span className="text-gray-400 text-base font-normal">players</span></p>
            <p className="text-gray-400 text-sm mt-1">
              Avg OVR: {roster.length ? Math.round(roster.reduce((s, p) => s + (p.overall_rating || 70), 0) / roster.length) : 'N/A'}
            </p>
          </div>

          {/* Upcoming */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-3">Upcoming Games</h2>
            {schedule.length === 0 ? (
              <p className="text-gray-400 text-sm">No upcoming games</p>
            ) : (
              <div className="space-y-2">
                {schedule.map(g => (
                  <div key={g.id} className="text-sm">
                    <span className="text-gray-400">Day {g.day}: </span>
                    <span className="text-white">{g.home_team_id === parseInt(teamId) ? `vs ${g.away_team_name}` : `@ ${g.home_team_name}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Roster Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Full Roster
            </h2>
          </div>
          {roster.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No players on roster yet — complete the draft first</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Player</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">POS</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">OVR</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">POT</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Age</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Salary</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {roster
                    .sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0))
                    .map(player => (
                    <tr
                      key={player.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/league/${team.league_id}/player/${player.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{player.name}</p>
                        {player.team && <p className="text-xs text-gray-500">{player.team}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">{player.position}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-lg ${getOverallColor(player.overall_rating)}`}>{player.overall_rating}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">{player.potential || '-'}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{player.age}</td>
                      <td className="px-4 py-3 text-right text-gray-300 text-sm">
                        {player.contract_salary ? `$${(player.contract_salary / 1000000).toFixed(1)}M` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamRoster;
