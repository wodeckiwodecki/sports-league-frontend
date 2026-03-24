import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, ArrowLeft, TrendingUp } from 'lucide-react';

const RatingBar = ({ label, value }) => {
  const color = value >= 90 ? 'bg-green-500' : value >= 80 ? 'bg-blue-500' : value >= 70 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-sm w-28 text-right">{label}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }}></div>
      </div>
      <span className="text-white text-sm font-semibold w-8">{value}</span>
    </div>
  );
};

const PlayerProfile = () => {
  const { leagueId, playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayer();
  }, [playerId]);

  const loadPlayer = async () => {
    try {
      const res = await api.players.getById(playerId, leagueId);
      setPlayer(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading player:', err);
      setLoading(false);
    }
  };

  const getOverallColor = (ovr) => {
    if (ovr >= 90) return 'text-green-400';
    if (ovr >= 80) return 'text-blue-400';
    if (ovr >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getOverallBg = (ovr) => {
    if (ovr >= 90) return 'bg-green-400/10 border-green-400/30';
    if (ovr >= 80) return 'bg-blue-400/10 border-blue-400/30';
    if (ovr >= 70) return 'bg-yellow-400/10 border-yellow-400/30';
    return 'bg-red-400/10 border-red-400/30';
  };

  const getAttributes = (player) => {
    const attrs = player.attributes || {};
    if (player.sport === 'NBA') {
      const ratings = attrs.ratings || {};
      return [
        { label: 'Inside Score', value: Math.round((ratings.ins || 50) * 1.2) },
        { label: 'Dunk', value: Math.round((ratings.dnk || 50) * 1.2) },
        { label: 'Mid-Range', value: Math.round((ratings.fg || 50) * 1.2) },
        { label: '3-Point', value: Math.round((ratings.tp || 50) * 1.2) },
        { label: 'Free Throw', value: Math.round((ratings.ft || 50) * 1.2) },
        { label: 'Defense IQ', value: Math.round((ratings.diq || 50) * 1.2) },
        { label: 'Offense IQ', value: Math.round((ratings.oiq || 50) * 1.2) },
        { label: 'Speed', value: Math.round((ratings.spd || 50) * 1.2) },
        { label: 'Rebounding', value: Math.round((ratings.reb || 50) * 1.2) },
        { label: 'Passing', value: Math.round((ratings.pss || 50) * 1.2) },
      ].map(a => ({ ...a, value: Math.min(99, a.value) }));
    }
    // MLB
    return [
      { label: 'Contact', value: attrs.contact || player.overall_rating },
      { label: 'Power', value: attrs.power || player.overall_rating },
      { label: 'Speed', value: attrs.speed || player.overall_rating },
      { label: 'Fielding', value: attrs.fielding || player.overall_rating },
      { label: 'Arm Strength', value: attrs.arm || player.overall_rating },
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Player not found</p>
      </div>
    );
  }

  const attributes = getAttributes(player);

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        {/* Player Header */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">{player.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-medium">{player.position}</span>
                {player.team && <span className="text-gray-400 text-sm">{player.team}</span>}
                <span className="text-gray-400 text-sm">Age {player.age}</span>
                <span className="text-gray-400 text-sm">{player.sport}</span>
              </div>
            </div>
            <div className={`border-2 rounded-xl p-4 text-center min-w-[90px] ${getOverallBg(player.overall_rating)}`}>
              <p className={`text-5xl font-black ${getOverallColor(player.overall_rating)}`}>{player.overall_rating}</p>
              <p className="text-gray-400 text-xs mt-1 uppercase tracking-wider">Overall</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attributes */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Ratings
            </h2>
            <div className="space-y-3">
              {attributes.map(attr => (
                <RatingBar key={attr.label} label={attr.label} value={attr.value} />
              ))}
            </div>
          </div>

          {/* Info + Contract */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-white font-bold text-lg mb-4">Player Info</h2>
              <div className="space-y-3">
                {[
                  { label: 'Overall', value: player.overall_rating },
                  { label: 'Potential', value: player.potential },
                  { label: 'Age', value: player.age },
                  { label: 'Position', value: player.position },
                  player.height && { label: 'Height', value: player.height },
                  player.weight && { label: 'Weight', value: `${player.weight} lbs` },
                  player.draft_year && { label: 'Draft Year', value: player.draft_year },
                  player.draft_class && { label: 'Draft Class', value: player.draft_class },
                ].filter(Boolean).map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-400 text-sm">{item.label}</span>
                    <span className="text-white text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {player.contract && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">Contract</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Annual Salary</span>
                    <span className="text-white text-sm font-medium">
                      ${(player.contract.annual_salary / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Years Left</span>
                    <span className="text-white text-sm font-medium">{player.contract.years_remaining}</span>
                  </div>
                </div>
              </div>
            )}

            {player.stats && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">Season Stats</h2>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(player.stats).slice(0, 9).map(([key, val]) => (
                    <div key={key} className="bg-gray-700 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white">{typeof val === 'number' ? val.toFixed(1) : val}</p>
                      <p className="text-xs text-gray-400 uppercase">{key}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
