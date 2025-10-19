import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const register = (name, username, email, password) => {
  return api.post('/players', {
    player: { name, username, email, password }
  });
};

export const login = (username, password) => {
  return api.post('/auth/login', { username, password });
};

export const logout = () => {
  return api.post('/auth/logout');
};

export const verifyToken = () => {
  return api.get('/auth/verify');
};

// Player endpoints
export const getPlayer = (username) => {
  return api.get(`/players/${encodeURIComponent(username)}`);
};

export const getPlayerGames = (username) => {
  return api.get(`/players/${encodeURIComponent(username)}/games`);
};

// Game endpoints
export const getGame = (gameId) => {
  return api.get(`/games/${gameId}`);
};

export const updateGame = (gameId, gameData) => {
  return api.patch(`/games/${gameId}`, { game_data: gameData });
};

export const resetGame = (gameId) => {
  return api.delete(`/games/${gameId}`);
};

// Leaderboard endpoint
export const getLeaderboard = () => {
  return api.get('/leaderboard');
};

export default api;