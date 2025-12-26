import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import Logo from '@/components/layout/Logo';

const RulesScreen = () => {
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { setHasWatchedRules } = useGameState();

  // Sample video URL - in production this would be your actual rules video
  const videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const handleContinue = async () => {
    await setHasWatchedRules(true);
    navigate('/splash');
  };

  useEffect(() => {
    // Auto-play video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, []);

  return (
    <BackgroundWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8 fade-in">
          <Logo size="md" />
          
          <div className="text-center">
            <h2 className="font-oswald text-2xl font-bold uppercase tracking-wide text-foreground mb-2">
              Game Rules
            </h2>
            <p className="text-muted-foreground">
              Watch the video to learn how to play
            </p>
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-border shadow-card">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full aspect-video object-cover"
              onEnded={handleVideoEnd}
              playsInline
              // Video with sound enabled (not muted)
            />
          </div>
          
          <Button
            variant="play"
            size="full"
            onClick={handleContinue}
            disabled={!videoEnded}
            className={!videoEnded ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {videoEnded ? 'Continue' : 'Watch the video to continue'}
          </Button>
          
          {!videoEnded && (
            <p className="text-center text-sm text-muted-foreground">
              The continue button will be enabled after the video finishes
            </p>
          )}
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default RulesScreen;
