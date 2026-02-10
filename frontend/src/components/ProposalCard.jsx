import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import CharacterAnimation from './CharacterAnimation';
import { Heart } from 'lucide-react';

const noButtonTexts = [
  'No',
  'Are you sure?',
  'Really?',
  'Think again!',
  'Wrong button!',
  'Try again!',
];

const ProposalCard = ({ valentineName, customMessage, characterChoice, onAccept }) => {
  const [noAttempts, setNoAttempts] = useState(0);
  const [noButtonText, setNoButtonText] = useState('No');
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });
  const [yesScale, setYesScale] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [showNoButton, setShowNoButton] = useState(true);
  const cardRef = useRef(null);

  const moveNoButton = useCallback(() => {
    if (!cardRef.current || noAttempts >= 3) return;

    const card = cardRef.current.getBoundingClientRect();
    const buttonWidth = 100;
    const buttonHeight = 48;
    const padding = 20;

    // Calculate random position within card bounds
    const maxX = card.width - buttonWidth - padding * 2;
    const maxY = card.height - buttonHeight - padding * 2;

    const newX = Math.random() * maxX - maxX / 2;
    const newY = Math.random() * maxY - maxY / 2;

    setNoButtonPosition({ x: newX, y: newY });
  }, [noAttempts]);

  const handleNoHover = () => {
    moveNoButton();
  };

  const handleNoTouch = (e) => {
    e.preventDefault();
    moveNoButton();
  };

  const handleNoClick = () => {
    const newAttempts = noAttempts + 1;
    setNoAttempts(newAttempts);

    // Change text
    setNoButtonText(noButtonTexts[Math.min(newAttempts, noButtonTexts.length - 1)]);

    // Grow Yes button
    setYesScale(1 + newAttempts * 0.2);

    // Move button
    moveNoButton();

    // Hide after 3 attempts
    if (newAttempts >= 3) {
      setTimeout(() => setShowNoButton(false), 300);
    }
  };

  const triggerHeartConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ['#FF4D6D', '#FF8FA3', '#FFB6C1', '#FF69B4', '#FF1493'];

    const heart = confetti.shapeFromPath({
      path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    });

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        shapes: [heart, 'circle'],
        scalar: 1.2,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        shapes: [heart, 'circle'],
        scalar: 1.2,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors,
      shapes: [heart, 'circle'],
      scalar: 1.5,
    });

    frame();
  };

  const handleYesClick = () => {
    setAccepted(true);
    triggerHeartConfetti();
    if (onAccept) {
      onAccept();
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="valentine-card p-8 md:p-12 max-w-md w-full mx-auto text-center relative overflow-visible"
      style={{ minHeight: '500px' }}
    >
      <AnimatePresence mode="wait">
        {!accepted ? (
          <motion.div
            key="proposal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Character Animation */}
            <CharacterAnimation characterType={characterChoice} />

            {/* Question Text */}
            <div className="space-y-2">
              <h1 
                className="font-heading text-2xl md:text-3xl font-bold text-valentine-primary"
                data-testid="valentine-name-display"
              >
                {valentineName},
              </h1>
              <p 
                className="font-heading text-xl md:text-2xl font-semibold text-gray-700"
                data-testid="proposal-message"
              >
                {customMessage || 'Will you be my Valentine?'}
              </p>
            </div>

            {/* Buttons Container */}
            <div className="relative w-full mt-8" style={{ minHeight: '120px' }}>
              {/* Yes Button */}
              <motion.button
                data-testid="yes-button"
                onClick={handleYesClick}
                animate={{ scale: yesScale }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="valentine-btn-yes py-3 px-8 text-lg md:text-xl pulse-glow"
                style={{ 
                  transformOrigin: 'center',
                  zIndex: 10,
                }}
              >
                Yes! <Heart className="inline ml-1" size={20} />
              </motion.button>

              {/* No Button */}
              <AnimatePresence>
                {showNoButton && (
                  <motion.button
                    data-testid="no-button"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      x: noButtonPosition.x, 
                      y: noButtonPosition.y,
                      scale: Math.max(0.7, 1 - noAttempts * 0.1)
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    onClick={handleNoClick}
                    onMouseEnter={handleNoHover}
                    onTouchStart={handleNoTouch}
                    className="valentine-btn-no py-3 px-8 text-lg md:text-xl absolute left-1/2 top-16"
                    style={{ 
                      marginLeft: '60px',
                      zIndex: 5,
                    }}
                  >
                    {noButtonText}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="accepted"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-6 py-8"
          >
            {/* Celebration Character */}
            <CharacterAnimation characterType={characterChoice} />

            {/* Success Message */}
            <div className="space-y-4">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-heading text-3xl md:text-4xl font-extrabold text-valentine-primary"
                data-testid="success-message"
              >
                Yay! 
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="font-heading text-xl md:text-2xl font-semibold text-gray-600"
              >
                See you on the 14th!
              </motion.p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="text-6xl"
              >
                <Heart className="text-valentine-primary fill-valentine-primary mx-auto" size={80} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProposalCard;
