import { getLevelInfo, getLevelBgColor, LEVELS } from '@/lib/gameData';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentLevel: number;
  correctAnswers: number;
}

const ProgressBar = ({ currentLevel, correctAnswers }: ProgressBarProps) => {
  const levelInfo = getLevelInfo(currentLevel);
  const nextLevel = LEVELS[currentLevel + 1];
  const previousRequired = currentLevel > 0 ? LEVELS[currentLevel - 1]?.requiredCorrect || 0 : 0;
  const answersInLevel = correctAnswers - previousRequired;
  const requiredForNextLevel = levelInfo.requiredCorrect - previousRequired;
  const progress = nextLevel 
    ? Math.min((answersInLevel / requiredForNextLevel) * 100, 100)
    : 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className={cn("font-oswald font-semibold uppercase text-sm", getLevelBgColor(currentLevel).replace('bg-', 'text-'))}>
          {levelInfo.name}
        </span>
        {nextLevel && (
          <span className="font-oswald text-sm text-muted-foreground">
            {answersInLevel} / {requiredForNextLevel}
          </span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            getLevelBgColor(currentLevel)
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
