/**
 * Large pet icon by type (dog/cat/parrot/rabbit). Color and subtle animation depend on emotion.
 */
import { motion } from "framer-motion";
import { DogIcon, Cat, Bird, Rabbit } from "lucide-react";

interface PetAvatarProps {
  emotion: "happy" | "sad" | "okay" | "grumpy" | "neutral" | "sleeping";
  type: string;
}

const PetIcon = ({ type, className }: { type: string; className: string }) => {
  switch (type) {
    case "cat":
      return <Cat className={className} strokeWidth={1.5} />;
    case "parrot":
      return <Bird className={className} strokeWidth={1.5} />;
    case "rabbit":
      return <Rabbit className={className} strokeWidth={1.5} />;
    case "dog":
    default:
      return <DogIcon className={className} strokeWidth={1.5} />;
  }
};

const emotionColors = {
  happy: "text-accent",
  okay: "text-primary",
  sad: "text-blue-400",
  grumpy: "text-destructive",
  neutral: "text-muted-foreground",
  sleeping: "text-purple-400",
};

const emotionAnimations = {
  happy: { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] },
  okay: { scale: 1 },
  sad: { y: [0, 5, 0] },
  grumpy: { x: [-2, 2, -2, 2, 0], rotate: [0, -5, 5, 0] },
  neutral: { scale: 1 },
  sleeping: { y: [0, -3, 0], opacity: [1, 0.8, 1] },
};

export const PetAvatar = ({ emotion, type }: PetAvatarProps) => {
  return (
    <div className="flex items-center justify-center py-5">
      <motion.div
        animate={emotionAnimations[emotion]}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`${emotionColors[emotion]} transition-colors duration-500`}
      >
        <PetIcon type={type} className="w-[172px] h-[172px] drop-shadow-lg" />
      </motion.div>
    </div>
  );
};
