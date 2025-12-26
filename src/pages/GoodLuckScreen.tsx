import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { getLevelInfo, getLevelColor, CATEGORIES, DEFAULT_MICROPHONES } from '@/lib/gameData';
import { Button } from '@/components/ui/button';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import Logo from '@/components/layout/Logo';
import { cn } from '@/lib/utils';

const GoodLuckScreen = () => {
  const navigate = useNavigate();
  const { selectedCategory, getProgressForCategory, setMicrophones, setSessionCorrectAnswers } = useGameState();

  const category = CATEGORIES.find(c => c.id === selectedCategory);
  const progress = selectedCategory ? getProgressForCategory(selectedCategory) : null;
  const currentLevel = progress?.currentLevel || 0;
  const levelInfo = getLevelInfo(currentLevel);
  const hasProgress = progress && progress.correctAnswers > 0;

  const handleStart = () => {
    // Reset microphones and session correct answers for new game session
    setMicrophones(DEFAULT_MICROPHONES);
    setSessionCorrectAnswers(0);
    navigate('/game');
  };

  if (!selectedCategory || !category) {
    navigate('/categories');
    return null;
  }

  return (
    <BackgroundWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          {/* Logo */}
          <div className="fade-in">
            <Logo size="md" />
          </div>
          
          {/* Category info */}
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-6xl mb-4 block">{category.icon}</span>
            <h2 className="font-oswald text-3xl font-bold uppercase tracking-wide text-foreground">
              {category.name}
            </h2>
          </div>
          
          {/* Level info */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-card slide-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-muted-foreground uppercase tracking-wide text-sm mb-2">
              Current Level
            </p>
            <h3 className={cn(
              "font-oswald text-4xl font-bold uppercase",
              getLevelColor(currentLevel)
            )}>
              {levelInfo.name}
            </h3>
            {hasProgress && (
              <p className="text-muted-foreground mt-3 text-sm">
                {progress.correctAnswers} correct answers
              </p>
            )}
          </div>
          
          {/* Good luck message */}
          <div className="slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="font-oswald text-2xl text-foreground uppercase tracking-wide">
              Good Luck!
            </p>
          </div>
          
          {/* Start/Continue button */}
          <div className="slide-up" style={{ animationDelay: '0.5s' }}>
            <Button
              variant="play"
              size="full"
              onClick={handleStart}
              className="text-xl"
            >
              {hasProgress ? 'Continue' : 'Start'}
            </Button>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default GoodLuckScreen;
