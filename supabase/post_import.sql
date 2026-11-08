-- Run once after importing Lovable data. Safe to re-run.
-- Imported levels were written by the client and cannot be trusted.
-- ponytail: correct_answers is kept as is, inflated counts are indistinguishable from real ones.
UPDATE public.user_progress
SET current_level = public.compute_level(correct_answers)
WHERE current_level IS DISTINCT FROM public.compute_level(correct_answers);
