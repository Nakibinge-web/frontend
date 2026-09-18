/**
 * API Configuration
 * Centralized API URL configuration for the entire application
 */

// Base API URL with /api endpoint
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Base URL without /api (for image uploads, etc.)
export const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL.replace('/api', '') 
  : 'http://localhost:8000';

// Helper function to create headers with authorization
export const createHeaders = (token, includeContentType = true) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

export default {
  API_URL,
  API_BASE_URL,
  createHeaders,
};
