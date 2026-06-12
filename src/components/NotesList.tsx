import React, { useEffect, useState, useCallback } from 'react';
import { type Note, getNotes, createNote, updateNote, deleteNote } from '../services/noteService';
import { Plus, Trash, Edit2, Save, X, FileText, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
      const newNote = await createNote(editTitle, editContent);
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
      const updated = await updateNote(editingId, editTitle, editContent);
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

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingId(null);
  };

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
      
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 relative z-10">
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

      {/* ── Notes Grid ─────────────────────────────────────── */}
      <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6 pb-20 relative z-10">
        {notes.map((note, idx) => (
          <div 
            key={note.id} 
            className="break-inside-avoid animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="glass-surface-subtle border border-border/40 rounded-3xl p-6 group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] hover:border-primary/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="font-extrabold text-xl tracking-tight text-foreground/90 group-hover:text-primary transition-colors duration-300 line-clamp-2 pr-4">{note.title}</h3>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 bg-background/50 backdrop-blur-md rounded-full p-1 border border-border/50 shadow-sm">
                  <button 
                    onClick={() => startEdit(note)} 
                    className="p-2 rounded-full text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                    title="Edit Note"
                  >
                    <Edit2 size={14} strokeWidth={2.5} />
                  </button>
                  <div className="w-px h-4 bg-border/60" />
                  <button 
                    onClick={() => handleDelete(note.id)} 
                    className="p-2 rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                    title="Delete Note"
                  >
                    <Trash size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              
              <p className="text-[15px] leading-relaxed text-muted-foreground/90 whitespace-pre-wrap relative z-10">
                {note.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
          <div className="size-32 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
            <FileText size={48} className="text-muted-foreground/30" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">No notes yet</h2>
          <p className="text-muted-foreground max-w-sm mb-8">
            Create your first smart note to inject personal knowledge and context directly into PAIVA's memory.
          </p>
          <button 
            onClick={startCreate} 
            className="text-primary font-bold hover:underline underline-offset-4"
          >
            Create your first note &rarr;
          </button>
        </div>
      )}

      {/* ── Modal Overlay ─────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-xl" 
            onClick={closeModal}
          />
          
          {/* Modal content */}
          <div className="relative w-full max-w-3xl glass-surface border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center mb-8 shrink-0">
              <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <div className="bg-primary/20 text-primary p-2 rounded-xl">
                  {isCreating ? <Plus size={20} strokeWidth={3} /> : <Edit2 size={20} strokeWidth={3} />}
                </div>
                {isCreating ? 'Create New Note' : 'Edit Note'}
              </h2>
              <button 
                onClick={closeModal} 
                className="p-2.5 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200 hover:rotate-90"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex flex-col gap-6 flex-1 min-h-0">
              <input
                autoFocus
                type="text"
                placeholder="Title..."
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full bg-transparent border-b-2 border-border/50 px-2 py-4 text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:border-primary outline-none transition-colors shrink-0"
              />
              
              <textarea
                placeholder="Start writing..."
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full flex-1 bg-secondary/10 border border-border/40 rounded-3xl p-6 text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-secondary/20 outline-none resize-none transition-all magical-scrollbar"
              />
            </div>

            <div className="flex gap-4 justify-end mt-8 shrink-0">
              <button 
                onClick={closeModal} 
                className="px-8 py-4 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={isCreating ? handleCreate : handleUpdate} 
                className="flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-2xl text-sm font-bold shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:bg-primary hover:text-primary-foreground hover:shadow-[0_8px_30px_rgba(var(--primary),0.3)] hover:-translate-y-1 active:scale-95 transition-all duration-300"
              >
                <Save size={18} strokeWidth={2.5} /> 
                {isCreating ? 'Save Note' : 'Update Note'}
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
