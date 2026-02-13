import { DaySuggestions, HistoryItem, User } from './types';

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
