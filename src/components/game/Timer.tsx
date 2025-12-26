import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  duration: number;
  onTimeUp: () => void;
  isRunning: boolean;
  onTick?: (remaining: number) => void;
}

const Timer = ({ duration, onTimeUp, isRunning, onTick }: TimerProps) => {
  const [remaining, setRemaining] = useState(duration);
  const remainingRef = useRef(duration);
  const firedRef = useRef(false);

  useEffect(() => {
    setRemaining(duration);
    remainingRef.current = duration;
    firedRef.current = false;
  }, [duration]);

  useEffect(() => {
    if (!isRunning) return;

    // Ensure the timer restarts cleanly when resumed.
    firedRef.current = false;

    const interval = setInterval(() => {
      const next = remainingRef.current - 1;
      remainingRef.current = next;

      if (onTick) onTick(Math.max(next, 0));
      setRemaining(Math.max(next, 0));

      if (next <= 0) {
        clearInterval(interval);
        if (!firedRef.current) {
          firedRef.current = true;
          onTimeUp();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUp, onTick]);

  const isLow = remaining <= 3;

  return (
    <div className={cn(
      "flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border transition-all",
      isLow && "border-primary"
    )}>
      <Clock className={cn(
        "w-5 h-5 transition-colors",
        isLow ? "text-primary timer-warning" : "text-muted-foreground"
      )} />
      <span className={cn(
        "font-oswald font-bold text-2xl tabular-nums min-w-[2ch] text-center transition-colors",
        isLow ? "text-primary timer-warning" : "text-foreground"
      )}>
        {remaining}
      </span>
    </div>
  );
};

export default Timer;
