import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import AuthCard from './components/AuthCard';
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
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-mesh relative overflow-hidden transition-colors duration-1000">
      {/* Dynamic atmospheric lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary/20 blur-[140px] pointer-events-none mix-blend-screen animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/20 blur-[140px] pointer-events-none mix-blend-screen animate-float" style={{ animationDelay: '3s' }} />
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
          <div className="inline-flex px-4 py-1.5 rounded-full bg-primary/10 text-primary font-extrabold tracking-widest text-xs uppercase mb-6 border border-primary/20 shadow-[0_0_15px_rgba(124,58,237,0.15)]">
            PAIVA
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground mb-4">
            {activeTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 text-lg">
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
