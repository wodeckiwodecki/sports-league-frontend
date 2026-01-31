import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const api = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.Authorization;
    }
  },

  // Generic methods
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),

  // Auth
  auth: {
    login: (email, password) => apiClient.post('/auth/login', { email, password }),
    register: (email, password, username) => apiClient.post('/auth/register', { email, password, username }),
    me: () => apiClient.get('/auth/me')
  },

  // Leagues
  leagues: {
    getAll: (userId) => apiClient.get(`/leagues${userId ? `?userId=${userId}` : ''}`),
    getById: (id) => apiClient.get(`/leagues/${id}`),
    create: (data) => apiClient.post('/leagues', data),
    update: (id, data) => apiClient.put(`/leagues/${id}`, data),
    advance: (id, days) => apiClient.post(`/leagues/${id}/advance`, { days }),
    getStorylines: (id, limit = 10) => apiClient.get(`/leagues/${id}/storylines?limit=${limit}`)
  },

  // Teams
  teams: {
    getById: (id) => apiClient.get(`/teams/${id}`),
    getByLeague: (leagueId) => apiClient.get(`/teams/league/${leagueId}`),
    create: (data) => apiClient.post('/teams', data),
    update: (id, data) => apiClient.put(`/teams/${id}`, data),
    getSchedule: (id, season) => apiClient.get(`/teams/${id}/schedule${season ? `?season=${season}` : ''}`),
    getStats: (id, season) => apiClient.get(`/teams/${id}/stats${season ? `?season=${season}` : ''}`),
    releasePlayer: (teamId, playerId) => apiClient.delete(`/teams/${teamId}/players/${playerId}`)
  },

  // Players
  players: {
    getAll: (params) => apiClient.get('/players', { params }),
    getById: (id, leagueId) => apiClient.get(`/players/${id}${leagueId ? `?leagueId=${leagueId}` : ''}`),
    create: (data) => apiClient.post('/players', data),
    createBulk: (players) => apiClient.post('/players/bulk', { players })
  },

  // Trades
  trades: {
    getByLeague: (leagueId, status) => apiClient.get(`/trades/league/${leagueId}${status ? `?status=${status}` : ''}`),
    getIncoming: (teamId) => apiClient.get(`/trades/team/${teamId}/incoming`),
    create: (data) => apiClient.post('/trades', data),
    accept: (id) => apiClient.put(`/trades/${id}/accept`),
    decline: (id, message) => apiClient.put(`/trades/${id}/decline`, { message })
  },

  // Contracts
  contracts: {
    getFreeAgents: (leagueId, position) => apiClient.get(`/contracts/free-agents/${leagueId}${position ? `?position=${position}` : ''}`),
    makeOffer: (data) => apiClient.post('/contracts/offer', data),
    getTeamOffers: (teamId) => apiClient.get(`/contracts/team/${teamId}`),
    getExpiring: (leagueId, teamId) => apiClient.get(`/contracts/expiring/${leagueId}${teamId ? `?teamId=${teamId}` : ''}`),
    acceptCounter: (offerId) => apiClient.put(`/contracts/${offerId}/accept-counter`),
    withdraw: (offerId) => apiClient.delete(`/contracts/${offerId}`)
  },

  // Games
  games: {
    getByLeague: (leagueId, params) => apiClient.get(`/games/league/${leagueId}`, { params }),
    getById: (id) => apiClient.get(`/games/${id}`),
    getToday: (leagueId) => apiClient.get(`/games/today/${leagueId}`),
    getStandings: (leagueId, season) => apiClient.get(`/games/standings/${leagueId}${season ? `?season=${season}` : ''}`),
    createSchedule: (leagueId, season, gamesPerTeam) => apiClient.post('/games/schedule', { leagueId, season, gamesPerTeam })
  },

  // Draft
  draft: {
    initialize: (leagueId, settings) => apiClient.post('/draft/initialize', { leagueId, settings }),
    start: (leagueId) => apiClient.post('/draft/start', { leagueId }),
    getState: (leagueId) => apiClient.get(`/draft/${leagueId}`),
    makePick: (leagueId, teamId, playerId) => apiClient.post('/draft/pick', { leagueId, teamId, playerId }),
    autoPick: (leagueId, teamId) => apiClient.post(`/draft/${leagueId}/auto-pick`, { teamId }),
    getAvailablePlayers: (leagueId, params) => apiClient.get(`/draft/${leagueId}/available-players`, { params }),
    getTeamPicks: (leagueId, teamId) => apiClient.get(`/draft/${leagueId}/team/${teamId}/picks`),
    getUpcomingPicks: (leagueId, teamId) => apiClient.get(`/draft/${leagueId}/upcoming-picks/${teamId}`),
    getDraftBoard: (leagueId, limit) => apiClient.get(`/draft/${leagueId}/draft-board${limit ? `?limit=${limit}` : ''}`)
  },

  // NBA
  nba: {
    import: () => apiClient.post('/nba/import'),
    search: (query) => apiClient.get(`/nba/search?q=${query}`),
    getTeamPlayers: (teamId) => apiClient.get(`/nba/teams/${teamId}/players`)
  }
};

export default api;
