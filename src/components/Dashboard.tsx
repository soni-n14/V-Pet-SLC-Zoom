import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DogIcon, Droplets, Heart, Sparkles, Battery, DollarSign, Clock, HelpCircle, Plus, Stethoscope, ShoppingBag, GlassWater, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PetAvatar } from "./PetAvatar";
import { ActionButton } from "./ActionButton";
import { EventLog } from "./EventLog";
import { StatBar } from "./StatBar";
import { Tutorial } from "./Tutorial";
import { InitialPurchase } from "./InitialPurchase";
import { OptionsMenu } from "./OptionsMenu";
import { Report } from "./Report";
import { toast } from "sonner";
import { petConfigs, PetType } from "@/lib/petConfig";

/**
 * Main care screen: pet display, stats, actions, events, spending. Loads/saves to vpet_pet_data.
 * Stat decay and sleep use petConfig; dog Feed is free until 120 feeds then $25 + extra time.
 */
interface Pet {
  type: string;
  name: string;
  stats: {
    hunger: number;
    happiness: number;
    hygiene: number;
    energy: number;
    thirst: number;
  };
  emotion: "happy" | "sad" | "okay" | "grumpy" | "neutral" | "sleeping";
}

interface EventEntry {
  message: string;
  timestamp: Date;
}

interface DashboardProps {
  pet: Pet;
  onReset: () => void;
}

