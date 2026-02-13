from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import Base, SessionLocal, engine
from backend.models import User
from backend.routers import history, suggestions, users, votes
from backend.scheduler import create_scheduler

SEED_USERS = [
    {"name": "Samyak", "is_vegetarian": True},
    {"name": "Friend2", "is_vegetarian": False},
    {"name": "Friend3", "is_vegetarian": False},
    {"name": "Friend4", "is_vegetarian": False},
]


def seed_users():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            for u in SEED_USERS:
                db.add(User(**u))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_users()
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Dinner Decider", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])
app.include_router(votes.router, prefix="/api/votes", tags=["votes"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(users.router, prefix="/api/users", tags=["users"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
