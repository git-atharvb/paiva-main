import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const raw = localStorage.getItem('user')
  if (!raw) return <Navigate to="/" replace />
  let user = null
  try {
    user = JSON.parse(raw)
  } catch {
    // Ignore parse error
  }
  
  if (!user || (!user.accessToken && !user.token)) return <Navigate to="/" replace />
  return <>{children}</>
}
