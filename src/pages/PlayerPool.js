import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Search, Filter, TrendingUp, User } from 'lucide-react';

const PlayerPool = () => {
  const { id } = useParams();
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating');
  const [sport, setSport] = useState('MLB');

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    filterAndSortPlayers();
  }, [searchTerm, positionFilter, sortBy, players]);

  const loadPlayers = async () => {
    try {
      // Fetch league first to get sport
      const leagueRes = await api.leaguesV2.getById(id);
      const leagueData = leagueRes.data?.league || leagueRes.data;
      const leagueSport = leagueData?.sport || 'MLB';
      setSport(leagueSport);
      const response = await api.players.getAll({ sport: leagueSport, limit: 2000 });
      setPlayers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading players:', error);
      setLoading(false);
    }
  };
  
  const filterAndSortPlayers = () => {
    let filtered = [...players];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (positionFilter !== 'ALL') {
      filtered = filtered.filter(p => p.position === positionFilter);
    }
    
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'rating':
          return (b.overall_rating || 0) - (a.overall_rating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'age':
          return (a.age || 0) - (b.age || 0);
        default:
          return 0;
      }
    });
    
    setFilteredPlayers(filtered);
  };
  
  const positions = sport === 'NBA'
    ? ['ALL', 'PG', 'SG', 'SF', 'PF', 'C']
    : ['ALL', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Player Pool</h1>
          <p className="text-gray-400">
            {filteredPlayers.length} of {players.length} players
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Search className="inline h-4 w-4 mr-2" />
                Search Players
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or team..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Filter className="inline h-4 w-4 mr-2" />
                Position
              </label>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <TrendingUp className="inline h-4 w-4 mr-2" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="rating">Overall Rating</option>
                <option value="name">Name</option>
                <option value="age">Age</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredPlayers.map(player => (
                  <tr key={player.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-300" />
                        </div>
                        <div className="ml-4 text-sm font-medium text-white">{player.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 text-xs font-semibold rounded-full bg-blue-900 text-blue-200">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{player.team || 'Free Agent'}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{player.age || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${
                        (player.overall_rating || 0) >= 80 ? 'text-green-400' :
                        (player.overall_rating || 0) >= 70 ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {player.overall_rating || 75}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400">No players found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerPool;
