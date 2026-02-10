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
    name: 'Teddy Bear',
    lottieUrl: null,
    fallbackImage: 'https://images.unsplash.com/photo-1747847386084-2b299514f40c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwzfHxjdXRlJTIwdGVkZHklMjBiZWFyJTIwdmFsZW50aW5lJTIwaGVhcnR8ZW58MHx8fHwxNzcwNzQ1MjI2fDA&ixlib=rb-4.1.0&q=85',
    fallbackEmoji: '🧸',
  },
  bunny: {
    name: 'Love Bunny',
    lottieUrl: null,
    fallbackImage: 'https://images.unsplash.com/photo-1718459782489-5aeeb65522be?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwyfHxjdXRlJTIwYnVubnklMjByYWJiaXQlMjB2YWxlbnRpbmV8ZW58MHx8fHwxNzcwNzQ1MjMyfDA&ixlib=rb-4.1.0&q=85',
    fallbackEmoji: '🐰',
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
