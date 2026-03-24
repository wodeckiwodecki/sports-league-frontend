import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Trophy, AlertCircle } from 'lucide-react';

const CreateMultiplayerLeague = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SPORT_DEFAULTS = {
    MLB: { maxTeams: 12 },
    NBA: { maxTeams: 30 },
  };

  const [formData, setFormData] = useState({
    name: '',
    sport: 'MLB',
    teamName: '',
    maxTeams: 12,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sport') {
      const defaults = SPORT_DEFAULTS[value] || {};
      setFormData(prev => ({ ...prev, sport: value, ...defaults }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getUserId = () => {
    if (user?.id) return user.id;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.id;
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const userId = getUserId();

    if (!userId) {
      setError('User not authenticated. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const leagueResponse = await api.leaguesV2.create({
        name: formData.name,
        sport: formData.sport,
        userId,
        maxTeams: formData.maxTeams,
        teamName: formData.teamName
      });

      const leagueId = leagueResponse.data.league.id;
      navigate(`/league/${leagueId}`);

    } catch (err) {
      console.error('Error creating league:', err);
      setError(err.response?.data?.error || err.response?.data?.details || 'Failed to create league');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Creating League...</h2>
            <p className="text-gray-400">Setting up your {formData.sport} league</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Create Multiplayer League</h1>
          <p className="text-gray-400">Set up a new fantasy league with friends</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="space-y-4">

              {/* Sport selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sport *
                </label>
                <div className="flex gap-3">
                  {['MLB', 'NBA'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleChange({ target: { name: 'sport', value: s } })}
                      className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-colors ${
                        formData.sport === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {s === 'MLB' ? '⚾ MLB' : '🏀 NBA'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  League Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder={`My Awesome ${formData.sport} League`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Team Name *
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Jordan's All-Stars"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Teams
                </label>
                <select
                  name="maxTeams"
                  value={formData.maxTeams}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={8}>8 Teams</option>
                  <option value={10}>10 Teams</option>
                  <option value={12}>12 Teams</option>
                  {formData.sport === 'NBA' && <option value={30}>30 Teams</option>}
                </select>
              </div>

            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Create League
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMultiplayerLeague;
