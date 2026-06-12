import React, { useEffect, useState, useCallback } from 'react';
import { type Email, getRecentEmails, createDraft, summarizeInbox, generateSmartReply } from '../services/gmailService';
import { Mail, RefreshCw, Edit3, Send, X, Sparkles, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';
import { useGoogleLogin } from '@react-oauth/google';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  if (loading) return <div className="p-8 text-center text-muted-foreground flex justify-center items-center h-full"><RefreshCw className="animate-spin mr-2" size={20} /> Loading emails...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full flex flex-col h-full overflow-y-auto magical-scrollbar relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Inbox <Sparkles className="text-primary opacity-70" size={20} />
          </h1>
          <p className="text-muted-foreground text-sm">Your recent emails and drafts powered by AI.</p>
        </div>
        <div className="flex gap-2">
          {provider === 'GOOGLE' && isConnected && (
            <>
              <button onClick={fetchEmails} className="flex items-center gap-2 bg-secondary/50 text-foreground px-4 py-2 rounded-xl hover:bg-secondary transition-colors" title="Refresh">
                <RefreshCw size={16} />
              </button>
              
              {emails.length > 0 && (
                <button 
                  onClick={handleSummarizeInbox} 
                  disabled={isSummarizing}
                  className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                >
                  {isSummarizing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Summarize
                </button>
              )}

              {!isDrafting && (
                <button onClick={startDraft} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-neon-sm">
                  <Edit3 size={16} /> Compose
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {provider !== 'GOOGLE' ? (
        <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border/40">
          <p className="mb-4 text-foreground/80 font-medium text-lg">This feature is only accessible to users with Google OAuth sign in.</p>
          <p className="text-sm">Please log out and try signing in using your Google account to access your Inbox.</p>
        </div>
      ) : !isConnected ? (
        <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border/40">
          <p className="mb-4 text-foreground/80 font-medium text-lg">Your Inbox is almost ready!</p>
          <p className="text-sm mb-6">You signed in with Google, but PAIVA needs your permission to view and manage your emails.</p>
          <button 
            onClick={() => googleLoginConnect()}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-neon-sm hover:shadow-neon transition-all"
          >
            Connect Gmail Account
          </button>
        </div>
      ) : (
        <>
          {/* AI Summary Banner */}
          {summary && (
            <div className="mb-8 relative rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50">
              <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles size={64} />
                </div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-400" />
                    AI Inbox Digest
                  </h2>
                  <button onClick={() => setSummary(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                </div>
                <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap relative z-10 text-sm">
                  {summary}
                </div>
              </div>
            </div>
          )}

          {/* Draft Composer */}
          {isDrafting && (
            <div className="bg-card border border-border/40 rounded-2xl p-6 mb-8 shadow-neon-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Edit3 size={18} className="text-primary" />
                  New Draft
                </h2>
                <button onClick={() => setIsDrafting(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <input
                autoFocus
                type="email"
                placeholder="To"
                value={draftTo}
                onChange={e => setDraftTo(e.target.value)}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 mb-3 text-foreground focus:border-primary outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="Subject"
                value={draftSubject}
                onChange={e => setDraftSubject(e.target.value)}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 mb-3 text-foreground focus:border-primary outline-none transition-colors"
              />
              <textarea
                placeholder="Email Body"
                value={draftBody}
                onChange={e => setDraftBody(e.target.value)}
                rows={8}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 mb-4 text-foreground focus:border-primary outline-none resize-none transition-colors"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsDrafting(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button onClick={handleCreateDraft} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-neon-sm">
                  <Send size={16} /> Save to Gmail
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {emails.map(email => (
              <div key={email.id} className="bg-card/60 border border-border/40 rounded-2xl p-5 hover:border-primary/30 transition-all group flex gap-4 relative overflow-hidden">
                <div className="shrink-0 mt-1 text-primary">
                  <Mail size={20} />
                </div>
                <div className="flex-1 min-w-0 pr-24">
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <h3 className="font-semibold text-foreground truncate">{email.subject || '(No Subject)'}</h3>
                    <span className="text-xs text-muted-foreground shrink-0">{email.date ? new Date(email.date).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="text-sm font-medium text-foreground/80 mb-2 truncate">
                    {email.from}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {email.snippet?.replace(/&#39;/g, "'").replace(/&quot;/g, '"')}
                  </p>
                </div>

                {/* Hover Actions */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-card/90 via-card/90 to-transparent pl-8 py-2 flex gap-2">
                  <button 
                    onClick={() => handleSmartReply(email)}
                    disabled={isGeneratingReply === email.id}
                    className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors text-sm whitespace-nowrap"
                  >
                    {isGeneratingReply === email.id ? <RefreshCw size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                    Smart Reply
                  </button>
                </div>
              </div>
            ))}
            {emails.length === 0 && !isDrafting && (
              <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border/40">
                No emails found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
