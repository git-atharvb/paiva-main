import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const raw = localStorage.getItem('user')
  if (!raw) return <Navigate to="/" replace />
  try {
    const user = JSON.parse(raw)
    if (!user || !user.accessToken && !user.token) return <Navigate to="/" replace />
  } catch (e) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
