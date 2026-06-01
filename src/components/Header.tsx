import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { Sun, Moon } from 'lucide-react';

export default function Header({ userName, onLogout }: { userName?: string; onLogout?: () => void }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <div className="font-black text-xl tracking-widest bg-linear-to-br from-primary to-blue-500 bg-clip-text text-transparent select-none hidden sm:block">
        PAIVA
      </div>
      <nav className="flex items-center gap-4 md:gap-6">
        <Button 
          variant="secondary"
          size="sm"
          onClick={toggleTheme} 
          title="Toggle Theme"
          aria-label="Toggle theme"
          className="rounded-full size-10 p-0 flex items-center justify-center"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
        <div className="text-foreground font-medium hidden sm:block">
          {userName ? `Hello, ${userName}` : ''}
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>Logout</Button>
      </nav>
    </>
  );
}