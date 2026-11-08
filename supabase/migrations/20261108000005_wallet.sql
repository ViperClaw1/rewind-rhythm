-- Purchased microphones only. Every game also grants free lives, see start_game.
ALTER TABLE public.profiles
  ADD COLUMN microphone_balance INTEGER NOT NULL DEFAULT 0 CHECK (microphone_balance >= 0);

CREATE TABLE public.microphone_ledger (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('answer_wrong', 'timeout', 'purchase', 'refund', 'admin')),
  ref_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX microphone_ledger_user_idx ON public.microphone_ledger (user_id);

CREATE TABLE public.microphone_packs (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL CHECK (count > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.microphone_packs (id, count, price_cents) VALUES
  ('mics-3', 3, 99),
  ('mics-5', 5, 149),
  ('mics-10', 10, 249);

CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL REFERENCES public.microphone_packs(id),
  microphones INTEGER NOT NULL CHECK (microphones > 0), -- snapshot, packs may change later
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'apple', 'google')),
  provider_ref TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX purchases_user_idx ON public.purchases (user_id);

ALTER TABLE public.microphone_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microphone_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ledger"
ON public.microphone_ledger FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read active packs"
ON public.microphone_packs FOR SELECT
USING (active);

CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
USING (auth.uid() = user_id);

REVOKE ALL ON public.microphone_ledger, public.microphone_packs, public.purchases FROM anon, authenticated;
GRANT SELECT ON public.microphone_ledger, public.purchases TO authenticated;
GRANT SELECT ON public.microphone_packs TO anon, authenticated;
