from datetime import date, datetime

from pydantic import BaseModel


# --- Users ---
class UserCreate(BaseModel):
    name: str
    is_vegetarian: bool = False


class UserCreate(BaseModel):
    name: str
    is_vegetarian: bool = False
    dietary_restrictions: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    is_vegetarian: bool | None = None
    dietary_restrictions: str | None = None


class UserOut(BaseModel):
    id: int
    name: str
    is_vegetarian: bool
    dietary_restrictions: str | None = None

    model_config = {"from_attributes": True}


# --- Meals ---
class MealOut(BaseModel):
    id: int
    name: str
    cuisine: str | None = None
    is_vegetarian: bool
    recipe_summary: str | None = None
    ingredients: str | None = None  # JSON string
    prep_steps: str | None = None  # JSON string
    estimated_time_minutes: int | None = None
    youtube_video_url: str | None = None
    youtube_video_title: str | None = None
    source_url: str | None = None

    model_config = {"from_attributes": True}


# --- Daily Suggestions ---
class DailySuggestionOut(BaseModel):
    id: int
    date: date
    slot_number: int
    meal: MealOut
    veg_alternative: MealOut | None = None
    vote_count: int = 0
    voters: list[str] = []

    model_config = {"from_attributes": True}


class SuggestionsResponse(BaseModel):
    date: date
    suggestions: list[DailySuggestionOut]
    user_vote_id: int | None = None  # which suggestion the current user voted for


# --- Votes ---
class VoteRequest(BaseModel):
    user_id: int
    daily_suggestion_id: int


class VoteOut(BaseModel):
    id: int
    date: date
    daily_suggestion_id: int
    user_id: int
    voted_at: datetime

    model_config = {"from_attributes": True}


class VoteTodayResponse(BaseModel):
    date: date
    votes: list[VoteOut]
    vote_counts: dict[int, int]  # suggestion_id -> count
    winner_id: int | None = None
    is_tie: bool = False


# --- History ---
class MealHistoryOut(BaseModel):
    id: int
    date: date
    winning_meal: MealOut
    total_votes: int
    was_cooked: bool
    rating: float | None = None
    notes: str | None = None

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    items: list[MealHistoryOut]
    page: int
    total_pages: int
    total_items: int


class RateRequest(BaseModel):
    rating: float
    notes: str | None = None
