import { useEffect, useState } from 'react';
import AnimeGirl from '../assets/anime_girl.svg?react';
import Sun from '../assets/sun.svg?react';
import Moon from '../assets/moon.svg?react';
import Profile from '../assets/profile.svg?react';
import AnimeCard from './components/AnimeCard';

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

  const [animes, setAnimes] = useState<Anime[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  // Fetch animes and favorites on mount
  useEffect(() => {
    fetch('http://localhost:8000/animes?start_id=1&end_id=50')
      .then(res => res.json())
      .then((data: Anime[]) => setAnimes(data))
      .catch(err => console.error('Failed to fetch animes:', err));

    fetch(`http://localhost:8000/favorites/${userID}`)
      .then(res => res.json())
      .then((data: Anime[]) => {
        const ids = new Set(data.map(a => a.id));
        setFavoriteIds(ids);
        console.log('Favorites loaded:', [...ids]);
      })
      .catch(err => console.error('Failed to fetch favorites:', err));
  }, []);

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
      fetch('http://localhost:8000/animes?start_id=1&end_id=50')
        .then(res => res.json())
        .then((data: Anime[]) => setAnimes(data))
        .catch(err => console.error('Failed to search animes:', err));
    } else {
      fetch(`http://localhost:8000/animes/search/${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then((data: Anime[]) => setAnimes(data))
        .catch(err => console.error('Failed to search animes:', err));
    }
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
          <button className={`btn btn-ghost btn-secondary text-secondary-content border-0 px-3 ${page === 1 ? 'btn-active' : ''}`} onClick={() => setPage(1)}>My Rates</button>
          <button className={`btn btn-ghost btn-secondary text-secondary-content border-0 px-3 ${page === 2 ? 'btn-active' : ''}`} onClick={() => setPage(2)}>Favorites</button>
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
        <input type="text" placeholder="Search for an anime..." className="input input-primary w-96 focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
        <button className="btn btn-primary" onClick={searchAnimes}>Search</button>
      </div>

      {/* List of Animes */}
      <div className="flex flex-wrap gap-6 justify-center p-4">
        {animes.map(anime => (
          <AnimeCard
            key={anime.id}
            title={anime.title}
            imageUrl={anime.image_url}
            isFavorite={favoriteIds.has(anime.id)}
            onToggleFavorite={() => toggleFavorite(anime.id)}
          />
        ))}
      </div>
    

      {/* Page Switcher */}

    </div>
  )
}

export default App