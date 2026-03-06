import { useEffect, useState } from 'react';
import AnimeGirl from '../assets/anime_girl.svg?react';
import Sun from '../assets/sun.svg?react';
import Moon from '../assets/moon.svg?react';
import Profile from '../assets/profile.svg?react';

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
  const [query, setQuery] = useState('');

  return (
    <div data-theme={theme} className="min-h-screen max-w-screen bg-base-200 flex flex-col">
      {/* NavBar */}
      <nav className="navbar bg-secondary text-primary-content shadow-sm">
        {/* Logo + Title */}
        <div className="flex items-center gap-2">
          <AnimeGirl className="w-10 h-10 fill-current" />
          <text className="text-xl font-bold">MyAnimeRate</text>
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
            <Sun className="swap-off w-7 h-7 fill-current" />

            {/* Moon Icon */}
            <Moon className="swap-on w-7 h-7 fill-current" />
          </label>

          {/* User Menu */}
          <Profile className="w-8 h-7 fill-current"/>
        </div>

      </nav>

      {/* Search Bar with Search Button*/}
      <div className="flex items-center gap-2 p-4 self-center">
        <input type="text" placeholder="Search for an anime..." className="input input-primary w-96 focus:outline-none" value={query} onChange={(e) => setQuery(e.target.value)}/>
        <button className="btn btn-primary">Search</button>
      </div>

      {/* List of Animes */}

      {/* Page Switcher */}

    </div>
  )
}

export default App