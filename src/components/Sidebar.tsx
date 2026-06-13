import React, { useState } from 'react';
import { ClipboardList, MessageSquare, Settings, Plus, Trash, Pencil, Check, X as XIcon, SplitSquareHorizontal, FileText, Home } from 'lucide-react';
import paivaLogo from '../assets/paiva_logo.png';
import { cn } from '../lib/utils';
import { useChat } from '../context/ChatContext';
import { chatService } from '../services/chatService';

type WorkspaceView = 'home' | 'chat' | 'todos' | 'notes' | 'emails' | 'calculator' | 'settings' | 'about';

interface SidebarProps {
  activeView: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { 
    conversations, 
    activeConversationId, setActiveConversationId, 
    secondaryConversationId, setSecondaryConversationId,
    refreshConversations 
  } = useChat();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      await chatService.deleteConversation(id);
      if (activeConversationId === id) setActiveConversationId(null);
      if (secondaryConversationId === id) setSecondaryConversationId(null);
      await refreshConversations();
    }
  };

  const startRename = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameValue(title);
  };

  const submitRename = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (renamingId && renameValue.trim()) {
      await chatService.renameConversation(renamingId, renameValue.trim());
      setRenamingId(null);
      await refreshConversations();
    }
  };

  return (
    <aside className="w-full h-full flex flex-col p-5 text-foreground relative z-20">

      {/* ── Ambient Background Glows ──────────────────────────────── */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* ── Logo / Brand ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 mb-8 px-2 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="relative size-12 shrink-0 group cursor-default">
            {/* Glow halo behind logo */}
            <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none animate-pulse-glow" />
            <div className="absolute inset-0 border border-primary/20 rounded-2xl group-hover:border-primary/50 transition-colors duration-500" />
            <img
              src={paivaLogo}
              alt="Paiva Logo"
              className="w-full h-full object-contain rounded-2xl drop-shadow-lg relative z-10 transition-all duration-500 ease-spring group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]"
            />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60 block drop-shadow-sm">
              PAIVA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">Workspace</span>
          </div>
        </div>

        {/* ── New Chat button ───────────────────────────────────────── */}
        <button
          onClick={() => {
            onViewChange('chat');
            setActiveConversationId(null);
          }}
          className={cn(
            'mb-8 w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl relative overflow-hidden group',
            'bg-card/40 border border-border/40 backdrop-blur-md',
            'text-foreground text-sm font-bold tracking-wide',
            'transition-all duration-300 hover:border-primary/50 hover:shadow-neon-sm',
            'hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]',
            'animate-in fade-in slide-in-from-left-4 duration-500 delay-75',
          )}
        >
          {/* Button Hover Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="bg-primary/20 text-primary p-1.5 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 z-10">
            <Plus size={16} strokeWidth={3} className="shrink-0 transition-transform duration-300 group-hover:rotate-180" />
          </div>
          <span className="z-10">New Chat</span>
        </button>

        {/* ── Scrollable Area: Core Apps & Recent Chats ──────────────── */}
        <div className="flex-1 flex flex-col min-h-0 gap-6">
          
          {/* Core Apps Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-3 px-3 animate-in fade-in duration-500 delay-100 shrink-0">
              Core Apps
            </div>
            <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 -mr-2 magical-scrollbar">
              {[
                { id: 'home' as const, label: 'Home', icon: Home, color: 'text-sky-500', bgHover: 'hover:bg-sky-500/10 hover:border-sky-500/30' },
                { id: 'chat' as const, label: 'Chat', icon: MessageSquare, color: 'text-indigo-500', bgHover: 'hover:bg-indigo-500/10 hover:border-indigo-500/30' },
                { id: 'todos' as const, label: 'Tasks', icon: ClipboardList, color: 'text-emerald-500', bgHover: 'hover:bg-emerald-500/10 hover:border-emerald-500/30' },
                { id: 'notes' as const, label: 'Notes', icon: FileText, color: 'text-amber-500', bgHover: 'hover:bg-amber-500/10 hover:border-amber-500/30' },
                { id: 'emails' as const, label: 'Inbox', icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>, color: 'text-rose-500', bgHover: 'hover:bg-rose-500/10 hover:border-rose-500/30' },
                { id: 'calculator' as const, label: 'Calculator', icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>, color: 'text-purple-500', bgHover: 'hover:bg-purple-500/10 hover:border-purple-500/30' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      'w-full group relative px-4 py-3 rounded-[1.25rem]',
                      'flex items-center gap-3.5 text-[14px] font-bold tracking-wide',
                      'transition-all duration-300 ease-out',
                      'hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0',
                      isActive
                        ? `bg-primary/10 text-primary border border-primary/30 shadow-[0_4px_12px_rgba(var(--primary),0.1)]`
                        : `text-muted-foreground bg-transparent border border-transparent ${item.bgHover} hover:text-foreground`
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-primary rounded-r-full shadow-[0_0_8px_var(--color-primary)]" />
                    )}
                    <div className={cn("p-1.5 rounded-xl transition-all duration-300", isActive ? "bg-primary text-primary-foreground shadow-neon-sm" : `bg-secondary/50 group-hover:bg-background ${item.color}`)}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Recent Chats Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-3 px-3 animate-in fade-in duration-500 delay-100 flex items-center justify-between shrink-0">
              <span>Recent Chats</span>
              <div className="h-px flex-1 bg-border/40 ml-3" />
            </div>

        {/* ── Conversation list ─────────────────────── */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 -mr-2 magical-scrollbar">
          {conversations.map((c, i) => {
            const isActive = activeConversationId === c.id || secondaryConversationId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setActiveConversationId(c.id);
                  onViewChange('chat');
                }}
                className={cn(
                  'group relative px-4 py-2.5 rounded-2xl cursor-pointer',
                  'flex items-center gap-3',
                  'text-sm font-semibold tracking-wide',
                  'transition-all duration-300',
                  'hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-sm',
                  'active:scale-[0.98] active:transition-none',
                  'animate-in fade-in slide-in-from-left-4',
                  isActive
                    ? 'bg-card border border-primary/30 text-primary shadow-[0_2px_10px_rgba(var(--primary),0.05)]'
                    : 'text-muted-foreground hover:bg-card/50 hover:text-foreground border border-transparent hover:border-border/50',
                )}
                style={{ animationDelay: `${(i + 2) * 60}ms`, animationFillMode: 'both' }}
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0 transition-all duration-300", isActive ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-border group-hover:bg-foreground/30")} />
                
                {renamingId === c.id ? (
                  <form onSubmit={submitRename} className="flex-1 flex items-center gap-1.5 z-10 bg-background/90 p-1 -m-1 rounded-lg backdrop-blur-md">
                    <input 
                      autoFocus
                      className="flex-1 bg-transparent text-foreground text-sm font-bold px-1 outline-none w-full"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button type="submit" className="p-1.5 text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"><Check size={14} strokeWidth={3} /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setRenamingId(null); }} className="p-1.5 text-destructive bg-destructive/10 rounded-md hover:bg-destructive/20 transition-colors"><XIcon size={14} strokeWidth={3} /></button>
                  </form>
                ) : (
                  <>
                    <span className={cn("truncate flex-1 transition-colors", isActive ? "text-primary" : "")}>{c.title}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSecondaryConversationId(c.id); }} 
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Split View"
                      >
                        <SplitSquareHorizontal size={14} />
                      </button>
                      <button onClick={(e) => startRename(e, c.id, c.title)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={(e) => handleDelete(e, c.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>
        </div>
      </div>

        {/* ── Settings panel ────────────────────────────────────────── */}
        <div className="mt-6 pt-6 border-t border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <button
            onClick={() => onViewChange('settings')}
            className={cn(
              'w-full flex items-center justify-between p-3.5 rounded-2xl group',
              'transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-95',
              activeView === 'settings' 
                ? 'bg-primary/10 border border-primary/30 shadow-[0_4px_12px_rgba(var(--primary),0.1)] text-primary' 
                : 'bg-card/40 border border-border/50 backdrop-blur-md hover:bg-card hover:border-primary/40 hover:shadow-neon-sm'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl transition-colors duration-300", activeView === 'settings' ? "bg-primary text-primary-foreground shadow-neon-sm" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground")}>
                <Settings size={18} className={cn("transition-transform duration-500", activeView === 'settings' ? "rotate-90" : "group-hover:rotate-90")} />
              </div>
              <div className="text-left">
                <div className={cn("text-sm font-bold transition-colors", activeView === 'settings' ? "text-primary" : "text-foreground group-hover:text-primary")}>Settings</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Preferences</div>
              </div>
            </div>
            {activeView === 'settings' && (
              <div className="w-1.5 h-6 bg-primary rounded-l-full shadow-[0_0_8px_var(--color-primary)] mr-[-14px]" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
