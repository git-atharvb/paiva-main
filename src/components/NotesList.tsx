import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { type Note, getNotes, createNote, updateNote, deleteNote } from '../services/noteService';
import { Plus, Trash, Edit2, Save, X, FileText, Sparkles, Mic, MicOff, Wand2, Loader2, Pin, Tag, Search, Palette, Bot } from 'lucide-react';
import { utilityService } from '../services/utilityService';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const NOTE_COLORS = ['default', 'red', 'blue', 'green', 'yellow', 'purple'] as const;
type NoteColor = typeof NOTE_COLORS[number];

const COLOR_STYLES: Record<string, { card: string, badge: string, glow: string }> = {
  default: { card: 'border-border/40 hover:border-primary/40', badge: 'bg-secondary text-muted-foreground', glow: 'bg-primary/10' },
  red: { card: 'border-red-500/30 hover:border-red-500/60 bg-red-500/5', badge: 'bg-red-500/20 text-red-500', glow: 'bg-red-500/10' },
  blue: { card: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-500', glow: 'bg-blue-500/10' },
  green: { card: 'border-green-500/30 hover:border-green-500/60 bg-green-500/5', badge: 'bg-green-500/20 text-green-500', glow: 'bg-green-500/10' },
  yellow: { card: 'border-yellow-500/30 hover:border-yellow-500/60 bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-500', glow: 'bg-yellow-500/10' },
  purple: { card: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5', badge: 'bg-purple-500/20 text-purple-500', glow: 'bg-purple-500/10' },
};

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState<string | null>(null);

  // Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPinned, setEditPinned] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editColor, setEditColor] = useState<NoteColor>('default');
  const [tagInput, setTagInput] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setEditContent(prev => prev + (prev.trim() ? ' ' : '') + finalTranscript);
        }
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

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Your browser does not support Speech Recognition.");
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

  const handleMagicPolish = async () => {
    if (!editContent.trim()) {
      toast.error("Add some content to polish first!");
      return;
    }
    setIsPolishing(true);
    try {
      const prompt = `You are an expert creative writing assistant. Your task is to ENHANCE and POLISH the following note. Do not just format it—expand on the ideas to add depth, improve the vocabulary, and organize it beautifully using Markdown (headings, bullet points, bold text). If the title "${editTitle}" is empty or too simple, create a fitting, engaging short title. 

CRITICAL INSTRUCTION: You MUST output ONLY a raw JSON object and absolutely nothing else. No conversational text, no markdown code blocks around the JSON.
Format:
{
  "title": "Enhanced Title",
  "content": "The enhanced and expanded markdown content"
}

Note Content:
${editContent}`;
      
      const responseText = await utilityService.generateJson(prompt);
      
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        toast.error("Failed to parse polished note from AI.");
        console.error("AI Response:", responseText);
        setIsPolishing(false);
        return;
      }

      if (parsed.title) setEditTitle(parsed.title);
      if (parsed.content) setEditContent(parsed.content);
      toast.success("Magic Polish complete!");
    } catch (e) {
      toast.error("Failed to polish note.");
    } finally {
      setIsPolishing(false);
    }
  };

  const handleAutoCategorize = async () => {
    if (!editContent.trim() && !editTitle.trim()) {
      toast.error("Add some content to categorize first!");
      return;
    }
    setIsAutoCategorizing(true);
    try {
      const prompt = `Analyze this note and categorize it. Provide 2-3 short relevant tags (without #) and suggest one color theme from this EXACT list: ["red", "blue", "green", "yellow", "purple", "default"]. 

CRITICAL INSTRUCTION: You MUST output ONLY a raw JSON object and absolutely nothing else. No conversational text, no markdown code blocks around the JSON.
Format:
{
  "tags": ["tag1", "tag2"],
  "color": "blue"
}

Title: ${editTitle}
Content: ${editContent}`;
      
      const responseText = await utilityService.generateJson(prompt);
      
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        toast.error("Failed to parse categorization from AI.");
        console.error("AI Response:", responseText);
        setIsAutoCategorizing(false);
        return;
      }

      if (parsed.tags && Array.isArray(parsed.tags)) {
        setEditTags(parsed.tags.map((t: string) => t.toLowerCase()));
      }
      if (parsed.color && NOTE_COLORS.includes(parsed.color as NoteColor)) {
        setEditColor(parsed.color as NoteColor);
      }
      toast.success("Auto-Categorized!");
    } catch (e) {
      toast.error("Failed to categorize note.");
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const fetchNotes = useCallback(async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      const newNote = await createNote(editTitle, editContent, editPinned, editTags, editColor);
      setNotes([newNote, ...notes]);
      closeModal();
      toast.success('Note created');
    } catch {
      toast.error('Failed to create note');
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !editTitle.trim() || !editContent.trim()) return;
    try {
      const updated = await updateNote(editingId, editTitle, editContent, editPinned, editTags, editColor);
      setNotes(notes.map(n => n.id === editingId ? updated : n));
      closeModal();
      toast.success('Note updated');
    } catch {
      toast.error('Failed to update note');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      await deleteNote(id);
      setNotes(notes.filter(n => n.id !== id));
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const togglePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    try {
      const updated = await updateNote(note.id, note.title, note.content, !note.isPinned, note.tags, note.color);
      setNotes(notes.map(n => n.id === note.id ? updated : n));
    } catch {
      toast.error('Failed to update pin status');
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditPinned(note.isPinned || false);
    setEditTags(note.tags || []);
    setEditColor((note.color as NoteColor) || 'default');
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditPinned(false);
    setEditTags([]);
    setEditColor('default');
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!editTags.includes(newTag)) {
        setEditTags([...editTags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  // Compute derived state
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              n.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = selectedFilterTag ? n.tags?.includes(selectedFilterTag) : true;
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, searchTerm, selectedFilterTag]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground animate-pulse">
        <FileText size={48} className="opacity-20 mb-4" />
        <p className="text-lg font-medium tracking-wide">Loading knowledge base...</p>
      </div>
    );
  }

  const isModalOpen = isCreating || editingId !== null;

  return (
    <div className="relative p-5 md:p-8 w-full flex flex-col h-full overflow-y-auto magical-scrollbar">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 relative z-10">
        <div>
          <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 text-amber-500 rounded-2xl mb-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <FileText size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-2 flex items-center gap-3">
            Smart Notes
            <Sparkles size={24} className="text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">
            Personal knowledge base injected directly into your AI assistant's context.
          </p>
        </div>
        
        <button 
          onClick={startCreate} 
          className={cn(
            "flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold tracking-wide",
            "bg-foreground text-background shadow-[0_8px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_20px_rgba(255,255,255,0.05)]",
            "hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 ease-out",
            "hover:bg-primary hover:text-primary-foreground hover:shadow-[0_8px_30px_rgba(var(--primary),0.3)]"
          )}
        >
          <Plus size={18} strokeWidth={3} /> Create Note
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-8 relative z-10">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-secondary/30 border border-border/50 rounded-2xl text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-secondary/50 transition-all"
          />
        </div>
        
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedFilterTag(null)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                selectedFilterTag === null ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
              )}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedFilterTag(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                  selectedFilterTag === tag ? "bg-primary/20 text-primary border-primary/30 shadow-sm" : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6 pb-20 relative z-10">
        {filteredNotes.map((note, idx) => {
          const style = COLOR_STYLES[note.color || 'default'] || COLOR_STYLES['default'];
          
          return (
            <div 
              key={note.id} 
              className="break-inside-avoid animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={cn("glass-surface-subtle border rounded-3xl p-6 group transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] relative overflow-hidden", style.card)}>
                <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-bl-[100px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", style.glow)} />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h3 className="font-extrabold text-xl tracking-tight text-foreground/90 group-hover:text-foreground transition-colors duration-300 pr-2">{note.title}</h3>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => togglePin(e, note)}
                      className={cn("p-2 rounded-full transition-colors", note.isPinned ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary")}
                      title={note.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin size={16} strokeWidth={2.5} className={note.isPinned ? "fill-current" : ""} />
                    </button>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 bg-background/50 backdrop-blur-md rounded-full p-1 border border-border/50 shadow-sm ml-1">
                      <button 
                        onClick={() => startEdit(note)} 
                        className="p-1.5 rounded-full text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                        title="Edit Note"
                      >
                        <Edit2 size={14} strokeWidth={2.5} />
                      </button>
                      <div className="w-px h-3 bg-border/60" />
                      <button 
                        onClick={() => handleDelete(note.id)} 
                        className="p-1.5 rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                        title="Delete Note"
                      >
                        <Trash size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="prose prose-sm dark:prose-invert prose-headings:font-bold prose-a:text-primary max-w-none text-muted-foreground/90 relative z-10 line-clamp-[10]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {note.content}
                  </ReactMarkdown>
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5 relative z-10">
                    {note.tags.map(tag => (
                      <span key={tag} className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold", style.badge)}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredNotes.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
          <div className="size-32 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
            <FileText size={48} className="text-muted-foreground/30" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">No notes found</h2>
          <p className="text-muted-foreground max-w-sm mb-8">
            {searchTerm || selectedFilterTag ? "Try adjusting your search or filters." : "Create your first smart note to inject personal knowledge into PAIVA."}
          </p>
          {!searchTerm && !selectedFilterTag && (
            <button 
              onClick={startCreate} 
              className="text-primary font-bold hover:underline underline-offset-4"
            >
              Create your first note &rarr;
            </button>
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={closeModal} />
          
          <div className={cn("relative w-full max-w-4xl glass-surface border rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out flex flex-col h-[90vh]", COLOR_STYLES[editColor].card)}>
            
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <div className="bg-primary/20 text-primary p-2 rounded-xl">
                  {isCreating ? <Plus size={20} strokeWidth={3} /> : <Edit2 size={20} strokeWidth={3} />}
                </div>
                {isCreating ? 'Create New Note' : 'Edit Note'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditPinned(!editPinned)}
                  className={cn("p-2.5 rounded-full transition-all", editPinned ? "bg-amber-500/20 text-amber-500" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground")}
                  title={editPinned ? "Unpin" : "Pin note"}
                >
                  <Pin size={20} strokeWidth={2.5} className={editPinned ? "fill-current" : ""} />
                </button>
                <button onClick={closeModal} className="p-2.5 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200">
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
              {/* Left Col: Editor */}
              <div className="flex-1 flex flex-col gap-4 min-h-0">
                <input
                  autoFocus
                  type="text"
                  placeholder="Note Title..."
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-border/50 px-2 py-3 text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:border-primary outline-none transition-colors shrink-0"
                />
                
                <div className="flex-1 relative flex flex-col">
                  <textarea
                    placeholder="Start writing or dictating (Markdown supported)..."
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full flex-1 bg-secondary/10 border border-border/40 rounded-3xl p-6 pb-20 text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-secondary/20 outline-none resize-none transition-all magical-scrollbar font-mono text-sm"
                  />
                  
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={toggleRecording}
                      className={cn(
                        "p-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md transition-all",
                        isRecording ? "bg-rose-500 text-white animate-[pulse-fade_1s_ease-out_infinite]" : "bg-background border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                      title="Dictate"
                    >
                      {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                    <button
                      onClick={handleMagicPolish}
                      disabled={isPolishing || !editContent.trim()}
                      className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 shadow-md transition-all disabled:opacity-50"
                    >
                      {isPolishing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      Magic Polish
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Col: Metadata */}
              <div className="w-full md:w-72 flex flex-col gap-6 shrink-0 bg-secondary/10 rounded-3xl p-6 border border-border/40 overflow-y-auto magical-scrollbar">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Tag size={14} /> Tags
                    </label>
                    <button 
                      onClick={handleAutoCategorize}
                      disabled={isAutoCategorizing || (!editContent.trim() && !editTitle.trim())}
                      className="text-[10px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-1 rounded hover:bg-indigo-500/20 transition-colors flex items-center gap-1 font-bold disabled:opacity-50"
                      title="AI Auto-Categorize"
                    >
                      {isAutoCategorizing ? <Loader2 size={10} className="animate-spin" /> : <Bot size={10} />} Auto
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {editTags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-secondary text-foreground text-xs font-bold rounded-md flex items-center gap-1 border border-border/50">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors rounded-full p-0.5">
                          <X size={10} strokeWidth={3} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagAdd}
                    placeholder="Add tag + Enter"
                    className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Palette size={14} /> Color Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={cn(
                          "h-10 rounded-xl border-2 transition-all capitalize text-[11px] font-bold flex items-center justify-center",
                          editColor === c ? "border-foreground" : "border-transparent",
                          COLOR_STYLES[c].card
                        )}
                      >
                        {c === 'default' ? 'Gray' : c}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="flex gap-4 justify-end mt-6 shrink-0">
              <button 
                onClick={closeModal} 
                className="px-6 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={isCreating ? handleCreate : handleUpdate} 
                className="flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-xl text-sm font-bold shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              >
                <Save size={18} strokeWidth={2.5} /> 
                {isCreating ? 'Save Note' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
