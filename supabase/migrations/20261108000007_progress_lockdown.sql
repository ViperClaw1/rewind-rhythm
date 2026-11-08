-- Breaks the current client's saveProgress: deploy together with the RPC-based frontend.
DROP POLICY "Users can update their own progress" ON public.user_progress;
DROP POLICY "Users can insert their own progress" ON public.user_progress;
REVOKE ALL ON public.user_progress FROM anon, authenticated;
GRANT SELECT ON public.user_progress TO authenticated;

-- Profiles are created by the signup trigger. Clients may change only has_watched_rules,
-- otherwise microphone_balance could be written directly.
DROP POLICY "Users can insert their own profile" ON public.profiles;
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (has_watched_rules) ON public.profiles TO authenticated;
