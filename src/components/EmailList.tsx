import React, { useEffect, useState, useCallback } from 'react';
import { type Email, getRecentEmails, createDraft, summarizeInbox, generateSmartReply } from '../services/gmailService';
import { Mail, RefreshCw, Edit3, Send, X, Sparkles, MessageSquare, ChevronRight, Inbox as InboxIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';
import { useGoogleLogin } from '@react-oauth/google';
import { cn } from '../lib/utils';

export default function EmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftTo, setDraftTo] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');

  const [provider, setProvider] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // New AI states
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingReply, setIsGeneratingReply] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await userService.getSettings();
      setProvider(settings.provider || 'LOCAL');
      
      if (settings.provider !== 'GOOGLE') {
        setLoading(false);
        return;
      }
      
      if (!settings.calendarConnected) {
        setIsConnected(false);
        setLoading(false);
        return;
      }
      
      setIsConnected(true);
      const data = await getRecentEmails(15);
      setEmails(data);
    } catch (err: any) {
      console.error("GMAIL FETCH ERR:", err);
      toast.error('Failed to load emails: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const googleLoginConnect = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const settings = await userService.getSettings();
        await userService.updateSettings({
          ...settings,
          googleAccessToken: tokenResponse.access_token
        });
        setIsConnected(true);
        toast.success("Gmail connected successfully!");
        fetchEmails();
      } catch (error) {
        toast.error("Failed to save connection.");
      }
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.modify',
    onError: () => toast.error('Google login failed'),
  });

  const handleCreateDraft = async () => {
    if (!draftTo.trim() || !draftSubject.trim() || !draftBody.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      await createDraft(draftTo, draftSubject, draftBody);
      setIsDrafting(false);
      setDraftTo('');
      setDraftSubject('');
      setDraftBody('');
      toast.success('Draft created in your Gmail!');
    } catch {
      toast.error('Failed to create draft');
    }
  };

  const startDraft = () => {
    setIsDrafting(true);
    setDraftTo('');
    setDraftSubject('');
    setDraftBody('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSummarizeInbox = async () => {
    if (emails.length === 0) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizeInbox(emails);
      setSummary(result);
    } catch (err: any) {
      toast.error('Failed to summarize inbox: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSmartReply = async (email: Email) => {
    setIsGeneratingReply(email.id);
    try {
      const replyText = await generateSmartReply(email.id, email.from, email.subject || '');
      
      // Open draft box and pre-fill
      setIsDrafting(true);
      // Try to extract email from "Name <email@domain.com>" or just use it as is
      const emailMatch = email.from.match(/<([^>]+)>/);
      setDraftTo(emailMatch ? emailMatch[1] : email.from);
      setDraftSubject((email.subject || '').startsWith('Re:') ? email.subject || '' : `Re: ${email.subject || 'No Subject'}`);
      setDraftBody(replyText);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Smart reply generated! Please review it.');
    } catch (err: any) {
      toast.error('Failed to generate reply: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingReply(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground animate-pulse">
        <Mail size={48} className="opacity-20 mb-4" />
        <p className="text-lg font-medium tracking-wide flex items-center gap-2">
          <RefreshCw className="animate-spin" size={18} /> Syncing Inbox...
        </p>
      </div>
    );
  }

  return (
    <div className="relative p-5 md:p-8 w-full flex flex-col h-full overflow-y-auto magical-scrollbar">
      
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 relative z-10">
        <div>
          <div className="inline-flex items-center justify-center p-3 bg-rose-500/10 text-rose-500 rounded-2xl mb-4 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
            <InboxIcon size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-2 flex items-center gap-3">
            Inbox
            <Sparkles size={24} className="text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">
            Your recent emails and drafts, supercharged by AI.
          </p>
        </div>
        
        <div className="flex gap-3">
          {provider === 'GOOGLE' && isConnected && (
            <>
              <button 
                onClick={fetchEmails} 
                className="flex items-center justify-center p-3.5 bg-secondary/50 text-foreground rounded-2xl hover:bg-secondary transition-all hover:rotate-180 duration-500" 
                title="Refresh Inbox"
              >
                <RefreshCw size={18} strokeWidth={2.5} />
              </button>
              
              {emails.length > 0 && (
                <button 
                  onClick={handleSummarizeInbox} 
                  disabled={isSummarizing}
                  className="flex items-center gap-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-6 py-3.5 rounded-2xl hover:bg-indigo-500/20 hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 font-bold tracking-wide shadow-[0_4px_15px_rgba(99,102,241,0.1)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.2)]"
                >
                  {isSummarizing ? <RefreshCw size={18} className="animate-spin" strokeWidth={2.5} /> : <Sparkles size={18} strokeWidth={2.5} />}
                  Summarize
                </button>
              )}

              <button 
                onClick={startDraft} 
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold tracking-wide",
                  "bg-foreground text-background shadow-[0_8px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_20px_rgba(255,255,255,0.05)]",
                  "hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 ease-out",
                  "hover:bg-primary hover:text-primary-foreground hover:shadow-[0_8px_30px_rgba(var(--primary),0.3)]"
                )}
              >
                <Edit3 size={18} strokeWidth={3} /> Compose
              </button>
            </>
          )}
        </div>
      </div>

      {provider !== 'GOOGLE' ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
          <div className="size-32 rounded-full bg-secondary/30 flex items-center justify-center mb-6 border border-border/50 shadow-inner">
            <Mail size={48} className="text-muted-foreground/30" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Google Sign-in Required</h2>
          <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
            This feature is exclusively available to users signed in via Google OAuth. Please log out and sign in with Google to access your Inbox.
          </p>
        </div>
      ) : !isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
          <div className="size-32 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.1)]">
            <Mail size={48} className="text-primary/80" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Connect Your Inbox</h2>
          <p className="text-muted-foreground max-w-md mb-8 leading-relaxed text-lg">
            You're signed in with Google, but PAIVA needs your permission to view and manage your emails to unlock AI superpowers.
          </p>
          <button 
            onClick={() => googleLoginConnect()}
            className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold tracking-wide hover:bg-primary/90 hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 shadow-[0_8px_30px_rgba(var(--primary),0.3)]"
          >
            Connect Gmail <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-4xl mx-auto space-y-6">
          
          {/* ── AI Summary Banner ─────────────────────────────────── */}
          {summary && (
            <div className="relative rounded-[2rem] p-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-in fade-in slide-in-from-top-8 duration-700 shadow-[0_10px_40px_rgba(168,85,247,0.2)] mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-30 pointer-events-none rounded-[2rem]" />
              <div className="bg-card/95 backdrop-blur-2xl rounded-[2rem] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none scale-150 -translate-y-8 translate-x-8">
                  <Sparkles size={120} />
                </div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 flex items-center gap-3">
                    <Sparkles size={24} className="text-indigo-400" strokeWidth={2.5} />
                    AI Inbox Digest
                  </h2>
                  <button 
                    onClick={() => setSummary(null)} 
                    className="p-2 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="text-foreground/90 leading-loose text-[15px] whitespace-pre-wrap relative z-10 font-medium">
                  {summary}
                </div>
              </div>
            </div>
          )}

          {/* ── Draft Composer ────────────────────────────────────── */}
          {isDrafting && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setIsDrafting(false)} />
              
              {/* Modal content */}
              <div className="relative w-full max-w-3xl glass-surface border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out flex flex-col max-h-[90vh]">
                
                <div className="flex justify-between items-center mb-8 shrink-0">
                  <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                    <div className="bg-primary/20 text-primary p-2 rounded-xl">
                      <Edit3 size={20} strokeWidth={3} />
                    </div>
                    Compose Draft
                  </h2>
                  <button 
                    onClick={() => setIsDrafting(false)} 
                    className="p-2.5 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200 hover:rotate-90"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="flex flex-col gap-4 flex-1 min-h-0">
                  <input
                    autoFocus
                    type="email"
                    placeholder="Recipient (To:)"
                    value={draftTo}
                    onChange={e => setDraftTo(e.target.value)}
                    className="w-full bg-transparent border-b border-border/50 px-2 py-3 text-lg font-bold tracking-wide text-foreground placeholder:text-muted-foreground/40 focus:border-primary outline-none transition-colors shrink-0"
                  />
                  <input
                    type="text"
                    placeholder="Subject"
                    value={draftSubject}
                    onChange={e => setDraftSubject(e.target.value)}
                    className="w-full bg-transparent border-b border-border/50 px-2 py-3 text-lg font-bold tracking-wide text-foreground placeholder:text-muted-foreground/40 focus:border-primary outline-none transition-colors shrink-0"
                  />
                  
                  <textarea
                    placeholder="Write your email here..."
                    value={draftBody}
                    onChange={e => setDraftBody(e.target.value)}
                    className="w-full flex-1 bg-secondary/10 border border-border/40 rounded-3xl p-6 mt-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-secondary/20 outline-none resize-none transition-all magical-scrollbar"
                  />
                </div>

                <div className="flex gap-4 justify-end mt-8 shrink-0">
                  <button 
                    onClick={() => setIsDrafting(false)} 
                    className="px-8 py-4 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleCreateDraft} 
                    className="flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-2xl text-sm font-bold shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:bg-primary hover:text-primary-foreground hover:shadow-[0_8px_30px_rgba(var(--primary),0.3)] hover:-translate-y-1 active:scale-95 transition-all duration-300"
                  >
                    <Send size={18} strokeWidth={2.5} /> Save to Gmail
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Email List ────────────────────────────────────────── */}
          <div className="space-y-4">
            {emails.map((email, idx) => (
              <div 
                key={email.id} 
                className="group relative animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="glass-surface-subtle border border-border/40 rounded-[2rem] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] relative overflow-hidden flex gap-5">
                  <div className="shrink-0 mt-1">
                    <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                      <Mail size={22} strokeWidth={2} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-0 md:pr-32">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1.5 gap-2">
                      <h3 className="font-extrabold text-lg text-foreground truncate tracking-tight">
                        {email.subject || '(No Subject)'}
                      </h3>
                      <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground shrink-0 sm:mt-1">
                        {email.date ? new Date(email.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-foreground/70 mb-3 truncate">
                      {email.from}
                    </div>
                    <p className="text-[14px] leading-relaxed text-muted-foreground line-clamp-2">
                      {email.snippet?.replace(/&#39;/g, "'").replace(/&quot;/g, '"')}
                    </p>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-card via-card/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-end pr-6 pointer-events-none group-hover:pointer-events-auto">
                    <button 
                      onClick={() => handleSmartReply(email)}
                      disabled={isGeneratingReply === email.id}
                      className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-4 py-2.5 rounded-xl hover:bg-indigo-500/20 hover:scale-105 active:scale-95 transition-all duration-300 text-[13px] font-bold shadow-[0_4px_15px_rgba(99,102,241,0.1)] disabled:opacity-50 disabled:hover:scale-100 whitespace-nowrap"
                    >
                      {isGeneratingReply === email.id ? <RefreshCw size={16} className="animate-spin" strokeWidth={2.5} /> : <MessageSquare size={16} strokeWidth={2.5} />}
                      Smart Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {emails.length === 0 && !isDrafting && (
              <div className="text-center py-20 text-muted-foreground glass-surface-subtle rounded-[2.5rem] border border-dashed border-border/40">
                <div className="size-24 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Mail size={36} className="text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-2">Inbox is empty</h3>
                <p className="text-sm">You have no recent emails.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
