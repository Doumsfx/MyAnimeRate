import os
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import hashlib

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Database connection ────────────────────────────────────────────────────────
DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
    f"@{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}"
    f"/{os.getenv('POSTGRES_DB')}"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── ORM Model ─────────────────────────────────────────────────────────────────
# These models are used to define the database schema and interact with the database using SQLAlchemy.
class Anime(Base):
    __tablename__ = "anime"

    id                  = Column(Integer, primary_key=True, index=True)
    title               = Column(String(255), nullable=False)
    score               = Column(Float)
    synopsis            = Column(Text)
    image_url           = Column(String(255), nullable=False)
    category            = Column(String(50))
    episodes            = Column(Integer)
    genres              = Column(String(255))
    themes              = Column(String(255))
    streaming_platforms = Column(String(255))

class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    password = Column(String(255), nullable=False)

# ── Pydantic Schema ────────────────────────────────────────────────────────────
# These schemas are used for request validation and response serialization in FastAPI.
class AnimeSchema(BaseModel):
    id:                  int
    title:               str
    score:               Optional[float]
    synopsis:            Optional[str]
    image_url:           str
    category:            Optional[str]
    episodes:            Optional[int]
    genres:              Optional[str]
    themes:              Optional[str]
    streaming_platforms: Optional[str]

    class Config:
        from_attributes = True

class UserSchema(BaseModel):
    id:       int
    username: str
    password: str

    class Config:
        from_attributes = True

class UserCreateSchema(BaseModel):
    username: str
    password: str

    class Config:
        from_attributes = True

# ── Dependency ─────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="MyAnimeRate API")

# ── Routes for Anime Management ────────────────────────────────────────────────
@app.get("/animes", response_model=list[AnimeSchema], summary="Get all animes", tags=["Anime"])
def getAllAnimes(db: Session = Depends(get_db)):
    return db.query(Anime).all()

@app.get("/animes/search-by-name/{name}", response_model=list[AnimeSchema], summary="Search animes by name", tags=["Anime"])
def getAnimeByName(name: str, db: Session = Depends(get_db)):
    results = db.query(Anime).filter(Anime.title.ilike(f"%{name}%")).all()
    if not results:
        raise HTTPException(status_code=404, detail=f"No anime found with name '{name}'")
    return results


# ── Routes for Users Management ────────────────────────────────────────────────
@app.post("/users/create", response_model=UserSchema, summary="Create a new user", tags=["User"])
def createUser(user: UserCreateSchema, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User with this username already exists")
    new_user = User(**user.model_dump())
    new_user.password = hashlib.sha256(user.password.encode()).hexdigest()  # Hash the password before storing
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put("/users/update-by-username/{username}", response_model=UserSchema, summary="Update an existing user", tags=["User"])
def updateUserByUsername(username: str, user: UserSchema, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with username {username} not found")
    for key, value in user.model_dump(exclude={"id"}).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/delete-by-username/{username}", summary="Delete a user by username", tags=["User"])
def deleteUserByUsername(username: str, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with username {username} not found")
    db.delete(db_user)
    db.commit()
    return {"detail": f"User with username {username} deleted successfully"}

