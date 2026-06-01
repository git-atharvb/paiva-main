import { useState } from 'react'
import AuthCard from './components/AuthCard'
import { useTheme } from './context/ThemeContext'
import LoginForm from './components/auth/LoginForm'
import SignupForm from './components/auth/SignupForm'
import { Toaster } from 'react-hot-toast'
import './App.css'

function App() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { theme, toggleTheme } = useTheme()

  const activeTitle = mode === 'login' ? 'Welcome back' : 'Create your free account'
  const activeDescription =
    mode === 'login'
      ? 'Sign in to manage your profile, access protected resources, and continue where you left off.'
      : 'Start your secure journey with a polished auth experience designed for frictionless onboarding.'

  const handleToggleMode = () => {
    setMode(current => (current === 'login' ? 'signup' : 'login'))
  }

  const handleSignupSuccess = () => {
    setMode('login')
  }

  return (
    <div className="auth-shell modern">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333',
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
          }
        }} 
      />
      <button className="theme-toggle-btn" onClick={toggleTheme}>
        {theme === 'light' ? '🌙 Dark' : '🌞 Light'}
      </button>
      <div className="auth-wrap">
        <AuthCard>
          <div className="auth-brand">PAIVA</div>
          <h2 className="auth-title">{activeTitle}</h2>
          <p className="auth-sub">{activeDescription}</p>

          {mode === 'login' ? (
            <LoginForm onToggleMode={handleToggleMode} />
          ) : (
            <SignupForm onToggleMode={handleToggleMode} onSuccess={handleSignupSuccess} />
          )}
        </AuthCard>
      </div>
    </div>
  )
}

export default App
