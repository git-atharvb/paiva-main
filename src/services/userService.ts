import { fetchWithAuth } from './api';

export interface UserSettings {
  customInstructions: string;
  assistantName: string;
  aboutUser: string;
  responseStyle: string;
  memoryEnabled: boolean;
  googleAccessToken?: string;
  calendarConnected?: boolean;
}

interface UserSettingsResponse {
  customInstructions?: string;
  assistantName?: string;
  aboutUser?: string;
  responseStyle?: string;
  memoryEnabled?: boolean | string;
  googleAccessToken?: string;
  calendarConnected?: boolean | string;
}

export const userService = {
  getSettings: async (): Promise<UserSettings> => {
    const response = await fetchWithAuth('/api/user/settings');
    if (!response.ok) throw new Error('Failed to fetch user settings');
    const data: UserSettingsResponse = await response.json();
    return {
      customInstructions: data.customInstructions || '',
      assistantName: data.assistantName || 'PAIVA',
      aboutUser: data.aboutUser || '',
      responseStyle: data.responseStyle || 'Balanced',
      memoryEnabled: data.memoryEnabled === undefined ? true : data.memoryEnabled === true || data.memoryEnabled === 'true',
      calendarConnected: data.calendarConnected === true || data.calendarConnected === 'true'
    };
  },

  updateSettings: async (settings: UserSettings): Promise<void> => {
    const response = await fetchWithAuth('/api/user/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) throw new Error('Failed to update user settings');
  }
};