export const Dashboard = ({ pet: initialPet, onReset }: DashboardProps) => {
  const [pet, setPet] = useState(initialPet);
  const [totalSpent, setTotalSpent] = useState(0);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionTimer, setActionTimer] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [lastRestTime, setLastRestTime] = useState(Date.now());
  const [feedCountdown, setFeedCountdown] = useState<string | null>(null);
  const [waterCountdown, setWaterCountdown] = useState<string | null>(null);
  const [walkCountdown, setWalkCountdown] = useState<string | null>(null);
  const [bathCountdown, setBathCountdown] = useState<string | null>(null);
  const [trimNailsCountdown, setTrimNailsCountdown] = useState<string | null>(null);
  const [hasToy, setHasToy] = useState(false);
  const [initialPurchases, setInitialPurchases] = useState({
    collar: false,
    harness: false,
    bed: false,
    bowls: false,
    toy: false,
  });
  const [lastWalkTime, setLastWalkTime] = useState<number>(0);
  const [lastBathTime, setLastBathTime] = useState<number>(0);
  const [lastTrimNailsTime, setLastTrimNailsTime] = useState<number>(0);
  const [showInitialPurchase, setShowInitialPurchase] = useState(false);
  const [feedCount, setFeedCount] = useState<number>(0);
  const [showReport, setShowReport] = useState(false);
  /** History of stat snapshots for report graphs; capped at 500, appended when pet.stats change. */
  const [statHistory, setStatHistory] = useState<{ t: number; stats: typeof pet.stats }[]>([]);
  const lastAppendedStatsRef = useRef<string>("");

  const petConfig = petConfigs[pet.type as PetType] || petConfigs.dog;

  useEffect(() => {
    const savedData = localStorage.getItem("vpet_pet_data");
    if (!savedData || savedData === "{}") {
      // New pet, show initial purchase
      setShowInitialPurchase(true);
    }
  }, []);

  const handleInitialPurchaseComplete = (cost: number) => {
    setShowInitialPurchase(false);
    setTotalSpent((prev) => prev + cost);
    setHasToy(true);
    setInitialPurchases({
      collar: true,
      harness: true,
      bed: true,
      bowls: true,
      toy: true,
    });
    addEvent(`Purchased all essentials for $${cost}`);
    toast.success("All set! Your pet is ready to go!");
    
    // Show tutorial after initial purchase if it should be shown
    const shouldShowTutorial = localStorage.getItem("vpet_show_tutorial");
    if (shouldShowTutorial === "true") {
      setShowTutorial(true);
      localStorage.removeItem("vpet_show_tutorial");
    }
  };

  /** Restore saved pet, stats (with offline decay), and cooldowns when same pet. */
  useEffect(() => {
    const savedData = localStorage.getItem("vpet_pet_data");
    
    // Only load saved data if it matches the current pet
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        // Check if this is the same pet (same name and type)
        if (parsed.pet.name === initialPet.name && parsed.pet.type === initialPet.type) {
          const lastSaved = new Date(parsed.lastSaved);
          const now = new Date();
          const minutesElapsed = (now.getTime() - lastSaved.getTime()) / (1000 * 60);
          
          // Calculate stat decay based on time elapsed
          const calculateDecay = (stat: number, decayRate: number, hours: number) => {
            const currentHour = now.getHours();
            const isNighttime = currentHour >= 22 || currentHour < 6;
            
            // During nighttime (10pm-6am), hunger and happiness barely decrease
            if (isNighttime && (decayRate === 1 || decayRate === 0.5)) {
              return Math.max(0, stat - (decayRate * 0.2 * hours));
            }
            
            return Math.max(0, stat - (decayRate * hours));
          };
          
          const hoursElapsed = minutesElapsed / 60;
          const newStats = {
            hunger: calculateDecay(parsed.pet.stats.hunger, 1, hoursElapsed),
            happiness: calculateDecay(parsed.pet.stats.happiness, 0.5, hoursElapsed),
            hygiene: calculateDecay(parsed.pet.stats.hygiene, 0.3, hoursElapsed),
            energy: calculateDecay(parsed.pet.stats.energy, 0.4, hoursElapsed),
            thirst: calculateDecay(parsed.pet.stats.thirst || 80, 2, hoursElapsed), // Decays faster than hunger
          };
          
          setPet({
            ...parsed.pet,
            stats: newStats,
            emotion: updateEmotion(newStats),
          });
          setTotalSpent(parsed.totalSpent || 0);
          setEvents(parsed.events || []);
          setHasToy(parsed.hasToy || false);
          setInitialPurchases(parsed.initialPurchases || initialPurchases);
          setLastWalkTime(parsed.lastWalkTime || 0);
          setLastBathTime(parsed.lastBathTime || 0);
          setLastTrimNailsTime(parsed.lastTrimNailsTime || 0);
          setFeedCount(parsed.feedCount ?? 0);
          setStatHistory(parsed.statHistory ?? []);
          
          if (minutesElapsed > 5) {
            addEvent(`Welcome back! ${Math.floor(minutesElapsed)} minutes have passed.`);
          }
        } else {
          // Different pet, clear old data and use new pet
          localStorage.removeItem("vpet_pet_data");
        }
      } catch (e) {
        console.error("Failed to load saved data:", e);
      }
    }
    
    // Check if tutorial should be shown (after pet creation)
    // Only check tutorial if initial purchase is not needed
    if (!savedData || savedData === "{}") {
      // New pet - don't check tutorial yet, it will show after initial purchase
      return;
    }
    
    const shouldShowTutorial = localStorage.getItem("vpet_show_tutorial");
    if (shouldShowTutorial === "true") {
      setShowTutorial(true);
      localStorage.removeItem("vpet_show_tutorial");
    }
  }, []);

  const handleTutorialComplete = () => {
    localStorage.setItem("vpet_tutorial_seen", "true");
    setShowTutorial(false);
    toast.success("Tutorial complete! You're ready to care for your pet.");
  };

  const handleReplayTutorial = () => {
    setShowTutorial(true);
  };

  const addEvent = (message: string) => {
    setEvents((prev) => [{ message, timestamp: new Date() }, ...prev].slice(0, 20));
  };

  const updateEmotion = (stats: typeof pet.stats, sleeping: boolean = false) => {
    if (sleeping) return "sleeping";
    if (stats.happiness >= 80) return "happy";
    if (stats.happiness >= 50) return "okay";
    if (stats.happiness >= 20) return "sad";
    return "grumpy";
  };

  /** Start a timed action; on finish apply statChanges, call extraEffects, toast. */
  const handleAction = (
    action: string,
    cost: number,
    duration: number,
    statChanges: Partial<typeof pet.stats>,
    extraEffects?: () => void
  ) => {
    setActiveAction(action);
    setActionTimer(duration);
    setTotalSpent((prev) => prev + cost);
    
    if (cost > 0) {
      addEvent(`Spent $${cost} on ${action.toLowerCase()}`);
    }

    // Countdown timer
    const interval = setInterval(() => {
      setActionTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveAction(null);
          
          // Apply stat changes
          setPet((currentPet) => {
            const newStats = { ...currentPet.stats, ...statChanges };
            return {
              ...currentPet,
              stats: newStats,
              emotion: updateEmotion(newStats),
            };
          });
          
          // Apply extra effects if any
          if (extraEffects) {
            extraEffects();
          }
          
          addEvent(`Finished ${action.toLowerCase()}`);
          toast.success(`${action} complete!`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const statsKey = JSON.stringify(pet.stats);
    const shouldAppend = statsKey !== lastAppendedStatsRef.current;
    const nextHistory = shouldAppend
      ? [...statHistory, { t: Date.now(), stats: pet.stats }].slice(-500)
      : statHistory;
    if (shouldAppend) {
      lastAppendedStatsRef.current = statsKey;
      setStatHistory(nextHistory);
    }
    const dataToSave = {
      pet,
      totalSpent,
      events,
      hasToy,
      initialPurchases,
      lastWalkTime,
      lastBathTime,
      lastTrimNailsTime,
      feedCount,
      statHistory: nextHistory,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem("vpet_pet_data", JSON.stringify(dataToSave));
  }, [pet, totalSpent, events, hasToy, initialPurchases, lastWalkTime, lastBathTime, lastTrimNailsTime, feedCount, statHistory]);

  useEffect(() => {
    const checkSleepCycle = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const { start, end } = petConfig.sleepHours;
      const shouldBeSleeping = start > end 
        ? (currentHour >= start || currentHour < end) // e.g., 22-6
        : (currentHour >= start && currentHour < end); // e.g., 20-7
      
      if (shouldBeSleeping && !isSleeping) {
        setIsSleeping(true);
        addEvent(`${pet.name} fell asleep 😴`);
        toast.info(`${pet.name} is sleeping. See you in the morning!`);
      } else if (!shouldBeSleeping && isSleeping) {
        setIsSleeping(false);
        addEvent(`${pet.name} woke up! ☀️`);
        toast.success(`${pet.name} is awake and ready for the day!`);
      }
    };
    
    checkSleepCycle();
    const sleepCheckInterval = setInterval(checkSleepCycle, 60000); // Check every minute
    
    return () => clearInterval(sleepCheckInterval);
  }, [isSleeping, pet.name]);

  /** Every 30s: apply decay from petConfig (or sleep regen for energy/hunger). */
  useEffect(() => {
    const decayInterval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const totalMinutesFromMidnight = currentHour * 60 + currentMinute;
      
      const { start, end } = petConfig.sleepHours;
      const sleepStartMinutes = start * 60;
      const sleepEndMinutes = end * 60;
      const isDaytime = start > end
        ? (totalMinutesFromMidnight < sleepStartMinutes && totalMinutesFromMidnight >= sleepEndMinutes)
        : (totalMinutesFromMidnight >= sleepEndMinutes && totalMinutesFromMidnight < sleepStartMinutes);
      
      if (!activeAction && !isSleeping) {
        const timeSinceLastRest = Date.now() - lastRestTime;
        const minutesSinceRest = timeSinceLastRest / (1000 * 60);
        
        setPet((currentPet) => {
          const hungerMultiplier = currentPet.stats.hunger < 25 ? 1.5 : 1;
          const hygieneMultiplier = currentPet.stats.hygiene < 40 ? 1.5 : 1;
          
          const decay = petConfig.decayRates;
          
          // Energy: drains faster during day, slight regen when idle
          const energyChange = isDaytime 
            ? -(1 / decay.energy) * 0.5 // Drains based on pet config
            : Math.min(2, minutesSinceRest / 10); // Slight regen when idle at night
          
          const newStats = {
            ...currentPet.stats,
            hunger: Math.max(0, currentPet.stats.hunger - (1 / decay.hunger) * 0.5),
            happiness: Math.max(0, currentPet.stats.happiness - ((1 / decay.happiness) * 0.5 * hungerMultiplier * hygieneMultiplier)),
            hygiene: Math.max(0, currentPet.stats.hygiene - (1 / (decay.hygiene * 2)) * 0.5), // Convert hours to minutes
            energy: Math.min(100, Math.max(0, currentPet.stats.energy + energyChange)),
            thirst: Math.max(0, currentPet.stats.thirst - (1 / decay.thirst) * 0.5),
          };
          
          return {
            ...currentPet,
            stats: newStats,
            emotion: updateEmotion(newStats, isSleeping),
          };
        });
        
        setLastRestTime(Date.now());
      } else if (isSleeping) {
        // During sleep: hunger decreases slowly, energy regenerates strongly
        setPet((currentPet) => {
          const { start, end } = petConfig.sleepHours;
          const sleepDuration = start > end ? (24 - start + end) : (end - start);
          const totalSleepMinutes = sleepDuration * 60;
          const hungerAtSleep = currentPet.stats.hunger;
          const targetHungerByMorning = 20;
          const hungerDecayRate = Math.max(0, (hungerAtSleep - targetHungerByMorning) / totalSleepMinutes);
          const decay = petConfig.decayRates;
          
          const newStats = {
            ...currentPet.stats,
            hunger: Math.max(20, currentPet.stats.hunger - (hungerDecayRate * 0.5)), // Slow decay to 20%
            happiness: Math.max(0, currentPet.stats.happiness - ((1 / decay.happiness) * 0.5 * 0.3)), // Very slow happiness decay
            hygiene: Math.max(0, currentPet.stats.hygiene - ((1 / (decay.hygiene * 2)) * 0.5 * 0.5)), // Half rate
            energy: Math.min(100, currentPet.stats.energy + 0.8), // Strong regeneration during sleep
            thirst: Math.max(15, currentPet.stats.thirst - ((currentPet.stats.thirst - 15) / totalSleepMinutes * 0.5)), // Slow decay during sleep
          };
          
          return {
            ...currentPet,
            stats: newStats,
            emotion: updateEmotion(newStats, true),
          };
        });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(decayInterval);
  }, [activeAction, isSleeping, lastRestTime]);

  useEffect(() => {
    if (isSleeping || activeAction) return;
    
    const idleEventInterval = setInterval(() => {
      const rand = Math.random();
      
      if (rand < 0.02) { // 2% chance every 2 minutes
        if (pet.stats.happiness < 50) {
          addEvent(`${pet.name} is waiting for attention 🥺`);
        } else {
          const idleEvents = [
            `${pet.name} is napping peacefully 😴`,
            `${pet.name} barked at a sound 🐕`,
            `${pet.name} is watching you curiously 👀`,
          ];
          addEvent(idleEvents[Math.floor(Math.random() * idleEvents.length)]);
        }
      }
    }, 120000); // Check every 2 minutes
    
    return () => clearInterval(idleEventInterval);
  }, [isSleeping, activeAction, pet.stats.happiness, pet.name]);

  /** Countdowns for feed/water/exercise/bath/grooming from config thresholds and cooldowns. */
  useEffect(() => {
    const updateCountdowns = () => {
      const config = petConfig.actions;
      const decay = petConfig.decayRates;
      
      // Feed countdown
      if (pet.stats.hunger < config.feed.triggerThreshold) {
        setFeedCountdown(null);
      } else {
        const hungerDifference = pet.stats.hunger - config.feed.triggerThreshold;
        const minutesUntilFeed = hungerDifference * decay.hunger;
        const hours = Math.floor(minutesUntilFeed / 60);
        const minutes = Math.ceil(minutesUntilFeed % 60);
        setFeedCountdown(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
      }

      // Water countdown
      if (pet.stats.thirst < config.water.triggerThreshold) {
        setWaterCountdown(null);
      } else {
        const thirstDifference = pet.stats.thirst - config.water.triggerThreshold;
        const minutesUntilWater = thirstDifference * decay.thirst;
        const hours = Math.floor(minutesUntilWater / 60);
        const minutes = Math.ceil(minutesUntilWater % 60);
        setWaterCountdown(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
      }

      // Exercise countdown
      const now = Date.now();
      const hoursSinceLastExercise = (now - lastWalkTime) / (1000 * 60 * 60);
      if (hoursSinceLastExercise >= config.exercise.cooldownHours || lastWalkTime === 0) {
        setWalkCountdown(null);
      } else {
        const hoursUntilExercise = config.exercise.cooldownHours - hoursSinceLastExercise;
        const hours = Math.floor(hoursUntilExercise);
        const minutes = Math.ceil((hoursUntilExercise - hours) * 60);
        setWalkCountdown(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
      }

      // Bath countdown
      const daysSinceLastBath = (now - lastBathTime) / (1000 * 60 * 60 * 24);
      if (daysSinceLastBath >= config.bath.cooldownDays || lastBathTime === 0) {
        setBathCountdown(null);
      } else {
        const daysUntilBath = config.bath.cooldownDays - daysSinceLastBath;
        const days = Math.floor(daysUntilBath);
        const hours = Math.ceil((daysUntilBath - days) * 24);
        setBathCountdown(days > 0 ? `${days}d ${hours}h` : `${hours}h`);
      }

      // Grooming countdown
      const daysSinceLastTrim = (now - lastTrimNailsTime) / (1000 * 60 * 60 * 24);
      if (daysSinceLastTrim >= config.grooming.cooldownDays || lastTrimNailsTime === 0) {
        setTrimNailsCountdown(null);
      } else {
        const daysUntilTrim = config.grooming.cooldownDays - daysSinceLastTrim;
        const days = Math.floor(daysUntilTrim);
        const hours = Math.ceil((daysUntilTrim - days) * 24);
        setTrimNailsCountdown(days > 0 ? `${days}d ${hours}h` : `${hours}h`);
      }
    };

    updateCountdowns();
    const countdownInterval = setInterval(updateCountdowns, 30000); // Update every 30 seconds

    return () => clearInterval(countdownInterval);
  }, [pet.stats.hunger, pet.stats.thirst, lastWalkTime, lastBathTime, lastTrimNailsTime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Initial Purchase */}
      {showInitialPurchase && <InitialPurchase onComplete={handleInitialPurchaseComplete} petType={pet.type} />}
      
      {/* Tutorial */}
      {showTutorial && <Tutorial onComplete={handleTutorialComplete} />}

      {/* Action Overlay */}
      {activeAction && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-fade-in">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="mb-8">
              <Clock className="w-16 h-16 text-white mx-auto mb-4 animate-pulse-soft" />
              <h2 className="text-3xl text-white font-light mb-2">{activeAction}</h2>
              <p className="text-white/70 text-lg">
                This is the realistic time it will take...
              </p>
            </div>
            <div className="text-6xl font-bold text-white">{actionTimer}s</div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-2 sm:px-4 py-4 flex justify-between items-center max-w-full">
          <h1 className="text-2xl font-bold text-foreground">V-Pet</h1>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={handleReplayTutorial}>
              <HelpCircle className="w-4 h-4 mr-1" />
              Tutorial
            </Button>
            <Button variant="outline" size="sm" onClick={onReset}>
              <Plus className="w-4 h-4 mr-1" />
              New Pet
            </Button>
            <OptionsMenu onGenerateReport={() => setShowReport(true)} />
          </div>
        </div>
      </div>

      <Report
        open={showReport}
        onOpenChange={setShowReport}
        petName={pet.name}
        petType={pet.type}
        stats={pet.stats}
        emotion={pet.emotion}
        events={events}
        totalSpent={totalSpent}
        statHistory={statHistory}
      />

      <div className="container mx-auto px-2 sm:px-4 py-4 flex-1 overflow-hidden max-w-full">
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Left Column */}
          <div className="flex flex-col gap-4 h-full min-h-0">
            {/* Pet Display - Top Left */}
            <Card data-tour="pet-display" className="pt-6 px-6 pb-4 bg-gradient-to-br from-card to-card/50 flex-shrink-0">
              <div className="text-center mb-3">
                <h2 className="text-2xl font-bold text-foreground mb-1">{pet.name}</h2>
                <p className="text-muted-foreground capitalize">{pet.type}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-primary/10 rounded-full">
                  <p className="text-sm font-medium text-primary capitalize">
                    Mood: {pet.emotion}
                  </p>
                </div>
              </div>
              <PetAvatar emotion={pet.emotion} type={pet.type} />
            </Card>

            {/* Action Buttons - Below Pet */}
            <Card data-tour="actions" className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
              <h3 className="text-lg font-semibold mb-3 text-foreground flex-shrink-0">Actions</h3>
              <div className="flex-1 min-h-0 grid grid-cols-3 gap-2 overflow-y-auto overflow-x-hidden pr-2 pb-2 content-start">

                {/* Dog: free until 120 feeds, then $25 and +60s "getting food" duration. */}
                <ActionButton
                  label="Feed"
                  cost={pet.type === "dog" ? (feedCount >= 120 ? 25 : 0) : petConfig.actions.feed.cost}
                  disabled={!!activeAction || isSleeping || pet.stats.hunger >= petConfig.actions.feed.triggerThreshold}
                  cooldownMessage={isSleeping ? "Sleeping" : feedCountdown ? feedCountdown : undefined}
                  onClick={() => {
                    const feed = petConfig.actions.feed;
                    const isDogNeedsRestock = pet.type === "dog" && feedCount >= 120;
                    const feedCost = pet.type === "dog" ? (feedCount >= 120 ? 25 : 0) : feed.cost;
                    const feedDuration = isDogNeedsRestock ? 5 + 60 : feed.duration; // +60 sec extra when going to get food
                    const statChanges: any = {
                      hunger: Math.min(100, pet.stats.hunger + feed.statChanges.hunger),
                    };
                    if (feed.statChanges.happiness) statChanges.happiness = Math.min(100, pet.stats.happiness + feed.statChanges.happiness);
                    if (feed.statChanges.energy) statChanges.energy = Math.min(100, pet.stats.energy + feed.statChanges.energy);
                    handleAction(
                      isDogNeedsRestock ? "Getting food & Feeding" : "Feeding",
                      feedCost,
                      feedDuration,
                      statChanges,
                      pet.type === "dog" ? () => setFeedCount((c) => c + 1) : undefined
                    );
                  }}
                />
                <ActionButton
                  label="Water"
                  cost={petConfig.actions.water.cost}
                  disabled={!!activeAction || isSleeping || pet.stats.thirst >= petConfig.actions.water.triggerThreshold}
                  cooldownMessage={isSleeping ? "Sleeping" : waterCountdown ? waterCountdown : undefined}
                  onClick={() => {
                    const water = petConfig.actions.water;
                    const statChanges: any = {
                      thirst: Math.min(100, pet.stats.thirst + water.statChanges.thirst),
                    };
                    if (water.statChanges.happiness) statChanges.happiness = Math.min(100, pet.stats.happiness + water.statChanges.happiness);
                    handleAction("Giving Water", water.cost, water.duration, statChanges);
                  }}
                />
                <ActionButton
                  label={pet.type === "dog" ? "Walk" : pet.type === "cat" ? "Play" : pet.type === "parrot" ? "Fly" : "Run"}
                  cost={petConfig.actions.exercise.cost}
                  disabled={!!activeAction || isSleeping || pet.stats.energy < petConfig.actions.exercise.minEnergy || (lastWalkTime > 0 && walkCountdown !== null)}
                  cooldownMessage={
                    isSleeping ? "Sleeping" : 
                    pet.stats.energy < petConfig.actions.exercise.minEnergy ? "Low energy" : 
                    walkCountdown ? walkCountdown : 
                    undefined
                  }
                  onClick={() => {
                    const exercise = petConfig.actions.exercise;
                    const duration = exercise.duration / 60; // Convert to minutes for display
                    const energyCost = Math.abs(exercise.statChanges.energy);
                    const hygieneLoss = exercise.statChanges.hygiene ? Math.abs(exercise.statChanges.hygiene) : 0;
                    const happinessGain = exercise.statChanges.happiness;
                    const thirstDecrease = exercise.statChanges.thirst ? Math.abs(exercise.statChanges.thirst) : 0;
                    const hungerDecrease = exercise.statChanges.hunger ? Math.abs(exercise.statChanges.hunger) : 0;
                    
                    const actionLabels: Record<string, string> = {
                      dog: "walk",
                      cat: "play session",
                      parrot: "flight",
                      rabbit: "run"
                    };
                    addEvent(`${pet.name} is going on a ${actionLabels[pet.type] || "exercise"} 🚶`);
                    
                    // Schedule random events during exercise
                    const eventTimers: NodeJS.Timeout[] = [];
                    const eventMessages: Record<string, string[]> = {
                      dog: [
                        `${pet.name} found a stick! +10 Happiness 🦴`,
                        `${pet.name} met another dog! +15 Happiness 🐕`,
                        `${pet.name} stepped in mud! -10 Hygiene 💩`
                      ],
                      cat: [
                        `${pet.name} caught a toy! +10 Happiness 🐾`,
                        `${pet.name} is having fun! +15 Happiness 😸`,
                        `${pet.name} got a bit messy. -5 Hygiene`
                      ],
                      parrot: [
                        `${pet.name} flew beautifully! +10 Happiness 🦜`,
                        `${pet.name} is exploring! +15 Happiness 🌿`,
                        `${pet.name} needs a quick preen. -5 Hygiene`
                      ],
                      rabbit: [
                        `${pet.name} hopped around happily! +10 Happiness 🐰`,
                        `${pet.name} is full of energy! +15 Happiness 🥕`,
                        `${pet.name} got a bit dirty. -8 Hygiene`
                      ]
                    };
                    
                    const messages = eventMessages[pet.type] || eventMessages.dog;
                    if (Math.random() < 0.10 && messages[0]) {
                      eventTimers.push(setTimeout(() => {
                        addEvent(messages[0]);
                        setPet(p => ({ ...p, stats: { ...p.stats, happiness: Math.min(100, p.stats.happiness + 10) }}));
                        toast.success("Great exercise!");
                      }, (exercise.duration * 0.4)));
                    }
                    if (Math.random() < 0.08 && messages[1]) {
                      eventTimers.push(setTimeout(() => {
                        addEvent(messages[1]);
                        setPet(p => ({ ...p, stats: { ...p.stats, happiness: Math.min(100, p.stats.happiness + 15) }}));
                        toast.success("Having fun!");
                      }, (exercise.duration * 0.6)));
                    }
                    if (Math.random() < 0.12 && messages[2]) {
                      eventTimers.push(setTimeout(() => {
                        addEvent(messages[2]);
                        setPet(p => ({ ...p, stats: { ...p.stats, hygiene: Math.max(0, p.stats.hygiene - (hygieneLoss || 5)) }}));
                        toast.info("Got a bit messy!");
                      }, (exercise.duration * 0.5)));
                    }
                    
                    const statChanges: any = {
                      energy: Math.max(0, pet.stats.energy - energyCost),
                      happiness: Math.min(100, pet.stats.happiness + happinessGain),
                    };
                    if (hygieneLoss > 0) statChanges.hygiene = Math.max(0, pet.stats.hygiene - hygieneLoss);
                    if (thirstDecrease > 0) statChanges.thirst = Math.max(0, pet.stats.thirst - thirstDecrease);
                    if (hungerDecrease > 0) statChanges.hunger = Math.max(0, pet.stats.hunger - hungerDecrease);
                    
                    handleAction(
                      pet.type === "dog" ? "Walking" : pet.type === "cat" ? "Playing" : pet.type === "parrot" ? "Flying" : "Running",
                      exercise.cost,
                      exercise.duration,
                      statChanges,
                      () => {
                        eventTimers.forEach(t => clearTimeout(t));
                        setLastWalkTime(Date.now());
                        addEvent(`${pet.name} is back from ${actionLabels[pet.type] || "exercise"}`);
                      }
                    );
                  }}
                />
                <ActionButton
                  label="Play"
                  cost={petConfig.actions.play.cost}
                  disabled={!!activeAction || isSleeping || pet.stats.energy < petConfig.actions.play.minEnergy || (petConfig.actions.play.requiresToy && !hasToy)}
                  cooldownMessage={
                    isSleeping ? "Sleeping" : 
                    pet.stats.energy < petConfig.actions.play.minEnergy ? "Low energy" : 
                    (petConfig.actions.play.requiresToy && !hasToy) ? "No toy!" : 
                    undefined
                  }
                  onClick={() => {
                    const play = petConfig.actions.play;
                    const energyCost = Math.abs(play.statChanges.energy);
                    const hygieneLoss = play.statChanges.hygiene ? Math.abs(play.statChanges.hygiene) : 0;
                    const thirstDecrease = play.statChanges.thirst ? Math.abs(play.statChanges.thirst) : 0;
                    const hungerDecrease = play.statChanges.hunger ? Math.abs(play.statChanges.hunger) : 0;
                    
                    addEvent(`${pet.name} is playing! 🎾`);
                    
                    const eventTimers: NodeJS.Timeout[] = [];
                    
                    if (Math.random() < 0.10) {
                      eventTimers.push(setTimeout(() => {
                        addEvent(`${pet.name} is having great fun! +10 Happiness 🎾`);
                        setPet(p => ({ ...p, stats: { ...p.stats, happiness: Math.min(100, p.stats.happiness + 10) }}));
                        toast.success("Perfect playtime!");
                      }, (play.duration * 0.4)));
                    }
                    if (Math.random() < 0.08 && hygieneLoss > 0) {
                      eventTimers.push(setTimeout(() => {
                        addEvent(`${pet.name} got a bit messy. -${hygieneLoss} Hygiene 🌪️`);
                        setPet(p => ({ ...p, stats: { ...p.stats, hygiene: Math.max(0, p.stats.hygiene - hygieneLoss) }}));
                      }, (play.duration * 0.6)));
                    }
                    
                    // 10% chance toy breaks
                    const toyBreaks = Math.random() < 0.10 && play.requiresToy;
                    
                    const statChanges: any = {
                      happiness: Math.min(100, pet.stats.happiness + play.statChanges.happiness),
                      energy: Math.max(0, pet.stats.energy - energyCost),
                    };
                    if (hygieneLoss > 0) statChanges.hygiene = Math.max(0, pet.stats.hygiene - hygieneLoss);
                    if (thirstDecrease > 0) statChanges.thirst = Math.max(0, pet.stats.thirst - thirstDecrease);
                    if (hungerDecrease > 0) statChanges.hunger = Math.max(0, pet.stats.hunger - hungerDecrease);
                    
                    handleAction("Playing", play.cost, play.duration, statChanges, () => {
                      eventTimers.forEach(t => clearTimeout(t));
                      if (toyBreaks) {
                        setHasToy(false);
                        addEvent(`⚠️ The toy broke! Buy a new one or happiness will drop!`);
                        toast.error("Toy broke! Buy a new one soon!");
                        // Start happiness penalty after 1 hour
                        setTimeout(() => {
                          if (!hasToy) {
                            setPet(p => ({ 
                              ...p, 
                              stats: { ...p.stats, happiness: Math.max(0, p.stats.happiness - 30) }
                            }));
                            addEvent(`${pet.name} is sad without a toy. -30 Happiness 😢`);
                            toast.error("Your pet is very sad without toys!");
                          }
                        }, 60 * 60 * 1000);
                      }
                    });
                  }}
                />
                <ActionButton
                  label="Buy Toy"
                  cost={15}
                  disabled={!!activeAction || isSleeping || hasToy}
                  cooldownMessage={
                    isSleeping ? "Sleeping" : 
                    hasToy ? "Already have toy" : 
                    undefined
                  }
                  onClick={() => {
                    addEvent(`Buying a new toy for ${pet.name} 🛒`);
                    toast.info("You'll probably go to the mall and buy this, so not much extra time");
                    handleAction("Buying Toy", 15, 5 * 60, { 
                      happiness: Math.min(100, pet.stats.happiness + 20)
                    }, () => {
                      setHasToy(true);
                      addEvent("Got a new toy! 🎾");
                      toast.success("New toy purchased! Your pet loves it!");
                    });
                  }}
                />
                <ActionButton
                  label={pet.type === "parrot" ? "Shower" : pet.type === "rabbit" ? "Spot Clean" : "Bath"}
                  cost={petConfig.actions.bath.cost}
                  disabled={!!activeAction || isSleeping || pet.stats.hygiene >= petConfig.actions.bath.triggerThreshold}
                  cooldownMessage={
                    isSleeping ? "Sleeping" : 
                    pet.stats.hygiene >= petConfig.actions.bath.triggerThreshold ? "Hygiene OK" : 
                    bathCountdown ? bathCountdown : 
                    undefined
                  }
                  onClick={() => {
                    const bath = petConfig.actions.bath;
                    const actionLabel = pet.type === "parrot" ? "Shower" : pet.type === "rabbit" ? "Spot Clean" : "Bath";
                    addEvent(`${pet.name} is getting a ${actionLabel.toLowerCase()} 🛁`);
                    const statChanges: any = {
                      hygiene: Math.min(100, pet.stats.hygiene + bath.statChanges.hygiene),
                    };
                    if (bath.statChanges.happiness) {
                      statChanges.happiness = Math.max(0, Math.min(100, pet.stats.happiness + bath.statChanges.happiness));
                    }
                    handleAction(actionLabel, bath.cost, bath.duration, statChanges, () => {
                      setLastBathTime(Date.now());
                    });
                  }}
                />
                <ActionButton
                  label="Vet Visit"
                  cost={petConfig.actions.vetVisit.cost}
                  disabled={!!activeAction || isSleeping}
                  cooldownMessage={isSleeping ? "Sleeping" : undefined}
                  onClick={() => {
                    const vet = petConfig.actions.vetVisit;
                    addEvent(`Taking ${pet.name} to the vet 🏥`);
                    handleAction("Vet Visit", vet.cost, vet.duration, { 
                      hygiene: Math.min(100, pet.stats.hygiene + vet.statChanges.hygiene),
                      happiness: Math.min(100, pet.stats.happiness + vet.statChanges.happiness),
                      energy: Math.min(100, pet.stats.energy + vet.statChanges.energy)
                    }, () => {
                      addEvent(`${pet.name} got a checkup! All healthy! 🩺`);
                      toast.success("Checkup complete! Your pet is healthy!");
                    });
                  }}
                />
                <ActionButton
                  label={pet.type === "parrot" ? "Trim Beak/Claws" : pet.type === "cat" ? "Brush" : pet.type === "rabbit" ? "Brush" : "Trim Nails"}
                  cost={petConfig.actions.grooming.cost}
                  disabled={!!activeAction || isSleeping || pet.stats.hygiene >= petConfig.actions.grooming.triggerThreshold}
                  cooldownMessage={
                    isSleeping ? "Sleeping" : 
                    pet.stats.hygiene >= petConfig.actions.grooming.triggerThreshold ? "Hygiene OK" : 
                    trimNailsCountdown ? trimNailsCountdown : 
                    undefined
                  }
                  onClick={() => {
                    const grooming = petConfig.actions.grooming;
                    const actionLabel = pet.type === "parrot" ? "Trimming Beak/Claws" : pet.type === "cat" ? "Brushing" : pet.type === "rabbit" ? "Brushing" : "Trimming Nails";
                    addEvent(`${actionLabel} ${pet.name} ✂️`);
                    const statChanges: any = {
                      hygiene: Math.min(100, pet.stats.hygiene + grooming.statChanges.hygiene),
                    };
                    if (grooming.statChanges.happiness) {
                      statChanges.happiness = Math.max(0, Math.min(100, pet.stats.happiness + grooming.statChanges.happiness));
                    }
                    handleAction(actionLabel, grooming.cost, grooming.duration, statChanges, () => {
                      setLastTrimNailsTime(Date.now());
                      const finishLabel = pet.type === "parrot" ? "beak and claws are trimmed" : pet.type === "cat" ? "is brushed" : pet.type === "rabbit" ? "is brushed" : "nails are trimmed";
                      addEvent(`${pet.name}'s ${finishLabel}!`);
                    });
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Right Column */}
            <div className="flex flex-col gap-4 h-full min-h-0">
            {/* Stats - Top Right */}
            <Card data-tour="stats" className="p-4 flex-shrink-0">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Stats</h3>
              <div className="space-y-2">
                <StatBar
                  icon={Droplets}
                  label="Hunger"
                  value={pet.stats.hunger}
                  color="bg-blue-500"
                />
                <StatBar
                  icon={GlassWater}
                  label="Thirst"
                  value={pet.stats.thirst}
                  color="bg-cyan-500"
                />
                <StatBar
                  icon={Heart}
                  label="Happiness"
                  value={pet.stats.happiness}
                  color="bg-pink-500"
                />
                <StatBar
                  icon={Sparkles}
                  label="Hygiene"
                  value={pet.stats.hygiene}
                  color="bg-purple-500"
                />
                <StatBar
                  icon={Battery}
                  label="Energy"
                  value={pet.stats.energy}
                  color="bg-green-500"
                />
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
              {/* Spending */}
              <Card data-tour="spending" className="p-3 bg-gradient-to-br from-secondary/20 to-secondary/5 h-full">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-secondary" />
                  <h3 className="text-sm font-semibold text-foreground">Total Spent</h3>
                </div>
                <p className="text-2xl font-bold text-secondary">${totalSpent}</p>
              </Card>

              {/* Event Log - Moved to right side */}
              <div data-tour="events" className="h-full flex w-full">
                <EventLog events={events} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
