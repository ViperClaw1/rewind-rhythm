ALTER TABLE public.questions
  ADD CONSTRAINT questions_options_check CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4),
  ADD CONSTRAINT questions_correct_answer_check CHECK (correct_answer BETWEEN 0 AND 3),
  ADD CONSTRAINT questions_level_check CHECK (level BETWEEN 0 AND 4);

CREATE INDEX questions_category_level_idx ON public.questions (category, level);

-- Questions are served only by get_next_question. A column-level
-- REVOKE (correct_answer) would be a no-op while the table-level SELECT grant exists.
DROP POLICY "Anyone can read questions" ON public.questions;
REVOKE ALL ON public.questions FROM anon, authenticated;
