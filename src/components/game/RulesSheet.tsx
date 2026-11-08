import { useEffect, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES, DEFAULT_MICROPHONES, LEVELS, TIMER_DURATION } from '@/lib/gameData';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Bump when the rules change to show them again to everyone.
const CURRENT_RULES_VERSION = 1;

const RULES = [
  {
    title: 'Timer',
    body: `Each question has 4 answers. You get ${TIMER_DURATION} seconds to pick one.`,
  },
  {
    title: 'Microphones',
    body: `You start with ${DEFAULT_MICROPHONES} microphones. A wrong answer or running out of time costs one. At 0 the game is over, but your level is saved.`,
  },
  {
    title: 'Levels',
    body: LEVELS.map((l) => `${l.name}: ${l.requiredCorrect}`).join(' · ') + ' correct answers. Higher levels unlock more questions.',
  },
  {
    title: 'Categories',
    body: `${CATEGORIES.map((c) => c.name).join(', ')}. Progress is tracked separately for each.`,
  },
];

// autoShow: open once for players who haven't seen the current rules.
const RulesSheet = ({ autoShow = false }: { autoShow?: boolean }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const unseen = useRef(false);

  useEffect(() => {
    if (!autoShow || !user) return;
    let cancelled = false;

    // On a load error the rules just don't open: they must never block the game.
    supabase
      .from('profiles')
      .select('onboarding_version')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Error loading onboarding state:', error);
        if (cancelled || !data || data.onboarding_version >= CURRENT_RULES_VERSION) return;
        unseen.current = true;
        setOpen(true);
      });

    return () => {
      cancelled = true;
    };
  }, [autoShow, user]);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next || !unseen.current || !user) return;

    unseen.current = false;
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_version: CURRENT_RULES_VERSION })
      .eq('user_id', user.id);
    if (error) console.error('Error saving onboarding state:', error);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        aria-label="Game rules"
        className="fixed right-4 top-4 z-10 p-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <CircleHelp className="h-6 w-6" />
      </button>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-oswald uppercase tracking-wide">How to Play</SheetTitle>
            <SheetDescription>Answer fast, keep your microphones, climb the levels.</SheetDescription>
          </SheetHeader>
          <dl className="mt-4 space-y-4">
            {RULES.map((rule) => (
              <div key={rule.title}>
                <dt className="font-oswald font-semibold uppercase text-foreground">{rule.title}</dt>
                <dd className="text-sm text-muted-foreground">{rule.body}</dd>
              </div>
            ))}
          </dl>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default RulesSheet;
