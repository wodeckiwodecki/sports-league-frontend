import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Trophy, Users, Settings, Mail, ChevronRight, 
  DollarSign, Calendar, TrendingUp, Award 
} from 'lucide-react';

const MultiplayerLeagueDashboard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    loadLeagueData();
  }, [id]);

  const loadLeagueData = async () => {
    try {
      const [leagueRes, teamsRes] = await Promise.all([
        api.leaguesV2.getById(id),
        api.leaguesV2.getTeams(id)
      ]);
      
      setLeague(leagueRes.data);
      setTeams(teamsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading league:', error);
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      await api.invitations.create(id, inviteEmail, 'member');
      alert(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      alert('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

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
        <p className="text-white text-xl">League not found</p>
      </div>
    );
  }

  const settings = league.league_settings || {};
  const isCommissioner = league.commissioner_id === user?.id;
  const userTeam = teams.find(t => t.user_id === user?.id);

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Trophy className="h-8 w-8 text-yellow-400 mr-3" />
                <h1 className="text-4xl font-bold text-white">{league.name}</h1>
              </div>
              <p className="text-blue-100 text-lg">
                {league.sport} • {teams.length} / {league.max_teams} Teams
              </p>
            </div>
            
            {isCommissioner && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Invite Players
                </button>
                <button
                  onClick={() => navigate(`/league/${id}/settings`)}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Team */}
            {userTeam && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Award className="h-6 w-6 mr-2 text-yellow-400" />
                  Your Team
                </h2>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-xl font-semibold text-white mb-2">{userTeam.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Record</p>
                      <p className="text-white font-semibold">
                        {userTeam.wins || 0}-{userTeam.losses || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Payroll</p>
                      <p className="text-white font-semibold">
                        ${((userTeam.payroll || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/team/${userTeam.id}`)}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    Manage Team
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* All Teams */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2" />
                League Teams
              </h2>
              <div className="space-y-3">
                {teams.map((team, index) => (
                  <div
                    key={team.id}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors cursor-pointer"
                    onClick={() => navigate(`/team/${team.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gray-600 rounded-full h-10 w-10 flex items-center justify-center text-white font-bold mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{team.name}</h3>
                          <p className="text-gray-400 text-sm">
                            Owner: {team.owner_username || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {team.wins || 0}-{team.losses || 0}
                        </p>
                        <p className="text-gray-400 text-sm">
                          ${((team.payroll || 0) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {teams.length < league.max_teams && (
                  <div className="bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-600">
                    <p className="text-gray-400 text-center">
                      {league.max_teams - teams.length} open spot(s) remaining
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate(`/league/${id}/draft`)}
                  className="p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white hover:from-green-700 hover:to-green-800 transition-all"
                >
                  <Users className="h-6 w-6 mb-2" />
                  <p className="font-semibold">Draft Room</p>
                </button>
                
                <button
                  onClick={() => navigate(`/league/${id}/players`)}
                  className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg text-white hover:from-purple-700 hover:to-purple-800 transition-all"
                >
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <p className="font-semibold">Player Pool</p>
                </button>
                
                <button
                  onClick={() => navigate(`/league/${id}/trades`)}
                  className="p-4 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg text-white hover:from-orange-700 hover:to-orange-800 transition-all"
                >
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <p className="font-semibold">Trade Center</p>
                </button>
                
                <button
                  onClick={() => navigate(`/league/${id}/standings`)}
                  className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  <Trophy className="h-6 w-6 mb-2" />
                  <p className="font-semibold">Standings</p>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* League Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                League Settings
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Commissioner</span>
                  <span className="text-white font-medium">
                    {league.commissioner_username || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Salary Cap</span>
                  <span className="text-white font-medium">
                    ${(settings.salaryCap / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Luxury Tax</span>
                  <span className="text-white font-medium">
                    ${(settings.luxuryTax / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Draft Type</span>
                  <span className="text-white font-medium capitalize">
                    {settings.draftType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Draft Rounds</span>
                  <span className="text-white font-medium">
                    {settings.draftRounds}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Regular Season</span>
                  <span className="text-white font-medium">
                    {settings.regularSeasonGames} games
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Playoff Teams</span>
                  <span className="text-white font-medium">
                    {settings.playoffTeams}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Recent Activity
              </h2>
              <div className="space-y-3 text-sm">
                <div className="text-gray-400">
                  <p className="text-white mb-1">League Created</p>
                  <p className="text-xs">
                    {new Date(league.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-gray-400">
                  <p className="text-white mb-1">Players Imported</p>
                  <p className="text-xs">1,195 MLB players loaded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Invite Player</h2>
            <form onSubmit={handleSendInvite}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                placeholder="friend@example.com"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerLeagueDashboard;
