declare global {
  interface Window { __env__?: { API_BASE_URL?: string } }
}
const fallback = 'http://localhost:8000/api/v1';
export const API_BASE_URL = (typeof window !== 'undefined' && window.__env__?.API_BASE_URL) ? window.__env__!.API_BASE_URL! : fallback;
export const environment = { apiBaseUrl: API_BASE_URL };
