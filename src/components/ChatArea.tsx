import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { Send, Sparkles, Square, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; 
import { chatService } from '../services/chatService';
import { useChat } from '../context/ChatContext';
import WikipediaImage from './WikipediaImage';

const extractText = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node) && node.props) {
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return '';
};

export default function ChatArea() {
  const { 
    messages, setMessages, 
    activeConversationId, setConversationIdWithoutFetch,
    refreshConversations 
  } = useChat();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextImageEnabled, setContextImageEnabled] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message immediately
    const tempUserId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempUserId, role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Prepare assistant message placeholder
    const tempAsstId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: tempAsstId, role: 'assistant', content: '' }]);

    const controller = new AbortController();
    setAbortController(controller);

    await chatService.streamMessage(
      activeConversationId,
      userMessage,
      contextImageEnabled,
      (data) => {
        if (data.conversationId) {
          setConversationIdWithoutFetch(data.conversationId);
          // Refresh sidebar so new chat appears
          refreshConversations();
        }
        if (data.c) {
          setMessages(prev => prev.map(msg => 
            msg.id === tempAsstId 
              ? { ...msg, content: msg.content + data.c }
              : msg
          ));
        }
      },
      () => {
        setIsTyping(false);
        setAbortController(null);
        refreshConversations(); // Final refresh just in case
      },
      (err) => {
        if (err.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          console.error('Stream error:', err);
        }
        setIsTyping(false);
        setAbortController(null);
      },
      controller.signal
    );
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsTyping(false);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-7 gap-5">

      {/* ── Chat header strip ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <div className={cn(
          'size-7 rounded-full flex items-center justify-center',
          'bg-primary/15 dark:bg-primary/25',
          'animate-pulse-glow',
        )}>
          <Sparkles size={14} strokeWidth={2} className="text-primary" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground tracking-snug">
          PAIVA Assistant
        </span>
        {/* Status dot */}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span className="size-2 rounded-full bg-emerald-400 dark:bg-emerald-300 shadow-[0_0_6px_oklch(0.80_0.17_160/0.8)] animate-pulse" />
          Online
        </span>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
        {messages.map((msg, index) => {
          const assistantIndex = messages.slice(0, index).filter(m => m.role === 'assistant').length;
          const isImageOnRight = assistantIndex % 2 === 1;

          return (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 group',
                msg.role === 'user' ? 'items-end' : 'items-start',
              )}
            >
            {(() => {
              const content = msg.content || '';
              const imageRegex = /!\[([^\]]*)\]\(wiki:([^)]+)\)/g;
              const matches = [...content.matchAll(imageRegex)];
              // If the message contains wiki image tags, it was generated with context mode ON.
              // We render the 2-column layout regardless of the current global checkbox state!
              const isContextMode = matches.length > 0;

              return (
                <>
                <div
                  className={cn(
                    'px-5 py-3.5 rounded-2xl text-sm leading-body tracking-snug transition-all duration-300',
                    msg.role === 'assistant'
                      ? [
                          'bg-card/70 dark:bg-card/80 backdrop-blur-sm',
                          'border border-border/50 dark:border-border/40',
                          'text-foreground rounded-bl-sm',
                          'shadow-1',
                          isContextMode ? 'max-w-full md:max-w-[95%] w-full' : 'max-w-[82%] prose prose-sm dark:prose-invert max-w-none'
                        ].join(' ')
                      : [
                          'max-w-[82%]',
                          'bg-linear-to-br from-primary to-[oklch(0.62_0.22_250)]',
                          'dark:from-primary dark:to-[oklch(0.58_0.22_250)]',
                          'text-primary-foreground rounded-br-sm',
                          'shadow-neon-sm',
                        ].join(' '),
                  )}
                >
                  {msg.role === 'assistant' ? (
                    (() => {
                      const renderMarkdown = (text: string) => (
                        <ReactMarkdown 
                          urlTransform={(value: string) => {
                            if (value.startsWith('wiki:')) return value;
                            return defaultUrlTransform(value);
                          }}
                          remarkPlugins={[remarkGfm]} 
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            img({ src, alt }) {
                              if (src?.startsWith('wiki:')) {
                                const searchTerm = src.replace('wiki:', '');
                                return <WikipediaImage searchTerm={searchTerm} alt={alt} />;
                              }
                              return <img src={src} alt={alt} className="rounded-xl max-w-full h-auto" />;
                            },
                            code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
                              const match = /language-(\w+)/.exec(className || '')
                              const language = match ? match[1] : 'text';
                              const codeText = extractText(children);
                              
                              return !inline && match ? (
                                <div className="relative my-4 rounded-xl overflow-hidden border border-border/50 bg-[#0d1117] shadow-xl">
                                  <div className="flex items-center justify-between px-4 py-2 bg-card/90 text-xs text-muted-foreground border-b border-border/50">
                                    <span className="font-mono">{language}</span>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(codeText)}
                                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                                    >
                                      <Copy size={12} /> Copy
                                    </button>
                                  </div>
                                  <div className="p-4 overflow-x-auto text-sm">
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </div>
                                </div>
                              ) : (
                                <code className={cn("bg-secondary/40 rounded px-1.5 py-0.5 text-[0.9em]", className)} {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {text || '...'}
                        </ReactMarkdown>
                      );

                      if (isContextMode) {
                        const cleanText = content.replace(imageRegex, '').trim();
                        return (
                          <div className="flex flex-col xl:flex-row gap-6 w-full items-start relative">
                            <div className={cn("w-full xl:w-1/2 shrink-0 flex flex-col gap-4 sticky top-4", isImageOnRight ? "xl:order-2" : "xl:order-1")}>
                              {matches.map((match, idx) => (
                                <WikipediaImage key={idx} searchTerm={match[2]} alt={match[1]} className="w-full max-w-full my-0 h-[350px] xl:h-[450px]" />
                              ))}
                            </div>
                            <div className={cn("w-full xl:w-1/2 min-w-0 prose prose-sm dark:prose-invert max-w-none", isImageOnRight ? "xl:order-1" : "xl:order-2")}>
                              {renderMarkdown(cleanText)}
                            </div>
                          </div>
                        );
                      }

                      return renderMarkdown(content);
                    })()
                  ) : (
                    msg.content
                  )}
                </div>

                {msg.role === 'assistant' && (
              <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                <button
                  onClick={() => copyMessage(msg.id, msg.content)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                  title="Copy message"
                >
                  {copiedId === msg.id ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
              </div>
            )}
                </>
              )
            })()}
          </div>
        )})}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ─────────────────────────────────────────────────── */}
      <form
        className="flex flex-col sm:flex-row gap-3 shrink-0"
        onSubmit={handleSend}
      >
        <div className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message PAIVA…"
            disabled={isTyping}
            className={cn(
              'w-full px-5 py-4 rounded-2xl',
              'bg-secondary/40 dark:bg-secondary/55',
              'border-2 border-transparent',
              'text-foreground text-sm font-medium tracking-snug',
              'placeholder:text-muted-foreground/60',
              'outline-none',
              'transition-all duration-200 ease-smooth',
              'focus:border-primary/60 focus:bg-card/60 dark:focus:bg-card/50',
              'focus:shadow-[0_0_0_4px_oklch(from_var(--color-ring)_l_c_h/0.15)]',
              'shadow-inner',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            <label 
              title="Context Image" 
              className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group px-2 py-1.5 rounded-lg hover:bg-secondary/80"
            >
              <input
                type="checkbox"
                checked={contextImageEnabled}
                onChange={(e) => setContextImageEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm border-muted-foreground/30 text-primary focus:ring-primary/40 cursor-pointer"
              />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-popover text-popover-foreground px-2 py-1 rounded text-[11px] shadow-sm border border-border/50 pointer-events-none">
                Context Image
              </span>
            </label>
          </div>
        </div>
        {isTyping ? (
          <Button
            type="button"
            onClick={handleStop}
            variant="primary"
            size="icon"
            className={cn(
              'rounded-2xl size-14 shrink-0',
              'shadow-neon-sm hover:shadow-neon',
              'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
            )}
            aria-label="Stop generation"
          >
            <Square size={18} strokeWidth={2} className="fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="icon"
            disabled={!input.trim()}
            className={cn(
              'rounded-2xl size-14 shrink-0',
              'shadow-neon-sm hover:shadow-neon',
            )}
            aria-label="Send message"
          >
            <Send size={18} strokeWidth={2} />
          </Button>
        )}
      </form>
    </div>
  );
}