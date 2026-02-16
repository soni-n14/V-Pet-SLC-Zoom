/**
 * Report grading and feedback: derives action counts from events, computes grade, and builds tips/feedback.
 * Supports time-range filtering (1d, 7d, 30d, since adoption) and stat history for averages/graphs.
 */

export interface EventEntry {
  message: string;
  timestamp: Date;
}

export interface PetStats {
  hunger: number;
  happiness: number;
  hygiene: number;
  energy: number;
  thirst: number;
}

export type ReportTimeRange = "1" | "7" | "30" | "all";

export interface StatHistoryEntry {
  t: number;
  stats: PetStats;
}

/** Millisecond cutoff for range: 1 day, 7 days, 30 days, or 0 (all). */
export function getRangeStartMs(range: ReportTimeRange): number {
  const now = Date.now();
  if (range === "all") return 0;
  const days = parseInt(range, 10);
  return now - days * 24 * 60 * 60 * 1000;
}

/** Filter events to those within the selected time range. */
export function filterEventsByRange(events: EventEntry[], range: ReportTimeRange): EventEntry[] {
  const start = getRangeStartMs(range);
  return events.filter((e) => new Date(e.timestamp).getTime() >= start);
}

/** Filter stat history to entries within the selected time range. */
export function filterStatHistoryByRange(history: StatHistoryEntry[], range: ReportTimeRange): StatHistoryEntry[] {
  const start = getRangeStartMs(range);
  return history.filter((h) => h.t >= start);
}

/** Average value of one stat over filtered history; falls back to current if no history. */
export function getAverageStat(history: StatHistoryEntry[], statKey: keyof PetStats, currentValue: number): number {
  if (!history.length) return currentValue;
  const sum = history.reduce((s, h) => s + h.stats[statKey], 0);
  return Math.round(sum / history.length);
}

/** Count care actions from event messages. One action can produce 1–2 events; counts are approximate. */
export function getActionCounts(events: EventEntry[]) {
  const counts = { feed: 0, water: 0, walk: 0, play: 0, bath: 0, vet: 0, groom: 0 };
  const lower = (s: string) => s.toLowerCase();
  for (const e of events) {
    const m = lower(e.message);
    if (m.includes("feeding") || m.includes("feed")) counts.feed++;
    if (m.includes("water") || m.includes("giving water")) counts.water++;
    if (m.includes("walk") || m.includes("run") || m.includes("fly") || m.includes("exercise")) counts.walk++;
    if (m.includes("play") || m.includes("playing")) counts.play++;
    if (m.includes("bath") || m.includes("shower") || m.includes("spot clean")) counts.bath++;
    if (m.includes("vet") || m.includes("checkup")) counts.vet++;
    if (m.includes("trim") || m.includes("brush") || m.includes("groom") || m.includes("nail") || m.includes("beak")) counts.groom++;
  }
  return counts;
}

/** Letter grade from 0–100 score. */
export function getGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

/**
 * Overall score 0–100: average of stat levels, plus small bonus for variety of care (feeding, water, play, walks).
 */
export function getOverallScore(stats: PetStats, counts: ReturnType<typeof getActionCounts>): number {
  const avgStat = (stats.hunger + stats.thirst + stats.happiness + stats.hygiene + stats.energy) / 5;
  const variety = [counts.feed, counts.water, counts.walk, counts.play, counts.bath, counts.groom].filter((c) => c > 0).length;
  const varietyBonus = Math.min(10, variety * 2);
  return Math.round(Math.min(100, avgStat + varietyBonus));
}

