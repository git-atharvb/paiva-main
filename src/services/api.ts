// import type { JwtResponse } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const userStr = localStorage.getItem('user');
  let token = '';
  if (userStr) {
    const user = JSON.parse(userStr);
    token = user.accessToken || user.token;
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !url.includes('/api/auth/login')) {
    if (isRefreshing) {
      return new Promise<unknown>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          return fetch(`${API_BASE}${url}`, { ...options, headers });
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    isRefreshing = true;
    
    if (userStr) {
      const user = JSON.parse(userStr);
      const refreshToken = user.refreshToken;
      
      try {
        const refreshResponse = await fetch(`${API_BASE}/api/auth/refreshtoken`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          user.accessToken = refreshData.accessToken;
          user.refreshToken = refreshData.refreshToken;
          localStorage.setItem('user', JSON.stringify(user));
          
          processQueue(null, user.accessToken);
          headers.set('Authorization', `Bearer ${user.accessToken}`);
          
          return fetch(`${API_BASE}${url}`, { ...options, headers });
        } else {
          localStorage.removeItem('user');
          window.location.href = '/';
          processQueue(new Error('Refresh failed'), null);
          return Promise.reject(new Error('Session expired'));
        }
      } catch (err) {
        localStorage.removeItem('user');
        window.location.href = '/';
        processQueue(err as Error, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    } else {
      isRefreshing = false;
    }
  }

  return response;
}
