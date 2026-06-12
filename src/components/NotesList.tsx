import React, { useEffect, useState, useCallback } from 'react';
import { type Note, getNotes, createNote, updateNote, deleteNote } from '../services/noteService';
import { Plus, Trash, Edit2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      const newNote = await createNote(editTitle, editContent);
      setNotes([newNote, ...notes]);
      setIsCreating(false);
      setEditTitle('');
      setEditContent('');
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
      setEditingId(null);
      setEditTitle('');
      setEditContent('');
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

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading notes...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full flex flex-col h-full overflow-y-auto magical-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Smart Notes</h1>
          <p className="text-muted-foreground text-sm">Personal knowledge base injected into AI context.</p>
        </div>
        {!isCreating && !editingId && (
          <button onClick={startCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            <Plus size={16} /> New Note
          </button>
        )}
      </div>

      {(isCreating || editingId) && (
        <div className="bg-card border border-border/40 rounded-2xl p-6 mb-8 shadow-1">
          <input
            autoFocus
            type="text"
            placeholder="Note Title"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 mb-4 text-foreground focus:border-primary outline-none"
          />
          <textarea
            placeholder="Note Content"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={6}
            className="w-full bg-background border border-border/40 rounded-xl px-4 py-2 mb-4 text-foreground focus:border-primary outline-none resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="px-4 py-2 text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={isCreating ? handleCreate : handleUpdate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90">
              <Save size={16} /> Save
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map(note => (
          <div key={note.id} className="bg-card/60 border border-border/40 rounded-2xl p-5 hover:border-primary/30 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-foreground truncate">{note.title}</h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(note)} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(note.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash size={14} /></button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
          </div>
        ))}
        {notes.length === 0 && !isCreating && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border/40">
            No notes yet. Create one to add personal knowledge to your AI's context.
          </div>
        )}
      </div>
    </div>
  );
}
