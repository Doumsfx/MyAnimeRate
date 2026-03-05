"""
Seed the Anime table from anime_infos.json.

Usage:
    python database/seed_anime.py
"""

import os
import json
import psycopg2
from dotenv import load_dotenv

# Load environment variables from the .env file at the project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Configuration ──────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL") or (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
    f"@{os.getenv('POSTGRES_HOST', 'localhost')}/{os.getenv('POSTGRES_DB')}"
)

JSON_FILE = os.path.join(os.path.dirname(__file__), "anime_infos.json")

INSERT_QUERY = """
    INSERT INTO Anime (title, score, synopsis, image_url, category, episodes, genres, themes, streaming_platforms)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT DO NOTHING;
"""

# ── Helpers ────────────────────────────────────────────────────────────────────
def join_list(value: list) -> str | None:
    """Convert a list to a comma-separated string, or None if empty."""
    return ", ".join(value) if value else None


def parse_episodes(value) -> int | None:
    """Return None if episodes is 'Unknown', otherwise return the integer."""
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print(f"\nConnecting to database...")
    conn = psycopg2.connect(DATABASE_URL)

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM Anime;")
            count = cur.fetchone()[0]
            if count > 0:
                print(f"\n[SKIP] Database already contains {count} anime entries. Skipping seed.")
                return

        print(f"Loading data from {JSON_FILE}...")
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            anime_list = json.load(f)

        inserted = 0
        skipped = 0

        with conn.cursor() as cur:
            for anime in anime_list:
                # skip entries missing NOT NULL fields (title, image_url)
                if not anime.get("title") or not anime.get("image_url"):
                    skipped += 1
                    continue
                cur.execute(INSERT_QUERY, (
                    anime.get("title"),
                    anime.get("score"),
                    anime.get("synopsis"),
                    anime.get("image_url"),
                    anime.get("type"),                      # JSON "type" → DB "category"
                    parse_episodes(anime.get("episodes")),  # "Unknown" → NULL
                    join_list(anime.get("genres", [])),
                    join_list(anime.get("themes", [])),
                    join_list(anime.get("streaming_platforms", [])),
                ))
                if cur.rowcount > 0:
                    inserted += 1
                else:
                    skipped += 1

        conn.commit()
        print(f"\n[OK] Done. {inserted} inserted, {skipped} skipped (title or image_url missing).")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
