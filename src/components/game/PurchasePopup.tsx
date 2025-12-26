import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { MICROPHONE_PACKS } from '@/lib/gameData';

interface PurchasePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (count: number) => void;
  onDecline: () => void;
  remainingMicrophones: number;
}

const PurchasePopup = ({ isOpen, onClose, onPurchase, onDecline, remainingMicrophones }: PurchasePopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/20 border border-primary/40">
              <Mic className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="font-oswald text-2xl uppercase tracking-wide text-foreground">
            {remainingMicrophones === 0 ? 'Out of Microphones!' : 'Running Low!'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {remainingMicrophones === 0 
              ? "You've used all your microphones. Buy more to continue playing!"
              : `You have only ${remainingMicrophones} microphone${remainingMicrophones > 1 ? 's' : ''} left. Buy more?`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          {MICROPHONE_PACKS.map((pack) => (
            <Button
              key={pack.count}
              variant="purchase"
              size="full"
              onClick={() => onPurchase(pack.count)}
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                <span>{pack.count} Microphones</span>
              </span>
              <span className="font-bold">${pack.price.toFixed(2)}</span>
            </Button>
          ))}
          
          <Button
            variant="ghost"
            onClick={onDecline}
            className="text-muted-foreground hover:text-foreground mt-2"
          >
            No Thanks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchasePopup;
