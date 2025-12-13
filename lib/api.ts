/**
 * API client utilities
 * Centralized API calls with auth token handling
 */

const API_BASE = '/api';

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  signup: (email: string, password: string, name?: string) =>
    apiCall<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    apiCall<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Ideas API
export const ideasApi = {
  list: () => apiCall<{ ideas: any[] }>('/ideas'),
  create: (content: string, source?: string) =>
    apiCall<{ idea: any }>('/ideas', {
      method: 'POST',
      body: JSON.stringify({ content, source }),
    }),
  update: (ideaId: string, content: string) =>
    apiCall<{ idea: any }>(`/ideas/${ideaId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
  delete: (ideaId: string) =>
    apiCall<{ success: boolean }>(`/ideas/${ideaId}`, {
      method: 'DELETE',
    }),
  refine: (ideaId: string) =>
    apiCall<{ refinedIdea: any }>(`/ideas/${ideaId}/refine`, {
      method: 'POST',
    }),
};

// Refined Ideas API
export const refinedIdeasApi = {
  list: () => apiCall<{ refinedIdeas: any[] }>('/refined-ideas'),
  delete: (refinedIdeaId: string) =>
    apiCall<{ success: boolean }>(`/refined-ideas/${refinedIdeaId}`, {
      method: 'DELETE',
    }),
};

// Mind Maps API
export const mindMapsApi = {
  list: () => apiCall<{ mindMaps: any[] }>('/mind-maps'),
  get: (mindMapId: string) =>
    apiCall<{ mindMap: any }>(`/mind-maps/${mindMapId}`),
  create: (refinedIdeaId: string, selectedAngle?: string) =>
    apiCall<{ mindMap: any }>('/mind-maps', {
      method: 'POST',
      body: JSON.stringify({ refinedIdeaId, selectedAngle }),
    }),
  update: (mindMapId: string, tree: any) =>
    apiCall<{ mindMap: any }>(`/mind-maps/${mindMapId}`, {
      method: 'PATCH',
      body: JSON.stringify({ tree }),
    }),
  delete: (mindMapId: string) =>
    apiCall<{ success: boolean }>(`/mind-maps/${mindMapId}`, {
      method: 'DELETE',
    }),
};

// Content History API
export const contentHistoryApi = {
  list: () => apiCall<{ history: any[] }>('/content-history'),
  add: (idea: string, angle: string, platform: string, themes?: string[]) =>
    apiCall<{ entry: any }>('/content-history', {
      method: 'POST',
      body: JSON.stringify({ idea, angle, platform, themes }),
    }),
  analyze: (currentIdea: string) =>
    apiCall<{ analysis: any }>('/content-history/analyze', {
      method: 'POST',
      body: JSON.stringify({ currentIdea }),
    }),
};

// Content Plans API
export const contentPlansApi = {
  list: () => apiCall<{ plans: any[] }>('/content-plans'),
  create: (mindMapId: string, platform: string, postingFrequency?: string) =>
    apiCall<{ plan: any }>('/content-plans', {
      method: 'POST',
      body: JSON.stringify({ mindMapId, platform, postingFrequency }),
    }),
};

// Drafts API
export const draftsApi = {
  list: () => apiCall<{ drafts: any[] }>('/drafts'),
  get: (draftId: string) =>
    apiCall<{ draft: any }>(`/drafts/${draftId}`),
  create: (contentPlanId: string) =>
    apiCall<{ draft: any }>('/drafts', {
      method: 'POST',
      body: JSON.stringify({ contentPlanId }),
    }),
  update: (draftId: string, content: string) =>
    apiCall<{ draft: any }>(`/drafts/${draftId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
  delete: (draftId: string) =>
    apiCall<{ success: boolean }>(`/drafts/${draftId}`, {
      method: 'DELETE',
    }),
  suggestPostTime: (draftId: string) =>
    apiCall<{ suggestion: { date: string; day: string; time: string; calendarUrl: string } }>(`/drafts/${draftId}/suggest-time`, {
      method: 'POST',
    }),
  generateImage: (content: string, platform: string) =>
    apiCall<{ imageUrl: string }>('/drafts/generate-image', {
      method: 'POST',
      body: JSON.stringify({ content, platform }),
    }),
  markAsPosted: (draftId: string) =>
    apiCall<{ success: boolean; historyId: string }>(`/drafts/${draftId}/post`, {
      method: 'POST',
    }),
};

