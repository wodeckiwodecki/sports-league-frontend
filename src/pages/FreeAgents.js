import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DollarSign, X, CheckCircle, XCircle, Search } from 'lucide-react';

const FreeAgents = () => {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const [freeAgents, setFreeAgents] = useState([]);
  const [league, setLeague] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ years: 2, annualSalary: 10000000 });
  const [offerResult, setOfferResult] = useState(null);
  const [offerLoading, setOfferLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [leagueId]);

  const loadData = async () => {
    try {
      const [faRes, leagueRes] = await Promise.all([
        api.contracts.getFreeAgents(leagueId),
        api.leagues.getById(leagueId)
      ]);
      setFreeAgents(faRes.data || []);
      setLeague(leagueRes.data);

      if (user) {
        const teamsRes = await api.teams.getLeagueTeams(leagueId);
        const myTeam = (teamsRes.data || []).find(t => t.user_id === user.id);
        setUserTeam(myTeam);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading free agents:', err);
      setLoading(false);
    }
  };

  const positions = league?.sport === 'NBA'
    ? ['ALL', 'PG', 'SG', 'SF', 'PF', 'C']
    : ['ALL', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

  const filtered = freeAgents.filter(p => {
    if (positionFilter !== 'ALL' && p.position !== positionFilter) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleOffer = async () => {
    if (!userTeam || !offerModal) return;
    setOfferLoading(true);
    setOfferResult(null);
    try {
      const res = await api.contracts.makeOffer({
        teamId: userTeam.id,
        playerId: offerModal.id,
        leagueId,
        years: offerForm.years,
        annualSalary: offerForm.annualSalary
      });
      setOfferResult(res.data);
    } catch (err) {
      setOfferResult({ error: err.response?.data?.error || 'Offer failed' });
    } finally {
      setOfferLoading(false);
    }
  };

  const getOverallColor = (ovr) => {
    if (ovr >= 90) return 'text-green-400';
    if (ovr >= 80) return 'text-blue-400';
    if (ovr >= 70) return 'text-yellow-400';
    return 'text-red-400';
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
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <DollarSign className="h-8 w-8 text-green-400 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-white">Free Agents</h1>
            <p className="text-gray-400">{league?.name} · {freeAgents.length} available</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {positions.map(pos => (
              <button
                key={pos}
                onClick={() => setPositionFilter(pos)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  positionFilter === pos ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <DollarSign className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No free agents available</p>
            <p className="text-gray-500 text-sm mt-1">Players become available after the draft or when released</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">POS</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">OVR</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Age</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Asking</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(player => (
                  <tr key={player.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{player.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">{player.position}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-lg ${getOverallColor(player.overall_rating)}`}>{player.overall_rating}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">{player.age}</td>
                    <td className="px-4 py-3 text-right text-gray-300 text-sm">
                      {player.demanded_salary
                        ? `$${(player.demanded_salary / 1000000).toFixed(1)}M / ${player.demanded_years || 2}yr`
                        : 'Negotiable'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setOfferModal(player); setOfferResult(null); setOfferForm({ years: 2, annualSalary: player.demanded_salary || 5000000 }); }}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        disabled={!userTeam}
                      >
                        Make Offer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Make Offer — {offerModal.name}</h2>
              <button onClick={() => { setOfferModal(null); setOfferResult(null); }} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            {offerResult ? (
              <div className={`p-4 rounded-lg mb-4 ${offerResult.error ? 'bg-red-900/30 border border-red-500' : offerResult.status === 'accepted' ? 'bg-green-900/30 border border-green-500' : 'bg-yellow-900/30 border border-yellow-500'}`}>
                {offerResult.error ? (
                  <div className="flex items-center gap-2 text-red-300">
                    <XCircle className="h-5 w-5" />
                    <p>{offerResult.error}</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {offerResult.status === 'accepted'
                        ? <CheckCircle className="h-5 w-5 text-green-400" />
                        : <XCircle className="h-5 w-5 text-yellow-400" />}
                      <p className={`font-semibold ${offerResult.status === 'accepted' ? 'text-green-300' : 'text-yellow-300'}`}>
                        Offer {offerResult.status === 'accepted' ? 'Accepted!' : 'Rejected'}
                      </p>
                    </div>
                    {offerResult.agentResponse && (
                      <p className="text-gray-300 text-sm mt-2">{offerResult.agentResponse}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Annual Salary</label>
                  <input
                    type="number"
                    value={offerForm.annualSalary}
                    onChange={e => setOfferForm(f => ({ ...f, annualSalary: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">${(offerForm.annualSalary / 1000000).toFixed(1)}M per year</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Years</label>
                  <select
                    value={offerForm.years}
                    onChange={e => setOfferForm(f => ({ ...f, years: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setOfferModal(null)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Cancel</button>
                  <button onClick={handleOffer} disabled={offerLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {offerLoading ? 'Sending...' : 'Send Offer'}
                  </button>
                </div>
              </div>
            )}

            {offerResult && (
              <button
                onClick={() => { setOfferModal(null); setOfferResult(null); loadData(); }}
                className="w-full mt-3 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeAgents;
