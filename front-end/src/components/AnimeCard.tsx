import Favorite from '../../assets/favorite.svg?react';
import FavoriteRed from '../../assets/favorite_red.svg?react';

interface AnimeCardProps {
    title: string;
    imageUrl: string;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

function AnimeCard({ title, imageUrl, isFavorite, onToggleFavorite }: AnimeCardProps) {
    
    return (
        <div className="card w-36 bg-base-300 shadow-xl">
            <figure className="relative h-52">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover"/>
                <button onClick={onToggleFavorite} className="absolute top-1 right-1 btn btn-circle btn-sm bg-black/65 border-none outline-none hover:bg-black/60">
                    {isFavorite ? <FavoriteRed className="w-5 h-5" /> : <Favorite className="w-5 h-5" />}
                </button>
            </figure>

            <div className="card-body p-2 items-center justify-center">
                <h2 className="card-title text-xs line-clamp-2 leading-tight text-center">{title}</h2>
            </div>
        </div>
    );
}

export default AnimeCard;

