/**
 * Per-pet config: decay rates, sleep hours, initial stats, and all action costs/durations/effects.
 * Used by Dashboard and Index for behavior and initial state.
 */
import { Cat, Bird, Rabbit, Dog } from "lucide-react";

export type PetType = "dog" | "cat" | "parrot" | "rabbit";

export interface PetConfig {
  type: PetType;
  name: string;
  icon: typeof Dog;
  // Stat decay rates (per 30 seconds)
  decayRates: {
    hunger: number; // -1% every X minutes
    happiness: number; // -1% every X minutes
    hygiene: number; // -1% every X hours
    energy: number; // -1% every X minutes (daytime drain)
    thirst: number; // -1% every X minutes
  };
  // Sleep cycle
  sleepHours: { start: number; end: number }; // 24-hour format
  // Initial stats
  initialStats: {
    hunger: number;
    happiness: number;
    hygiene: number;
    energy: number;
    thirst: number;
  };
  // Actions available and their effects
  actions: {
    feed: {
      cost: number;
      duration: number; // in seconds
      statChanges: {
        hunger: number;
        happiness?: number;
        energy?: number;
      };
      triggerThreshold: number; // Feed when hunger < this
    };
    water: {
      cost: number;
      duration: number;
      statChanges: {
        thirst: number;
        happiness?: number;
      };
      triggerThreshold: number;
    };
    exercise: { // Walk for dogs, Play for cats, Fly for parrots, Run for rabbits
      cost: number;
      duration: number;
      statChanges: {
        energy: number; // negative = cost
        happiness: number;
        hygiene?: number; // negative = loss
        thirst: number; // negative = decrease (a lot)
        hunger: number; // negative = decrease (some)
      };
      minEnergy: number;
      cooldownHours: number;
    };
    play: {
      cost: number;
      duration: number;
      statChanges: {
        happiness: number;
        energy: number; // negative
        hygiene?: number; // negative
        thirst: number; // negative = decrease (a lot)
        hunger: number; // negative = decrease (some)
      };
      requiresToy: boolean;
      minEnergy: number;
    };
    bath: {
      cost: number;
      duration: number;
      statChanges: {
        hygiene: number;
        happiness?: number; // negative for pets that don't like baths
      };
      triggerThreshold: number;
      cooldownDays: number;
    };
    grooming: { // Trim nails for dogs/cats, Trim beak/claws for parrots, Trim nails for rabbits
      cost: number;
      duration: number;
      statChanges: {
        hygiene: number;
        happiness?: number; // negative
      };
      triggerThreshold: number;
      cooldownDays: number;
    };
    vetVisit: {
      cost: number;
      duration: number;
      statChanges: {
        hygiene: number;
        happiness: number;
        energy: number;
      };
    };
  };
}

