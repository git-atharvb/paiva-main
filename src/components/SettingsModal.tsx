import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { userService } from '../services/userService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={cn(
        "relative w-full max-w-lg p-6 rounded-2xl",
        "bg-card/90 dark:bg-card/80 border border-border/50",
        "shadow-2xl animate-in zoom-in-95 duration-200"
      )}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Custom Instructions</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
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
              "bg-secondary/40 border border-border/50",
              "text-foreground text-sm tracking-snug",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "transition-all duration-200"
            )}
          />
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
