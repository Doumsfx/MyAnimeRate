import Favorite from '../../assets/favorite.svg?react';
import FavoriteRed from '../../assets/favorite_red.svg?react';

interface AnimeCardProps {
    title: string;
    imageUrl: string;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onClick: () => void;
    existingRatingScore: number | null;
}

function AnimeCard({ title, imageUrl, isFavorite, onToggleFavorite, onClick, existingRatingScore }: AnimeCardProps) {
    
    const getScoreColor = (score: number): string => {
        if (score >= 8) return '#06B800';
        if (score >= 6) return '#1FC974';
        if (score >= 4) return '#F8CD20';
        if (score >= 2) return '#FF8239';
        return '#FF3939';
    };

    return (
        <div className="card w-36 bg-base-300 shadow-xl cursor-pointer" onClick={onClick}>
            <figure className="relative h-52">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover"/>
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="absolute top-1 right-1 btn btn-circle btn-sm bg-black/65 border-none outline-none hover:bg-black/60">
                    {isFavorite ? <FavoriteRed className="w-5 h-5" /> : <Favorite className="w-5 h-5" />}
                </button>
                {existingRatingScore !== null && (
                    <div className="absolute top-1 left-1 text-white px-2 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: getScoreColor(existingRatingScore) }}>
                        {existingRatingScore.toFixed(1)}
                    </div>
                )}
            </figure>

            <div className="card-body p-2 items-center justify-center">
                <h2 className="card-title text-xs line-clamp-2 leading-tight text-center">{title}</h2>
            </div>
        </div>
    );
}

export default AnimeCard;

