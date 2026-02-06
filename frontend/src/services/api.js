// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true, // 🔥 THIS IS CRITICAL
});

export const getDashboardData = async () => {
  const res = await api.get('/api/analytics/dashboard')
  return res.data;
};

export const getInsightsData = async () => {
  const res = await api.get('/api/analytics/insights');
  return res.data;
};

export const getTopSongs = async () => {
  const res = await api.get('/api/analytics/top-songs');
  return res.data;
};

export const semanticSearch = async (query) => {
  const res = await api.post("/api/search", { query });
  return res.data;
};