export const petConfigs: Record<PetType, PetConfig> = {
  dog: {
    type: "dog",
    name: "Dog",
    icon: Dog,
    decayRates: {
      hunger: 6.75, // -1% every 6.75 min
      happiness: 45, // -1% every 45 min
      hygiene: 120, // -1% every 2 hours
      energy: 10, // -1% every 10 min (daytime)
      thirst: 3.5, // -1% every 3.5 min
    },
    sleepHours: { start: 22, end: 6 },
    initialStats: {
      hunger: 80,
      happiness: 80,
      hygiene: 90,
      energy: 80,
      thirst: 80,
    },
    actions: {
      feed: {
        cost: 0,
        duration: 5,
        statChanges: { hunger: 90, happiness: 5, energy: 12 },
        triggerThreshold: 35,
      },
      water: {
        cost: 0,
        duration: 5,
        statChanges: { thirst: 80, happiness: 3 },
        triggerThreshold: 70,
      },
      exercise: {
        cost: 0,
        duration: 5,
        statChanges: { energy: -20, happiness: 15, hygiene: -7, thirst: -35, hunger: -8 },
        minEnergy: 20,
        cooldownHours: 12,
      },
      play: {
        cost: 0,
        duration: 5,
        statChanges: { happiness: 15, energy: -20, hygiene: -3, thirst: -30, hunger: -6 },
        requiresToy: true,
        minEnergy: 20,
      },
      bath: {
        cost: 2,
        duration: 35 * 60,
        statChanges: { hygiene: 100, happiness: -5 },
        triggerThreshold: 35,
        cooldownDays: 14,
      },
      grooming: {
        cost: 10,
        duration: 30 * 60,
        statChanges: { hygiene: 15, happiness: -3 },
        triggerThreshold: 35,
        cooldownDays: 30,
      },
      vetVisit: {
        cost: 100,
        duration: 45 * 60,
        statChanges: { hygiene: 30, happiness: 10, energy: 20 },
      },
    },
  },
  cat: {
    type: "cat",
    name: "Cat",
    icon: Cat,
    decayRates: {
      hunger: 8, // Cats eat less frequently than dogs
      happiness: 50, // Cats are more independent
      hygiene: 180, // Cats groom themselves more
      energy: 12, // Cats are less active
      thirst: 4, // Similar to dogs
    },
    sleepHours: { start: 20, end: 6 }, // Cats sleep more
    initialStats: {
      hunger: 75,
      happiness: 75,
      hygiene: 95, // Cats are cleaner
      energy: 70,
      thirst: 75,
    },
    actions: {
      feed: {
        cost: 2,
        duration: 5,
        statChanges: { hunger: 85, happiness: 3, energy: 10 },
        triggerThreshold: 40,
      },
      water: {
        cost: 0,
        duration: 5,
        statChanges: { thirst: 75, happiness: 2 },
        triggerThreshold: 70,
      },
      exercise: { // Play with cat
        cost: 0,
        duration: 5,
        statChanges: { energy: -15, happiness: 20, hygiene: -2, thirst: -30, hunger: -7 },
        minEnergy: 15,
        cooldownHours: 8,
      },
      play: {
        cost: 0,
        duration: 5,
        statChanges: { happiness: 20, energy: -15, hygiene: -2, thirst: -25, hunger: -5 },
        requiresToy: true,
        minEnergy: 15,
      },
      bath: {
        cost: 3,
        duration: 40 * 60, // Cats hate baths more
        statChanges: { hygiene: 100, happiness: -10 },
        triggerThreshold: 30,
        cooldownDays: 21, // Cats need fewer baths
      },
      grooming: { // Brush cat
        cost: 5,
        duration: 20 * 60,
        statChanges: { hygiene: 20, happiness: 5 }, // Cats like being brushed
        triggerThreshold: 40,
        cooldownDays: 7,
      },
      vetVisit: {
        cost: 120,
        duration: 45 * 60,
        statChanges: { hygiene: 25, happiness: 5, energy: 15 },
      },
    },
  },
  parrot: {
    type: "parrot",
    name: "Parrot",
    icon: Bird,
    decayRates: {
      hunger: 5, // Parrots eat more frequently
      happiness: 30, // Parrots need more attention
      hygiene: 200, // Birds preen themselves
      energy: 8, // Very active
      thirst: 3, // Need water frequently
    },
    sleepHours: { start: 20, end: 7 }, // Parrots need more sleep
    initialStats: {
      hunger: 70,
      happiness: 70, // Need more social interaction
      hygiene: 85,
      energy: 75,
      thirst: 70,
    },
    actions: {
      feed: {
        cost: 4,
        duration: 5,
        statChanges: { hunger: 80, happiness: 8, energy: 15 },
        triggerThreshold: 30,
      },
      water: {
        cost: 0,
        duration: 5,
        statChanges: { thirst: 75, happiness: 2 },
        triggerThreshold: 65,
      },
      exercise: { // Fly/Exercise
        cost: 0,
        duration: 5,
        statChanges: { energy: -25, happiness: 25, hygiene: -5, thirst: -40, hunger: -10 },
        minEnergy: 25,
        cooldownHours: 6,
      },
      play: {
        cost: 0,
        duration: 5,
        statChanges: { happiness: 25, energy: -20, hygiene: -3, thirst: -35, hunger: -8 },
        requiresToy: true,
        minEnergy: 20,
      },
      bath: { // Shower/Mist
        cost: 1,
        duration: 15 * 60, // Quick misting
        statChanges: { hygiene: 100, happiness: 10 }, // Parrots love baths
        triggerThreshold: 40,
        cooldownDays: 3, // More frequent
      },
      grooming: { // Trim beak/claws
        cost: 15,
        duration: 25 * 60,
        statChanges: { hygiene: 20, happiness: -5 },
        triggerThreshold: 40,
        cooldownDays: 60,
      },
      vetVisit: {
        cost: 150,
        duration: 50 * 60,
        statChanges: { hygiene: 35, happiness: 15, energy: 25 },
      },
    },
  },
  rabbit: {
    type: "rabbit",
    name: "Rabbit",
    icon: Rabbit,
    decayRates: {
      hunger: 4, // Rabbits eat constantly (grazing)
      happiness: 40,
      hygiene: 150,
      energy: 9,
      thirst: 3.5,
    },
    sleepHours: { start: 22, end: 6 },
    initialStats: {
      hunger: 85,
      happiness: 75,
      hygiene: 80,
      energy: 70,
      thirst: 80,
    },
    actions: {
      feed: {
        cost: 2,
        duration: 5,
        statChanges: { hunger: 75, happiness: 5, energy: 8 },
        triggerThreshold: 50, // Rabbits need constant food
      },
      water: {
        cost: 0,
        duration: 5,
        statChanges: { thirst: 80, happiness: 2 },
        triggerThreshold: 70,
      },
      exercise: { // Run/Exercise
        cost: 0,
        duration: 5,
        statChanges: { energy: -18, happiness: 18, hygiene: -8, thirst: -32, hunger: -9 },
        minEnergy: 18,
        cooldownHours: 10,
      },
      play: {
        cost: 0,
        duration: 5,
        statChanges: { happiness: 18, energy: -18, hygiene: -4, thirst: -28, hunger: -7 },
        requiresToy: true,
        minEnergy: 18,
      },
      bath: { // Spot clean (rabbits shouldn't be fully bathed)
        cost: 1,
        duration: 20 * 60,
        statChanges: { hygiene: 90, happiness: -8 }, // Rabbits don't like baths
        triggerThreshold: 40,
        cooldownDays: 30,
      },
      grooming: { // Brush rabbit
        cost: 8,
        duration: 25 * 60,
        statChanges: { hygiene: 25, happiness: 3 },
        triggerThreshold: 40,
        cooldownDays: 14,
      },
      vetVisit: {
        cost: 110,
        duration: 40 * 60,
        statChanges: { hygiene: 30, happiness: 8, energy: 18 },
      },
    },
  },
};

