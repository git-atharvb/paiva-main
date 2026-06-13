import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import AuthCard from './components/AuthCard';
import paivaLogo from './assets/paiva_logo.png';
import { useTheme } from './context/ThemeContext'
import LoginForm from './components/auth/LoginForm'
import SignupForm from './components/auth/SignupForm'
import { Toaster } from 'react-hot-toast'
import { cn } from './lib/utils';

function App() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { theme, toggleTheme } = useTheme()

  const activeTitle = mode === 'login' ? 'PAIVA' : 'Create Account'
  const activeDescription =
    mode === 'login'
      ? 'Personalized AI Virtual Assistant Welcomes You'
      : 'Start Your Secure Journey with Frictionless Onboarding'

  const handleToggleMode = () => {
    setMode(current => (current === 'login' ? 'signup' : 'login'))
  }

  const handleSignupSuccess = () => {
    setMode('login')
  }

  return (
    <div className="w-full min-h-dvh flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-700 bg-background bg-mesh bg-aurora">

      {/* ── Floating ambient orbs ──────────────────────────────────── */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none z-0 opacity-30 blur-3xl animate-spotlight"
        style={{ background: 'radial-gradient(circle, oklch(0.56 0.260 280 / 0.3), transparent 70%)' }}
      />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none z-0 opacity-20 blur-3xl animate-spotlight"
        style={{ background: 'radial-gradient(circle, oklch(0.60 0.220 240 / 0.25), transparent 70%)', animationDelay: '2.5s' }}
      />

      {/* ── Toast notifications ───────────────────────────────────── */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:   theme === 'dark' || theme === 'cyberpunk' || theme === 'midnight'
              ? 'oklch(0.175 0.028 262)'
              : 'oklch(0.992 0.002 264)',
            color:        theme === 'dark' || theme === 'cyberpunk' || theme === 'midnight'
              ? 'oklch(0.960 0.005 264)'
              : 'oklch(0.145 0.024 264)',
            borderRadius: '14px',
            border:       theme === 'dark' || theme === 'cyberpunk' || theme === 'midnight'
              ? '1px solid oklch(0.230 0.026 262 / 0.6)'
              : '1px solid oklch(0.90 0.010 264 / 0.5)',
            boxShadow:    theme === 'dark' || theme === 'cyberpunk' || theme === 'midnight'
              ? 'var(--shadow-premium-dark)'
              : 'var(--shadow-2)',
            fontSize:     '0.875rem',
            fontWeight:   '500',
            letterSpacing: '-0.011em',
          },
        }}
      />

      {/* ── Theme toggle ──────────────────────────────────────────── */}
      <button
        className={cn(
          'absolute top-6 right-6 z-50',
          'size-12 flex items-center justify-center',
          'rounded-full',
          // Frosted glass
          'bg-white/55 dark:bg-white/8',
          'backdrop-blur-2xl',
          'border border-black/8 dark:border-white/10',
          'shadow-2 dark:shadow-premium-dark',
          // Spring interaction
          'transition-all duration-300 ease-spring',
          'hover:scale-110 hover:-translate-y-0.5',
          'hover:shadow-neon-sm hover:border-primary/40',
          'active:scale-95 active:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        <div
          className={cn(
            'transition-all duration-500 ease-spring',
            theme === 'dark' || theme === 'cyberpunk' || theme === 'midnight'
              ? 'rotate-180 scale-110'
              : 'rotate-0 scale-100',
          )}
        >
          {theme === 'light'
            ? <Moon size={20} strokeWidth={1.75} className="text-primary" />
            : <Sun  size={20} strokeWidth={1.75} className="text-yellow-400 dark:text-yellow-300" />
          }
        </div>
      </button>

      {/* ── Auth card ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center w-full justify-center relative z-10 animate-in fade-in zoom-in-95 duration-1000 ease-out">
        <AuthCard>
          {/* Logo */}
          <div className="flex justify-center mb-8 w-full animate-in fade-in zoom-in-75 duration-700 delay-100">
            <div className="relative size-24 md:size-28 group cursor-default">
              <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none animate-pulse-glow" />
              <img
                src={paivaLogo}
                alt="Paiva Logo"
                className="w-full h-full object-contain rounded-3xl drop-shadow-2xl relative z-10 transition-all duration-700 ease-spring group-hover:scale-110 group-hover:drop-shadow-[0_20px_40px_oklch(from_var(--color-ring)_l_c_h/0.35)] outline-none border-none ring-0 animate-float"
              />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-[2.75rem] font-extrabold text-foreground mb-3 text-center animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150"
              style={{ letterSpacing: '-0.033em', lineHeight: '1.10' }}>
            {activeTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-gradient-accent mb-9 text-base text-center leading-relaxed tracking-snug font-medium animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
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
