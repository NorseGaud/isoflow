declare global {
  interface Window {
    __ISOFLOW_API_URL__?: string;
  }
}

export const API_BASE_URL =
  (typeof window !== 'undefined' && window.__ISOFLOW_API_URL__) ||
  'http://localhost:9324';

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
