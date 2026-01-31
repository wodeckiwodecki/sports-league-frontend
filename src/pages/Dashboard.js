import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Trophy, Users, Calendar, TrendingUp, Plus, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeagues: 0,
    activeLeagues: 0,
    totalTeams: 0,
    upcomingGames: 0
  });

  useEffect(() => {
    fetchUserLeagues();
  }, [user]);

  const fetchUserLeagues = async () => {
    try {
      const response = await api.leagues.getAll(user.id);
      setLeagues(response.data);
      
      // Calculate stats
      const activeLeagues = response.data.filter(l => l.status !== 'completed').length;
      const totalTeams = response.data.reduce((sum, l) => sum + (l.team_count || 0), 0);
      
      setStats({
        totalLeagues: response.data.length,
        activeLeagues,
        totalTeams,
        upcomingGames: 0 // Could fetch from games endpoint
      });
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user.username}!
        </h1>
        <p className="text-gray-600">Manage your leagues and teams from your dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalLeagues}</span>
          </div>
          <p className="text-blue-100">Total Leagues</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.activeLeagues}</span>
          </div>
          <p className="text-green-100">Active Leagues</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalTeams}</span>
          </div>
          <p className="text-purple-100">Your Teams</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.upcomingGames}</span>
          </div>
          <p className="text-orange-100">Upcoming Games</p>
        </div>
      </div>

      {/* Leagues Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Leagues</h2>
          <div className="flex gap-3">
            <Link
              to="/multiplayer/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
            >
              <Users className="h-5 w-5" />
              Create Multiplayer League
            </Link>
            <Link
              to="/leagues/create"
              className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              <Plus className="h-5 w-5" />
              Single Player
            </Link>
          </div>
        </div>

        {leagues.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No leagues yet</h3>
            <p className="text-gray-600 mb-6">Create your first league to get started</p>
            <Link
              to="/leagues/create"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="h-5 w-5" />
              Create Your First League
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.map((league) => (
              <Link
                key={league.id}
                to={`/league/${league.id}`}
                className="border border-gray-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {league.name}
                    </h3>
                    <p className="text-sm text-gray-600">{league.sport}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Teams</span>
                    <span className="font-semibold text-gray-900">{league.team_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Season</span>
                    <span className="font-semibold text-gray-900">{league.current_season || 1}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Day</span>
                    <span className="font-semibold text-gray-900">{league.current_day || 1}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Owner: {league.owner_username}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
