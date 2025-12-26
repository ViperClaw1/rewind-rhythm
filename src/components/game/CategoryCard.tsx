import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}

const CategoryCard = ({ id, name, icon, onClick, disabled }: CategoryCardProps) => {
  return (
    <Button
      variant="category"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-3 h-32 rounded-2xl",
        "hover:transform hover:scale-105 transition-all duration-300",
        "fade-in"
      )}
    >
      <span className="text-4xl">{icon}</span>
      <span className="font-oswald font-semibold text-lg uppercase tracking-wide">
        {name}
      </span>
    </Button>
  );
};

export default CategoryCard;
