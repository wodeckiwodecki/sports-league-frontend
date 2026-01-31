import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Trophy, AlertCircle } from 'lucide-react';

const CreateLeague = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    sport: 'NBA',
    salaryCap: 150000000,
    realHours: 24,
    leagueDays: 7,
    rounds: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.leagues.create({
        name: formData.name,
        ownerId: user.id,
        sport: formData.sport,
        salaryCap: formData.salaryCap,
        timeRatio: {
          real_hours: formData.realHours,
          league_days: formData.leagueDays
        }
      });

      // Create owner's team
      await api.teams.create({
        leagueId: response.data.id,
        userId: user.id,
        name: `${user.username}'s Team`,
        abbreviation: user.username.substring(0, 3).toUpperCase()
      });

      navigate(`/league/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create league');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New League</h1>
          <p className="text-gray-600">Set up your custom sports league</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">League Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="My Awesome League"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sport</label>
            <select
              value={formData.sport}
              onChange={(e) => setFormData({...formData, sport: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="NBA">NBA Basketball</option>
              <option value="MLB">MLB Baseball</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Time Progression</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Real Hours</label>
                <input
                  type="number"
                  value={formData.realHours}
                  onChange={(e) => setFormData({...formData, realHours: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">League Days</label>
                <input
                  type="number"
                  value={formData.leagueDays}
                  onChange={(e) => setFormData({...formData, leagueDays: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  min="1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Every {formData.realHours} real hours = {formData.leagueDays} league days
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating League...' : 'Create League'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateLeague;
