export interface User {
  id: number;
  name: string;
  is_vegetarian: boolean;
  dietary_restrictions?: string | null;
}

// Mirrors backend MealOut. ingredients/prep_steps are JSON-encoded strings.
export interface Meal {
  id: number;
  name: string;
  cuisine?: string | null;
  is_vegetarian: boolean;
  recipe_summary?: string | null;
  ingredients?: string | null;
  prep_steps?: string | null;
  estimated_time_minutes?: number | null;
  youtube_video_url?: string | null;
  youtube_video_title?: string | null;
  source_url?: string | null;
}

// Mirrors backend DailySuggestionOut.
export interface Suggestion {
  id: number;
  date: string;
  slot_number: number;
  meal: Meal;
  veg_alternative?: Meal | null;
  vote_count: number;
  voters: string[];
}

// Mirrors backend SuggestionsResponse.
export interface DaySuggestions {
  date: string;
  suggestions: Suggestion[];
  user_vote_id?: number | null;
}

// Mirrors backend MealHistoryOut.
export interface HistoryItem {
  id: number;
  date: string;
  winning_meal: Meal;
  total_votes: number;
  was_cooked: boolean;
  rating?: number | null;
  notes?: string | null;
}

// Mirrors backend HistoryResponse.
export interface HistoryResponse {
  items: HistoryItem[];
  page: number;
  total_pages: number;
  total_items: number;
}

export interface AuthStatus {
  authenticated: boolean;
  auth_required: boolean;
  current_user: User | null;
}

export interface VoteOut {
  id: number;
  date: string;
  daily_suggestion_id: number;
  user_id: number;
  voted_at: string;
}

export interface VoteToday {
  date: string;
  vote_counts: Record<number, number>;
  winner_id: number | null;
  is_tie: boolean;
}

// --- Weekly plan ---
export interface PlanDay {
  date: string;
  meal: Meal | null;
  source: 'planned' | 'history' | 'none';
  is_pinned: boolean;
  was_cooked: boolean;
  note?: string | null;
}

export interface WeekResponse {
  start: string;
  days: PlanDay[];
}

// --- Shopping list ---
export interface ShoppingItem {
  item: string;
  meals: string[];
}

export interface ShoppingListResponse {
  start: string;
  days: number;
  items: ShoppingItem[];
}

// --- Favourites ---
export interface Favourite {
  meal: Meal;
  avg_rating: number;
  times_cooked: number;
  last_cooked: string;
}

// --- Recipe import ---
export interface MealCreate {
  name: string;
  cuisine?: string;
  is_vegetarian: boolean;
  recipe_summary?: string;
  ingredients: string[];
  prep_steps: string[];
  estimated_time_minutes?: number;
  youtube_video_url?: string;
  source_url?: string;
}
