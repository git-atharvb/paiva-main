import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { Send, Sparkles, Square, Copy, CheckCircle2, Paperclip, X, Image as ImageIcon, Link as LinkIcon, Mic, MicOff, Volume2, VolumeX, MonitorPlay, Download, ChevronDown, ArrowRight, FileText, Loader2, Radio } from 'lucide-react';
import { cn } from '../lib/utils';
import VoiceChatMode from './VoiceChatMode';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; 
import { chatService } from '../services/chatService';
import { assistantService } from '../services/assistantService';
import type { AssistantModel } from '../services/assistantService';
import { useChat } from '../context/ChatContext';
import WikipediaImage from './WikipediaImage';
import { fetchWithAuth } from '../services/api';
import paivaLogo from '../assets/paiva_logo.png';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

const extractText = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node) && node.props) {
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return '';
};

const FALLBACK_MODELS: AssistantModel[] = [
  { id: '', name: 'Auto (Default)', capability: 'Uses your configured default model' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', capability: 'Strong general reasoning' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', capability: 'Fast everyday help' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B', capability: 'Reasoning-heavy tasks' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', capability: 'Balanced long-context work' },
  { id: 'gemma2-9b-it', name: 'Google Gemma 2 9B', capability: 'Concise instruction following' },
  { id: 'qwen-2.5-32b', name: 'Qwen 2.5 32B', capability: 'Research and synthesis' },
  { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', capability: 'Coding assistance' }
];

const ModelDropdown = ({ value, onChange, models }: { value: string, onChange: (v: string) => void, models: AssistantModel[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = models.find(m => m.id === value) || models[0];

  return (
    <div className="relative ml-2">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-secondary/35 border border-border/40 text-xs text-foreground rounded-lg px-3 py-1.5 outline-none hover:border-primary/40 transition-colors hover:bg-secondary/50 focus:ring-2 focus:ring-primary/20 shadow-sm"
      >
        <span className="truncate max-w-[150px] font-medium">{selected.name}</span>
        <ChevronDown size={12} className={cn("transition-transform duration-200 text-muted-foreground", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-3 dark:shadow-premium-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200 py-1.5">
            {models.map(m => (
              <button
                key={m.id}
                onClick={() => { onChange(m.id); setIsOpen(false); }}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-primary/15 hover:text-primary flex items-center gap-2",
                  value === m.id ? "bg-primary/10 text-primary font-bold" : "text-foreground font-medium"
                )}
              >
                {value === m.id && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                <span className={cn("min-w-0", value !== m.id && "ml-3.5")}>
                  <span className="block truncate">{m.name}</span>
                  <span className="block truncate text-[10px] font-normal text-muted-foreground">{m.capability}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const VoiceDropdown = ({ value, onChange, availableVoices }: { value: string, onChange: (v: string) => void, availableVoices: SpeechSynthesisVoice[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!availableVoices || availableVoices.length === 0) return null;
  
  const selected = availableVoices.find(v => v.voiceURI === value) || availableVoices[0];

  return (
    <div className="relative ml-2 hidden sm:block">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-secondary/35 border border-border/40 text-xs text-foreground rounded-lg px-2.5 py-1.5 outline-none hover:border-primary/40 transition-colors hover:bg-secondary/50 focus:ring-2 focus:ring-primary/20 shadow-sm"
        title="Select AI Voice"
      >
        <Volume2 size={14} className="text-muted-foreground" />
        <span className="truncate max-w-[80px] font-medium">{selected.name.replace(/Microsoft |Google /g, '')}</span>
        <ChevronDown size={12} className={cn("transition-transform duration-200 text-muted-foreground", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 z-50 rounded-xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-3 dark:shadow-premium-dark overflow-hidden animate-in fade-in zoom-in-95 duration-200 py-1.5">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">AI Voices</div>
            {availableVoices.map(v => (
              <button
                key={v.voiceURI}
                onClick={() => { onChange(v.voiceURI); setIsOpen(false); }}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-primary/15 hover:text-primary flex items-center gap-2",
                  value === v.voiceURI ? "bg-primary/10 text-primary font-bold" : "text-foreground font-medium"
                )}
              >
                <div className={cn("size-1.5 rounded-full shrink-0", value === v.voiceURI ? "bg-primary shadow-neon-sm" : "bg-transparent")} />
                <span className="truncate">{v.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const QUICK_ACTIONS = [
  { label: 'Explain a concept', prompt: 'Explain ' },
  { label: 'Write code', prompt: 'Write a function that ' },
  { label: 'Summarize text', prompt: 'Summarize the following: ' },
  { label: 'Creative writing', prompt: 'Write a creative ' },
];

export default function ChatArea({ isSecondary = false }: { isSecondary?: boolean }) {
  const chatContext = useChat();
  
  const messages = isSecondary ? chatContext.secondaryMessages : chatContext.messages;
  const setMessages = isSecondary ? chatContext.setSecondaryMessages : chatContext.setMessages;
  const activeConversationId = isSecondary ? chatContext.secondaryConversationId : chatContext.activeConversationId;
  const setConversationIdWithoutFetch = isSecondary ? chatContext.setSecondaryConversationIdWithoutFetch : chatContext.setConversationIdWithoutFetch;
  const refreshConversations = chatContext.refreshConversations;

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextImageEnabled, setContextImageEnabled] = useState(false);
  const [aiModel, setAiModel] = useState('');
  const [assistantModels, setAssistantModels] = useState<AssistantModel[]>(FALLBACK_MODELS);
  const [aiVoice, setAiVoice] = useState<string>(() => localStorage.getItem('aiVoice') || '');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [attachedDocumentText, setAttachedDocumentText] = useState<string | null>(null);
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const youtubeInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isGeneratingPdfId, setIsGeneratingPdfId] = useState<string | null>(null);
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
    if (aiVoice && availableVoices.length > 0) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === aiVoice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    assistantService.getModels()
      .then(models => {
        if (models.length > 0) {
          setAssistantModels(models);
        }
      })
      .catch(err => console.error('Failed to load assistant models:', err));

    // Load voices for TTS
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Filter out for 4 high quality English voices if possible
        // Try to find specific good voices first
        const preferred = voices.filter(v => 
          v.name.includes('Microsoft Aria Online') || 
          v.name.includes('Google US English') ||
          v.name.includes('Microsoft Guy Online') ||
          v.name.includes('Google UK English Female') ||
          v.name.includes('Apple Samantha') ||
          v.name.includes('Samantha')
        );
        
        let finalVoices = [];
        if (preferred.length >= 8) {
          finalVoices = preferred.slice(0, 8);
        } else {
          // Fallback: just get 8 distinct English voices
          const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
          finalVoices = [...new Set([...preferred, ...englishVoices])].slice(0, 8);
        }
        
        // If still empty, just use whatever is available
        if (finalVoices.length === 0) finalVoices = voices.slice(0, 8);
        
        setAvailableVoices(finalVoices);
        
        // Set default voice if none selected
        setAiVoice(current => {
          if (!current && finalVoices.length > 0) {
            const defaultVoice = finalVoices[0].voiceURI;
            localStorage.setItem('aiVoice', defaultVoice);
            return defaultVoice;
          }
          return current;
        });
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

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
    // @ts-expect-error - Web Speech API may not have types in standard DOM lib
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev.trim() ? ' ' : '') + transcript);
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Scroll detection for "scroll to bottom" button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
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

  const downloadMessagePdf = async (msgId: string) => {
    try {
      setIsGeneratingPdfId(msgId);
      const element = document.getElementById(`msg-content-${msgId}`);
      if (!element) {
        toast.error('Could not find message content to capture');
        return;
      }
      
      console.log('Generating PDF for message:', msgId);
      
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      
      if (width === 0 || height === 0) {
        throw new Error('Element dimensions are zero');
      }

      // Freeze all images as Base64 to prevent html-to-image from re-fetching dynamic images.
      // Since they load dynamically from an AI (e.g. pollinations), a re-fetch generates a totally different image.
      const imgs = Array.from(element.querySelectorAll('img'));
      const originalSrcs = new Map<HTMLImageElement, string>();

      imgs.forEach(img => {
        if (img.src && !img.src.startsWith('data:') && img.naturalWidth > 0) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              originalSrcs.set(img, img.src);
              img.src = dataUrl; // Instantly lock it to the exact pixels currently on screen
            }
          } catch (e) {
            console.warn('Could not freeze image to base64 (CORS?), leaving as is', e);
          }
        }
      });

      // Generate high resolution image
      const imgData = await htmlToImage.toJpeg(element, { 
        quality: 0.95,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
        pixelRatio: 2, // 2x resolution for very sharp text
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      });
      
      // Restore original URLs instantly so the UI isn't bogged down with giant base64 strings
      imgs.forEach(img => {
        if (originalSrcs.has(img)) {
          img.src = originalSrcs.get(img)!;
        }
      });
      
      // Scale down the physical PDF size so fonts don't appear gigantic
      const scale = 0.65;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      const pdf = new jsPDF({
        orientation: scaledWidth > scaledHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [scaledWidth + 40, scaledHeight + 40]
      });
      
      pdf.addImage(imgData, 'JPEG', 20, 20, scaledWidth, scaledHeight);
      pdf.save(`PAIVA_Response_${msgId.slice(0,6)}.pdf`);
      console.log('PDF saved successfully');
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.error('Failed to generate PDF. See console for details.');
    } finally {
      setIsGeneratingPdfId(null);
    }
  };

  const isWelcomeState = messages.length <= 1 && messages[0]?.id === 'welcome';

  return (
    <div className="flex flex-col h-full p-5 lg:p-7 gap-4">

      {/* ── Chat header strip ────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className={cn(
          'size-7 rounded-full flex items-center justify-center',
          'bg-primary/12 dark:bg-primary/20',
          'animate-pulse-glow',
        )}>
          <Sparkles size={14} strokeWidth={2} className="text-primary" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground tracking-snug">
          PAIVA Assistant
        </span>

        {/* Model Switcher & Controls */}
        <div className="ml-auto flex items-center gap-2">
          <button 
            type="button"
            onClick={downloadChat}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg flex items-center gap-1.5 text-xs border border-transparent hover:border-border/40 hover:bg-secondary/35"
            title="Download Chat as Markdown"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <ModelDropdown value={aiModel} onChange={setAiModel} models={assistantModels} />
          <VoiceDropdown value={aiVoice} onChange={setAiVoice} availableVoices={availableVoices} />

          {/* Status dot */}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="size-2 rounded-full bg-emerald-400 dark:bg-emerald-300 shadow-[0_0_5px_oklch(0.70_0.19_155/0.7)] animate-pulse" />
            Online
          </span>
          <button
            type="button"
            onClick={() => setShowVoiceMode(true)}
            className="ml-2 text-primary hover:text-primary/80 transition-colors p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold border border-primary/20 bg-primary/10 hover:bg-primary/20"
            title="Continuous Voice Mode"
          >
            <Radio size={14} className="animate-pulse" />
            <span className="hidden sm:inline">Voice Mode</span>
          </button>
          {isSecondary && (
            <button
              type="button"
              onClick={() => chatContext.setSecondaryConversationId(null)}
              className="ml-2 text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg border border-transparent hover:border-destructive/30 hover:bg-destructive/10"
              title="Close split view"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 relative magical-scrollbar">

        {/* ── Welcome state ──────────────────────────────────────── */}
        {isWelcomeState && (
          <div className="flex flex-col items-center justify-center h-full gap-6 animate-in fade-in duration-700">
            <div className="relative size-20 group">
              <div className="absolute inset-0 bg-primary/25 blur-3xl rounded-full opacity-60 animate-pulse-glow pointer-events-none" />
              <img src={paivaLogo} alt="PAIVA" className="w-full h-full object-contain rounded-2xl relative z-10 animate-float" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground max-w-sm">Ask me anything — I can explain concepts, write code, summarize text, and more.</p>
            </div>
            {/* Quick action chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.prompt)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium tracking-snug',
                    'bg-secondary/40 text-foreground',
                    'border border-border/40',
                    'hover:bg-primary/10 hover:text-primary hover:border-primary/25',
                    'hover:shadow-neon-sm',
                    'transition-all duration-200 ease-spring',
                    'hover:scale-[1.03] active:scale-[0.97]',
                    'flex items-center gap-1.5',
                  )}
                >
                  {action.label}
                  <ArrowRight size={13} className="opacity-0 -ml-1 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Message list ────────────────────────────────────────── */}
        {!isWelcomeState && messages.map((msg, index) => {
          const assistantIndex = messages.slice(0, index).filter(m => m.role === 'assistant').length;
          const isImageOnRight = assistantIndex % 2 === 1;

          return (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col group',
                msg.role === 'user' ? 'items-end' : 'items-start',
              )}
              style={{ animation: 'slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both', animationDelay: `${index * 30}ms` }}
            >
            {(() => {
              const content = msg.content || '';
              const imageRegex = /!\[([^\]]*)\]\(wiki:([^)]+)\)/g;
              const matches = [...content.matchAll(imageRegex)];
              const isContextMode = matches.length > 0;

              return (
                <>
                <div
                  id={msg.role === 'assistant' ? `msg-content-${msg.id}` : undefined}
                  className={cn(
                    'px-5 py-3.5 rounded-3xl text-[14px] leading-relaxed tracking-wide transition-all duration-300 relative',
                    msg.role === 'assistant'
                      ? [
                          'glass-surface-subtle',
                          'rounded-tl-md',
                          'text-foreground/90',
                          'shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]',
                          isContextMode ? 'max-w-full md:max-w-[95%] w-full' : 'max-w-[85%] prose prose-sm dark:prose-invert'
                        ].join(' ')
                      : [
                          'max-w-[85%]',
                          'text-primary-foreground rounded-tr-md',
                          'shadow-[0_8px_32px_rgba(var(--primary),0.25)]',
                          'bg-gradient-to-br from-primary via-primary to-primary/80',
                          'border border-white/10'
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
                              return (
                                <img 
                                  src={src} 
                                  alt={alt} 
                                  crossOrigin="anonymous"
                                  onError={(e) => {
                                    if (src && !src.includes('wsrv.nl')) {
                                      e.currentTarget.src = `https://wsrv.nl/?url=${encodeURIComponent(src)}`;
                                    }
                                  }}
                                  className="rounded-xl max-w-full h-auto" 
                                />
                              );
                            },
                            code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
                              const match = /language-(\w+)/.exec(className || '')
                              const language = match ? match[1] : 'text';
                              const codeText = extractText(children);
                              
                              return !inline && match ? (
                                <div className="relative my-6 rounded-2xl overflow-hidden border border-white/10 bg-[#0d1117]/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                                  {/* Code block header with macOS style dots and gradient accent */}
                                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22]/80 text-xs text-muted-foreground/80 border-b border-white/5 relative">
                                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
                                    <div className="flex items-center gap-1.5">
                                      <div className="size-3 rounded-full bg-red-500/80 border border-red-500/20" />
                                      <div className="size-3 rounded-full bg-yellow-500/80 border border-yellow-500/20" />
                                      <div className="size-3 rounded-full bg-emerald-500/80 border border-emerald-500/20" />
                                    </div>
                                    <span className="font-mono font-bold tracking-wider uppercase text-[10px] text-foreground/50 absolute left-1/2 -translate-x-1/2">{language}</span>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(codeText)}
                                      className="flex items-center gap-1.5 hover:text-primary transition-all duration-200 px-2.5 py-1 rounded-md hover:bg-white/5 active:scale-95"
                                    >
                                      <Copy size={12} /> <span className="font-semibold tracking-wide">Copy</span>
                                    </button>
                                  </div>
                                  <div className="p-5 overflow-x-auto text-[13px] leading-relaxed magical-scrollbar">
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </div>
                                </div>
                              ) : (
                                <code className={cn("bg-secondary/40 rounded px-1.5 py-0.5 text-[0.9em] font-medium", className)} {...props}>
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
              <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                <button
                  onClick={() => copyMessage(msg.id, msg.content)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary/45 hover:text-foreground transition-colors"
                  title="Copy message"
                >
                  {copiedId === msg.id ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
                <button
                  onClick={() => downloadMessagePdf(msg.id)}
                  disabled={isGeneratingPdfId === msg.id}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary/45 hover:text-foreground transition-colors disabled:opacity-50"
                  title="Download as PDF"
                >
                  {isGeneratingPdfId === msg.id ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                </button>
                <button
                  onClick={() => playTTS(msg.id, msg.content)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    speakingId === msg.id 
                      ? "text-primary bg-primary/10 hover:bg-primary/18" 
                      : "text-muted-foreground hover:bg-secondary/45 hover:text-foreground"
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

        {/* ── Typing indicator ────────────────────────────────────── */}
        {isTyping && messages[messages.length - 1]?.content === '' && (
          <div className="flex items-start animate-in fade-in duration-300">
            <div className={cn(
              'px-5 py-3.5 rounded-2xl rounded-bl-sm',
              'bg-card/65 dark:bg-card/75 backdrop-blur-sm',
              'border border-border/40 dark:border-border/30',
              'shadow-1 magical-border',
            )}>
              <div className="typing-indicator">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* ── Scroll to bottom button ─────────────────────────────── */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className={cn(
              'sticky bottom-3 left-1/2 -translate-x-1/2 z-20',
              'scroll-pill',
              'px-4 py-2 rounded-full',
              'text-xs font-medium text-muted-foreground',
              'flex items-center gap-1.5',
              'animate-in fade-in slide-in-from-bottom-3 duration-300',
            )}
          >
            <ChevronDown size={14} />
            Scroll to bottom
          </button>
        )}
      </div>

      {/* ── Composer ─────────────────────────────────────────────── */}
      <div className="relative pt-2 pb-1 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none sticky bottom-0 z-30">
        <div className="pointer-events-auto">
          <form
            className="flex flex-col sm:flex-row gap-3 shrink-0 mx-auto max-w-5xl w-full min-w-0"
            onSubmit={handleSend}
          >
            <div className="relative flex-1 group/composer min-w-0">
              {/* Glowing aura under composer */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-indigo-500/20 to-primary/20 rounded-[2rem] blur-xl opacity-0 group-focus-within/composer:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <div className="absolute -top-12 left-2 flex items-center gap-2">
                {attachedFileName && (
                  <div className="bg-card/80 backdrop-blur-md text-foreground border border-border/50 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                {attachedImageBase64 ? <ImageIcon size={12} /> : <Paperclip size={12} />}
                {attachedFileName}
                <button type="button" onClick={() => { setAttachedDocumentText(null); setAttachedImageBase64(null); setAttachedFileName(null); }} className="hover:text-foreground transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
            {attachedUrl && (
              <div className="bg-primary/15 text-primary border border-primary/25 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                {attachedUrl.includes('youtube.com') || attachedUrl.includes('youtu.be') ? <MonitorPlay size={12} /> : <LinkIcon size={12} />}
                {attachedUrl.length > 30 ? attachedUrl.substring(0, 30) + '...' : attachedUrl}
                <button type="button" onClick={() => setAttachedUrl(null)} className="hover:text-foreground transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          
          {showUrlInput && (
            <div className="absolute -top-16 left-0 bg-card/95 backdrop-blur-xl border border-border/45 p-2 rounded-xl shadow-2 flex gap-2 animate-in fade-in slide-in-from-bottom-2 z-10 w-80">
              <input 
                ref={urlInputRef}
                type="url" 
                placeholder="https://..." 
                className="flex-1 frosted-input rounded-lg px-3 py-1.5 text-sm"
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
            <div className="absolute -top-16 left-0 bg-card/95 backdrop-blur-xl border border-[#ff0000]/40 p-2 rounded-xl shadow-2 flex gap-2 animate-in fade-in slide-in-from-bottom-2 z-10 w-80">
              <input 
                ref={youtubeInputRef}
                type="url" 
                placeholder="Paste YouTube Link..." 
                className="flex-1 frosted-input rounded-lg px-3 py-1.5 text-sm"
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
              'w-full pl-6 pr-40 py-4.5 rounded-[2rem]',
              'glass-surface-subtle',
              'border border-border/50',
              'text-foreground text-[15px] font-semibold tracking-wide',
              'placeholder:text-muted-foreground/40 placeholder:font-medium',
              'outline-none',
              'transition-all duration-300 ease-out',
              'focus:border-primary/50 focus:bg-card/60',
              'focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)]',
              'disabled:opacity-45 disabled:cursor-not-allowed'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv" onChange={handleFileUpload} />
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*,.svg,.cdr,.cdt" onChange={handleFileUpload} />
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className={cn("p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors group relative", isUploading && "opacity-50 pointer-events-none")}
            >
              <Paperclip size={16} className={isUploading ? "animate-bounce" : ""} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-card text-foreground px-2 py-1 rounded-lg text-[11px] shadow-1 border border-border/40 pointer-events-none">
                Upload Document
              </span>
            </button>
            <button 
              type="button" 
              onClick={() => imageInputRef.current?.click()} 
              className={cn("p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors group relative", isUploading && "opacity-50 pointer-events-none")}
            >
              <ImageIcon size={16} className={isUploading ? "animate-bounce" : ""} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-card text-foreground px-2 py-1 rounded-lg text-[11px] shadow-1 border border-border/40 pointer-events-none">
                Upload Image
              </span>
            </button>
            <button 
              type="button" 
              onClick={() => { setShowUrlInput(!showUrlInput); setShowYoutubeInput(false); }} 
              className={cn("p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors group relative", showUrlInput && "bg-secondary/60 text-foreground")}
            >
              <LinkIcon size={16} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-card text-foreground px-2 py-1 rounded-lg text-[11px] shadow-1 border border-border/40 pointer-events-none">
                Attach Link
              </span>
            </button>
            <button 
              type="button" 
              onClick={() => { setShowYoutubeInput(!showYoutubeInput); setShowUrlInput(false); }} 
              className={cn("p-1.5 rounded-lg text-muted-foreground hover:bg-[#ff0000]/8 hover:text-[#ff0000] transition-colors group relative", showYoutubeInput && "bg-[#ff0000]/8 text-[#ff0000]")}
            >
              <MonitorPlay size={16} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-card text-foreground px-2 py-1 rounded-lg text-[11px] shadow-1 border border-border/40 pointer-events-none">
                YouTube Link
              </span>
            </button>
            
            <button 
              type="button" 
              onClick={toggleRecording} 
              className={cn(
                "p-1.5 rounded-lg transition-colors group relative", 
                isRecording ? "bg-red-500/15 text-red-500 hover:bg-red-500/25" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {isRecording ? <Mic className="animate-pulse" size={16} /> : <MicOff size={16} />}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 whitespace-nowrap bg-card text-foreground px-2 py-1 rounded-lg text-[11px] shadow-1 border border-border/40 pointer-events-none">
                {isRecording ? "Stop Recording" : "Voice Typing"}
              </span>
            </button>
            
            <div className="h-5 w-px bg-border/60 mx-1"></div>
            <label 
              title="Context Image" 
              className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-all group px-2 py-1.5 rounded-xl hover:bg-secondary/60 active:scale-95"
            >
              <input
                type="checkbox"
                checked={contextImageEnabled}
                onChange={(e) => setContextImageEnabled(e.target.checked)}
                className="w-4 h-4 rounded-md border-muted-foreground/30 text-primary focus:ring-primary/40 cursor-pointer accent-[var(--color-primary)] transition-all"
              />
              <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 absolute right-full mr-2 whitespace-nowrap bg-card/90 backdrop-blur-md text-foreground px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xl border border-border/40 pointer-events-none -translate-x-2 group-hover:translate-x-0">
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
              'rounded-[2rem] size-[56px] shrink-0',
              'shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.4)]',
              'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
              'transition-all duration-300 hover:scale-105 active:scale-95'
            )}
            aria-label="Stop generation"
          >
            <Square size={20} strokeWidth={2.5} className="fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="icon"
            disabled={!input.trim()}
            className={cn(
              'rounded-[2rem] size-[56px] shrink-0',
              'shadow-[0_4px_20px_rgba(var(--primary),0.3)] hover:shadow-[0_8px_30px_rgba(var(--primary),0.4)]',
              'transition-all duration-300 hover:scale-105 active:scale-95',
              'bg-gradient-to-br from-primary via-primary to-primary/80'
            )}
            aria-label="Send message"
          >
            <Send size={20} strokeWidth={2.5} className="ml-1" />
          </Button>
        )}
          </form>
        </div>
      </div>

      {showVoiceMode && (
        <VoiceChatMode
          conversationId={activeConversationId}
          onClose={() => setShowVoiceMode(false)}
        />
      )}
    </div>
  );
}
