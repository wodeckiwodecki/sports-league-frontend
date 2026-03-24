import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeftRight, CheckCircle, XCircle, Inbox, X, Zap } from 'lucide-react';

const TradeCenter = () => {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState('incoming');
  const [teams, setTeams] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [incomingTrades, setIncomingTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Propose trade state
  const [targetTeamId, setTargetTeamId] = useState('');
  const [targetRoster, setTargetRoster] = useState([]);
  const [myRoster, setMyRoster] = useState([]);
  const [offeringIds, setOfferingIds] = useState([]);
  const [requestingIds, setRequestingIds] = useState([]);
  const [tradeMessage, setTradeMessage] = useState('');
  const [tradeResult, setTradeResult] = useState(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [leagueId]);

  useEffect(() => {
    if (targetTeamId) loadTargetRoster();
  }, [targetTeamId]);

  const loadData = async () => {
    try {
      const teamsRes = await api.teams.getLeagueTeams(leagueId);
      const allTeams = teamsRes.data || [];
      setTeams(allTeams);
      const myTeam = allTeams.find(t => t.user_id === user?.id);
      setUserTeam(myTeam);

      if (myTeam) {
        const [incomingRes, myTeamRes] = await Promise.all([
          api.trades.getIncoming(myTeam.id),
          api.teams.getById(myTeam.id)
        ]);
        setIncomingTrades(incomingRes.data || []);
        setMyRoster(myTeamRes.data?.roster || myTeamRes.data?.players || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading trade center:', err);
      setLoading(false);
    }
  };

  const loadTargetRoster = async () => {
    setRosterLoading(true);
    try {
      const res = await api.teams.getById(targetTeamId);
      setTargetRoster(res.data?.roster || res.data?.players || []);
    } catch (err) {
      console.error('Error loading target roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  const togglePlayer = (id, side) => {
    if (side === 'offering') {
      setOfferingIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setRequestingIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const submitTrade = async () => {
    if (!userTeam || !targetTeamId || offeringIds.length === 0 || requestingIds.length === 0) return;
    setTradeLoading(true);
    setTradeResult(null);
    try {
      const res = await api.trades.propose({
        leagueId,
        proposingTeamId: userTeam.id,
        receivingTeamId: parseInt(targetTeamId),
        offeringPlayerIds: offeringIds,
        requestingPlayerIds: requestingIds,
        message: tradeMessage
      });
      setTradeResult(res.data);
      setOfferingIds([]);
      setRequestingIds([]);
      setTradeMessage('');
    } catch (err) {
      setTradeResult({ error: err.response?.data?.error || 'Trade proposal failed' });
    } finally {
      setTradeLoading(false);
    }
  };

  const respondToTrade = async (tradeId, action) => {
    try {
      if (action === 'accept') {
        await api.trades.accept(tradeId);
      } else {
        await api.trades.decline(tradeId);
      }
      await loadData();
    } catch (err) {
      console.error('Error responding to trade:', err);
    }
  };

  const getOverallColor = (ovr) => {
    if (ovr >= 90) return 'text-green-400';
    if (ovr >= 80) return 'text-blue-400';
    if (ovr >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const PlayerCard = ({ player, selected, onClick }) => (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all border ${
        selected ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 bg-gray-700 hover:border-gray-500'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium">{player.name}</p>
          <p className="text-gray-400 text-xs">{player.position} · Age {player.age}</p>
        </div>
        <span className={`text-lg font-bold ${getOverallColor(player.overall_rating)}`}>{player.overall_rating}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <ArrowLeftRight className="h-8 w-8 text-orange-400 mr-3" />
          <h1 className="text-3xl font-bold text-white">Trade Center</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('incoming')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${tab === 'incoming' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Inbox className="h-4 w-4" />
            Incoming {incomingTrades.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{incomingTrades.length}</span>}
          </button>
          <button
            onClick={() => setTab('propose')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${tab === 'propose' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Propose Trade
          </button>
        </div>

        {/* Incoming Trades */}
        {tab === 'incoming' && (
          <div className="space-y-4">
            {incomingTrades.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-12 text-center">
                <Inbox className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No incoming trade proposals</p>
              </div>
            ) : (
              incomingTrades.map(trade => (
                <div key={trade.id} className="bg-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-semibold">From: {trade.proposing_team_name}</p>
                      <p className="text-gray-400 text-sm">Proposed {new Date(trade.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => respondToTrade(trade.id, 'accept')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> Accept
                      </button>
                      <button onClick={() => respondToTrade(trade.id, 'decline')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1.5">
                        <XCircle className="h-4 w-4" /> Decline
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs uppercase mb-2">They Send</p>
                      <div className="space-y-1">
                        {(trade.offering_players || []).map(p => (
                          <div key={p.id} className="bg-gray-700 rounded p-2 flex justify-between">
                            <span className="text-white text-sm">{p.name}</span>
                            <span className={`text-sm font-bold ${getOverallColor(p.overall_rating)}`}>{p.overall_rating}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase mb-2">You Send</p>
                      <div className="space-y-1">
                        {(trade.requesting_players || []).map(p => (
                          <div key={p.id} className="bg-gray-700 rounded p-2 flex justify-between">
                            <span className="text-white text-sm">{p.name}</span>
                            <span className={`text-sm font-bold ${getOverallColor(p.overall_rating)}`}>{p.overall_rating}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {trade.message && (
                    <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                      <p className="text-gray-300 text-sm italic">"{trade.message}"</p>
                    </div>
                  )}
                  {trade.ai_evaluation && (
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex gap-2">
                      <Zap className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-blue-200 text-sm">{trade.ai_evaluation}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Propose Trade */}
        {tab === 'propose' && (
          <div>
            {tradeResult && (
              <div className={`mb-6 p-4 rounded-xl border ${tradeResult.error ? 'bg-red-900/30 border-red-500' : 'bg-green-900/30 border-green-500'}`}>
                {tradeResult.error ? (
                  <p className="text-red-300">{tradeResult.error}</p>
                ) : (
                  <div>
                    <p className="text-green-300 font-semibold mb-1">✓ Trade proposal sent!</p>
                    {tradeResult.evaluation && (
                      <div className="flex gap-2 mt-2">
                        <Zap className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-300 text-sm">{tradeResult.evaluation}</p>
                      </div>
                    )}
                  </div>
                )}
                <button onClick={() => setTradeResult(null)} className="mt-2 text-gray-400 hover:text-white text-sm">Dismiss</button>
              </div>
            )}

            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <label className="text-gray-400 text-sm block mb-2">Trade Partner</label>
              <select
                value={targetTeamId}
                onChange={e => { setTargetTeamId(e.target.value); setRequestingIds([]); }}
                className="w-full max-w-sm px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a team...</option>
                {teams.filter(t => t.id !== userTeam?.id).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {targetTeamId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">
                    Your Players <span className="text-gray-400 text-sm font-normal">(select to offer)</span>
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {myRoster.sort((a,b) => b.overall_rating - a.overall_rating).map(p => (
                      <PlayerCard key={p.id} player={p} selected={offeringIds.includes(p.id)} onClick={() => togglePlayer(p.id, 'offering')} />
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">
                    Their Players <span className="text-gray-400 text-sm font-normal">(select to request)</span>
                  </h3>
                  {rosterLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {targetRoster.sort((a,b) => b.overall_rating - a.overall_rating).map(p => (
                        <PlayerCard key={p.id} player={p} selected={requestingIds.includes(p.id)} onClick={() => togglePlayer(p.id, 'requesting')} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(offeringIds.length > 0 || requestingIds.length > 0) && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Trade Summary</h3>
                <div className="grid grid-cols-3 gap-4 items-center mb-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-2">You Give</p>
                    {offeringIds.map(id => {
                      const p = myRoster.find(pl => pl.id === id);
                      return p ? <p key={id} className="text-white text-sm">{p.name} ({p.overall_rating})</p> : null;
                    })}
                  </div>
                  <div className="text-center">
                    <ArrowLeftRight className="h-6 w-6 text-orange-400 mx-auto" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-2">You Get</p>
                    {requestingIds.map(id => {
                      const p = targetRoster.find(pl => pl.id === id);
                      return p ? <p key={id} className="text-white text-sm">{p.name} ({p.overall_rating})</p> : null;
                    })}
                  </div>
                </div>
                <textarea
                  value={tradeMessage}
                  onChange={e => setTradeMessage(e.target.value)}
                  placeholder="Add a message (optional)..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-none mb-4 focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <button
                  onClick={submitTrade}
                  disabled={tradeLoading || offeringIds.length === 0 || requestingIds.length === 0}
                  className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-semibold"
                >
                  {tradeLoading ? 'Submitting...' : 'Propose Trade'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeCenter;
