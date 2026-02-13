export interface User {
  id: number;
  name: string;
  is_vegetarian: boolean;
  dietary_restrictions?: string;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  image_url?: string;
  video_url?: string;
  votes: string[]; // List of user IDs
  vote_count: number;
}

export interface DaySuggestions {
  date: string;
  suggestions: Suggestion[];
  user_vote_id?: string;
}

export interface HistoryItem {
  date: string;
  meal_title: string;
  votes: number;
}
