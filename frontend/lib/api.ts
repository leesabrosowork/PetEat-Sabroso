/**
 * API Configuration and utility functions
 * Uses environment variable NEXT_PUBLIC_API_URL for the backend base URL
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${path}`;
};

export const getAuthHeader = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const fetchAPI = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = apiUrl(endpoint);
  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};
