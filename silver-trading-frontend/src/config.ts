// API Configuration
// This file centralizes all API endpoint configuration
// 
// IMPORTANT: In production (Railway), we use RELATIVE URLs (empty string base).
// This is because frontend and backend are served from the same origin.

// Check if we're running on localhost (development)
const isLocalhost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

// API base URL - empty string in production means relative URLs
export const API_BASE_URL = isLocalhost() ? 'http://127.0.0.1:8342' : '';

// WebSocket URL - must be absolute
export const WS_URL = isLocalhost()
  ? 'ws://127.0.0.1:8342/ws'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

