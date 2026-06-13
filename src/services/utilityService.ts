import { fetchWithAuth } from './api';

export const utilityService = {
  async generateText(prompt: string): Promise<string> {
    const response = await fetchWithAuth('/api/utility/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate text');
    }

    const data = await response.json();
    return data.text;
  },

  async generateJson(prompt: string): Promise<string> {
    const response = await fetchWithAuth('/api/utility/generate-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate JSON');
    }

    const data = await response.json();
    return data.text;
  }
};
