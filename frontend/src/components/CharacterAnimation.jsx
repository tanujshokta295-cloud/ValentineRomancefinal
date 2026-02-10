import { useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';

const characters = {
  panda: {
    name: 'Cute Panda',
    lottieUrl: 'https://lottie.host/e1e68e5a-44a5-4a8e-8c1e-90f4f239f60f/BKqAJ58qKQ.json',
    fallbackImage: null,
    fallbackEmoji: '🐼',
  },
  bear: {
    name: 'Couple Teddy',
    lottieUrl: null,
    fallbackImage: 'https://customer-assets.emergentagent.com/job_cutematch-1/artifacts/ur3y0r94_couple-teddy-4096926_1280.jpg',
    fallbackEmoji: '🧸',
  },
  seal: {
    name: 'Sappy Seals',
    lottieUrl: null,
    gifUrl: 'https://media.tenor.com/H8oJvzwt1bMAAAAj/sappy-seals.gif',
    fallbackEmoji: '🦭',
  },
};

const CharacterAnimation = ({ characterType = 'panda', className = '' }) => {
  const [lottieError, setLottieError] = useState(false);
  const character = characters[characterType] || characters.panda;

  const handleLottieError = () => {
    setLottieError(true);
  };

  // Show fallback if no lottie URL or if lottie failed to load
  const showFallback = !character.lottieUrl || lottieError;

  // Check if it's a GIF character
  const isGif = character.gifUrl;

  return (
    <div className={`character-container bounce-soft ${className}`}>
      {!showFallback ? (
        <Player
          autoplay
          loop
          src={character.lottieUrl}
          style={{ width: '100%', height: '100%' }}
          onEvent={(event) => {
            if (event === 'error') {
              handleLottieError();
            }
          }}
        />
      ) : isGif ? (
        <div className="w-full h-full flex items-center justify-center">
          <img 
            src={character.gifUrl} 
            alt={character.name}
            className="w-full h-full object-contain rounded-2xl"
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {character.fallbackImage ? (
            <img 
              src={character.fallbackImage} 
              alt={character.name}
              className="w-full h-full object-cover rounded-2xl shadow-lg"
              onError={() => {
                // If image also fails, we'll still have the container
              }}
            />
          ) : (
            <span className="text-8xl">{character.fallbackEmoji}</span>
          )}
        </div>
      )}
    </div>
  );
};

export { characters };
export default CharacterAnimation;
