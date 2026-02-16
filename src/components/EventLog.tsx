/**
 * Scrollable log of recent pet events (feeds, walks, purchases) with timestamps. Keeps last 20 (handled by parent).
 */
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface EventEntry {
  message: string;
  timestamp: Date;
}

interface EventLogProps {
  events: EventEntry[];
}

const formatTime = (date: Date | string | number) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export const EventLog = ({ events }: EventLogProps) => {
  return (
    <Card className="p-4 w-full h-full flex flex-col min-h-0 overflow-hidden">
      <h3 className="text-sm font-semibold mb-2 text-foreground shrink-0">Events</h3>
      <ScrollArea className="flex-1 min-h-0">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <p className="text-muted-foreground text-xs text-center py-4">
              No events yet
            </p>
          ) : (
            <div className="space-y-1.5 pr-4">
              {events.map((event, index) => (
                <motion.div
                  key={`${event.message}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="p-2 rounded-lg bg-muted/50 text-xs"
                >
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      [{formatTime(event.timestamp)}]
                    </span>
                    <span className="text-foreground leading-tight">{event.message}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </Card>
  );
};
