import { Mic } from 'lucide-react';

interface MicrophoneCounterProps {
  count: number;
  maxCount?: number;
}

const MicrophoneCounter = ({ count, maxCount = 10 }: MicrophoneCounterProps) => {
  const displayCount = Math.min(count, maxCount);
  
  return (
    <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border">
      <Mic className="w-5 h-5 text-primary" />
      <span className="font-oswald font-semibold text-lg text-foreground">
        {count}
      </span>
    </div>
  );
};

export default MicrophoneCounter;
