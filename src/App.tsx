import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from './services/auth'
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

  const activeTitle = mode === 'login' ? 'Welcome back' : 'Create your free account'
  const activeDescription =
    mode === 'login'
      ? 'Sign in to manage your profile, access protected resources, and continue where you left off.'
      : 'Start your secure journey with a polished auth experience designed for frictionless onboarding.'

  const activeForm = mode === 'login' ? loginForm : signupForm
  const buttonLabel = mode === 'login' ? 'Sign in' : 'Sign up'
  const switchLabel = mode === 'login' ? "Don't have an account?" : 'Already registered?'
  const switchAction = mode === 'login' ? 'Create account' : 'Sign in'

  const helperText =
    mode === 'login'
      ? 'Use the email address associated with your account.'
      : 'Choose a strong password with 8+ characters, including one number and one symbol.'

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
        // Normalize token key (backend returns `token`) and save user payload
        const userPayload = { ...response, accessToken: (response as any).accessToken ?? (response as any).token }
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
    <div className="auth-shell">
      <div className="app-layout">
        <section className="hero-panel">
          <span className="hero-badge">Secure authentication</span>
          <h1>Beautiful login & signup flows built for modern web apps</h1>
          <p>
            A polished experience with clear validation, responsive layout, and seamless transition
            between sign in and registration.
          </p>

          <div className="hero-features">
            <article>
              <strong>Fast entry</strong>
              <span>Minimal form steps and clear actions keep users moving.</span>
            </article>
            <article>
              <strong>Trusted security</strong>
              <span>Ready to connect to your Spring Boot auth backend with secure token handling.</span>
            </article>
            <article>
              <strong>Adaptive UI</strong>
              <span>Responsive styles scale beautifully from desktop to mobile.</span>
            </article>
          </div>

          <div className="hero-footer">
            <div className="hero-stat">
              <strong>99.9%</strong>
              <span>Uptime-ready UI</span>
            </div>
            <div className="hero-stat">
              <strong>2x</strong>
              <span>Better conversion</span>
            </div>
          </div>
        </section>

        <main className="auth-card">
          <div className="auth-header">
            <div>
              <p className="eyebrow">Authentication</p>
              <h2>{activeTitle}</h2>
            </div>
            <div className="switch-control">
              <span>{switchLabel}</span>
              <button type="button" className="switch-button" onClick={handleModeToggle}>
                {switchAction}
              </button>
            </div>
          </div>

          <p className="auth-copy">{activeDescription}</p>

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

            <p className="field-hint">{helperText}</p>

            <button className="submit-button" type="submit" disabled={isBusy}>
              {isBusy ? 'Processing…' : buttonLabel}
            </button>

            {notification && (
              <div className={`status-message ${notification.type}`}>
                {notification.text}
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  )
}

export default App
