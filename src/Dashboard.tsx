import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import { DashboardLayout } from './components/layout/DashboardLayout'

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
    toast.success('Thank you for using Paiva!')
    navigate('/')
  }

  return (
    <DashboardLayout
      header={<Header userName={user?.name} onLogout={handleLogout} />}
      sidebar={<Sidebar />}
    >
      <ChatArea />
    </DashboardLayout>
  )
}
