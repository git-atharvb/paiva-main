import { fetchWithAuth } from './api';

export interface Email {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const getRecentEmails = async (limit: number = 10): Promise<Email[]> => {
  const response = await fetchWithAuth(`/api/gmail/emails?limit=${limit}`);
  if (!response.ok) {
    let errMsg = 'Failed to fetch emails';
    try {
      const data = await response.json();
      errMsg = data.error || errMsg;
    } catch(e) {}
    throw new Error(errMsg);
  }
  return response.json();
};

export const createDraft = async (to: string, subject: string, body: string) => {
  const response = await fetchWithAuth('/api/gmail/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, body }),
  });
  if (!response.ok) {
    throw new Error('Failed to create draft');
  }
  return response.json();
};

export const summarizeInbox = async (emails: Email[]): Promise<string> => {
  // Only send metadata to summarize to save bandwidth
  const payload = emails.map(e => ({
    subject: e.subject || '(No Subject)',
    from: e.from || 'Unknown',
    snippet: e.snippet || ''
  }));
  const response = await fetchWithAuth('/api/gmail/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to summarize inbox');
  }
  const data = await response.json();
  return data.summary;
};

export const generateSmartReply = async (messageId: string, sender: string, subject: string): Promise<string> => {
  const response = await fetchWithAuth('/api/gmail/smart-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, sender, subject }),
  });
  if (!response.ok) {
    throw new Error('Failed to generate smart reply');
  }
  const data = await response.json();
  return data.replyText;
};
