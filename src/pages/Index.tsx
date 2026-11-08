import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import Logo from '@/components/layout/Logo';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    navigate(user ? '/splash' : '/auth');
  }, [user, authLoading, navigate]);

  // Show loading state while checking auth
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