/** Per-stat feedback: short assessment and one tip. */
export function getStatFeedback(
  statName: string,
  value: number,
  counts: ReturnType<typeof getActionCounts>
): { assessment: string; tip: string } {
  const v = Math.round(value);
  const good = v >= 70;
  const low = v < 40;
  const assessments: Record<string, string> = {
    hunger: good ? "Well fed." : low ? "Often hungry. Feed more regularly." : "Could eat sooner sometimes.",
    thirst: good ? "Hydration on track." : low ? "Often thirsty. Offer water more often." : "Keep water topped up.",
    happiness: good ? "Pet is happy." : low ? "Pet is unhappy. More play and attention needed." : "A bit more playtime would help.",
    hygiene: good ? "Clean and groomed." : low ? "Hygiene is low. Bath/groom soon." : "Consider a bath or groom soon.",
    energy: good ? "Good energy levels." : low ? "Pet is tired. Rest and then gentle activity." : "Balance activity with rest.",
  };
  const tips: Record<string, string> = {
    hunger: "Feed when hunger drops below ~35%. Dogs need meals ~twice a day.",
    thirst: "Water should be refilled when thirst is under 70%. Always have fresh water.",
    happiness: "Play, walks, and attention raise happiness. Neglect and low hunger/hygiene lower it.",
    hygiene: "Bath when hygiene is low; trim nails or brush per pet type on a schedule.",
    energy: "Sleep restores energy. Daytime activity drains it; don’t over-exercise when low.",
  };
  return {
    assessment: assessments[statName] ?? "Keep an eye on this.",
    tip: tips[statName] ?? "Consistent care keeps stats healthy.",
  };
}

/** Mood tab: happiness summary and tips. */
export function getMoodFeedback(stats: PetStats, counts: ReturnType<typeof getActionCounts>): {
  summary: string;
  tips: string[];
} {
  const h = stats.happiness;
  const summary =
    h >= 80
      ? `${stats.happiness}% happiness — your pet is in great spirits.`
      : h >= 50
        ? `${stats.happiness}% happiness — doing okay; more play and care will help.`
        : `${stats.happiness}% happiness — your pet needs more attention and care.`;
  const tips: string[] = [];
  if (counts.play < 2 && counts.walk < 2) tips.push("Try more play sessions or walks to boost mood.");
  if (stats.hunger < 50) tips.push("Low hunger can make pets unhappy. Feed regularly.");
  if (stats.hygiene < 50) tips.push("Poor hygiene can affect mood. Schedule baths and grooming.");
  if (tips.length === 0) tips.push("Keep up the variety: feed, water, play, and walks all support happiness.");
  return { summary, tips };
}

/** Top improvements: what went wrong and how to do better (2–4 items). */
export function getImprovements(
  stats: PetStats,
  counts: ReturnType<typeof getActionCounts>
): { wrong: string; better: string }[] {
  const out: { wrong: string; better: string }[] = [];
  if (stats.hunger < 50 && counts.feed < 3) {
    out.push({
      wrong: "Hunger has been low and feeding has been infrequent.",
      better: "Feed when hunger is below 35% and aim for at least two feeding times per day.",
    });
  }
  if (stats.thirst < 50 && counts.water < 3) {
    out.push({
      wrong: "Thirst has been low; water wasn’t offered often enough.",
      better: "Refill water when thirst is under 70% and keep a consistent watering routine.",
    });
  }
  if (stats.happiness < 60 && (counts.play + counts.walk) < 2) {
    out.push({
      wrong: "Happiness is low and there’s been little play or exercise.",
      better: "Add daily play and walks (or flight/runs for other pets) to keep your pet happy.",
    });
  }
  if (stats.hygiene < 50 && counts.bath === 0 && counts.groom === 0) {
    out.push({
      wrong: "Hygiene is low with no recent bath or grooming.",
      better: "Give a bath when hygiene drops and groom (brush/trim) on a regular schedule.",
    });
  }
  if (stats.energy < 30) {
    out.push({
      wrong: "Energy has been very low.",
      better: "Let your pet rest; avoid long activities until energy recovers (e.g. after sleep).",
    });
  }
  if (out.length === 0) {
    out.push({
      wrong: "No major issues right now.",
      better: "Keep up consistent feeding, water, play, and grooming to maintain this level.",
    });
  }
  return out.slice(0, 4);
}

/** Mood/care letter rating from average happiness in the period (0–100). */
export function getMoodRatingFromHappiness(avgHappiness: number): string {
  return getGrade(avgHappiness);
}
