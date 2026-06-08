import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { userService } from '../services/userService';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_SWATCHES = {
  light:     ['oklch(0.985 0.003 264)', 'oklch(0.56 0.260 280)', 'oklch(0.145 0.024 264)'],
  dark:      ['oklch(0.105 0.024 262)', 'oklch(0.64 0.255 280)', 'oklch(0.960 0.005 264)'],
  cyberpunk: ['oklch(0.135 0.050 290)', 'oklch(0.85 0.200 95)',  'oklch(0.700 0.200 190)'],
  midnight:  ['oklch(0.015 0 0)',        'oklch(0.58 0.150 255)', 'oklch(0.880 0.008 260)'],
} as const;

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (isOpen && !isLoaded) {
      userService.getSettings()
        .then(data => {
          setInstructions(data.customInstructions || '');
          setIsLoaded(true);
        })
        .catch(console.error);
    }
  }, [isOpen, isLoaded]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await userService.updateSettings(instructions);
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn(
        "relative w-full max-w-lg p-6 rounded-2xl",
        "bg-card/92 dark:bg-card/88 border border-border/45",
        "shadow-3 dark:shadow-premium-dark",
        "animate-in zoom-in-95 fade-in duration-300",
        "conic-border",
      )}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground hover:rotate-90 transition-transform duration-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">App Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEME_SWATCHES) as Array<keyof typeof THEME_SWATCHES>).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-3 rounded-xl border text-sm font-medium tracking-snug',
                    'transition-all duration-200 ease-spring',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    theme === t
                      ? 'border-primary/40 bg-primary/8 text-primary shadow-neon-sm'
                      : 'border-border/40 bg-secondary/25 text-foreground hover:border-primary/25 hover:bg-secondary/40',
                  )}
                >
                  {/* Theme swatches */}
                  <div className="flex -space-x-1">
                    {THEME_SWATCHES[t].map((color, i) => (
                      <div
                        key={i}
                        className="size-4 rounded-full border border-white/20 shadow-sm"
                        style={{ background: color, zIndex: 3 - i }}
                      />
                    ))}
                  </div>
                  <span className="capitalize">{t === 'cyberpunk' ? 'Cyberpunk' : t === 'midnight' ? 'Midnight' : t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Custom Instructions</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            What would you like PAIVA to know about you to provide better responses? 
            You can dictate formatting (e.g., "Always use bullet points") or tone (e.g., "Respond in a highly technical way").
          </p>
          
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Always respond in less than 3 sentences..."
            className={cn(
              "w-full h-40 p-4 rounded-xl resize-none",
              "frosted-input",
              "text-foreground text-sm tracking-snug",
              "focus:outline-none",
              "transition-all duration-200"
            )}
          />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

      </div>
    </div>
  );
}
