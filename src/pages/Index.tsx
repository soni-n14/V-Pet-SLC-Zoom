/**
 * Main app flow: intro → pet selection → dashboard.
 * Dogs get time-of-day initial hunger/energy; other pets use config defaults.
 * Restores dashboard + pet from localStorage when returning (e.g. from Q&A).
 */
import { useState } from "react";
import { IntroSequence } from "@/components/IntroSequence";
import { PetSelection } from "@/components/PetSelection";
import { Dashboard } from "@/components/Dashboard";
import { petConfigs, PetType } from "@/lib/petConfig";

function getInitialStageAndPet(): { stage: "intro" | "selection" | "dashboard"; pet: any } {
  if (typeof window === "undefined") return { stage: "intro", pet: null };
  const introSeen = localStorage.getItem("vpet_intro_seen") === "true";
  const saved = localStorage.getItem("vpet_pet_data");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.pet && data.pet.name && data.pet.type) {
        if (introSeen) return { stage: "dashboard", pet: data.pet };
      }
    } catch (_) {
      /* ignore */
    }
  }
  if (introSeen) return { stage: "selection", pet: null };
  return { stage: "intro", pet: null };
}

const Index = () => {
  const initial = getInitialStageAndPet();
  const [stage, setStage] = useState<"intro" | "selection" | "dashboard">(initial.stage);
  const [pet, setPet] = useState<any>(initial.pet);

  const handleIntroComplete = (currentPet: any) => {
    if (currentPet) {
      setStage("dashboard");
    } else {
      localStorage.setItem("vpet_intro_seen", "true");
      setStage("selection");
    }
  };

  const handleReplayIntro = () => {
    setStage("intro");
  };

  /** Dog: hunger/energy vary by time (sleep 10p–6a, feeds ~7a and 7p). Other pets: use config. */
  const calculateInitialStats = (type: string) => {
    const petConfig = petConfigs[type as PetType] || petConfigs.dog;

    if (type === "dog") {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const totalMinutesFromMidnight = currentHour * 60 + currentMinute;
      
      // Time markers
      const sixAM = 360; // 6 AM
      const sevenAM = 420; // 7 AM (morning feed)
      const eightAM = 480; // 8 AM
      const sevenPM = 1140; // 7 PM (evening feed)
      const tenPM = 1320; // 10 PM (sleep start)
      
      let hunger: number;
      let energy: number;
      
      // Calculate hunger based on time
      if (totalMinutesFromMidnight < sixAM) {
        // Before 6 AM: Hunger = 25% (hungry, needs feeding soon)
        hunger = 25;
      } else if (totalMinutesFromMidnight < eightAM) {
        // 6-8 AM: Hunger drops from 25% as morning feed approaches
        const minutesSinceSixAM = totalMinutesFromMidnight - sixAM;
        const minutesUntilEightAM = eightAM - sixAM; // 120 minutes
        hunger = Math.max(20, 25 - (minutesSinceSixAM / minutesUntilEightAM * 5)); // Drops from 25% to 20%
      } else if (totalMinutesFromMidnight < sevenPM) {
        // After morning feed (8 AM) until evening feed (7 PM): Hunger starts at 90%, decays
        const minutesSinceSevenAM = totalMinutesFromMidnight - sevenAM;
        const decayRate = 6.75; // -1% every 6.75 min
        hunger = Math.max(0, 90 - (minutesSinceSevenAM / decayRate));
      } else if (totalMinutesFromMidnight < tenPM) {
        // After evening feed (7 PM) until sleep (10 PM): Hunger resets to 90%, then decays
        const minutesSinceSevenPM = totalMinutesFromMidnight - sevenPM;
        const decayRate = 6.75;
        hunger = Math.max(0, 90 - (minutesSinceSevenPM / decayRate));
      } else {
        // After 10 PM: Hunger decreases slowly during sleep to 20% by 6 AM
        const minutesSinceTenPM = totalMinutesFromMidnight - tenPM;
        const totalSleepMinutes = 480; // 10 PM to 6 AM = 8 hours
        const hungerAtTenPM = 90 - ((tenPM - sevenPM) / 6.75); // Hunger at 10 PM after evening feed decay
        const hungerDecayDuringSleep = (hungerAtTenPM - 20) / totalSleepMinutes;
        hunger = Math.max(20, hungerAtTenPM - (minutesSinceTenPM * hungerDecayDuringSleep));
      }
      
      // Calculate energy based on time
      if (totalMinutesFromMidnight >= tenPM || totalMinutesFromMidnight < sixAM) {
        // During sleep (10 PM to 6 AM): Energy regenerates from 25% to 85%
        const sleepStart = totalMinutesFromMidnight >= tenPM ? tenPM : 0;
        const minutesIntoSleep = totalMinutesFromMidnight >= tenPM 
          ? totalMinutesFromMidnight - tenPM 
          : totalMinutesFromMidnight + (1440 - tenPM);
        const totalSleepMinutes = 480; // 8 hours
        const energyGainDuringSleep = 60 / totalSleepMinutes; // Gain 60% over 8 hours
        energy = Math.min(85, 25 + (minutesIntoSleep * energyGainDuringSleep));
      } else {
        // During day (6 AM to 10 PM): Energy drains from 85% to 25%
        const minutesSinceSixAM = totalMinutesFromMidnight - sixAM;
        const totalDayMinutes = 960; // 16 hours
        const energyDrainRate = 60 / totalDayMinutes; // Lose 60% over 16 hours
        energy = Math.max(25, 85 - (minutesSinceSixAM * energyDrainRate));
      }
      
      return {
        hunger: Math.round(hunger),
        happiness: petConfig.initialStats.happiness,
        hygiene: petConfig.initialStats.hygiene,
        energy: Math.round(energy),
        thirst: petConfig.initialStats.thirst,
      };
    }
    
    // For other pets, use config initial stats
    return petConfig.initialStats;
  };

  const handlePetSelect = (type: string, name: string) => {
    const petConfig = petConfigs[type as PetType] || petConfigs.dog;
    const newPet = {
      type,
      name,
      stats: calculateInitialStats(type),
      emotion: "happy" as const,
    };
    setPet(newPet);
    setStage("dashboard");
  };

  const handleReset = () => {
    setPet(null);
    localStorage.removeItem("vpet_pet_data"); // Clear saved pet data
    setStage("selection");
  };

  if (stage === "intro") {
    return <IntroSequence onComplete={() => handleIntroComplete(pet)} />;
  }

  if (stage === "selection") {
    return <PetSelection onSelectPet={handlePetSelect} />;
  }

  if (stage === "dashboard" && pet) {
    return <Dashboard pet={pet} onReset={handleReset} onReplayIntro={handleReplayIntro} />;
  }

  return null;
};

export default Index;
