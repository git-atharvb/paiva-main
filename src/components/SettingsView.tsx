import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { 
  Brain, Check, MessageSquareText, Save, Sparkles, ToggleLeft, ToggleRight, 
  UserRound, X, Calendar, Settings2, Palette, Zap, Cpu, SlidersHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { userService } from '../services/userService';
import type { UserSettings } from '../services/userService';
import { useTheme } from '../context/ThemeContext';

const THEME_SWATCHES = {
  light:     ['oklch(0.985 0.003 264)', 'oklch(0.56 0.260 280)', 'oklch(0.145 0.024 264)'],
  dark:      ['oklch(0.105 0.024 262)', 'oklch(0.64 0.255 280)', 'oklch(0.960 0.005 264)'],
  cyberpunk: ['oklch(0.135 0.050 290)', 'oklch(0.85 0.200 95)',  'oklch(0.700 0.200 190)'],
  midnight:  ['oklch(0.015 0 0)',        'oklch(0.58 0.150 255)', 'oklch(0.880 0.008 260)'],
} as const;

const RESPONSE_STYLES = ['Balanced', 'Concise', 'Detailed', 'Technical', 'Creative'] as const;

// New Mock Models
const AI_MODELS = [
  { id: 'paiva-core', name: 'PAIVA-Core', desc: 'Balanced performance and speed.' },
  { id: 'paiva-fast', name: 'PAIVA-Fast', desc: 'Lightning-fast generation for daily tasks.' },
  { id: 'paiva-pro', name: 'PAIVA-Pro (GPT-4o)', desc: 'Maximum intelligence for complex logic.' },
];

const DEFAULT_SETTINGS: UserSettings = {
  assistantName: 'PAIVA',
  aboutUser: '',
  responseStyle: 'Balanced',
  customInstructions: '',
  memoryEnabled: true,
  calendarConnected: false,
};

export default function SettingsView() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme, setTheme } = useTheme();

  // Simulated Advanced Settings (Visual only for now)
  const [selectedModel, setSelectedModel] = useState('paiva-core');
  const [creativity, setCreativity] = useState(50);

  const connectCalendar = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await userService.updateSettings({ ...settings, googleAccessToken: tokenResponse.access_token });
        setSettings(s => ({ ...s, calendarConnected: true, googleAccessToken: tokenResponse.access_token }));
        toast.success("Google Calendar connected!");
      } catch {
        toast.error("Failed to save calendar connection.");
      }
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.modify',
    onError: () => toast.error('Google login failed'),
  });

  useEffect(() => {
    if (!isLoaded) {
      userService.getSettings()
        .then(data => {
          setSettings(data);
          setIsLoaded(true);
        })
        .catch(console.error);
    }
  }, [isLoaded]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await userService.updateSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings.');
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground animate-pulse h-full">
        <Settings2 size={48} className="opacity-20 mb-4 animate-spin-slow" />
        <p className="text-lg font-medium tracking-wide">Loading Preferences...</p>
      </div>
    );
  }

  return (
    <div className="relative p-5 md:p-8 w-full flex flex-col h-full overflow-y-auto magical-scrollbar pb-32">
      
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 relative z-10">
        <div>
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl mb-4 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
            <Settings2 size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-2 flex items-center gap-3">
            Preferences
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">
            Customize PAIVA to fit your exact workflow and aesthetic.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-bold tracking-wide",
              "bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-[0_8px_20px_rgba(var(--primary),0.25)]",
              "hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 ease-out",
              "hover:shadow-[0_8px_30px_rgba(var(--primary),0.4)] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:-translate-y-0"
            )}
          >
            {isSaving ? <Settings2 size={18} className="animate-spin" strokeWidth={3} /> : <Save size={18} strokeWidth={3} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-8 relative z-10">
        
        {/* ── Appearance Section ───────────────────────────────────── */}
        <div className="glass-surface-subtle border border-border/40 rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
          
          <h2 className="text-xl font-black tracking-tight mb-8 flex items-center gap-3">
            <div className="bg-indigo-500/10 text-indigo-500 p-2 rounded-xl"><Palette size={20} strokeWidth={2.5} /></div>
            Appearance
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(THEME_SWATCHES) as Array<keyof typeof THEME_SWATCHES>).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'flex flex-col gap-4 p-5 rounded-3xl border transition-all duration-300 ease-out relative overflow-hidden group/theme',
                    'hover:-translate-y-1 active:scale-95 hover:shadow-lg',
                    theme === t
                      ? 'border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]'
                      : 'border-border/40 bg-secondary/30 text-foreground hover:border-primary/30 hover:bg-secondary/60'
                  )}
                >
                  {theme === t && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                  )}
                  {theme === t && (
                    <div className="absolute top-3 right-3 text-primary"><Check size={16} strokeWidth={3} /></div>
                  )}
                  <div className="flex -space-x-2 relative z-10">
                    {THEME_SWATCHES[t].map((color, i) => (
                      <div
                        key={i}
                        className={cn(
                          "size-8 rounded-full border-2 shadow-sm transition-transform duration-300",
                          theme === t ? "border-primary/20 scale-110" : "border-background group-hover/theme:-translate-y-1"
                        )}
                        style={{ background: color, zIndex: 3 - i, animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                  <span className={cn("capitalize font-bold tracking-wide relative z-10 text-[15px]", theme === t ? "text-primary" : "")}>
                    {t === 'cyberpunk' ? 'Cyberpunk' : t === 'midnight' ? 'Midnight' : t}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Personalization Section ──────────────────────────────── */}
        <div className="glass-surface-subtle border border-border/40 rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700" />
          
          <h2 className="text-xl font-black tracking-tight mb-8 flex items-center gap-3">
            <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl"><Sparkles size={20} strokeWidth={2.5} /></div>
            Assistant Persona
          </h2>

          <div className="space-y-6">
            <label className="block space-y-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <UserRound size={14} strokeWidth={2.5} /> Assistant Name
              </span>
              <input
                value={settings.assistantName}
                onChange={(e) => setSettings(current => ({ ...current, assistantName: e.target.value }))}
                maxLength={40}
                placeholder="PAIVA"
                className={cn(
                  "w-full px-5 py-4 rounded-2xl bg-background border border-border/50",
                  "text-foreground text-[15px] font-bold tracking-wide",
                  "focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] transition-all duration-300"
                )}
              />
            </label>

            <div className="space-y-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <MessageSquareText size={14} strokeWidth={2.5} /> Response Style
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {RESPONSE_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSettings(current => ({ ...current, responseStyle: style }))}
                    className={cn(
                      'min-h-12 rounded-xl border px-2 text-[13px] font-bold transition-all duration-300',
                      settings.responseStyle === style
                        ? 'border-primary/50 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(var(--primary),0.3)] scale-105'
                        : 'border-border/40 bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary/60 active:scale-95'
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Brain size={14} strokeWidth={2.5} /> About You
              </span>
              <textarea
                value={settings.aboutUser}
                onChange={(e) => setSettings(current => ({ ...current, aboutUser: e.target.value }))}
                placeholder="Your work, goals, interests, preferred tools, current projects, learning style..."
                className={cn(
                  "w-full h-32 p-5 rounded-2xl resize-none bg-background border border-border/50",
                  "text-foreground text-[15px] leading-relaxed magical-scrollbar font-medium",
                  "focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] transition-all duration-300"
                )}
              />
            </label>
          </div>
        </div>

        {/* ── Advanced AI Engine ───────────────────────────────────── */}
        <div className="glass-surface-subtle border border-border/40 rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
          
          <h2 className="text-xl font-black tracking-tight mb-8 flex items-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl"><Cpu size={20} strokeWidth={2.5} /></div>
            AI Engine
          </h2>

          <div className="space-y-8">
            <div className="space-y-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Zap size={14} strokeWidth={2.5} /> Model Selection
              </span>
              <div className="space-y-3">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left group/model",
                      selectedModel === model.id
                        ? "bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                        : "bg-background border-border/40 hover:border-primary/30 hover:bg-secondary/30"
                    )}
                  >
                    <div>
                      <div className={cn("font-bold text-[15px] transition-colors", selectedModel === model.id ? "text-primary" : "text-foreground")}>{model.name}</div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">{model.desc}</div>
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", selectedModel === model.id ? "border-primary" : "border-muted-foreground/30")}>
                      {selectedModel === model.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <span className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-2"><SlidersHorizontal size={14} strokeWidth={2.5} /> Creativity Level</span>
                <span className="text-primary">{creativity}%</span>
              </span>
              <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/50 to-primary rounded-full transition-all duration-200" style={{ width: `${creativity}%` }} />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={creativity} 
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                <span>Deterministic</span>
                <span>Highly Creative</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Integrations & Memory ────────────────────────────────── */}
        <div className="glass-surface-subtle border border-border/40 rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/20 transition-all duration-700" />
          
          <h2 className="text-xl font-black tracking-tight mb-8 flex items-center gap-3">
            <div className="bg-rose-500/10 text-rose-500 p-2 rounded-xl"><Calendar size={20} strokeWidth={2.5} /></div>
            Integrations & Memory
          </h2>

          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setSettings(current => ({ ...current, memoryEnabled: !current.memoryEnabled }))}
              className={cn(
                'w-full flex items-center justify-between gap-4 rounded-2xl border p-5 text-left',
                'bg-background border-border/50 hover:border-primary/40 hover:bg-secondary/30 transition-all duration-300'
              )}
            >
              <div>
                <span className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                  <Brain size={18} className={settings.memoryEnabled ? "text-primary" : "text-muted-foreground"} strokeWidth={2.5} />
                  Long-Term Memory
                </span>
                <span className="block text-[13px] text-muted-foreground mt-1">
                  Use older conversation summaries to keep PAIVA personally aware.
                </span>
              </div>
              <div className={cn("w-12 h-6 rounded-full p-1 transition-colors duration-300 shrink-0", settings.memoryEnabled ? "bg-primary" : "bg-secondary/80")}>
                <div className={cn("w-4 h-4 bg-white rounded-full transition-transform duration-300", settings.memoryEnabled ? "translate-x-6" : "translate-x-0")} />
              </div>
            </button>

            {/* Google Calendar Section */}
            <div className={cn("flex flex-col sm:flex-row items-center sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300 gap-4", settings.calendarConnected ? "border-green-500/30 bg-green-500/5" : "bg-background border-border/50 hover:border-primary/40 hover:bg-secondary/30")}>
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className={cn("p-3 rounded-xl", settings.calendarConnected ? "bg-green-500/20 text-green-500" : "bg-rose-500/10 text-rose-500")}>
                  <Calendar size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-foreground">Google Calendar</h4>
                  <p className="text-[13px] text-muted-foreground mt-0.5">Let PAIVA read your schedule and appointments.</p>
                </div>
              </div>
              {settings.calendarConnected ? (
                <div className="flex items-center gap-2 text-sm font-bold text-green-500 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] shrink-0">
                  <Check size={16} strokeWidth={3} /> Connected
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => connectCalendar()}
                  className="px-6 py-3 bg-foreground text-background dark:bg-white dark:text-black text-[13px] font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 active:scale-95 shrink-0 shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                >
                  Connect Calendar
                </button>
              )}
            </div>

            <label className="block space-y-3 pt-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Custom Instructions
              </span>
              <textarea
                value={settings.customInstructions}
                onChange={(e) => setSettings(current => ({ ...current, customInstructions: e.target.value }))}
                placeholder="Always explain tradeoffs. Ask before making assumptions. Use examples from my stack..."
                className={cn(
                  "w-full h-32 p-5 rounded-2xl resize-none bg-background border border-border/50",
                  "text-foreground text-[15px] leading-relaxed magical-scrollbar font-medium",
                  "focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] transition-all duration-300"
                )}
              />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
