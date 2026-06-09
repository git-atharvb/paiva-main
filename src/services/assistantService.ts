import { fetchWithAuth } from './api';

export interface AssistantModel {
  id: string;
  name: string;
  capability: string;
}

export const assistantService = {
  getModels: async (): Promise<AssistantModel[]> => {
    const response = await fetchWithAuth('/api/assistant/models');
    if (!response.ok) throw new Error('Failed to fetch assistant models');
    return response.json();
  }
};
