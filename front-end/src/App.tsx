import { useEffect, useState } from 'react';
import AnimeGirl from '../assets/anime_girl.svg?react';
import Sun from '../assets/sun.svg?react';
import Moon from '../assets/moon.svg?react';
import Profile from '../assets/profile.svg?react';
import AnimeCard from './components/AnimeCard';
import AnimeDetails from './components/AnimeDetails';

function App() {
  // State for theme (dark/light)
  const [isDark, setIsDark] = useState(
    JSON.parse(localStorage.getItem('isDark') || 'false')
  );
  useEffect(() => {
    localStorage.setItem('isDark', JSON.stringify(isDark));
  }, [isDark]);

  // Variables
  const theme = isDark ? 'lavender-dark' : 'lavender-light';
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const userID = 1;

  
  // API calls
  interface Anime {
    id: number;
    title: string;
    score: number | null;
    synopsis: string | null;
    image_url: string;
    category: string | null;
    episodes: number | null;
    genres: string | null;
    themes: string | null;
    streaming_platforms: string | null;
  }

  interface RatingData {
    animation: number;
    story: number;
    characters: number;
    world_building: number;
    openings: number;
    endings: number;
    ost: number;
    pacing: number;
    global_note?: number;
  }

  const [animes, setAnimes] = useState<Anime[]>([]);
  const [ratedAnimes, setRatedAnimes] = useState<Anime[]>([]);
  const [favoriteAnimes, setFavoriteAnimes] = useState<Anime[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [ratingsCache, setRatingsCache] = useState<Map<number, RatingData & { ratingId: number }>>(new Map());
  const [currentRating, setCurrentRating] = useState<RatingData | null>(null);

  // Fetch animes and favorites on mount
  useEffect(() => {
    fetch('http://localhost:8000/animes?start_id=1&end_id=99')
      .then(res => res.json())
      .then((data: Anime[]) => setAnimes(data))
      .catch(err => console.error('Failed to fetch animes:', err));

    fetch(`http://localhost:8000/favorites/${userID}`)
      .then(res => res.json())
      .then((data: Anime[]) => {
        const ids = new Set(data.map(a => a.id));
        setFavoriteIds(ids);
        setFavoriteAnimes(data);
      })
      .catch(err => console.error('Failed to fetch favorites:', err));

    fetch(`http://localhost:8000/ratings/${userID}`)
      .then(res => {
        if (res.status === 404) return [];
        if (!res.ok) throw new Error('Failed to fetch ratings');
        return res.json();
      })
      .then((data: (RatingData & { id: number; user_id: number; anime_id: number })[]) => {
        const cache = new Map<number, RatingData & { ratingId: number }>();
        data.forEach(r => {
          const { id, user_id, anime_id, ...ratingData } = r;
          cache.set(anime_id, { ...ratingData, ratingId: id });
        });
        setRatingsCache(cache);
      })
      .catch(err => console.error('Failed to fetch ratings:', err));
  }, []);

  /// Fetch rated animes and favorites when switching pages
  const fetchRatedAnimes = () => {
    fetch(`http://localhost:8000/animes/rated/${userID}`)
      .then(res => {
        if (res.status === 404) return [];
        if (!res.ok) throw new Error('Failed to fetch rated animes');
        return res.json();
      })
      .then((data: Anime[]) => setRatedAnimes(data))
      .catch(err => console.error('Failed to fetch rated animes:', err));
  };

  const fetchFavoriteAnimes = () => {
    fetch(`http://localhost:8000/favorites/${userID}`)
      .then(res => res.json())
      .then((data: Anime[]) => {
        setFavoriteAnimes(data);
        setFavoriteIds(new Set(data.map(a => a.id)));
      })
      .catch(err => console.error('Failed to fetch favorites:', err));
  };

    // Disable scroll when modal is open 
  useEffect(() => {
    if (modalOpen) {
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = scrollbarWidth + 'px';
    } else {
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.paddingRight = '';
    }
    return () => {
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.paddingRight = '';
    };
  }, [modalOpen]);


  /// Function to toggle favorite status of an anime
  const toggleFavorite = (animeId: number) => {
    const isFav = favoriteIds.has(animeId);
    const url = isFav ? 'http://localhost:8000/favorites/remove' : 'http://localhost:8000/favorites/add';
    const method = isFav ? 'DELETE' : 'POST';

    console.log(`${isFav ? 'Removing' : 'Adding'} anime ${animeId} from favorites...`);

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userID, anime_id: animeId }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to toggle favorite');
        setFavoriteIds(prev => {
          const next = new Set(prev);
          if (isFav) next.delete(animeId);
          else next.add(animeId);
          return next;
        });
      })
      .catch(err => console.error('Failed to toggle favorite:', err));
  };


  /// Function to search animes by title
  const searchAnimes = () => {
    if (!searchQuery.trim()) {
      fetch('http://localhost:8000/animes?start_id=1&end_id=99')
        .then(res => res.json())
        .then((data: Anime[]) => setAnimes(data))
        .catch(err => console.error('Failed to search animes:', err));
    } else {
      fetch(`http://localhost:8000/animes/search/${encodeURIComponent(searchQuery)}`)
        .then(res => {
          if (res.status === 404) return [];
          if (!res.ok) throw new Error('Failed to search animes');
          return res.json();
        })
        .then((data: Anime[]) => setAnimes(data))
        .catch(err => console.error('Failed to search animes:', err));
    }
  };

  
  /// Function to get existing rating for an anime from cache
  const getRating = (animeId: number): RatingData | null => {
    const cached = ratingsCache.get(animeId);
    if (!cached) return null;
    const { ratingId, ...ratingData } = cached;
    return ratingData;
  };

  /// Function to save Ratings (create or update)
  const saveRatings = (animeId: number, ratings: RatingData) => {
    const existing = ratingsCache.get(animeId);
    const url = existing
      ? `http://localhost:8000/ratings/update/${existing.ratingId}`
      : 'http://localhost:8000/ratings/create';
    const method = existing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userID, anime_id: animeId, ...ratings }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save ratings');
        return res.json();
      })
      .then((data: RatingData & { id: number; user_id: number; anime_id: number }) => {
        const { id, user_id, anime_id, ...ratingData } = data;
        setRatingsCache(prev => new Map(prev).set(animeId, { ...ratingData, ratingId: id }));
        setCurrentRating(ratingData);
      })
      .catch(err => console.error('Failed to save ratings:', err));
  };

  // ---------------------------------------------------------------------------------------


  // Front-end Part
  return (
    <div data-theme={theme} className="min-h-screen max-w-screen bg-base-200 flex flex-col">
      {/* NavBar */}
      <nav className="navbar bg-secondary text-primary-content shadow-sm sticky top-0 z-10">
        {/* Logo + Title */}
        <div className="flex items-center gap-2">
          <AnimeGirl className="w-10 h-10 fill-red" />
          <h1 className="text-xl font-bold">MyAnimeRate</h1>
        </div>

        {/* Options */}
        <div className="flex items-center gap-2 ml-5">
          <button className={`btn btn-ghost btn-secondary text-secondary-content border-0 px-3 ${page === 0 ? 'btn-active' : ''}`} onClick={() => setPage(0)}>All Animes</button>
          <button className={`btn btn-ghost btn-secondary text-secondary-content border-0 px-3 ${page === 1 ? 'btn-active' : ''}`} onClick={() => { setPage(1); fetchRatedAnimes(); }}>My Rates</button>
          <button className={`btn btn-ghost btn-secondary text-secondary-content border-0 px-3 ${page === 2 ? 'btn-active' : ''}`} onClick={() => { setPage(2); fetchFavoriteAnimes(); }}>Favorites</button>
        </div>

        {/* Theme Switcher + User Menu */}
        <div className="flex items-center gap-5 ml-auto mr-3">
          {/* Theme Switcher */}
          <label className="swap swap-rotate cursor-pointer *:transition-all *:duration-500">
            <input type="checkbox" className="theme-controller" checked={isDark} onChange={() => setIsDark(!isDark)}/>
            
            {/* Sun Icon */}
            <Sun className="swap-off w-7 h-7 text-current" />

            {/* Moon Icon */}
            <Moon className="swap-on w-7 h-7 text-current" />
          </label>

          {/* User Menu */}
          <Profile className="w-8 h-7 text-current"/>
        </div>

      </nav>

      {/* Search Bar with Search Button*/}
      <div className="flex items-center gap-2 p-4 self-center">
        <input type="text" placeholder="Search for an anime..." className="input input-primary w-96 focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && searchAnimes()}/>
        <button className="btn btn-primary" onClick={searchAnimes}>Search</button>
      </div>

      {/* List of Animes */}
      <div className="flex flex-wrap gap-6 justify-center p-4">
        {(page === 0 ? animes : page === 1 ? ratedAnimes : favoriteAnimes).length === 0 ? (
          <p className="text-base-content/60 text-lg mt-10">No anime found.</p>
        ) : (page === 0 ? animes : page === 1 ? ratedAnimes : favoriteAnimes).map(anime => (
          <AnimeCard
            key={anime.id}
            title={anime.title}
            imageUrl={anime.image_url}
            isFavorite={favoriteIds.has(anime.id)}
            onToggleFavorite={() => toggleFavorite(anime.id)}
            onClick={() => {
              setSelectedAnime(anime);
              setCurrentRating(getRating(anime.id));
              setModalOpen(true);
            }}
            existingRatingScore={ratingsCache.get(anime.id)?.global_note ?? null}
          />
        ))}
      </div>
    

      {/* Page Switcher */}

      {/* Modal for Anime Details */}
      {modalOpen && selectedAnime != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20" onClick={() => setModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
          <AnimeDetails
            title={selectedAnime?.title || ''}
            score={selectedAnime?.score || null}
            synopsis={selectedAnime?.synopsis || null}
            image_url={selectedAnime?.image_url?.replace(/\.jpg$/, 'l.jpg') || ''}
            category={selectedAnime?.category || null}
            episodes={selectedAnime?.episodes || null}
            genres={selectedAnime?.genres || null}
            themes={selectedAnime?.themes || null}
            streaming_platforms={selectedAnime?.streaming_platforms || null}
            isFavorite={favoriteIds.has(selectedAnime?.id || 0)}
            onToggleFavorite={() => selectedAnime && toggleFavorite(selectedAnime.id)}
            existingRating={currentRating}
            onClose={() => setModalOpen(false)}
            onSaveRatings={(ratings) => { saveRatings(selectedAnime.id, ratings); setModalOpen(false); }}
          />
          </div>
        </div>
      )}

    </div>
  )
}

export default App