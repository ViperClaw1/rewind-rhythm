import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const newValue = prev - 1;
        if (onTick) onTick(newValue);
        
        if (newValue <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return newValue;
      });
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
