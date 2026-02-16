/** One stat row: icon, label, 0–100% value, and a colored bar. Value is clamped. */
import { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StatBarProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}

export const StatBar = ({ icon: Icon, label, value, color }: StatBarProps) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">{Math.round(clampedValue)}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
        <div
          className={cn("h-full transition-all duration-300", color)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
