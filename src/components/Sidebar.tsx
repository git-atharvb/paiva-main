import { MessageSquare, Settings } from 'lucide-react';
import paivaLogo from '../assets/paiva_logo.png';

const conversations = [
  { id: '1', title: 'Plan UI Redesign' },
  { id: '2', title: 'Implement Tailwind v4' },
  { id: '3', title: 'Fix API Endpoints' },
];

export default function Sidebar() {
  return (
    <aside className="w-full h-full flex flex-col p-6 text-foreground bg-transparent">
      <div className="flex items-center gap-4 mb-10 px-2 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="relative size-12 shrink-0 group cursor-default">
          <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <img 
            src={paivaLogo} 
            alt="Paiva Logo" 
            className="w-full h-full object-contain rounded-xl drop-shadow-lg relative z-10 transition-transform duration-700 group-hover:scale-110 outline-none border-none ring-0" 
          />
        </div>
        <span className="font-bold text-xl tracking-tight">Workspace</span>
      </div>
      
      <div className="font-extrabold mb-4 text-muted-foreground text-xs uppercase tracking-widest px-2">
        Conversations
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        {conversations.map((c, i) => (
          <div 
            key={c.id} 
            className="px-4 py-3 rounded-xl cursor-pointer text-foreground font-medium text-sm transition-all duration-300 hover:bg-secondary/60 hover:text-primary flex items-center gap-3 animate-in fade-in slide-in-from-left-4"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
          >
            <MessageSquare size={16} className="shrink-0" />
            <span className="truncate">{c.title}</span>
          </div>
        ))}
      </nav>
      
      <div className="mt-auto pt-6">
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Settings size={16} />
            Settings
          </div>
          <div className="text-xs text-muted-foreground mb-4">Manage your workspace preferences.</div>
          <button className="w-full py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:shadow-neon transition-all duration-300">
            Open Settings
          </button>
        </div>
      </div>
    </aside>
  );
}