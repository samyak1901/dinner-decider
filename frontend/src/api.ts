import { DaySuggestions, HistoryItem, User } from './types';
export type { User };

const BASE = '/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export function getUsers(): Promise<User[]> {
  return request<User[]>('/users');
}

export function createUser(name: string, is_vegetarian: boolean, dietary_restrictions?: string): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify({ name, is_vegetarian, dietary_restrictions }),
  });
}

export function updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: number): Promise<void> {
  return request(`/users/${id}`, { method: 'DELETE' });
}

export function getTodaySuggestions(userId?: string): Promise<DaySuggestions> {
  const params = userId ? `?user_id=${userId}` : '';
  return request<DaySuggestions>(`/suggestions/today${params}`);
}

export function refreshSuggestions(userId?: string): Promise<DaySuggestions> {
  const params = userId ? `?user_id=${userId}` : '';
  return request<DaySuggestions>(`/suggestions/refresh${params}`, { method: 'POST' });
}

export function castVote(userId: string, dailySuggestionId: string): Promise<any> {
  return request('/votes', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, daily_suggestion_id: dailySuggestionId }),
  });
}

export function getTodayVotes(): Promise<any> {
  return request('/votes/today');
}

export function getHistory(page: number = 1): Promise<{ history: HistoryItem[] }> {
  return request<{ history: HistoryItem[] }>(`/history?page=${page}`);
}

export function rateMeal(date: string, rating: number, notes: string): Promise<any> {
  return request(`/history/${date}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating, notes }),
  });
}
