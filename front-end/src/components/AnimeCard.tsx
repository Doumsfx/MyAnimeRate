import Favorite from '../../assets/favorite.svg?react';

interface AnimeCardProps {
    title: string;
    imageUrl: string;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

function AnimeCard({ title, imageUrl, isFavorite, onToggleFavorite }: AnimeCardProps) {
    
    return (
        <div className="card w-36 bg-base-300 shadow-xl">
            <figure className="relative">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover"/>
                <button onClick={onToggleFavorite} className="absolute top-1 right-1 btn btn-circle btn-sm bg-base-100/80 border-0 hover:bg-base-100">
                    <Favorite className={`w-5 h-5 fill-current ${isFavorite ? 'text-red-500' : 'text-gray-400'}`} />
                </button>
            </figure>

            <div className="card-body p-3 items-center justify-center">
                <h2 className="card-title text-xs line-clamp-1 leading-tight text-center">{title}</h2>
            </div>
        </div>
    );
}

export default AnimeCard;

