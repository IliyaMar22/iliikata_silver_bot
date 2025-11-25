// API Configuration
// This file centralizes all API endpoint configuration

const isDevelopment = process.env.NODE_ENV === 'development';

// Helper to get API base URL - use empty string for production (relative URLs)
export const getApiBaseUrl = (): string => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (isDevelopment) {
    return 'http://127.0.0.1:8342';
  }
  // Production: use empty string for relative URLs (same origin)
  return '';
};

// Helper to get WebSocket URL
export const getWsUrl = (): string => {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  if (isDevelopment) {
    return 'ws://127.0.0.1:8342/ws';
  }
  // Production: derive from current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

// For backward compatibility - these are computed at runtime now
export const API_BASE_URL = getApiBaseUrl();
export const WS_URL = getWsUrl();

