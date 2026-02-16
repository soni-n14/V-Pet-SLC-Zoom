/** Single action tile: label, cost (or "Free"), and either cooldown text when disabled or cost when enabled. */
import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  label: string;
  cost: number;
  disabled?: boolean;
  cooldownMessage?: string;
  onClick: () => void;
}

export const ActionButton = ({ label, cost, disabled, cooldownMessage, onClick }: ActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className="flex flex-col items-center justify-center h-full min-h-[70px] hover:bg-primary/10 hover:border-primary transition-all"
    >
      <span className="font-medium text-foreground text-sm">{label}</span>
      {disabled && cooldownMessage ? (
        <span className="text-xs text-muted-foreground/70 mt-1">{cooldownMessage}</span>
      ) : (
        <span className="text-xs text-muted-foreground mt-1">
          {cost === 0 ? "Free" : `$${cost}`}
        </span>
      )}
    </Button>
  );
};
