import React from 'react'

export default function AuthCard({ children }: { children: React.ReactNode }) {
  // Using the new 'auth-card' class mapped to glassmorphic properties in App.css
  return <div className="auth-card">{children}</div>
}
