import { fetchWithAuth } from './api';

export const userService = {
  getSettings: async (): Promise<{ customInstructions: string }> => {
    const response = await fetchWithAuth('/api/user/settings');
    if (!response.ok) throw new Error('Failed to fetch user settings');
    return response.json();
  },

  updateSettings: async (customInstructions: string): Promise<void> => {
    const response = await fetchWithAuth('/api/user/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customInstructions })
    });
    
    if (!response.ok) throw new Error('Failed to update user settings');
  }
};
