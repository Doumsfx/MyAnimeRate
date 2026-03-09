import os
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Computed
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

# ── ORM Model ──────────────────────────────────────────────────────────────────
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

class Rating(Base):
    __tablename__ = "rating"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, nullable=False)
    anime_id        = Column(Integer, nullable=False)
    animation       = Column(Float, nullable=False)
    story           = Column(Float, nullable=False)
    characters      = Column(Float, nullable=False)
    world_building  = Column(Float, nullable=False)
    openings        = Column(Float, nullable=False)
    endings         = Column(Float, nullable=False)
    ost             = Column(Float, nullable=False)
    pacing          = Column(Float, nullable=False)
    global_note     = Column(Float, Computed("(animation + story + characters + world_building + openings + endings + ost + pacing) / 8"))

class Favorite(Base):
    __tablename__ = "favorite"

    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, nullable=False)
    anime_id = Column(Integer, nullable=False)


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

    class Config:
        from_attributes = True

class UserCreateSchema(BaseModel):
    username: str
    password: str

    class Config:
        from_attributes = True

class RatingSchema(BaseModel):
    id:              int
    user_id:         int
    anime_id:        int
    animation:       float
    story:           float
    characters:      float
    world_building:  float
    openings:        float
    endings:         float
    ost:             float
    pacing:          float
    global_note:     Optional[float]

    class Config:
        from_attributes = True

class RatingCreateSchema(BaseModel):
    user_id:         int
    anime_id:        int
    animation:       float
    story:           float
    characters:      float
    world_building:  float
    openings:        float
    endings:         float
    ost:             float
    pacing:          float

    class Config:
        from_attributes = True

class FavoriteSchema(BaseModel):
    id:       int
    user_id:  int
    anime_id: int

    class Config:
        from_attributes = True

class FavoriteCreateSchema(BaseModel):
    user_id:  int
    anime_id: int

    class Config:
        from_attributes = True


# ── Dependency ─────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Utility functions ──────────────────────────────────────────────────────────
def sortByScore(list: list[Anime]) -> list[Anime]:
    """Sort a list of Anime objects by their score in descending order."""
    return sorted(list, key=lambda anime: anime.score if anime.score is not None else 0, reverse=True)


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="MyAnimeRate API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes for Anime Management ────────────────────────────────────────────────
@app.get("/animes", response_model=list[AnimeSchema], summary="Get all animes", tags=["Animes"])
def getAllAnimes(start_id: int = Query(1, ge=1, description="ID de départ"),end_id: int = Query(50, ge=1, description="ID de fin"),db: Session = Depends(get_db)):
    if end_id < start_id:
        raise HTTPException(status_code=400, detail="end_id doit être supérieur ou égal à start_id")
    return db.query(Anime).filter(Anime.id >= start_id, Anime.id <= end_id).all()

@app.get("/animes/search/{name}", response_model=list[AnimeSchema], summary="Search animes by name", tags=["Animes"])
def getAnimeByName(name: str, db: Session = Depends(get_db)):
    results = db.query(Anime).filter(Anime.title.ilike(f"%{name}%")).all()
    if not results:
        raise HTTPException(status_code=404, detail=f"No anime found with name '{name}'")
    return results

@app.get("/animes/rated/{user_id}", response_model=list[AnimeSchema], summary="Get all animes that the user rates", tags=["Animes"])
def getAllAnimeThatUserRates(user_id: int, db: Session = Depends(get_db)):
    ratings = db.query(Rating).filter(Rating.user_id == user_id).order_by(Rating.global_note.desc()).all()
    anime_ids = [rating.anime_id for rating in ratings]
    animes = db.query(Anime).filter(Anime.id.in_(anime_ids)).all()
    order = {aid: i for i, aid in enumerate(anime_ids)}
    animes.sort(key=lambda a: order[a.id])
    return animes


# ── Routes for Users Management ────────────────────────────────────────────────
@app.post("/users/create", response_model=UserSchema, summary="Create a new user", tags=["Users"])
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

