import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnswerButtonProps {
  answer: string;
  index: number;
  onClick: () => void;
  disabled?: boolean;
  state?: 'default' | 'selected' | 'correct' | 'wrong';
}

const AnswerButton = ({ answer, index, onClick, disabled, state = 'default' }: AnswerButtonProps) => {
  const labels = ['A', 'B', 'C', 'D'];
  
  const getVariant = () => {
    switch (state) {
      case 'correct':
        return 'answerCorrect';
      case 'wrong':
        return 'answerWrong';
      case 'selected':
        return 'answerSelected';
      default:
        return 'answer';
    }
  };

  return (
    <Button
      variant={getVariant()}
      size="answer"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "justify-start gap-4",
        state === 'correct' && 'answer-correct',
        state === 'wrong' && 'answer-wrong',
        "fade-in"
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-background/20 font-oswald font-bold">
        {labels[index]}
      </span>
      <span className="font-oswald text-base leading-snug">
        {answer}
      </span>
    </Button>
  );
};

export default AnswerButton;
