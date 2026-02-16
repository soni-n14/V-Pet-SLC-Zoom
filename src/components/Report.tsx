/**
 * Care report modal: choose time range (1d / 7d / 30d / since adoption), then view
 * per-stat tabs (Hunger, Thirst, Happiness, Hygiene, Energy) with average + graph, and
 * Mood tab with happiness graph and letter rating. Uses project theme.
 */
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  getActionCounts,
  getGrade,
  getOverallScore,
  getStatFeedback,
  getMoodFeedback,
  getImprovements,
  filterEventsByRange,
  filterStatHistoryByRange,
  getAverageStat,
  getMoodRatingFromHappiness,
  type EventEntry,
  type PetStats,
  type ReportTimeRange,
  type StatHistoryEntry,
} from "@/lib/reportLogic";
import { Droplets, Heart, Sparkles, Battery, GlassWater, Smile } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface ReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petName: string;
  petType: string;
  stats: PetStats;
  emotion: string;
  events: EventEntry[];
  totalSpent: number;
  /** Snapshot history for graphs; can be empty if not yet collected. */
  statHistory?: StatHistoryEntry[];
}

const TIME_RANGE_OPTIONS: { value: ReportTimeRange; label: string }[] = [
  { value: "1", label: "Since 1 day ago" },
  { value: "7", label: "Since 7 days ago" },
  { value: "30", label: "Since 30 days ago" },
  { value: "all", label: "Since adoption" },
];

const statConfig: { key: keyof PetStats; label: string; icon: typeof Heart }[] = [
  { key: "hunger", label: "Hunger", icon: Droplets },
  { key: "thirst", label: "Thirst", icon: GlassWater },
  { key: "happiness", label: "Happiness", icon: Heart },
  { key: "hygiene", label: "Hygiene", icon: Sparkles },
  { key: "energy", label: "Energy", icon: Battery },
];

/** Build chart data from filtered history for one stat. */
function buildChartData(history: StatHistoryEntry[], statKey: keyof PetStats) {
  return history.map((h) => ({
    time: new Date(h.t).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    value: Math.round(h.stats[statKey]),
    full: h.stats[statKey],
  }));
}

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-primary";
  if (grade.startsWith("B")) return "text-green-500";
  if (grade.startsWith("C")) return "text-yellow-500";
  if (grade.startsWith("D")) return "text-orange-500";
  return "text-destructive";
}

export function Report({
  open,
  onOpenChange,
  petName,
  petType,
  stats,
  emotion,
  events,
  totalSpent,
  statHistory = [],
}: ReportProps) {
  const [timeRange, setTimeRange] = useState<ReportTimeRange>("7");

  const filteredEvents = useMemo(() => filterEventsByRange(events, timeRange), [events, timeRange]);
  const filteredHistory = useMemo(() => filterStatHistoryByRange(statHistory, timeRange), [statHistory, timeRange]);

  const counts = getActionCounts(filteredEvents);
  const score = getOverallScore(stats, counts);
  const grade = getGrade(score);
  const improvements = getImprovements(stats, counts);
  const { summary: moodSummary, tips: moodTips } = getMoodFeedback(stats, counts);

  const avgHappiness = getAverageStat(filteredHistory, "happiness", stats.happiness);
  const moodGrade = getMoodRatingFromHappiness(avgHappiness);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">
            Care Report — {petName}
          </DialogTitle>
        </DialogHeader>

        {/* Time range: ask before showing everything */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Report period</label>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as ReportTimeRange)}>
            <SelectTrigger className="w-full border-border bg-muted/30 text-foreground">
              <SelectValue placeholder="Choose period" />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-foreground">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overall grade */}
        <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
          <span className={`text-4xl font-bold ${gradeColor(grade)}`}>{grade}</span>
          <div>
            <p className="text-sm text-muted-foreground">
              Overall score: {score}/100 for this period (current stats + care variety).
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total spent: ${totalSpent} · {petType}
            </p>
          </div>
        </div>

        <Tabs defaultValue="hunger" className="w-full">
          <TabsList className="flex w-full flex-wrap gap-1 bg-muted/50 border border-border h-auto p-1">
            {statConfig.map(({ key, label }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5"
              >
                {label}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="mood"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1.5"
            >
              Mood
            </TabsTrigger>
          </TabsList>

          {statConfig.map(({ key, label, icon: Icon }) => {
            const avg = getAverageStat(filteredHistory, key, stats[key]);
            const { assessment, tip } = getStatFeedback(key, stats[key], counts);
            const chartData = buildChartData(filteredHistory, key);
            return (
              <TabsContent key={key} value={key} className="mt-4 space-y-3">
                <Card className="border-border bg-card/80 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-sm text-muted-foreground">
                      — Average in period: {avg}% · Current: {Math.round(stats[key])}%
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-2">{assessment}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">Tip: {tip}</p>
                </Card>
                {chartData.length > 0 && (
                  <div className="h-[200px] w-full rounded-lg border border-border bg-muted/20 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number) => [`${value}%`, label]}
                        />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name={label} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </TabsContent>
            );
          })}

          <TabsContent value="mood" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-foreground">
                <Smile className="h-5 w-5 text-primary" />
                <span className="font-medium">Current mood: {emotion}</span>
              </div>
              <span className={`text-2xl font-bold ${gradeColor(moodGrade)}`}>
                Mood rating: {moodGrade}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{moodSummary}</p>
            <p className="text-xs text-muted-foreground">
              How you took care of your pet in this period: you fed {counts.feed} time(s), gave water {counts.water} time(s),
              exercised or played {counts.walk + counts.play} time(s), and bathed/groomed {counts.bath + counts.groom} time(s).
              {filteredHistory.length > 0 && ` Average happiness in period: ${avgHappiness}%.`}
            </p>
            {filteredHistory.length > 0 && (
              <div className="h-[200px] w-full rounded-lg border border-border bg-muted/20 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={buildChartData(filteredHistory, "happiness")} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                      formatter={(value: number) => [`${value}%`, "Happiness"]}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Happiness" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-foreground mb-2">Tips for a happier pet:</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                {moodTips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground mb-3">What to improve</p>
          <ul className="space-y-3">
            {improvements.map((item, i) => (
              <li key={i} className="text-sm">
                <span className="text-destructive/90">• {item.wrong}</span>
                <p className="text-muted-foreground mt-1 pl-4">→ {item.better}</p>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
