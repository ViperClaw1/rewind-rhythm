-- Keep in sync with CATEGORIES in src/lib/gameData.ts.
ALTER TABLE public.questions
  ADD CONSTRAINT questions_category_check CHECK (category IN ('hip-hop', 'movies', 'tv', 'rnb'));

ALTER TABLE public.user_progress
  ADD CONSTRAINT user_progress_category_check CHECK (category IN ('hip-hop', 'movies', 'tv', 'rnb'));
