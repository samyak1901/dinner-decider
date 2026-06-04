import {
  AuthStatus,
  DaySuggestions,
  Favourite,
  HistoryResponse,
  Meal,
  MealCreate,
  ShoppingListResponse,
  User,
  VoteOut,
  VoteToday,
  WeekResponse,
} from './types';
export type { User };

const BASE = '/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    // Send the session cookie with every request so the server can identify
    // the household + acting member.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Auth ---
export function getAuthStatus(): Promise<AuthStatus> {
  return request<AuthStatus>('/auth/me');
}

export function login(passcode: string): Promise<AuthStatus> {
  return request<AuthStatus>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ passcode }),
  });
}

export function logout(): Promise<AuthStatus> {
  return request<AuthStatus>('/auth/logout', { method: 'POST' });
}

export function selectUser(userId: number): Promise<AuthStatus> {
  return request<AuthStatus>('/auth/select-user', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}

// --- Users ---
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

// --- Suggestions (acting member comes from the session) ---
export function getTodaySuggestions(): Promise<DaySuggestions> {
  return request<DaySuggestions>('/suggestions/today');
}

export function refreshSuggestions(): Promise<DaySuggestions> {
  return request<DaySuggestions>('/suggestions/refresh', { method: 'POST' });
}

// --- Votes (no user_id: identity is the session's) ---
export function castVote(dailySuggestionId: number | string): Promise<VoteOut> {
  return request<VoteOut>('/votes', {
    method: 'POST',
    body: JSON.stringify({ daily_suggestion_id: Number(dailySuggestionId) }),
  });
}

export function getTodayVotes(): Promise<VoteToday> {
  return request<VoteToday>('/votes/today');
}

// --- History ---
export function getHistory(page: number = 1): Promise<HistoryResponse> {
  return request<HistoryResponse>(`/history?page=${page}`);
}

export function rateMeal(date: string, rating: number, notes: string): Promise<unknown> {
  return request(`/history/${date}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating, notes }),
  });
}

export function markLeftovers(date: string): Promise<unknown> {
  return request(`/history/${date}/leftovers`, { method: 'POST' });
}

// --- Meals / recipes ---
export function getMeals(): Promise<Meal[]> {
  return request<Meal[]>('/meals');
}

export function createMeal(payload: MealCreate): Promise<Meal> {
  return request<Meal>('/meals', { method: 'POST', body: JSON.stringify(payload) });
}

export function getFavourites(): Promise<Favourite[]> {
  return request<Favourite[]>('/meals/favourites');
}

// --- Weekly plan ---
export function getWeek(start: string): Promise<WeekResponse> {
  return request<WeekResponse>(`/plan/week?start=${start}`);
}

export function pinMeal(date: string, mealId: number, note?: string): Promise<unknown> {
  return request(`/plan/${date}`, {
    method: 'PUT',
    body: JSON.stringify({ meal_id: mealId, note }),
  });
}

export function unpinMeal(date: string): Promise<void> {
  return request(`/plan/${date}`, { method: 'DELETE' });
}

export function getShoppingList(start: string, days: number): Promise<ShoppingListResponse> {
  return request<ShoppingListResponse>('/plan/shopping-list', {
    method: 'POST',
    body: JSON.stringify({ start, days }),
  });
}
