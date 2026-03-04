import os
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

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

# ── Pydantic Schema ────────────────────────────────────────────────────────────
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

# ── Dependency ─────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="MyAnimeRate API")

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/animes", response_model=list[AnimeSchema], summary="Get all animes")
def getAllAnimes(db: Session = Depends(get_db)):
    return db.query(Anime).all()


@app.get("/animes/search/by-name", response_model=list[AnimeSchema], summary="Search animes by name")
def getAnimeByName(
    name: str = Query(..., min_length=1, description="Partial or full anime title"),
    db: Session = Depends(get_db),
):
    results = db.query(Anime).filter(Anime.title.ilike(f"%{name}%")).all()
    if not results:
        raise HTTPException(status_code=404, detail=f"No anime found with name '{name}'")
    return results


@app.get("/animes/{anime_id}", response_model=AnimeSchema, summary="Get an anime by ID")
def getAnimeById(anime_id: int, db: Session = Depends(get_db)):
    anime = db.query(Anime).filter(Anime.id == anime_id).first()
    if not anime:
        raise HTTPException(status_code=404, detail=f"Anime with id {anime_id} not found")
    return anime