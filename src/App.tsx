import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from './services/auth'
import AuthCard from './components/AuthCard'
import { useTheme } from './context/ThemeContext'
import './App.css'

const initialLogin = {
  email: '',
  password: '',
}

const initialSignup = {
  name: '',
  email: '',
  password: '',
}

function App() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [signupForm, setSignupForm] = useState(initialSignup)
  const [isBusy, setIsBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [notification, setNotification] = useState<
    | { type: 'success' | 'error'; text: string }
    | null
  >(null)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const activeTitle = mode === 'login' ? 'Welcome back' : 'Create your free account'
  const activeDescription =
    mode === 'login'
      ? 'Sign in to manage your profile, access protected resources, and continue where you left off.'
      : 'Start your secure journey with a polished auth experience designed for frictionless onboarding.'

  const activeForm = mode === 'login' ? loginForm : signupForm
  const buttonLabel = mode === 'login' ? 'Sign in' : 'Sign up'
  const switchAction = mode === 'login' ? 'Create account' : 'Sign in'

  const handleInputChange = (field: string, value: string) => {
    setNotification(null)
    if (mode === 'login') {
      setLoginForm(prev => ({ ...prev, [field]: value }))
    } else {
      setSignupForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleModeToggle = () => {
    setMode(current => (current === 'login' ? 'signup' : 'login'))
    setNotification(null)
    setShowPassword(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotification(null)
    setIsBusy(true)


    try {
      if (mode === 'login') {
        const response = await login(loginForm)
        const userPayload = { ...response, accessToken: response.accessToken ?? response.token }
        localStorage.setItem('user', JSON.stringify(userPayload))
        setNotification({ type: 'success', text: `Welcome back, ${response.name}!` })
        navigate('/dashboard')
      } else {
        await signup(signupForm)
        setNotification({
          type: 'success',
          text: 'Account created successfully. You can now sign in.',
        })
        setMode('login')
        setLoginForm({ email: signupForm.email, password: '' })
        setSignupForm(initialSignup)
        setShowPassword(false)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete the request.'
      setNotification({ type: 'error', text: message })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="auth-shell modern">
      <button className="theme-toggle-btn" onClick={toggleTheme}>
        {theme === 'light' ? '🌙 Dark' : '🌞 Light'}
      </button>
      <div className="auth-wrap">
        <AuthCard>
          <div className="auth-brand">PAIVA</div>
          <h2 className="auth-title">{activeTitle}</h2>
          <p className="auth-sub">{activeDescription}</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={event => handleInputChange('name', event.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={activeForm.email}
                onChange={event => handleInputChange('email', event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <div className="field-label-row">
                <span>Password</span>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(current => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={activeForm.password}
                onChange={event => handleInputChange('password', event.target.value)}
                placeholder="Create a strong password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={8}
              />
            </label>

            <div className="form-actions">
              <button className="submit-button" type="submit" disabled={isBusy}>
                {isBusy ? 'Processing…' : buttonLabel}
              </button>
              <button type="button" className="link" onClick={handleModeToggle}>
                {switchAction}
              </button>
            </div>

            {notification && (
              <div className={`status-message ${notification.type}`}>
                {notification.text}
              </div>
            )}
          </form>
        </AuthCard>
      </div>
    </div>
  )
}

export default App
