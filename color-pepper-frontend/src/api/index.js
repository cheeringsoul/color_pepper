import * as mock from './mock';

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJSON(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${path}${query ? '?' + query : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJSON(path, body) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const api = {
  async getMarketOverview() {
    if (USE_MOCK) return mock.getMarketOverview();
    return fetchJSON('/api/market/overview');
  },

  async getSymbols() {
    if (USE_MOCK) return mock.getSymbols();
    return fetchJSON('/api/symbols');
  },

  async getTicker(symbol) {
    if (USE_MOCK) return mock.getTicker(symbol);
    return fetchJSON(`/api/ticker/${symbol}`);
  },

  async getKlines(symbol, interval = '1h', limit = 80) {
    if (USE_MOCK) return mock.getKlines(symbol, interval, limit);
    return fetchJSON(`/api/klines/${symbol}`, { interval, limit });
  },

  async getOrderBook(symbol, limit = 9) {
    if (USE_MOCK) return mock.getOrderBook(symbol, limit);
    return fetchJSON(`/api/orderbook/${symbol}`, { limit });
  },

  async getSparkline(symbol, points = 30) {
    if (USE_MOCK) return mock.getSparkline(symbol, points);
    return fetchJSON(`/api/sparkline/${symbol}`, { points });
  },

  async getSectorRotation(period = '7d') {
    if (USE_MOCK) return mock.getSectorRotation(period);
    return fetchJSON('/api/rotation/heatmap', { period });
  },

  async getBtcKlines(period = '30d') {
    if (USE_MOCK) return mock.getBtcKlines(period);
    return fetchJSON('/api/btc/klines', { period });
  },

  async getRotationAnalysis(period = '30d') {
    if (USE_MOCK) return mock.getRotationAnalysis(period);
    return fetchJSON('/api/rotation/analysis', { period });
  },

  async getSimilarity(refSymbol = 'BTC', algo = 'pearson', period = '30d', minCorr = 0.5) {
    if (USE_MOCK) return mock.getSimilarity(refSymbol, algo, period, minCorr);
    return fetchJSON('/api/similarity', { ref: refSymbol, algo, period, minCorr });
  },

  async sendAgentMessage(message, context = {}) {
    if (USE_MOCK) return mock.sendAgentMessage(message, context);
    return postJSON('/api/agent/chat', { message, context });
  },

  async getAgentAlerts() {
    if (USE_MOCK) return mock.getAgentAlerts();
    return fetchJSON('/api/agent/alerts');
  },
};

export default api;
