import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CATEGORIES, type Category } from '@/lib/gameData';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import Logo from '@/components/layout/Logo';
import CategoryCard from '@/components/game/CategoryCard';
import microphoneImg from '@/assets/microphone.png';

const CategoriesScreen = () => {
  const navigate = useNavigate();
  const { setSelectedCategory } = useGameState();

  const handleCategorySelect = (categoryId: Category) => {
    setSelectedCategory(categoryId);
    navigate('/good-luck');
  };

  return (
    <BackgroundWrapper>
      <div className="min-h-screen flex flex-col p-6 py-8">
        {/* Logo at top */}
        <div className="flex justify-center fade-in">
          <Logo size="md" />
        </div>
        
        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {/* Microphone image */}
          <div className="slide-up" style={{ animationDelay: '0.1s' }}>
            <img 
              src={microphoneImg} 
              alt="Microphone" 
              className="w-32 h-32 object-contain drop-shadow-xl"
            />
          </div>
          
          {/* Text */}
          <div className="text-center slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-oswald text-3xl font-bold uppercase tracking-wide gradient-text">
              Step Up to the Mic
            </h2>
            <p className="text-muted-foreground mt-2">Choose your category</p>
          </div>
          
          {/* Categories grid - 2x2 */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-4 slide-up" style={{ animationDelay: '0.3s' }}>
            {CATEGORIES.map((category, index) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                icon={category.icon}
                onClick={() => handleCategorySelect(category.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default CategoriesScreen;
