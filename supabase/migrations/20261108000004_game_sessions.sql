CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('hip-hop', 'movies', 'tv', 'rnb')),
  microphones INTEGER NOT NULL CHECK (microphones >= 0), -- free lives left in this game
  correct_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX game_sessions_one_active_idx ON public.game_sessions (user_id) WHERE ended_at IS NULL;

-- Questions may repeat within a session once the pool is exhausted, so
-- (session_id, question_id) is deliberately not unique.
CREATE TABLE public.game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  answer_index INTEGER CHECK (answer_index BETWEEN 0 AND 3), -- NULL = timeout or not answered yet
  is_correct BOOLEAN,
  served_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ
);

CREATE INDEX game_answers_session_question_idx ON public.game_answers (session_id, question_id);
CREATE UNIQUE INDEX game_answers_one_open_idx ON public.game_answers (session_id) WHERE answered_at IS NULL;

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.game_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own answers"
ON public.game_answers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.game_sessions s
  WHERE s.id = session_id AND s.user_id = auth.uid()
));

REVOKE ALL ON public.game_sessions, public.game_answers FROM anon, authenticated;
GRANT SELECT ON public.game_sessions, public.game_answers TO authenticated;
