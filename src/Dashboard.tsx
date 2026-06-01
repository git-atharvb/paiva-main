import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (!raw) return navigate('/')
    try {
      const parsed = JSON.parse(raw)
      setUser({ name: parsed.name || parsed.username || '', email: parsed.email || '' })
    } catch (e) {
      navigate('/')
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div className="auth-shell">
      <div className="app-layout">
        <section className="hero-panel">
          <h1>PAIVA — Personalized AI Virtual Assistant</h1>
          <p>
            Welcome to your PAIVA dashboard. From here you can manage your assistant, review
            conversations, and tune personalization settings.
          </p>
          <div className="hero-features">
            <article>
              <strong>Personalized AI</strong>
              <span>Tailor responses and behaviors to your preferences.</span>
            </article>
            <article>
              <strong>Secure storage</strong>
              <span>We store tokens locally for session management.</span>
            </article>
            <article>
              <strong>Productivity</strong>
              <span>Quick access to assistant tools and history.</span>
            </article>
          </div>
        </section>
        <main className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="eyebrow">Dashboard</p>
              <h2>Welcome{user?.name ? `, ${user.name}` : ''}!</h2>
              <p style={{ color: '#64748b', marginTop: 8 }}>{user?.email}</p>
            </div>
            <div>
              <button className="submit-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <p style={{ color: '#475569' }}>
              This is a starter dashboard. I can add components like Conversation history,
              Settings, and Assistants management next — tell me which features you want.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