@app.put("/users/update/{username}", response_model=UserSchema, summary="Update an existing user", tags=["Users"])
def updateUserByUsername(username: str, user: UserSchema, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with username {username} not found")
    for key, value in user.model_dump(exclude={"id"}).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/delete/{username}", summary="Delete a user by username", tags=["Users"])
def deleteUserByUsername(username: str, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with username {username} not found")
    db.delete(db_user)
    db.commit()
    return {"detail": f"User with username {username} deleted successfully"}


# ── Routes for Ratings Management ───────────────────────────────────────────────
@app.post("/ratings/create", response_model=RatingSchema, summary="Create a new rating", tags=["Ratings"])
def createRating(rating: RatingCreateSchema, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.id == rating.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with id {rating.user_id} not found")

    # Check if anime exists
    db_anime = db.query(Anime).filter(Anime.id == rating.anime_id).first()
    if not db_anime:
        raise HTTPException(status_code=404, detail=f"Anime with id {rating.anime_id} not found")
    
    # Check if the user has already rated this anime
    existing_rating = db.query(Rating).filter(Rating.user_id == rating.user_id, Rating.anime_id == rating.anime_id).first()
    if existing_rating:
        raise HTTPException(status_code=400, detail=f"User with id {rating.user_id} has already rated anime with id {rating.anime_id}")

    new_rating = Rating(**rating.model_dump())
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)
    return new_rating

@app.put("/ratings/update/{rating_id}", response_model=RatingSchema, summary="Update an existing rating", tags=["Ratings"])
def updateRatingById(rating_id: int, rating: RatingCreateSchema, db: Session = Depends(get_db)):
    db_rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not db_rating:
        raise HTTPException(status_code=404, detail=f"Rating with id {rating_id} not found")
    for key, value in rating.model_dump(exclude={"user_id", "anime_id"}).items():
        setattr(db_rating, key, value)
    db.commit()
    db.refresh(db_rating)
    return db_rating

@app.get("/ratings/{user_id}", response_model=list[RatingSchema], summary="Get all ratings of a user", tags=["Ratings"])
def getAllRatingsByUser(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
    return db.query(Rating).filter(Rating.user_id == user_id).all()

@app.get("/ratings/{user_id}/{anime_id}", response_model=RatingSchema, summary="Get a specific rating", tags=["Ratings"])
def getSpecificRating(user_id: int, anime_id: int, db: Session = Depends(get_db)):
    # Check if anime exists
    db_anime = db.query(Anime).filter(Anime.id == anime_id).first()
    if not db_anime:
        raise HTTPException(status_code=404, detail=f"Anime with id {anime_id} not found")

    # Check if user exists
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")

    # Check if the user has rated this anime    
    db_rating = db.query(Rating).filter(Rating.anime_id == anime_id, Rating.user_id == user_id).first()
    if not db_rating:
        raise HTTPException(status_code=404, detail=f"Rating not found for user {user_id} and anime {anime_id}")
    
    return db_rating

@app.get("/ratings/{user_id}", response_model=list[RatingSchema], summary="Get all ratings of a user", tags=["Ratings"])
def getAllRatingsByUser(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
    return db.query(Rating).filter(Rating.user_id == user_id).all()


@app.delete("/ratings/delete/{rating_id}", summary="Delete a rating by id", tags=["Ratings"])
def deleteRatingById(rating_id: int, db: Session = Depends(get_db)):
    db_rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not db_rating:
        raise HTTPException(status_code=404, detail=f"Rating with id {rating_id} not found")
    db.delete(db_rating)
    db.commit()
    return {"detail": f"Rating with id {rating_id} deleted successfully"}


# ── Routes for Favorite Management ───────────────────────────────────────────────
@app.post("/favorites/add", summary="Add an anime to user's favorites", tags=["Favorites"])
def addFavorite(favorite: FavoriteCreateSchema, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.id == favorite.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with id {favorite.user_id} not found")

    # Check if anime exists
    db_anime = db.query(Anime).filter(Anime.id == favorite.anime_id).first()
    if not db_anime:
        raise HTTPException(status_code=404, detail=f"Anime with id {favorite.anime_id} not found")

    # Check if the anime is already in the user's favorites
    existing_favorite = db.query(Favorite).filter(Favorite.user_id == favorite.user_id, Favorite.anime_id == favorite.anime_id).first()
    if existing_favorite:
        raise HTTPException(status_code=400, detail=f"Anime with id {favorite.anime_id} is already in the favorites of user with id {favorite.user_id}")

    new_favorite = Favorite(user_id=favorite.user_id, anime_id=favorite.anime_id)
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    return new_favorite

@app.delete("/favorites/remove", summary="Remove an anime from user's favorites", tags=["Favorites"])
def removeFavorite(favorite: FavoriteCreateSchema, db: Session = Depends(get_db)):
    db_favorite = db.query(Favorite).filter(Favorite.user_id == favorite.user_id, Favorite.anime_id == favorite.anime_id).first()
    if not db_favorite:
        raise HTTPException(status_code=404, detail=f"Anime with id {favorite.anime_id} is not in the favorites of user with id {favorite.user_id}")
    db.delete(db_favorite)
    db.commit()
    return {"detail": f"Anime with id {favorite.anime_id} removed from favorites of user with id {favorite.user_id}"}

@app.get("/favorites/{user_id}", response_model=list[AnimeSchema], summary="Get all favorite animes of a user", tags=["Favorites"])
def getFavoritesByUserId(user_id: int, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")

    favorites = db.query(Favorite).filter(Favorite.user_id == user_id).all()
    anime_ids = [favorite.anime_id for favorite in favorites]
    return db.query(Anime).filter(Anime.id.in_(anime_ids)).all()