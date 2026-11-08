import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { DEFAULT_MICROPHONES, type Category } from '@/lib/gameData';

interface UserProgress {
  category: string;
  currentLevel: number;
  correctAnswers: number;
  totalQuestionsAnswered: number;
}

interface GameContextType {
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  microphones: number;
  setMicrophones: (count: number) => void;
  sessionCorrectAnswers: number;
  setSessionCorrectAnswers: (count: number) => void;
  getProgressForCategory: (category: Category) => UserProgress | null;
  saveProgress: (category: Category, level: number, correctAnswers: number, totalAnswered: number) => Promise<void>;
  loadProgress: () => Promise<void>;
  progressMap: Record<string, UserProgress>;
  loading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [microphones, setMicrophones] = useState(DEFAULT_MICROPHONES);
  const [sessionCorrectAnswers, setSessionCorrectAnswers] = useState(0);
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  // Load progress when user changes
  useEffect(() => {
    if (user) {
      loadProgress();
    } else {
      setProgressMap({});
      setLoading(false);
    }
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading progress:', error);
        return;
      }

      const map: Record<string, UserProgress> = {};
      if (data) {
        data.forEach((p) => {
          map[p.category] = {
            category: p.category,
            currentLevel: p.current_level,
            correctAnswers: p.correct_answers,
            totalQuestionsAnswered: p.total_questions_answered,
          };
        });
      }
      setProgressMap(map);
    } catch (err) {
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgressForCategory = (category: Category): UserProgress | null => {
    return progressMap[category] || null;
  };

  const saveProgress = async (
    category: Category,
    level: number,
    correctAnswers: number,
    totalAnswered: number
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          category,
          current_level: level,
          correct_answers: correctAnswers,
          total_questions_answered: totalAnswered,
        }, {
          onConflict: 'user_id,category'
        });

      if (error) {
        console.error('Error saving progress:', error);
        return;
      }

      // Update local state
      setProgressMap(prev => ({
        ...prev,
        [category]: {
          category,
          currentLevel: level,
          correctAnswers,
          totalQuestionsAnswered: totalAnswered,
        }
      }));
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  return (
    <GameContext.Provider value={{
      selectedCategory,
      setSelectedCategory,
      microphones,
      setMicrophones,
      sessionCorrectAnswers,
      setSessionCorrectAnswers,
      getProgressForCategory,
      saveProgress,
      loadProgress,
      progressMap,
      loading,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
};
