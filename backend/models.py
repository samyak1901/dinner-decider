from datetime import datetime, date

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    is_vegetarian = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    votes = relationship("Vote", back_populates="user")
    preferences = relationship("Preference", back_populates="user")


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    cuisine = Column(String(50))
    is_vegetarian = Column(Boolean, default=False)
    recipe_summary = Column(Text)
    ingredients = Column(Text)  # JSON array
    prep_steps = Column(Text)  # JSON array
    estimated_time_minutes = Column(Integer)
    youtube_video_url = Column(String(500))
    youtube_video_title = Column(String(300))
    source_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)


class DailySuggestion(Base):
    __tablename__ = "daily_suggestions"

    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    veg_alternative_meal_id = Column(Integer, ForeignKey("meals.id"), nullable=True)
    slot_number = Column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint("date", "slot_number"),)

    meal = relationship("Meal", foreign_keys=[meal_id])
    veg_alternative = relationship("Meal", foreign_keys=[veg_alternative_meal_id])
    votes = relationship("Vote", back_populates="daily_suggestion")


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    daily_suggestion_id = Column(
        Integer, ForeignKey("daily_suggestions.id"), nullable=False
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    voted_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "date"),)

    daily_suggestion = relationship("DailySuggestion", back_populates="votes")
    user = relationship("User", back_populates="votes")


class MealHistory(Base):
    __tablename__ = "meal_history"

    id = Column(Integer, primary_key=True)
    date = Column(Date, unique=True, nullable=False)
    winning_meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    total_votes = Column(Integer, default=0)
    was_cooked = Column(Boolean, default=True)
    rating = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    winning_meal = relationship("Meal")


class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cuisine = Column(String(50), nullable=False)
    preference_score = Column(Float, default=0.5)

    __table_args__ = (UniqueConstraint("user_id", "cuisine"),)

    user = relationship("User", back_populates="preferences")
