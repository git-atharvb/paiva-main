import { fetchWithAuth } from './api';

export interface UserSettings {
  customInstructions: string;
  assistantName: string;
  aboutUser: string;
  responseStyle: string;
  memoryEnabled: boolean;
  googleAccessToken?: string;
  calendarConnected?: boolean;
  provider?: string;
  aiModel?: string;
  aiCreativity?: number;
  autoPlayVoice?: boolean;
  uiSoundsEnabled?: boolean;
  currentFocus?: string;
  expertiseLevel?: string;
  uiDensity?: string;
  preferredLanguage?: string;
  userDisplayName?: string;
}

interface UserSettingsResponse {
  customInstructions?: string;
  assistantName?: string;
  aboutUser?: string;
  responseStyle?: string;
  memoryEnabled?: boolean | string;
  googleAccessToken?: string;
  calendarConnected?: boolean | string;
  provider?: string;
  aiModel?: string;
  aiCreativity?: string | number;
  autoPlayVoice?: boolean | string;
  uiSoundsEnabled?: boolean | string;
  currentFocus?: string;
  expertiseLevel?: string;
  uiDensity?: string;
  preferredLanguage?: string;
  userDisplayName?: string;
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
      calendarConnected: data.calendarConnected === true || data.calendarConnected === 'true',
      provider: data.provider || 'LOCAL',
      aiModel: data.aiModel || 'paiva-core',
      aiCreativity: data.aiCreativity !== undefined ? Number(data.aiCreativity) : 50,
      autoPlayVoice: data.autoPlayVoice === undefined ? true : data.autoPlayVoice === true || data.autoPlayVoice === 'true',
      uiSoundsEnabled: data.uiSoundsEnabled === undefined ? true : data.uiSoundsEnabled === true || data.uiSoundsEnabled === 'true',
      currentFocus: data.currentFocus || '',
      expertiseLevel: data.expertiseLevel || 'Intermediate',
      uiDensity: data.uiDensity || 'Comfortable',
      preferredLanguage: data.preferredLanguage || 'English',
      userDisplayName: data.userDisplayName || '',
    };
  },

  async updateSettings(settings: UserSettings): Promise<void> {
    const response = await fetchWithAuth('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      throw new Error('Failed to update settings');
    }
  },

  async deleteAccount(): Promise<void> {
    const response = await fetchWithAuth('/api/user/account', {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete account');
    }
  }
};
