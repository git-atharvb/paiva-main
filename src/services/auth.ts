import type { JwtResponse, LoginRequest, SignupRequest } from '../types/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

async function post<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.message || payload?.error || response.statusText || 'Request failed'
    throw new Error(message)
  }

  return payload as T
}

export function login(data: LoginRequest): Promise<JwtResponse> {
  return post<JwtResponse>('/api/auth/login', data)
}

export function signup(data: SignupRequest): Promise<{ message: string }> {
  return post<{ message: string }>('/api/auth/signup', data)
}
