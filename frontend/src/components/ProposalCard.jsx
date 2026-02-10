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
  'Nope, try Yes!',
  'Oops!',
  'Not this one!',
  'Missed!',
];

const ProposalCard = ({ valentineName, customMessage, characterChoice, onAccept }) => {
  const [noAttempts, setNoAttempts] = useState(0);
  const [noButtonText, setNoButtonText] = useState('No');
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });
  const [yesScale, setYesScale] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [showNoButton, setShowNoButton] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef(null);
  const noButtonRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 
                  'ontouchstart' in window || 
                  navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get random text excluding current text
  const getRandomText = useCallback(() => {
    const availableTexts = noButtonTexts.filter(text => text !== noButtonText);
    return availableTexts[Math.floor(Math.random() * availableTexts.length)];
  }, [noButtonText]);

  // Move No button to random position within visible bounds
  const moveNoButton = useCallback(() => {
    if (!cardRef.current || noAttempts >= 3) return;

    const card = cardRef.current.getBoundingClientRect();
    const buttonWidth = isMobile ? 100 : 120;
    const buttonHeight = 50;
    const padding = isMobile ? 15 : 30;

    // Calculate bounds based on card size
    const maxX = Math.min((card.width / 2) - buttonWidth - padding, 150);
    const maxY = isMobile ? 100 : 150;

    // Generate random position
    const newX = (Math.random() * maxX * 2) - maxX;
    const newY = (Math.random() * maxY);

    setNoButtonPosition({ x: newX, y: newY });
  }, [noAttempts, isMobile]);

  // Handle all mischievous actions
  const handleMischief = useCallback((isClick = false) => {
    if (noAttempts >= 3) return;

    // Always move the button
    moveNoButton();

    // On click, do additional mischief
    if (isClick) {
      const newAttempts = noAttempts + 1;
      setNoAttempts(newAttempts);

      // Change the text to something funny
      setNoButtonText(getRandomText());

      // Grow the Yes button by 20%
      setYesScale(1 + newAttempts * 0.25);

      // Hide after 3 attempts
      if (newAttempts >= 3) {
        setTimeout(() => setShowNoButton(false), 400);
      }
    }
  }, [noAttempts, moveNoButton, getRandomText]);

  // Desktop: Move on hover
  const handleMouseEnter = () => {
    if (!isMobile) {
      handleMischief(false);
    }
  };

  // Mobile: Move on touch start (before click registers)
  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Move immediately on touch
    handleMischief(false);
  };

  // Handle actual click/tap
  const handleNoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleMischief(true);
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
      className="valentine-card p-6 md:p-12 max-w-md w-full mx-auto text-center relative overflow-visible"
      style={{ minHeight: isMobile ? '480px' : '550px' }}
    >
      <AnimatePresence mode="wait">
        {!accepted ? (
          <motion.div
            key="proposal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 md:gap-6"
          >
            {/* Character Animation */}
            <div className={isMobile ? 'w-40 h-40' : ''}>
              <CharacterAnimation characterType={characterChoice} />
            </div>

            {/* Question Text */}
            <div className="space-y-1 md:space-y-2">
              <h1 
                className="font-heading text-xl md:text-3xl font-bold text-valentine-primary"
                data-testid="valentine-name-display"
              >
                {valentineName},
              </h1>
              <p 
                className="font-heading text-lg md:text-2xl font-semibold text-gray-700 px-2"
                data-testid="proposal-message"
              >
                {customMessage || 'Will you be my Valentine?'}
              </p>
            </div>

            {/* Buttons Container */}
            <div 
              className="relative w-full mt-4 md:mt-8 flex flex-col items-center" 
              style={{ minHeight: isMobile ? '160px' : '180px' }}
            >
              {/* Yes Button - grows with each No attempt */}
              <motion.button
                data-testid="yes-button"
                onClick={handleYesClick}
                animate={{ scale: yesScale }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="valentine-btn-yes py-3 px-6 md:px-8 text-base md:text-xl pulse-glow z-10 touch-manipulation"
                style={{ 
                  transformOrigin: 'center',
                  minWidth: isMobile ? '120px' : '140px',
                }}
              >
                Yes! <Heart className="inline ml-1" size={isMobile ? 16 : 20} />
              </motion.button>

              {/* No Button - mischievous behavior */}
              <AnimatePresence>
                {showNoButton && (
                  <motion.button
                    ref={noButtonRef}
                    data-testid="no-button"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0, rotate: 180 }}
                    animate={{ 
                      x: noButtonPosition.x, 
                      y: noButtonPosition.y + (isMobile ? 55 : 70),
                      scale: Math.max(0.6, 1 - noAttempts * 0.1)
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={handleNoClick}
                    onMouseEnter={handleMouseEnter}
                    onTouchStart={handleTouchStart}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      handleMischief(false);
                    }}
                    className="valentine-btn-no py-2 md:py-3 px-5 md:px-8 text-base md:text-xl absolute touch-manipulation select-none"
                    style={{ 
                      zIndex: 5,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      userSelect: 'none',
                    }}
                  >
                    {noButtonText}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Show hint after No button disappears */}
              {!showNoButton && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-gray-400 text-sm mt-16 md:mt-20 font-body"
                >
                  There's only one choice now... 💕
                </motion.p>
              )}
            </div>

            {/* Mobile hint */}
            {isMobile && showNoButton && noAttempts === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 2 }}
                className="text-xs text-gray-400 font-body"
              >
                Tip: Try tapping the No button 😉
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="accepted"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8"
          >
            {/* Celebration Character */}
            <div className={isMobile ? 'w-40 h-40' : ''}>
              <CharacterAnimation characterType={characterChoice} />
            </div>

            {/* Success Message */}
            <div className="space-y-3 md:space-y-4">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-heading text-2xl md:text-4xl font-extrabold text-valentine-primary"
                data-testid="success-message"
              >
                Yay! 
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="font-heading text-lg md:text-2xl font-semibold text-gray-600"
              >
                See you on the 14th!
              </motion.p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
              >
                <Heart 
                  className="text-valentine-primary fill-valentine-primary mx-auto" 
                  size={isMobile ? 60 : 80} 
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProposalCard;
