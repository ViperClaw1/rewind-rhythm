import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { 
  TIMER_DURATION, 
  LEVELS, 
  getQuestionsUpToLevel, 
  shuffleArray,
  type Category 
} from '@/lib/gameData';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import Logo from '@/components/layout/Logo';
import Timer from '@/components/game/Timer';
import MicrophoneCounter from '@/components/game/MicrophoneCounter';
import ProgressBar from '@/components/game/ProgressBar';
import AnswerButton from '@/components/game/AnswerButton';
import PurchasePopup from '@/components/game/PurchasePopup';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  level: number;
}

// Sound effects (using Web Audio API for simple sounds)
const playCorrectSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

const playWrongSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.15);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

const GameScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    selectedCategory,
    microphones,
    setMicrophones,
    sessionCorrectAnswers,
    setSessionCorrectAnswers,
    getProgressForCategory,
    saveProgress,
  } = useGameState();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<'default' | 'correct' | 'wrong'>('default');
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showPurchasePopup, setShowPurchasePopup] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);

  const isProcessingRef = useRef(false);

  // Initialize game
  useEffect(() => {
    if (!selectedCategory) {
      navigate('/categories');
      return;
    }

    const progress = getProgressForCategory(selectedCategory);
    const level = progress?.currentLevel || 0;
    const correct = progress?.correctAnswers || 0;
    const answered = progress?.totalQuestionsAnswered || 0;

    setCurrentLevel(level);
    setTotalCorrect(correct);
    setTotalAnswered(answered);

    // Get questions for current level and shuffle
    const categoryQuestions = getQuestionsUpToLevel(selectedCategory, level);
    const shuffled = shuffleArray(categoryQuestions);
    setQuestions(shuffled);
  }, [selectedCategory, getProgressForCategory, navigate]);

  const currentQuestion = questions[currentQuestionIndex];

  // Check for level up
  useEffect(() => {
    const nextLevel = LEVELS.find(l => l.requiredCorrect > totalCorrect);
    if (nextLevel && nextLevel.level > currentLevel) {
      setCurrentLevel(nextLevel.level - 1);
    } else if (!nextLevel && currentLevel < LEVELS.length - 1) {
      // Player has completed all levels
      setCurrentLevel(LEVELS.length - 1);
      toast({
        title: "🎉 Congratulations!",
        description: "You've reached the Diamond level!",
      });
    }
  }, [totalCorrect, currentLevel, toast]);

  const handleTimeUp = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    playWrongSound();
    setMicrophones(microphones - 1);
    setTotalAnswered(prev => prev + 1);
    setAnswerState('wrong');
    setIsTimerRunning(false);

    setTimeout(() => {
      if (microphones - 1 <= 1) {
        setShowPurchasePopup(true);
      } else {
        moveToNextQuestion();
      }
      isProcessingRef.current = false;
    }, 1500);
  }, [microphones, setMicrophones]);

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null || !isTimerRunning || isProcessingRef.current) return;
    isProcessingRef.current = true;

    setSelectedAnswer(index);
    setIsTimerRunning(false);

    const isCorrect = index === currentQuestion?.correctAnswer;
    const newMicrophoneCount = isCorrect ? microphones : microphones - 1;

    if (isCorrect) {
      playCorrectSound();
      setAnswerState('correct');
      setTotalCorrect(prev => prev + 1);
      setSessionCorrectAnswers(sessionCorrectAnswers + 1);
    } else {
      playWrongSound();
      setAnswerState('wrong');
      setMicrophones(newMicrophoneCount);
    }

    setTotalAnswered(prev => prev + 1);

    // Delay of 2 seconds to show the result before moving on
    setTimeout(() => {
      if (!isCorrect && newMicrophoneCount <= 1) {
        setShowPurchasePopup(true);
      } else {
        moveToNextQuestion();
      }
      isProcessingRef.current = false;
    }, 2000);
  };

  const moveToNextQuestion = () => {
    // Save progress
    if (selectedCategory) {
      saveProgress(selectedCategory, currentLevel, totalCorrect, totalAnswered);
    }

    // Check if we've answered all questions
    if (currentQuestionIndex >= questions.length - 1) {
      // Reshuffle and start over
      setQuestions(shuffleArray(questions));
      setCurrentQuestionIndex(0);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }

    setSelectedAnswer(null);
    setAnswerState('default');
    setIsTimerRunning(true);
    setTimerKey(prev => prev + 1);
  };

  const handlePurchase = (count: number) => {
    setMicrophones(microphones + count);
    setShowPurchasePopup(false);
    
    toast({
      title: "Microphones Added!",
      description: `You now have ${microphones + count} microphones.`,
    });

    if (answerState !== 'default') {
      moveToNextQuestion();
    }
  };

  const handleDeclinePurchase = () => {
    setShowPurchasePopup(false);
    
    // Save final progress before game over
    if (selectedCategory) {
      saveProgress(selectedCategory, currentLevel, totalCorrect, totalAnswered);
    }
    
    navigate('/game-over', {
      state: {
        correctAnswers: sessionCorrectAnswers,
        totalCorrect,
        currentLevel,
        category: selectedCategory,
      }
    });
  };

  if (!currentQuestion) {
    return (
      <BackgroundWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-foreground">Loading...</p>
        </div>
      </BackgroundWrapper>
    );
  }

  const getAnswerButtonState = (index: number) => {
    if (answerState === 'default') return 'default';
    if (index === currentQuestion.correctAnswer) return 'correct';
    if (index === selectedAnswer && answerState === 'wrong') return 'wrong';
    return 'default';
  };

  return (
    <BackgroundWrapper>
      <div className="min-h-screen flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 fade-in">
          <div className="flex-1">
            <Logo size="sm" showText={false} />
          </div>
          <div className="flex items-center gap-3">
            <Timer
              key={timerKey}
              duration={TIMER_DURATION}
              onTimeUp={handleTimeUp}
              isRunning={isTimerRunning}
            />
            <MicrophoneCounter count={microphones} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 fade-in" style={{ animationDelay: '0.1s' }}>
          <ProgressBar currentLevel={currentLevel} correctAnswers={totalCorrect} />
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-card mb-6 slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="font-oswald text-xl leading-relaxed text-foreground text-center">
              {currentQuestion.question}
            </p>
          </div>

          {/* Answers */}
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option, index) => (
              <AnswerButton
                key={`${currentQuestion.id}-${index}`}
                answer={option}
                index={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null || !isTimerRunning}
                state={getAnswerButtonState(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Purchase popup */}
      <PurchasePopup
        isOpen={showPurchasePopup}
        onClose={() => {}}
        onPurchase={handlePurchase}
        onDecline={handleDeclinePurchase}
        remainingMicrophones={microphones}
      />
    </BackgroundWrapper>
  );
};

export default GameScreen;
