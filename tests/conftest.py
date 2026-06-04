"""Test fixtures.

Environment is configured *before* importing the app so the module-level
engine/settings bind to an isolated temp database with auth enabled.
"""

import os
import tempfile

_TMPDIR = tempfile.mkdtemp(prefix="dinner_decider_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMPDIR}/test.db"
os.environ["HOUSEHOLD_PASSCODE"] = "testpass"
os.environ["SESSION_SECRET"] = "testsecret"
os.environ.setdefault("GOOGLE_API_KEY", "test-key")

from datetime import date  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend.database import Base, SessionLocal, engine  # noqa: E402
from backend.main import app  # noqa: E402
from backend.models import DailySuggestion, Meal, User  # noqa: E402

PASSCODE = "testpass"


@pytest.fixture(autouse=True)
def _schema():
    """Fresh schema per test (create_all is fine here; migrations are tested
    separately by the startup path)."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    # No context manager: skip lifespan (migrations/scheduler); schema is
    # already created by the _schema fixture.
    return TestClient(app)


@pytest.fixture
def auth_client(client):
    resp = client.post("/api/auth/login", json={"passcode": PASSCODE})
    assert resp.status_code == 200
    return client


def make_user(db, name="Alex", is_vegetarian=False, dietary=None):
    user = User(name=name, is_vegetarian=is_vegetarian, dietary_restrictions=dietary)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def make_suggestion(db, slot, cuisine="Mexican", name=None, on=None):
    meal = Meal(name=name or f"Meal {slot}", cuisine=cuisine, is_vegetarian=False)
    db.add(meal)
    db.flush()
    suggestion = DailySuggestion(
        date=on or date.today(), meal_id=meal.id, slot_number=slot
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return suggestion
