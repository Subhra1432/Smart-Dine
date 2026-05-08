const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${API_URL}/api/v1`;

import { useAuthStore } from '../store/auth';

export const fetchApi = async (url: string, opts?: RequestInit) => {
  const { token } = useAuthStore.getState();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts?.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, { 
    credentials: 'include', 
    ...opts,
    headers
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'API request failed');
  return data.data;
};

export const getMe = () => fetchApi('/auth/superadmin/me');
