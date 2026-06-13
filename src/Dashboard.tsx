import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import TodoList from './components/TodoList'
import NotesList from './components/NotesList'
import EmailList from './components/EmailList'
import SmartCalculator from './components/SmartCalculator'
import SettingsView from './components/SettingsView'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { ChatProvider } from './context/ChatContext'
import { userService } from './services/userService'

import { useChat } from './context/ChatContext'

import HomeDashboard from './components/HomeDashboard'
import AboutView from './components/AboutView'

type DashboardView = 'home' | 'chat' | 'todos' | 'notes' | 'emails' | 'calculator' | 'settings' | 'about';

function DashboardContent({ user, handleLogout }: { user: { name?: string; email?: string } | null, handleLogout: () => void }) {
  const { secondaryConversationId } = useChat();
  const [activeView, setActiveView] = useState<DashboardView>('home');

  return (
    <DashboardLayout
      header={<Header userName={user?.name} onLogout={handleLogout} onOpenAbout={() => setActiveView('about')} />}
      sidebar={<Sidebar activeView={activeView} onViewChange={setActiveView} />}
    >
      {activeView === 'home' ? (
        <HomeDashboard user={user} onNavigate={setActiveView} />
      ) : activeView === 'todos' ? (
        <TodoList userEmail={user?.email} />
      ) : activeView === 'notes' ? (
        <NotesList />
      ) : activeView === 'emails' ? (
        <EmailList />
      ) : activeView === 'calculator' ? (
        <SmartCalculator />
      ) : activeView === 'settings' ? (
        <SettingsView />
      ) : activeView === 'about' ? (
        <AboutView />
      ) : secondaryConversationId ? (
        <div className="flex w-full h-full gap-4">
          <div className="flex-1 min-w-0">
            <ChatArea />
          </div>
          <div className="w-px bg-border/40 shrink-0 hidden md:block" />
          <div className="flex-1 min-w-0 hidden md:block">
            <ChatArea isSecondary={true} />
          </div>
        </div>
      ) : (
        <ChatArea />
      )}
    </DashboardLayout>
  );
}

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

  useEffect(() => {
    if (!user) return;
    
    const applySettings = async () => {
      try {
        const settings = await userService.getSettings();
        document.documentElement.setAttribute('data-density', settings.uiDensity || 'Comfortable');
      } catch (err) {
        console.error('Failed to load global settings', err);
      }
    };
    
    applySettings();
    
    const onSettingsUpdated = () => applySettings();
    window.addEventListener('settingsUpdated', onSettingsUpdated);
    return () => window.removeEventListener('settingsUpdated', onSettingsUpdated);
  }, [user]);

  return (
    <ChatProvider>
      <DashboardContent user={user} handleLogout={handleLogout} />
    </ChatProvider>
  )
}
