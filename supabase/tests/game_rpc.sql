-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/game_rpc.sql
-- Requires migrations and seed.sql applied. Plain ASSERTs, everything is rolled back.
BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local');

CREATE FUNCTION pg_temp.denied(p_sql TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RETURN false;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN true;
END;
$$;

-- Levels match the old client behaviour.
DO $$
BEGIN
  ASSERT public.compute_level(0) = 0;
  ASSERT public.compute_level(9) = 0;
  ASSERT public.compute_level(10) = 1;
  ASSERT public.compute_level(15) = 2;
  ASSERT public.compute_level(20) = 3;
  ASSERT public.compute_level(24) = 3;
  ASSERT public.compute_level(25) = 4;
  ASSERT public.compute_level(1000) = 4;
END $$;

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

-- Direct access is closed.
DO $$
BEGIN
  ASSERT pg_temp.denied('SELECT correct_answer FROM public.questions'), 'correct_answer readable';
  ASSERT pg_temp.denied('SELECT id FROM public.questions'), 'questions readable';
  ASSERT pg_temp.denied('UPDATE public.user_progress SET current_level = 4'), 'progress update';
  ASSERT pg_temp.denied($q$INSERT INTO public.user_progress (user_id, category) VALUES (auth.uid(), 'tv')$q$), 'progress insert';
  ASSERT pg_temp.denied('UPDATE public.profiles SET microphone_balance = 999'), 'balance update';
  ASSERT pg_temp.denied('INSERT INTO public.microphone_ledger (user_id, delta, reason) VALUES (auth.uid(), 5, $r$admin$r$)'), 'ledger insert';
  ASSERT pg_temp.denied($q$SELECT public.credit_microphones('x')$q$), 'credit by client';
  UPDATE public.profiles SET has_watched_rules = true; -- still allowed
END $$;

-- Game flow.
DO $$
DECLARE
  s JSONB; q JSONB; r JSONB; sid UUID; qid UUID; right_idx INTEGER; i INTEGER;
BEGIN
  s := public.start_game('hip-hop');
  sid := s->>'session_id';
  ASSERT (s->>'microphones')::INT = 3 AND (s->>'level')::INT = 0, 'start';

  q := public.get_next_question(sid);
  qid := q->>'question_id';
  ASSERT NOT q ? 'correct_answer', 'answer leaked';
  ASSERT public.get_next_question(sid)->>'question_id' = qid::TEXT, 'reload must keep the question';

  r := public.submit_answer(sid, qid, 0);
  right_idx := (r->>'correct_index')::INT;
  ASSERT (r->>'total_answered')::INT = 1, 'answered counted without lag';
  ASSERT (r->>'is_correct')::BOOLEAN = (right_idx = 0), 'is_correct';
  ASSERT (r->>'microphones')::INT = CASE WHEN right_idx = 0 THEN 3 ELSE 2 END, 'lives after answer';

  BEGIN
    PERFORM public.submit_answer(sid, qid, 0);
    ASSERT false, 'double submit accepted';
  EXCEPTION WHEN raise_exception THEN
    ASSERT SQLERRM = 'question_not_open', SQLERRM;
  END;

  BEGIN
    PERFORM public.submit_answer(sid, (public.get_next_question(sid)->>'question_id')::UUID, 9);
    ASSERT false, 'bad index accepted';
  EXCEPTION WHEN raise_exception THEN
    ASSERT SQLERRM = 'invalid_answer', SQLERRM;
  END;

  -- Explicit timeouts until the game ends.
  FOR i IN 1..3 LOOP
    q := public.get_next_question(sid);
    r := public.submit_answer(sid, (q->>'question_id')::UUID, NULL);
    ASSERT (r->>'timed_out')::BOOLEAN, 'timeout flag';
    EXIT WHEN (r->>'game_over')::BOOLEAN;
  END LOOP;
  ASSERT (r->>'game_over')::BOOLEAN AND (r->>'microphones')::INT = 0, 'game over';

  BEGIN
    PERFORM public.get_next_question(sid);
    ASSERT false, 'ended session served a question';
  EXCEPTION WHEN raise_exception THEN
    ASSERT SQLERRM = 'session_not_active', SQLERRM;
  END;

  -- A new game grants free lives again.
  ASSERT (public.start_game('hip-hop')->>'microphones')::INT = 3, 'free lives per game';
END $$;

-- Late answers lose even when the index is right.
RESET ROLE;
DO $$
DECLARE
  sid UUID; qid UUID; right_idx INTEGER; r JSONB;
BEGIN
  SELECT id INTO sid FROM public.game_sessions WHERE ended_at IS NULL;
  qid := public.get_next_question(sid)->>'question_id';
  SELECT correct_answer INTO right_idx FROM public.questions WHERE id = qid;
  UPDATE public.game_answers SET served_at = now() - interval '12 seconds'
  WHERE session_id = sid AND answered_at IS NULL;
  r := public.submit_answer(sid, qid, right_idx);
  ASSERT NOT (r->>'is_correct')::BOOLEAN AND (r->>'timed_out')::BOOLEAN, 'late answer';

  qid := public.get_next_question(sid)->>'question_id';
  SELECT correct_answer INTO right_idx FROM public.questions WHERE id = qid;
  r := public.submit_answer(sid, qid, right_idx);
  ASSERT (r->>'is_correct')::BOOLEAN AND (r->>'session_correct')::INT = 1, 'on-time correct answer';
END $$;

-- Other users' sessions are invisible and unusable.
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM public.game_sessions), 'foreign sessions visible';
  ASSERT NOT EXISTS (SELECT 1 FROM public.user_progress), 'foreign progress visible';
