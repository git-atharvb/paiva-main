import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user] = useState<{ name?: string; email?: string } | null>(() => {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return { name: parsed.name || parsed.username || '', email: parsed.email || '' }
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  function handleLogout() {
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div className="paiva-dashboard">
      <Header userName={user?.name} onLogout={handleLogout} />
      <div className="dashboard-body">
        <Sidebar />
        <ChatArea />
      </div>
    </div>
  )
}
