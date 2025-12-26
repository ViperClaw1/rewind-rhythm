import { ReactNode } from 'react';
import heroBackground from '@/assets/hero-background.jpg';

interface BackgroundWrapperProps {
  children: ReactNode;
  overlay?: boolean;
}

const BackgroundWrapper = ({ children, overlay = true }: BackgroundWrapperProps) => {
  return (
    <div 
      className="min-h-screen w-full bg-background bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      {overlay && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default BackgroundWrapper;
