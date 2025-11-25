// API Configuration
// This file centralizes all API endpoint configuration

const isDevelopment = process.env.NODE_ENV === 'development';

const getWindowOrigin = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return '';
};

// For Railway deployment, frontend and backend are on the same domain
// So we can use relative URLs in production
const defaultApiBase = process.env.REACT_APP_API_URL ||
  (isDevelopment ? 'http://127.0.0.1:8342' : getWindowOrigin());

export const API_CONFIG = {
  // Backend API URL
  API_BASE_URL: defaultApiBase,
  
  // WebSocket URL
  WS_URL: process.env.REACT_APP_WS_URL || 
          (isDevelopment 
            ? 'ws://127.0.0.1:8342/ws'  // WebSocket still needs full URL
            : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`),  // Production: same host
};

// Export for easy access
export const { API_BASE_URL, WS_URL } = API_CONFIG;

