/**
 * Full-screen intro with typewriter messages. Click or key advances; last message calls onComplete.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroSequenceProps {
  onComplete: () => void;
}

const messages = [
  "Welcome to V-Pet",
  "V-Pet allows future pet-owners to know what they will deal with when they choose to house a pet",
  "This includes time, responsibilities, and money spent",
  "Why is this important?",
  "About 1 in every 5 pets are returned/sent away after adoption",
  "Most of these pets fall into depression with this house hopping",
  "This is not good for their well being",
  "Now let's get started.",
];

export const IntroSequence = ({ onComplete }: IntroSequenceProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    const text = messages[currentIndex];
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 30); // Speed of letter animation

    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    setShowPrompt(false);
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  useEffect(() => {
    const handleAdvance = () => {
      if (currentIndex < messages.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete();
      }
    };

    const handleClick = () => handleAdvance();
    const handleKeyPress = () => handleAdvance();

    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentIndex, onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 cursor-pointer">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            x: [0, 10, -10, 10, 0], // Floating effect
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ 
            duration: 0.6,
            x: {
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="max-w-4xl px-8 text-center"
        >
          <p className="text-3xl md:text-4xl lg:text-5xl text-white font-light leading-relaxed tracking-wide">
            {displayedText}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
        {messages.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-white"
                : index < currentIndex
                ? "w-1.5 bg-white/50"
                : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Click/Press prompt */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 text-white/60 text-sm"
          >
            Click or press any key to continue
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
