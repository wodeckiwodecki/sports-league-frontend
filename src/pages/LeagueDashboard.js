import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { Trophy, Users, Calendar, TrendingUp, PlayCircle, Newspaper, Settings } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const LeagueDashboard = () => {
  const { leagueId } = useParams();
  const { socket, joinLeague, leaveLeague } = useSocket();
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [todayGames, setTodayGames] = useState([]);
  const [storylines, setStorylines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagueData();
    joinLeague(parseInt(leagueId));

    return () => leaveLeague(parseInt(leagueId));
  }, [leagueId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('league_day_advanced', handleDayAdvanced);
    socket.on('game_completed', handleGameCompleted);
    socket.on('new_storylines', handleNewStorylines);

    return () => {
      socket.off('league_day_advanced', handleDayAdvanced);
      socket.off('game_completed', handleGameCompleted);
      socket.off('new_storylines', handleNewStorylines);
    };
  }, [socket]);

  const fetchLeagueData = async () => {
    try {
      const [leagueRes, teamsRes, gamesRes, storylinesRes] = await Promise.all([
        api.leagues.getById(leagueId),
        api.teams.getByLeague(leagueId),
        api.games.getToday(leagueId),
        api.leagues.getStorylines(leagueId, 5)
      ]);

      setLeague(leagueRes.data);
      setTeams(teamsRes.data);
      setTodayGames(gamesRes.data);
      setStorylines(storylinesRes.data);
    } catch (error) {
      console.error('Error fetching league data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayAdvanced = (data) => {
    if (data.leagueId === parseInt(leagueId)) {
      fetchLeagueData();
    }
  };

  const handleGameCompleted = () => {
    fetchLeagueData();
  };

  const handleNewStorylines = (data) => {
    if (data.leagueId === parseInt(leagueId)) {
      setStorylines(prev => [...data.storylines, ...prev].slice(0, 5));
    }
  };

  const advanceLeague = async (days = 1) => {
    try {
      await api.leagues.advance(leagueId, days);
    } catch (error) {
      console.error('Error advancing league:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{league.name}</h1>
        <div className="flex items-center gap-6 text-gray-600">
          <span>Season {league.current_season}</span>
          <span>•</span>
          <span>Day {league.current_day}</span>
          <span>•</span>
          <span>{teams.length} Teams</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          to={`/league/${leagueId}/standings`}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all text-center"
        >
          <Trophy className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <span className="font-semibold text-gray-900">Standings</span>
        </Link>

        <Link
          to={`/league/${leagueId}/schedule`}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all text-center"
        >
          <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <span className="font-semibold text-gray-900">Schedule</span>
        </Link>

        <Link
          to={`/league/${leagueId}/trades`}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all text-center"
        >
          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <span className="font-semibold text-gray-900">Trades</span>
        </Link>

        <Link
          to={`/league/${leagueId}/free-agents`}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all text-center"
        >
          <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <span className="font-semibold text-gray-900">Free Agents</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Games */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <PlayCircle className="h-6 w-6" />
                Today's Games
              </h2>
              <button
                onClick={() => advanceLeague(1)}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Advance Day
              </button>
            </div>

            {todayGames.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No games scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todayGames.map(game => (
                  <div key={game.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{game.away_team_name}</span>
                          {game.status === 'completed' && (
                            <span className="text-xl font-bold">{game.away_score}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{game.home_team_name}</span>
                          {game.status === 'completed' && (
                            <span className="text-xl font-bold">{game.home_score}</span>
                          )}
                        </div>
                      </div>
                      {game.status === 'scheduled' && (
                        <span className="text-sm text-gray-500 ml-4">Scheduled</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Standings Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Standings</h2>
              <Link to={`/league/${leagueId}/standings`} className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {teams.slice(0, 5).map((team, index) => (
                <Link
                  key={team.id}
                  to={`/league/${leagueId}/team/${team.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 w-6">{index + 1}</span>
                    <span className="font-semibold text-gray-900">{team.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{team.wins}-{team.losses}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* League News */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Newspaper className="h-6 w-6" />
              League News
            </h2>

            {storylines.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent news</p>
            ) : (
              <div className="space-y-4">
                {storylines.map(story => (
                  <div key={story.id} className="border-l-4 border-blue-500 pl-3">
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">{story.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{story.content}</p>
                    <span className="text-xs text-gray-500 mt-1 block">Day {story.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Teams</h2>
            <div className="space-y-2">
              {teams.map(team => (
                <Link
                  key={team.id}
                  to={`/league/${leagueId}/team/${team.id}`}
                  className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="font-medium text-gray-900">{team.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueDashboard;
