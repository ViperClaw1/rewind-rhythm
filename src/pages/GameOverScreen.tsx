import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import Logo from '@/components/layout/Logo';
import { getLevelInfo, getLevelColor, CATEGORIES, LEVELS } from '@/lib/gameData';
import { cn } from '@/lib/utils';

interface GameOverState {
  correctAnswers: number;
  totalCorrect: number;
  currentLevel: number;
  category: string;
}

const GameOverScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as GameOverState | undefined;

  const correctAnswers = state?.correctAnswers || 0;
  const totalCorrect = state?.totalCorrect || 0;
  const currentLevel = state?.currentLevel || 0;
  const categoryId = state?.category || '';

  const category = CATEGORIES.find(c => c.id === categoryId);
  const levelInfo = getLevelInfo(currentLevel);
  const nextLevel = LEVELS[currentLevel + 1];
  const answersNeededForNext = nextLevel ? nextLevel.requiredCorrect - totalCorrect : 0;

  const handleBackToCategories = () => {
    navigate('/categories');
  };

  return (
    <BackgroundWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          {/* Logo */}
          <div className="fade-in">
            <Logo size="md" />
          </div>
          
          {/* Game Over title */}
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="font-oswald text-5xl font-bold uppercase tracking-wider text-primary text-glow">
              Game Over
            </h1>
          </div>
          
          {/* Stats card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-card space-y-6 slide-up" style={{ animationDelay: '0.3s' }}>
            {/* Category */}
            {category && (
              <div className="pb-4 border-b border-border">
                <span className="text-4xl mb-2 block">{category.icon}</span>
                <p className="font-oswald text-xl uppercase tracking-wide text-foreground">
                  {category.name}
                </p>
              </div>
            )}
            
            {/* Session stats */}
            <div>
              <p className="text-muted-foreground text-sm uppercase tracking-wide mb-1">
                This Session
              </p>
              <p className="font-oswald text-4xl font-bold text-foreground">
                {correctAnswers}
              </p>
              <p className="text-muted-foreground text-sm">Correct Answers</p>
            </div>
            
            {/* Level */}
            <div className="pb-4 border-b border-border">
              <p className="text-muted-foreground text-sm uppercase tracking-wide mb-1">
                Current Level
              </p>
              <p className={cn(
                "font-oswald text-3xl font-bold uppercase",
                getLevelColor(currentLevel)
              )}>
                {levelInfo.name}
              </p>
            </div>
            
            {/* Progress to next level */}
            {nextLevel && (
              <div>
                <p className="text-muted-foreground text-sm uppercase tracking-wide mb-1">
                  Progress to {LEVELS[currentLevel + 1].name}
                </p>
                <p className="font-oswald text-2xl font-bold text-foreground">
                  {totalCorrect} / {nextLevel.requiredCorrect}
                </p>
                <p className="text-muted-foreground text-sm">
                  {answersNeededForNext} more correct answers needed
                </p>
              </div>
            )}
            
            {!nextLevel && (
              <div>
                <p className="font-oswald text-xl text-level-diamond">
                  🎉 Maximum Level Reached!
                </p>
              </div>
            )}
          </div>
          
          {/* Back button */}
          <div className="slide-up" style={{ animationDelay: '0.5s' }}>
            <Button
              variant="hero"
              size="full"
              onClick={handleBackToCategories}
            >
              Back to Categories
            </Button>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default GameOverScreen;
