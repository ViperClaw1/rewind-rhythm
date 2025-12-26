import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameState } from '@/hooks/useGameState';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import Logo from '@/components/layout/Logo';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasWatchedRules, loading: gameLoading } = useGameState();

  useEffect(() => {
    if (authLoading || gameLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    // User is authenticated, check if they've watched rules
    if (hasWatchedRules === false) {
      navigate('/rules');
    } else if (hasWatchedRules === true) {
      navigate('/splash');
    }
    // If hasWatchedRules is null, we're still loading
  }, [user, hasWatchedRules, authLoading, gameLoading, navigate]);

  // Show loading state while checking auth and game state
  return (
    <BackgroundWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Logo size="lg" />
        <div className="mt-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default Index;
