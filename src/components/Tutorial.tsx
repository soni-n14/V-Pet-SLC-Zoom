/**
 * Guided tour: highlights dashboard areas by data-tour id and shows a card. Skip or complete calls onComplete.
 */
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TutorialProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    id: "pet-display",
    title: "Meet Your Pet",
    description: "This is your pet! Their expression changes based on how well you care for them.",
    highlight: { top: "10%", left: "2%", width: "47%", height: "32%" },
  },
  {
    id: "actions",
    title: "Action Buttons",
    description: "Feed, walk, play, and care for your pet. Each action takes realistic time and may cost money.",
    highlight: { top: "44%", left: "2%", width: "47%", height: "46%" },
  },
  {
    id: "stats",
    title: "Pet Stats",
    description: "Monitor hunger, happiness, hygiene, health, and energy. These decrease over time and need your attention.",
    highlight: { top: "10%", left: "52%", width: "46%", height: "48%" },
  },
  {
    id: "spending",
    title: "Cost Tracker",
    description: "See exactly how much you've spent on realistic pet care costs.",
    highlight: { top: "60%", left: "52%", width: "46%", height: "14%" },
  },
  {
    id: "events",
    title: "Event Log",
    description: "Track all your pet care activities and important events here.",
    highlight: { top: "76%", left: "52%", width: "46%", height: "14%" },
  },
];

export const Tutorial = ({ onComplete }: TutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorialSteps[currentStep];
  const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const computeRect = () => {
    const el = document.querySelector(`[data-tour="${step.id}"]`) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      const padding = 8;
      setHighlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    }
  };

  useEffect(() => {
    computeRect();
    const onResize = () => computeRect();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [currentStep]);

  useEffect(() => {
    const target = document.querySelector(`[data-tour="${step.id}"]`) as HTMLElement | null;
    document.querySelectorAll(".tour-highlight").forEach((n) => {
      n.classList.remove("tour-highlight", "ring-4", "ring-primary", "brightness-110", "relative", "z-[60]");
    });
    if (target) {
      target.classList.add("tour-highlight", "ring-4", "ring-primary", "brightness-110", "relative", "z-[60]");
    }
    return () => {
      if (target) target.classList.remove("tour-highlight", "ring-4", "ring-primary", "brightness-110", "relative", "z-[60]");
    };
  }, [step.id]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  /** Place card to the right of highlight if space, else left. */
  const getTutorialCardPosition = (): CSSProperties => {
    const fallback = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" } as CSSProperties;
    if (!highlightRect) return fallback;
    const pad = 16;
    const viewportW = window.innerWidth;
    const rightSpace = viewportW - (highlightRect.left + highlightRect.width) - pad;
    const placeRight = rightSpace >= 380; // enough for card
    const left = placeRight ? highlightRect.left + highlightRect.width + pad : Math.max(16, highlightRect.left - 380 - pad);
    const top = Math.min(window.innerHeight - 220, Math.max(16, highlightRect.top));
    return { top, left } as CSSProperties;
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 pointer-events-auto" />

      {/* Tutorial card placed to the side of the highlight */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute bg-card border border-border rounded-xl p-6 shadow-2xl w-[360px] pointer-events-auto"
          style={getTutorialCardPosition()}
        >
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">{step.title}</h2>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-primary"
                      : index < currentStep
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <Button size="sm" onClick={handleNext}>
                {currentStep < tutorialSteps.length - 1 ? "Next" : "Got it!"}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
