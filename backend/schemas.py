from datetime import date, datetime

from pydantic import BaseModel, Field


# --- Users ---
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    is_vegetarian: bool = False
    dietary_restrictions: str | None = Field(default=None, max_length=500)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    is_vegetarian: bool | None = None
    dietary_restrictions: str | None = Field(default=None, max_length=500)


class UserOut(BaseModel):
    id: int
    name: str
    is_vegetarian: bool
    dietary_restrictions: str | None = None

    model_config = {"from_attributes": True}


# --- Auth ---
class LoginRequest(BaseModel):
    passcode: str = Field(max_length=200)


class SelectUserRequest(BaseModel):
    user_id: int


class AuthStatus(BaseModel):
    authenticated: bool
    auth_required: bool
    current_user: UserOut | None = None

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


class MealCreate(BaseModel):
    """Manual recipe entry / import. Lists are JSON-encoded on save."""
    name: str = Field(min_length=1, max_length=200)
    cuisine: str | None = Field(default=None, max_length=50)
    is_vegetarian: bool = False
    recipe_summary: str | None = None
    ingredients: list[str] = []
    prep_steps: list[str] = []
    estimated_time_minutes: int | None = Field(default=None, ge=1, le=600)
    youtube_video_url: str | None = Field(default=None, max_length=500)
    source_url: str | None = Field(default=None, max_length=500)


# --- Weekly plan ---
class PlanDayOut(BaseModel):
    date: date
    meal: MealOut | None = None
    source: str  # "planned" | "history" | "none"
    is_pinned: bool = False
    was_cooked: bool = True
    note: str | None = None


class WeekResponse(BaseModel):
    start: date
    days: list[PlanDayOut]


class PinRequest(BaseModel):
    meal_id: int
    note: str | None = Field(default=None, max_length=500)


# --- Shopping list ---
class ShoppingListRequest(BaseModel):
    start: date
    days: int = Field(default=7, ge=1, le=31)


class ShoppingItem(BaseModel):
    item: str
    meals: list[str]  # which meals contributed this ingredient


class ShoppingListResponse(BaseModel):
    start: date
    days: int
    items: list[ShoppingItem]


# --- Favourites ---
class FavouriteOut(BaseModel):
    meal: MealOut
    avg_rating: float
    times_cooked: int
    last_cooked: date


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
    # No user_id: the acting member is taken from the session, never the body.
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
    winning_meal: MealOut | None = None  # None on a "leftovers / no cook" day
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
    rating: float = Field(ge=1, le=5)
    notes: str | None = Field(default=None, max_length=1000)
