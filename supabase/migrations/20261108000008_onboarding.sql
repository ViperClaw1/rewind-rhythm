-- Last version of the rules the player has seen. Bump CURRENT_RULES_VERSION in the client to show them again.
ALTER TABLE public.profiles ADD COLUMN onboarding_version SMALLINT NOT NULL DEFAULT 0;
GRANT UPDATE (onboarding_version) ON public.profiles TO authenticated;