END $$;
RESET ROLE;
SELECT set_config('test.foreign_sid', id::TEXT, true) FROM public.game_sessions WHERE ended_at IS NULL;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.get_next_question(current_setting('test.foreign_sid')::UUID);
  ASSERT false, 'foreign session usable';
EXCEPTION WHEN raise_exception THEN
  ASSERT SQLERRM = 'session_not_active', SQLERRM;
END $$;
RESET ROLE;

-- Wallet: purchases are idempotent, spent after free lives, ledger matches the balance.
DO $$
DECLARE
  a CONSTANT UUID := '00000000-0000-0000-0000-00000000000a';
  sid UUID; q JSONB; r JSONB; i INTEGER;
BEGIN
  INSERT INTO public.purchases (user_id, pack_id, microphones, amount_cents, currency, provider, provider_ref)
  VALUES (a, 'mics-3', 3, 99, 'usd', 'stripe', 'cs_test');

  ASSERT public.credit_microphones('cs_test'), 'first credit';
  ASSERT NOT public.credit_microphones('cs_test'), 'redelivery must not credit';
  ASSERT (SELECT microphone_balance FROM public.profiles WHERE user_id = a) = 3, 'balance after credit';

  PERFORM set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', true);
  sid := public.start_game('tv')->>'session_id';

  FOR i IN 1..4 LOOP
    q := public.get_next_question(sid);
    r := public.submit_answer(sid, (q->>'question_id')::UUID, NULL);
  END LOOP;
  ASSERT (r->>'microphones')::INT = 2 AND NOT (r->>'game_over')::BOOLEAN, 'free lives spent first';
  ASSERT (SELECT microphone_balance FROM public.profiles WHERE user_id = a) = 2, 'balance after spend';

  ASSERT public.refund_microphones('cs_test'), 'refund';
  ASSERT NOT public.refund_microphones('cs_test'), 'second refund';
  ASSERT (SELECT microphone_balance FROM public.profiles WHERE user_id = a) = 0, 'balance after refund';
  ASSERT (SELECT sum(delta) FROM public.microphone_ledger WHERE user_id = a) = 0, 'ledger equals balance';
END $$;

SELECT 'game_rpc: all checks passed' AS result;
ROLLBACK;
