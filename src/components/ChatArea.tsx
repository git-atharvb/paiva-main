import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { Send, Sparkles, Square, Copy, CheckCircle2, Paperclip, X, Image as ImageIcon, Link as LinkIcon, Mic, MicOff, Volume2, VolumeX, MonitorPlay, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; 
import { chatService } from '../services/chatService';
import { useChat } from '../context/ChatContext';
import WikipediaImage from './WikipediaImage';
import { fetchWithAuth } from '../services/api';

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
  const [contextImageEnabled, setContextImageEnabled] = useState(false);
  const [aiModel, setAiModel] = useState('');
  const [attachedDocumentText, setAttachedDocumentText] = useState<string | null>(null);
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const youtubeInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stopTTS = () => {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  };

  const playTTS = (id: string, text: string) => {
    if (speakingId === id) {
      stopTTS();
      return;
    }
    
    stopTTS(); // Stop any currently playing audio

    // Strip markdown formatting for cleaner reading
    const cleanText = text
      .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
      .replace(/```[\s\S]*?```/g, 'Code block omitted for reading.') // replace code blocks
      .replace(/[`*#_~>]/g, '') // remove markdown symbols
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Fetch user location in the background
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.city && data.region && data.country_name) {
          setUserLocation(`${data.city}, ${data.region}, ${data.country_name}`);
        }
      })
      .catch(err => console.error('Failed to fetch location:', err));

    // Initialize Web Speech API
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev.trim() ? ' ' : '') + transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const downloadChat = () => {
    if (!messages || messages.length === 0) return;
    
    let mdContent = `# PAIVA Conversation Export\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
    
    messages.forEach(msg => {
      const role = msg.role === 'user' ? '👤 **You**' : '🤖 **PAIVA**';
      mdContent += `${role}:\n${msg.content}\n\n`;
    });
    
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PAIVA_Chat_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition. Try using Chrome or Edge.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert("File size exceeds 10MB limit");
        return;
    }
    
    setIsUploading(true);
    
    // If it's an image, read it as Base64 for the Vision model
    if (file.type.startsWith('image/') || file.name.match(/\.(svg|cdr|cdt)$/i)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImageBase64(event.target?.result as string);
        setAttachedFileName(file.name);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (imageInputRef.current) imageInputRef.current.value = '';
      };
      reader.onerror = () => {
        alert("Failed to read image");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Otherwise, use backend Document extraction
    const formData = new FormData();
    formData.append("file", file);
    
    try {
        const response = await fetchWithAuth('/api/documents/extract', {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) throw new Error("Failed to extract text");
        
        const data = await response.json();
        setAttachedDocumentText(data.text);
        setAttachedFileName(file.name);
    } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to extract text from document");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

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
    const currentAttachment = attachedDocumentText;
    const currentImage = attachedImageBase64;
    const currentUrl = attachedUrl;
    setAttachedDocumentText(null);
    setAttachedImageBase64(null);
    setAttachedFileName(null);
    setAttachedUrl(null);
    
    const finalMessage = currentUrl ? `${userMessage}\n\n[Reference URL: ${currentUrl}]` : userMessage;
    
    // Add user message immediately
    const tempUserId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempUserId, role: 'user', content: finalMessage }]);
    setIsTyping(true);

    // Prepare assistant message placeholder
    const tempAsstId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: tempAsstId, role: 'assistant', content: '' }]);

    const controller = new AbortController();
    setAbortController(controller);

    await chatService.streamMessage(
      activeConversationId,
      finalMessage,
      contextImageEnabled,
      aiModel,
      currentAttachment || undefined,
      currentImage || undefined,
      userLocation || undefined,
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

        {/* Model Switcher */}
        <div className="ml-auto flex items-center gap-2">
          <button 
            type="button"
            onClick={downloadChat}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded flex items-center gap-1.5 text-xs border border-transparent hover:border-border/50 hover:bg-secondary/40"
            title="Download Chat as Markdown"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <select 
            value={aiModel} 
            onChange={(e) => setAiModel(e.target.value)}
            className="ml-4 bg-secondary/40 border border-border/50 text-xs text-muted-foreground rounded-md px-2 py-1 outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="">Auto (Default)</option>
            <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Smartest)</option>
            <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fastest)</option>
            <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 70B (Reasoning)</option>
            <option value="mixtral-8x7b-32768">Mixtral 8x7B (Balanced)</option>
            <option value="gemma2-9b-it">Google Gemma 2 9B</option>
            <option value="qwen-2.5-32b">Qwen 2.5 32B</option>
            <option value="qwen-2.5-coder-32b">Qwen 2.5 Coder 32B</option>
          </select>

          {/* Status dot */}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="size-2 rounded-full bg-emerald-400 dark:bg-emerald-300 shadow-[0_0_6px_oklch(0.80_0.17_160/0.8)] animate-pulse" />
            Online
          </span>
        </div>
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
                          isContextMode ? 'max-w-full md:max-w-[95%] w-full' : 'max-w-[82%] prose prose-sm dark:prose-invert'
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
                                return <WikipediaImage matches={[{ term: searchTerm, alt: alt || '' }]} />;
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
                              <WikipediaImage matches={matches.map(m => ({ alt: m[1], term: m[2] }))} className="w-full max-w-full my-0 h-[350px] xl:h-[450px]" />
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
                <button
                  onClick={() => playTTS(msg.id, msg.content)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    speakingId === msg.id 
                      ? "text-primary bg-primary/10 hover:bg-primary/20" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                  title={speakingId === msg.id ? "Stop reading" : "Read aloud"}
                >
                  {speakingId === msg.id ? <VolumeX size={15} /> : <Volume2 size={15} />}
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
          <div className="absolute -top-10 left-0 flex items-center gap-2">
            {attachedFileName && (
              <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                {attachedImageBase64 ? <ImageIcon size={12} /> : <Paperclip size={12} />}
                {attachedFileName}
                <button type="button" onClick={() => { setAttachedDocumentText(null); setAttachedImageBase64(null); setAttachedFileName(null); }} className="hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            )}
            {attachedUrl && (
              <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                {attachedUrl.includes('youtube.com') || attachedUrl.includes('youtu.be') ? <MonitorPlay size={12} /> : <LinkIcon size={12} />}
                {attachedUrl.length > 30 ? attachedUrl.substring(0, 30) + '...' : attachedUrl}
                <button type="button" onClick={() => setAttachedUrl(null)} className="hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          
          {showUrlInput && (
            <div className="absolute -top-16 left-0 bg-background border border-border/50 p-2 rounded-lg shadow-lg flex gap-2 animate-in fade-in slide-in-from-bottom-2 z-10 w-80">
              <input 
                ref={urlInputRef}
                type="url" 
                placeholder="https://..." 
                className="flex-1 bg-secondary/50 border-none rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && urlInputRef.current?.value) {
                    setAttachedUrl(urlInputRef.current.value);
                    setShowUrlInput(false);
                  }
                }}
                autoFocus
              />
              <Button size="sm" onClick={() => {
                if (urlInputRef.current?.value) {
                  setAttachedUrl(urlInputRef.current.value);
                  setShowUrlInput(false);
                }
              }}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowUrlInput(false)}>Cancel</Button>
            </div>
          )}

          {showYoutubeInput && (
            <div className="absolute -top-16 left-0 bg-background border border-[#ff0000]/50 p-2 rounded-lg shadow-lg flex gap-2 animate-in fade-in slide-in-from-bottom-2 z-10 w-80">
              <input 
                ref={youtubeInputRef}
                type="url" 
                placeholder="Paste YouTube Link..." 
                className="flex-1 bg-secondary/50 border-none rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff0000]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && youtubeInputRef.current?.value) {
                    setAttachedUrl(youtubeInputRef.current.value);
                    setShowYoutubeInput(false);
                  }
                }}
                autoFocus
              />
              <Button size="sm" onClick={() => {
                if (youtubeInputRef.current?.value) {
                  setAttachedUrl(youtubeInputRef.current.value);
                  setShowYoutubeInput(false);
                }
              }} className="bg-[#ff0000] hover:bg-[#cc0000] text-white">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowYoutubeInput(false)}>Cancel</Button>
            </div>
          )}



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
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv" onChange={handleFileUpload} />
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*,.svg,.cdr,.cdt" onChange={handleFileUpload} />
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className={cn("p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/80 transition-colors group relative", isUploading && "opacity-50 pointer-events-none")}
            >
              <Paperclip size={16} className={isUploading ? "animate-bounce" : ""} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-popover text-popover-foreground px-2 py-1 rounded text-[11px] shadow-sm border border-border/50 pointer-events-none">
                Upload Document
              </span>
            </button>
            <button 
              type="button" 
              onClick={() => imageInputRef.current?.click()} 
              className={cn("p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/80 transition-colors group relative", isUploading && "opacity-50 pointer-events-none")}
            >
              <ImageIcon size={16} className={isUploading ? "animate-bounce" : ""} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-popover text-popover-foreground px-2 py-1 rounded text-[11px] shadow-sm border border-border/50 pointer-events-none">
                Upload Image
              </span>
            </button>
            <button 
              type="button" 
              onClick={() => { setShowUrlInput(!showUrlInput); setShowYoutubeInput(false); }} 
              className={cn("p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/80 transition-colors group relative", showUrlInput && "bg-secondary/80 text-foreground")}
            >
              <LinkIcon size={16} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-popover text-popover-foreground px-2 py-1 rounded text-[11px] shadow-sm border border-border/50 pointer-events-none">
                Attach Link
              </span>
            </button>
            <button 
              type="button" 
              onClick={() => { setShowYoutubeInput(!showYoutubeInput); setShowUrlInput(false); }} 
              className={cn("p-1.5 rounded-lg text-muted-foreground hover:bg-[#ff0000]/10 hover:text-[#ff0000] transition-colors group relative", showYoutubeInput && "bg-[#ff0000]/10 text-[#ff0000]")}
            >
              <MonitorPlay size={16} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-popover text-popover-foreground px-2 py-1 rounded text-[11px] shadow-sm border border-border/50 pointer-events-none">
                YouTube Link
              </span>
            </button>
            
            <button 
              type="button" 
              onClick={toggleRecording} 
              className={cn(
                "p-1.5 rounded-lg transition-colors group relative", 
                isRecording ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {isRecording ? <Mic className="animate-pulse" size={16} /> : <MicOff size={16} />}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-popover text-popover-foreground px-2 py-1 rounded text-[11px] shadow-sm border border-border/50 pointer-events-none">
                {isRecording ? "Stop Recording" : "Voice Typing"}
              </span>
            </button>
            
            <div className="h-4 w-px bg-border/50 mx-1"></div>
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