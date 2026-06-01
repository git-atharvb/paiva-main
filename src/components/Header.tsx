import { useTheme } from '../context/ThemeContext'

export default function Header({ userName, onLogout }: { userName?: string; onLogout?: () => void }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="paiva-header">
      <div className="brand">PAIVA</div>
      <nav className="nav-actions">
        <button 
          className="ghost" 
          onClick={toggleTheme} 
          title="Toggle Theme"
          style= {{ padding: '6px 12px', fontSize: '1.1rem' }}
        >
          {theme === 'light' ? '🌙' : '🌞'}
        </button>
        <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
          {userName ? `Hello, ${userName}` : ''}
        </div>
        <button className="ghost" onClick={onLogout}>Logout</button>
      </nav>
    </header>
  )
}