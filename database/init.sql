-- ============================================================
-- MyAnimeRate database initialization script
-- ============================================================

-- Drop tables if they already exist (for a clean re-initialization)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS anime CASCADE;
DROP TABLE IF EXISTS rating CASCADE;

-- ============================================================
-- TABLE : users
-- ============================================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL
);

-- ============================================================
-- TABLE : anime
-- ============================================================
CREATE TABLE anime (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    score               REAL,
    synopsis            TEXT,
    image_url           VARCHAR(255) NOT NULL,
    category            VARCHAR(50),
    episodes            INTEGER,              
    genres              VARCHAR(255),
    themes              VARCHAR(255),
    streaming_platforms VARCHAR(255)
);

-- ============================================================
-- TABLE : rating
-- ============================================================
CREATE TABLE rating (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    anime_id        INTEGER     NOT NULL REFERENCES anime(id)  ON DELETE CASCADE,
    animation       REAL        NOT NULL,
    story           REAL        NOT NULL,
    characters      REAL        NOT NULL,
    world_building  REAL        NOT NULL,
    openings        REAL        NOT NULL,
    endings         REAL        NOT NULL,
    ost             REAL        NOT NULL,
    pacing          REAL        NOT NULL,
    global_score    REAL        NOT NULL,
    UNIQUE (user_id, anime_id)   -- a user can only rate an anime once
);
