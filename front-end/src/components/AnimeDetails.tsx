import { useState, useEffect } from 'react';
import Favorite from '../../assets/favorite.svg?react';
import FavoriteRed from '../../assets/favorite_red.svg?react';

// Define the structure of the ratings data
export interface RatingData {
    animation: number;
    story: number;
    characters: number;
    world_building: number;
    openings: number;
    endings: number;
    ost: number;
    pacing: number;
}

// Define the props for the AnimeDetails component
interface AnimeDetailsProps {
    title: string;
    score: number | null;
    synopsis: string | null;
    image_url: string;
    category: string | null;
    episodes: number | null;
    genres: string | null;
    themes: string | null;
    streaming_platforms: string | null;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onClose: () => void;
    existingRating: RatingData | null;
    onSaveRatings: (ratings: RatingData) => void;
    onDeleteRatings: () => void;
}

// Define the rating fields with their corresponding labels and icons
const ratingFields: { key: keyof RatingData; label: string; icon: string }[] = [
    { key: 'ost', label: 'OST', icon: '🎵' },
    { key: 'story', label: 'Story', icon: '📖' },
    { key: 'animation', label: 'Animation', icon: '🎨' },
    { key: 'characters', label: 'Characters', icon: '👥' },
    { key: 'world_building', label: 'World Building', icon: '🌍' },
    { key: 'openings', label: 'Openings', icon: '🎬' },
    { key: 'endings', label: 'Endings', icon: '🎶' },
    { key: 'pacing', label: 'Pacing', icon: '⏱️' },
];

// TODO: Mettre des beaux Svgs

const defaultRatings: RatingData = {
    animation: 0, story: 0, characters: 0, world_building: 0,
    openings: 0, endings: 0, ost: 0, pacing: 0,
};

// Decode HTML entities
const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

function AnimeDetails({ title, synopsis, image_url, category, episodes, genres, themes, streaming_platforms, isFavorite, onToggleFavorite, existingRating, onSaveRatings, onDeleteRatings }: AnimeDetailsProps) {
    const [ratings, setRatings] = useState<RatingData>(existingRating ?? defaultRatings);

    useEffect(() => {
        setRatings(existingRating ?? defaultRatings);
    }, [existingRating]);

    const average = +(ratingFields.map(f => ratings[f.key]).reduce((a, b) => a + b, 0) / ratingFields.length).toFixed(1);

    // Handle slider changes
    const handleSliderChange = (key: keyof RatingData, value: number) => {
        setRatings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-base-100 rounded-2xl shadow-xl w-[75vw] max-w-6xl max-h-[85vh] overflow-hidden flex">
            {/* Left Column */}
            <div className="w-1/3 flex flex-col bg-base-200 p-0">
                {/* Image + Favorite Button */}
                <div className="relative">
                    <img src={image_url} alt={title} className="w-full h-full object-cover rounded-tl-2xl" />

                    <button onClick={onToggleFavorite} className="absolute top-2 right-2 btn btn-circle btn-sm bg-black/75 border-none outline-none hover:bg-black/60">
                        {isFavorite ? <FavoriteRed className="w-6 h-6" /> : <Favorite className="w-6 h-6" />}
                    </button>
                </div>

                {/* Average Rating */}
                <div className="flex flex-col items-center py-4 border-b border-base-300">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl text-warning">⭐</span>
                        <span className="text-3xl font-bold">{average}</span>
                        <span className="text-base-content/60 text-lg">/10</span>
                    </div>
                    <span className="text-sm text-base-content/60 mt-1">Your average note</span>
                </div>

                {/* Anime Info */}
                <div className="flex flex-col gap-2 p-4 text-sm">
                    {category && (
                        <div className="flex items-center gap-2">
                            <span>📺</span>
                            <span>{category} {streaming_platforms != null ? `- ${streaming_platforms}` : ''}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span>📋</span>
                        <span>{episodes ? (episodes > 1 ? `${episodes} episodes` : '1 episode') : 'Unknown number of episodes'}</span>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-2/3 flex flex-col p-6 overflow-y-auto">
                {/* Title */}
                <h2 className="text-2xl font-bold mb-2">{title}</h2>

                {/* Genre Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {genres?.split(',').map((g, i) => (
                        <span key={i} className="badge badge-outline badge-primary">{g.trim()}</span>
                    ))}
                    {themes?.split(',').map((t, i) => (
                        <span key={`t-${i}`} className="badge badge-outline badge-secondary">{t.trim()}</span>
                    ))}
                </div>

                {/* Synopsis */}
                <p className="text-sm text-base-content/80 mb-6">{synopsis ? decodeHtmlEntities(synopsis) : 'No synopsis available.'}</p>

                {/* Rating Sliders */}
                <h3 className="text-lg font-bold mb-4">Rate this Anime</h3>
                <div className="flex flex-col gap-3">
                    {ratingFields.map(({ key, label, icon }) => (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span>{icon}</span>
                                    <span className="text-sm font-medium">{label}</span>
                                </div>
                                <span className="text-sm font-bold">{ratings[key]} <span className="text-base-content/50 font-normal">/10</span></span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={10}
                                step={0.1}
                                value={ratings[key]}
                                onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                                className="range range-primary range-sm w-full"
                            />
                        </div>
                    ))}
                </div>

                {/* Save Button + Delete Button */}
                <div className="flex justify-evenly">
                    {existingRating && (
                    <button
                        className="btn btn-error w-1/3 mt-6"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete your ratings for this anime?')) {
                                onDeleteRatings();
                            }
                        }}
                    >
                        Delete Ratings
                    </button>
                    )}
                    <button
                        className="btn btn-neutral w-1/3 mt-6"
                        onClick={() => onSaveRatings(ratings)}
                    >
                        Save Ratings
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AnimeDetails;

