import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import Logo from '@/components/layout/Logo';
import RulesSheet from '@/components/game/RulesSheet';
import microphoneImg from '@/assets/microphone.png';

const SplashScreen = () => {
  const navigate = useNavigate();

  const handlePlay = () => {
    navigate('/categories');
  };

  return (
    <BackgroundWrapper>
      <RulesSheet autoShow />
      <div className="min-h-screen flex flex-col items-center justify-between p-6 py-12">
        {/* Logo at top */}
        <div className="fade-in" style={{ animationDelay: '0.1s' }}>
          <Logo size="lg" />
        </div>
        
        {/* Center microphone image */}
        <div className="flex-1 flex items-center justify-center slide-up" style={{ animationDelay: '0.3s' }}>
          <img 
            src={microphoneImg} 
            alt="Microphone" 
            className="w-64 h-64 object-contain drop-shadow-2xl"
          />
        </div>
        
        {/* Play button at bottom */}
        <div className="w-full max-w-xs fade-in" style={{ animationDelay: '0.5s' }}>
          <Button
            variant="play"
            size="full"
            onClick={handlePlay}
            className="text-2xl"
          >
            Play
          </Button>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default SplashScreen;
