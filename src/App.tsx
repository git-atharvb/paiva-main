import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import AuthCard from './components/AuthCard';
import paivaLogo from './assets/paiva_logo.png';
import { useTheme } from './context/ThemeContext'
import LoginForm from './components/auth/LoginForm'
import SignupForm from './components/auth/SignupForm'
import { Toaster } from 'react-hot-toast'
import './App.css'

function App() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { theme, toggleTheme } = useTheme()

  const activeTitle = mode === 'login' ? 'Welcome Back' : 'Create Your Account'
  const activeDescription =
    mode === 'login'
      ? 'Personalized AI Virtual Assistant'
      : 'Start Your Secure Journey with Frictionless Onboarding'

  const handleToggleMode = () => {
    setMode(current => (current === 'login' ? 'signup' : 'login'))
  }

  const handleSignupSuccess = () => {
    setMode('login')
  }

  return (
    <div className="w-full min-h-dvh flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-700 bg-background bg-aurora">
      {/* Subtle grid overlay for texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6bTAgNDBoMXYtNDBoLTEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz4KPC9zdmc+')] mix-blend-overlay" />
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
      <button 
        className="absolute top-8 right-8 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-foreground backdrop-blur-2xl p-4 rounded-full shadow-premium dark:shadow-premium-dark z-50 transition-all duration-500 hover:scale-110 hover:shadow-neon hover:border-primary/50" 
        onClick={toggleTheme} 
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={22} className="text-primary" /> : <Sun size={22} className="text-yellow-400" />}
      </button>
      <div className="flex w-full justify-center relative perspective-[1500px] z-10 animate-in fade-in zoom-in-95 duration-1000 ease-out">
        <AuthCard>
          <div className="flex justify-center mb-10 w-full animate-in fade-in zoom-in-75 duration-700 delay-100">
            <div className="relative size-28 md:size-32 group cursor-default">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <img 
                src={paivaLogo} 
                alt="Paiva Logo" 
                className="w-full h-full object-contain rounded-3xl drop-shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-110 outline-none border-none ring-0" 
              />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground mb-4 text-center">
            {activeTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 text-lg text-center">
            {activeDescription}
          </p>

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
