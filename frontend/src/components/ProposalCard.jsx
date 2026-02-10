import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import CharacterAnimation from './CharacterAnimation';
import { Heart } from 'lucide-react';

const noButtonTexts = [
  'Are you sure?',
  'Really?',
  'Think again!',
  'Wrong button!',
  'Try again!',
  'Nope, try Yes!',
  'Oops!',
  'Not this one!',
  'Missed!',
  'Nice try!',
];

const ProposalCard = ({ valentineName, customMessage, characterChoice, onAccept, isPreview = false }) => {
  const [noAttempts, setNoAttempts] = useState(0);
  const [noButtonText, setNoButtonText] = useState('No');
  const [noButtonStyle, setNoButtonStyle] = useState({ left: '60%', top: '70px' });
  const [yesButtonSize, setYesButtonSize] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [showNoButton, setShowNoButton] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

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

  // Move No button to random position
  const moveNoButton = useCallback(() => {
    if (!containerRef.current || noAttempts >= 3) return;

    const container = containerRef.current.getBoundingClientRect();
    const maxX = container.width - 120; // button width ~120px
    const maxY = 150;

    const randomX = Math.random() * maxX;
    const randomY = Math.random() * maxY + 60;

    setNoButtonStyle({
      left: `${randomX}px`,
      top: `${randomY}px`,
    });
  }, [noAttempts]);

  // Handle No button click - ALL mischief happens here
  const handleNoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (noAttempts >= 3) return;

    const newAttempts = noAttempts + 1;
    setNoAttempts(newAttempts);

    // 1. THE SWITCH: Change text to something funny
    setNoButtonText(getRandomText());

    // 2. THE GROWTH: Yes button grows 20% bigger each time
    setYesButtonSize(1 + (newAttempts * 0.2));

    // 3. THE RUNNER: Move to random position
    moveNoButton();

    // 4. THE VANISHING ACT: Disappear after 3 attempts
    if (newAttempts >= 3) {
      setTimeout(() => setShowNoButton(false), 500);
    }
  };

  // Handle hover (desktop) - just move
  const handleNoHover = () => {
    if (!isMobile && noAttempts < 3) {
      moveNoButton();
    }
  };

  // Handle touch start (mobile) - move away from finger
  const handleNoTouch = (e) => {
    e.preventDefault();
    if (noAttempts < 3) {
      moveNoButton();
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
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`valentine-card p-6 md:p-12 max-w-md w-full mx-auto text-center relative overflow-hidden ${isPreview ? 'shadow-[0_20px_50px_rgba(255,77,109,0.25)]' : ''}`}
      style={{ minHeight: isMobile ? '520px' : '580px' }}
    >
      {/* Preview Badge */}
      {isPreview && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#FF4D6D] text-white text-xs font-bold px-4 py-1 rounded-full shadow-md z-20">
          PREVIEW
        </div>
      )}

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
            <div className={isMobile ? 'w-36 h-36' : 'w-48 h-48'}>
              <CharacterAnimation characterType={characterChoice} />
            </div>

            {/* Question Text */}
            <div className="space-y-1 md:space-y-2">
              <h1 
                className="font-heading text-xl md:text-3xl font-bold"
                style={{ color: '#FF4D6D' }}
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
              ref={containerRef}
              className="relative w-full mt-4 md:mt-6" 
              style={{ height: isMobile ? '180px' : '200px' }}
            >
              {/* Yes Button - GROWS with each No attempt */}
              <div className="flex justify-center">
                <motion.button
                  data-testid="yes-button"
                  onClick={handleYesClick}
                  initial={{ scale: 1 }}
                  animate={{ scale: yesButtonSize }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 260, 
                    damping: 20,
                    duration: 0.5
                  }}
                  className="valentine-btn-yes py-3 px-8 md:px-10 text-lg md:text-xl pulse-glow touch-manipulation"
                  style={{ 
                    transformOrigin: 'center',
                    backgroundColor: '#FF4D6D',
                    color: 'white',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    boxShadow: '0 10px 25px rgba(255, 77, 109, 0.4)',
                    zIndex: 10,
                    position: 'relative',
                  }}
                >
                  Yes! <Heart className="inline ml-1" size={isMobile ? 18 : 22} fill="white" />
                </motion.button>
              </div>

              {/* No Button - MOVES, SHRINKS, and DISAPPEARS */}
              <AnimatePresence>
                {showNoButton && (
                  <motion.button
                    data-testid="no-button"
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0, rotate: 360 }}
                    animate={{ 
                      scale: Math.max(0.7, 1 - noAttempts * 0.1),
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={handleNoClick}
                    onMouseEnter={handleNoHover}
                    onTouchStart={handleNoTouch}
                    className="valentine-btn-no py-2 md:py-3 px-6 md:px-8 text-base md:text-lg absolute touch-manipulation select-none"
                    style={{ 
                      ...noButtonStyle,
                      backgroundColor: '#FF8FA3',
                      color: 'white',
                      borderRadius: '9999px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      zIndex: 5,
                      transition: 'left 0.3s ease-out, top 0.3s ease-out',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {noButtonText}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Hint after No button disappears */}
              {!showNoButton && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-gray-400 text-sm mt-16 text-center font-body"
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
            <div className={isMobile ? 'w-36 h-36' : 'w-48 h-48'}>
              <CharacterAnimation characterType={characterChoice} />
            </div>

            {/* Success Message */}
            <div className="space-y-3 md:space-y-4">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-heading text-2xl md:text-4xl font-extrabold"
                style={{ color: '#FF4D6D' }}
                data-testid="success-message"
              >
                Yay! 🎉
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
                  className="mx-auto" 
                  style={{ color: '#FF4D6D', fill: '#FF4D6D' }}
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
