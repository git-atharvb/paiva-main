import React, { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, Wind, Sparkles, Plus, Mail, ClipboardList, FileText, Check, X, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useChat } from '../context/ChatContext';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '../services/api';

interface HomeDashboardProps {
  user: { name?: string; email?: string } | null;
  onNavigate: (view: 'chat' | 'todos' | 'notes' | 'emails') => void;
}

interface WeatherData {
  temp: number;
  condition: string;
  isDay: boolean;
  city?: string;
}

interface ActionSuggestion {
  id: string;
  type: 'todo' | 'event';
  title: string;
  source: string;
}

export default function HomeDashboard({ user, onNavigate }: HomeDashboardProps) {
  const { setActiveConversationId } = useChat();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [suggestions, setSuggestions] = useState<ActionSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Greeting logic
  const hour = currentTime.getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  const firstName = user?.name?.split(' ')[0] || 'there';

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number, city?: string) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code`);
        const data = await res.json();
        
        let condition = 'Clear';
        const code = data.current.weather_code;
        if (code >= 1 && code <= 3) condition = 'Partly Cloudy';
        else if (code >= 45 && code <= 48) condition = 'Foggy';
        else if (code >= 51 && code <= 67) condition = 'Rainy';
        else if (code >= 71 && code <= 77) condition = 'Snowy';
        else if (code >= 95) condition = 'Stormy';

        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition,
          isDay: data.current.is_day === 1,
          city: city || 'Your Location'
        });
      } catch (e) {
        console.error("Failed to fetch weather", e);
      } finally {
        setWeatherLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
        () => fetchWeather(51.5074, -0.1278, 'London')
      );
    } else {
      fetchWeather(51.5074, -0.1278, 'London');
    }
  }, []);

  // Fetch Action Hub Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetchWithAuth('/api/action-hub/suggestions');
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const handleAcceptSuggestion = async (suggestion: ActionSuggestion) => {
    try {
      if (suggestion.type === 'todo') {
        const res = await fetchWithAuth('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: suggestion.title,
            description: `Source: ${suggestion.source}`,
            dueDate: new Date().toISOString()
          })
        });
        if (!res.ok) throw new Error('Failed to create todo');
        toast.success('Added to ToDo List!');
      }
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (err) {
      toast.error('Failed to accept suggestion');
    }
  };

  const WeatherIcon = () => {
    if (!weather) return null;
    if (weather.condition === 'Rainy' || weather.condition === 'Stormy') return <CloudRain size={56} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />;
    if (weather.condition.includes('Cloud') || weather.condition === 'Foggy') return <Cloud size={56} className="text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.5)]" />;
    if (weather.isDay) return <Sun size={56} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />;
    return <Sun size={56} className="text-indigo-200 drop-shadow-[0_0_15px_rgba(199,210,254,0.5)]" />; 
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto magical-scrollbar relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="mb-12 relative z-10 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-purple-400">{firstName}</span>.
          </h1>
          <p className="text-muted-foreground text-xl font-medium">Welcome to your workspace.</p>
        </div>
        
        {/* Minimalist Clock */}
        <div className="hidden md:flex items-center gap-3 bg-card/40 backdrop-blur-md border border-border/40 px-5 py-3 rounded-2xl shadow-sm">
          <Clock className="text-primary" size={20} />
          <div className="text-xl font-semibold tracking-wider text-foreground/90">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 relative z-10">
        
        {/* Weather Widget */}
        <div className="col-span-1 bg-gradient-to-br from-card/80 to-card/30 backdrop-blur-2xl border border-border/50 rounded-[2rem] p-8 relative overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.15)] flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
          
          {weatherLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-secondary/50 rounded w-1/2"></div>
              <div className="h-16 bg-secondary/50 rounded w-3/4"></div>
            </div>
          ) : weather ? (
            <>
              <div>
                <p className="text-muted-foreground font-medium mb-2 uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {weather.city}
                </p>
                <div className="flex items-start gap-1">
                  <h2 className="text-6xl font-bold text-foreground tracking-tighter">{weather.temp}°</h2>
                </div>
              </div>
              <div className="flex items-end justify-between mt-8">
                <span className="text-xl font-medium text-foreground/80">{weather.condition}</span>
                <div className="group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out">
                  <WeatherIcon />
                </div>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Weather unavailable</div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => { setActiveConversationId(null); onNavigate('chat'); }}
            className="bg-card/40 hover:bg-primary/5 border border-border/40 hover:border-primary/30 rounded-[2rem] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-neon-sm flex flex-col justify-between group"
          >
            <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Plus size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-xl mb-1">New Chat</h3>
              <p className="text-muted-foreground text-sm font-medium">Start a conversation</p>
            </div>
          </button>
          
          <button 
            onClick={() => onNavigate('emails')}
            className="bg-card/40 hover:bg-indigo-500/5 border border-border/40 hover:border-indigo-500/30 rounded-[2rem] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] flex flex-col justify-between group"
          >
            <div className="bg-indigo-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <Mail size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-xl mb-1">Inbox</h3>
              <p className="text-muted-foreground text-sm font-medium">Check your emails</p>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('notes')}
            className="bg-card/40 hover:bg-emerald-500/5 border border-border/40 hover:border-emerald-500/30 rounded-[2rem] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] flex flex-col justify-between group"
          >
            <div className="bg-emerald-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <FileText size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-xl mb-1">Notes</h3>
              <p className="text-muted-foreground text-sm font-medium">View smart notes</p>
            </div>
          </button>
        </div>
      </div>

      {/* Action Hub */}
      <div className="relative z-10 bg-card/30 backdrop-blur-md border border-border/40 rounded-[2.5rem] p-8 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2.5 rounded-xl">
              <Sparkles className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Action Hub</h2>
              <p className="text-muted-foreground text-sm">AI-extracted tasks from your workspace</p>
            </div>
          </div>
          
          {suggestionsLoading && (
            <div className="flex items-center gap-2 text-primary text-sm font-medium bg-primary/10 px-4 py-2 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Scanning...
            </div>
          )}
        </div>

        {suggestionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-card/40 border border-border/20 rounded-3xl p-6 h-32 animate-pulse" />
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 hover:border-primary/50 hover:shadow-neon-sm transition-all duration-300 flex flex-col justify-between group">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                      {suggestion.type}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground truncate flex items-center gap-1">
                      via {suggestion.source}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-lg leading-snug group-hover:text-primary transition-colors">{suggestion.title}</h3>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAcceptSuggestion(suggestion)}
                    className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-md transition-all active:scale-95"
                  >
                    <Check size={18} strokeWidth={2.5} /> Accept
                  </button>
                  <button 
                    onClick={() => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                    className="w-12 bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-destructive rounded-xl flex items-center justify-center transition-all active:scale-95"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-background/40 border border-border/40 border-dashed rounded-[2rem] p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6 text-muted-foreground">
              <ClipboardList size={36} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">You're all caught up!</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              PAIVA hasn't found any new actionable tasks in your recent emails or chats. Great job staying on top of things!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
