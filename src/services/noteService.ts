import { fetchWithAuth } from './api';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  tags: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const getNotes = async (): Promise<Note[]> => {
  const response = await fetchWithAuth('/api/notes');
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
};

export const createNote = async (title: string, content: string, isPinned: boolean = false, tags: string[] = [], color: string = 'default'): Promise<Note> => {
  const response = await fetchWithAuth('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, isPinned, tags, color })
  });
  if (!response.ok) throw new Error('Failed to create note');
  return response.json();
};

export const updateNote = async (id: string, title: string, content: string, isPinned: boolean = false, tags: string[] = [], color: string = 'default'): Promise<Note> => {
  const response = await fetchWithAuth(`/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, isPinned, tags, color })
  });
  if (!response.ok) throw new Error('Failed to update note');
  return response.json();
};

export const deleteNote = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`/api/notes/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete note');
};
