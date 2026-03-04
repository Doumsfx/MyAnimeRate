-- ============================================================
-- MyAnimeRate database initialization script
-- ============================================================

-- Drop tables if they already exist (for a clean re-initialization)
DROP TABLE IF EXISTS User CASCADE;
DROP TABLE IF EXISTS Anime CASCADE;
DROP TABLE IF EXISTS Rating CASCADE;

-- ============================================================
-- TABLE : User
-- ============================================================
CREATE TABLE User (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL
);

-- ============================================================
-- TABLE : Anime
-- ============================================================
CREATE TABLE Anime (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    score               REAL         NOT NULL DEFAULT 0,
    synopsis            TEXT,
    image_url           VARCHAR(255) NOT NULL,
    category            VARCHAR(50)  NOT NULL,
    episodes            INTEGER      NOT NULL,
    genres              VARCHAR(255),
    themes              VARCHAR(255),
    streaming_platforms VARCHAR(255)
);

-- ============================================================
-- TABLE : Rating
-- ============================================================
CREATE TABLE Rating (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER     NOT NULL REFERENCES User(id)   ON DELETE CASCADE,
    anime_id        INTEGER     NOT NULL REFERENCES Anime(id)  ON DELETE CASCADE,
    animation       REAL        NOT NULL,
    story           REAL        NOT NULL,
    characters      REAL        NOT NULL,
    world_building  REAL        NOT NULL,
    openings        REAL        NOT NULL,
    endings         REAL        NOT NULL,
    ost             REAL        NOT NULL,
    global_score    REAL        NOT NULL,
    UNIQUE (user_id, anime_id)   -- a user can only rate an anime once
);
