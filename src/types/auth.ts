export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
}

export interface JwtResponse {
  // Backend may return `token` (this app) or `accessToken` (other examples).
  token?: string
  accessToken?: string
  tokenType?: string
  id: string
  name: string
  email: string
}
