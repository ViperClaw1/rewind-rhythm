-- The only place level thresholds are defined. Matches what the client has always
-- computed: Gold at 10 correct, then every 5, Diamond at 25.
CREATE FUNCTION public.compute_level(p_correct INTEGER)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT greatest(0, least(4, p_correct / 5 - 1));
$$;

CREATE FUNCTION public.start_game(p_category TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_free CONSTANT INTEGER := 3; -- free lives per game (DEFAULT_MICROPHONES on the client)
  v_session UUID;
  v_balance INTEGER;
  v_progress user_progress;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE game_sessions SET ended_at = now() WHERE user_id = v_user AND ended_at IS NULL;

  INSERT INTO game_sessions (user_id, category, microphones)
  VALUES (v_user, p_category, v_free)
  RETURNING id INTO v_session;

  INSERT INTO user_progress (user_id, category)
  VALUES (v_user, p_category)
  ON CONFLICT (user_id, category) DO NOTHING;

  SELECT * INTO STRICT v_progress FROM user_progress WHERE user_id = v_user AND category = p_category;
  SELECT microphone_balance INTO STRICT v_balance FROM profiles WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'session_id', v_session,
    'microphones', v_free + v_balance,
    'level', v_progress.current_level,
    'total_correct', v_progress.correct_answers
  );
END;
$$;

-- Reloading returns the still-open question with its original deadline,
-- so a refresh cannot restart the timer.
CREATE FUNCTION public.get_next_question(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session game_sessions;
  v_level INTEGER;
  v_question UUID;
  v_served_at TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  SELECT * INTO v_session FROM game_sessions
  WHERE id = p_session_id AND user_id = auth.uid() AND ended_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_active' USING ERRCODE = 'P0001';
  END IF;

  SELECT question_id, served_at INTO v_question, v_served_at
  FROM game_answers
  WHERE session_id = p_session_id AND answered_at IS NULL;

  IF NOT FOUND THEN
    SELECT current_level INTO STRICT v_level FROM user_progress
    WHERE user_id = v_session.user_id AND category = v_session.category;

    -- Unserved questions first; repeats only after the pool is exhausted.
    SELECT q.id INTO v_question
    FROM questions q
    LEFT JOIN game_answers a ON a.question_id = q.id AND a.session_id = p_session_id
    WHERE q.category = v_session.category AND q.level <= v_level
    GROUP BY q.id
    ORDER BY count(a.id), random()
    LIMIT 1;

    IF v_question IS NULL THEN
      RAISE EXCEPTION 'no_questions' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO game_answers (session_id, question_id)
    VALUES (p_session_id, v_question)
    RETURNING served_at INTO v_served_at;
  END IF;

  SELECT jsonb_build_object(
    'question_id', q.id,
    'question_text', q.question_text,
    'options', q.options,
    'seconds_left', greatest(0, 10 - extract(epoch FROM clock_timestamp() - v_served_at))
  ) INTO v_result
  FROM questions q WHERE q.id = v_question;

  RETURN v_result;
END;
$$;

-- p_answer_index NULL means the client timer ran out.
CREATE FUNCTION public.submit_answer(p_session_id UUID, p_question_id UUID, p_answer_index INTEGER)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session game_sessions;
  v_answer game_answers;
  v_correct_index INTEGER;
  v_timed_out BOOLEAN;
  v_is_correct BOOLEAN;
  v_balance INTEGER;
  v_progress user_progress;
  v_lives INTEGER;
BEGIN
  IF p_answer_index IS NOT NULL AND p_answer_index NOT BETWEEN 0 AND 3 THEN
    RAISE EXCEPTION 'invalid_answer' USING ERRCODE = 'P0001';
  END IF;

  -- The row lock serializes double submits from the same session.
  SELECT * INTO v_session FROM game_sessions
  WHERE id = p_session_id AND user_id = auth.uid() AND ended_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_active' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_answer FROM game_answers
  WHERE session_id = p_session_id AND question_id = p_question_id AND answered_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'question_not_open' USING ERRCODE = 'P0001';
  END IF;

  SELECT correct_answer INTO STRICT v_correct_index FROM questions WHERE id = p_question_id;

  -- 10 s timer + 1.5 s network grace.
  v_timed_out := p_answer_index IS NULL
    OR clock_timestamp() - v_answer.served_at > interval '11.5 seconds';
  v_is_correct := NOT v_timed_out AND p_answer_index = v_correct_index;

  UPDATE game_answers
  SET answer_index = CASE WHEN v_timed_out THEN NULL ELSE p_answer_index END,
      is_correct = v_is_correct,
      answered_at = clock_timestamp()
  WHERE id = v_answer.id;

  UPDATE user_progress
  SET correct_answers = correct_answers + v_is_correct::INTEGER,
      total_questions_answered = total_questions_answered + 1,
      current_level = compute_level(correct_answers + v_is_correct::INTEGER)
  WHERE user_id = v_session.user_id AND category = v_session.category
  RETURNING * INTO STRICT v_progress;

  -- Spend the free lives of this game first, then the purchased balance.
  IF v_is_correct THEN
    v_session.correct_count := v_session.correct_count + 1;
  ELSIF v_session.microphones > 0 THEN
    v_session.microphones := v_session.microphones - 1;
  ELSE
    UPDATE profiles SET microphone_balance = microphone_balance - 1
    WHERE user_id = v_session.user_id AND microphone_balance > 0;

    IF FOUND THEN
      INSERT INTO microphone_ledger (user_id, delta, reason, ref_id)
      VALUES (v_session.user_id, -1, CASE WHEN v_timed_out THEN 'timeout' ELSE 'answer_wrong' END, v_answer.id::TEXT);
    END IF;
  END IF;

  SELECT microphone_balance INTO STRICT v_balance FROM profiles WHERE user_id = v_session.user_id;
  v_lives := v_session.microphones + v_balance;

  UPDATE game_sessions
  SET microphones = v_session.microphones,
      correct_count = v_session.correct_count,
      ended_at = CASE WHEN v_lives = 0 THEN now() END
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'timed_out', v_timed_out,
    'correct_index', v_correct_index,
    'microphones', v_lives,
    'total_correct', v_progress.correct_answers,
    'total_answered', v_progress.total_questions_answered,
    'session_correct', v_session.correct_count,
    'level', v_progress.current_level,
    'game_over', v_lives = 0
  );
END;
$$;

CREATE FUNCTION public.end_game(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session game_sessions;
  v_progress user_progress;
BEGIN
  UPDATE game_sessions SET ended_at = coalesce(ended_at, now())
  WHERE id = p_session_id AND user_id = auth.uid()
  RETURNING * INTO v_session;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO STRICT v_progress FROM user_progress
  WHERE user_id = v_session.user_id AND category = v_session.category;

  RETURN jsonb_build_object(
    'session_correct', v_session.correct_count,
    'total_correct', v_progress.correct_answers,
    'level', v_progress.current_level
  );
END;
$$;

-- Webhook only (service_role). Idempotent: a redelivered event finds no pending row.
CREATE FUNCTION public.credit_microphones(p_provider_ref TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_purchase purchases;
BEGIN
  UPDATE purchases SET status = 'paid'
  WHERE provider_ref = p_provider_ref AND status = 'pending'
  RETURNING * INTO v_purchase;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE profiles SET microphone_balance = microphone_balance + v_purchase.microphones
  WHERE user_id = v_purchase.user_id;

  INSERT INTO microphone_ledger (user_id, delta, reason, ref_id)
  VALUES (v_purchase.user_id, v_purchase.microphones, 'purchase', v_purchase.id::TEXT);

  RETURN true;
END;
$$;

-- Webhook only (service_role). Takes back at most what is left; spent microphones stay spent.
CREATE FUNCTION public.refund_microphones(p_provider_ref TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_purchase purchases;
  v_taken INTEGER;
BEGIN
  UPDATE purchases SET status = 'refunded'
  WHERE provider_ref = p_provider_ref AND status = 'paid'
  RETURNING * INTO v_purchase;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT least(microphone_balance, v_purchase.microphones) INTO STRICT v_taken
  FROM profiles WHERE user_id = v_purchase.user_id FOR UPDATE;

  UPDATE profiles SET microphone_balance = microphone_balance - v_taken
  WHERE user_id = v_purchase.user_id;

  INSERT INTO microphone_ledger (user_id, delta, reason, ref_id)
  VALUES (v_purchase.user_id, -v_taken, 'refund', v_purchase.id::TEXT);

  RETURN true;
END;
$$;

-- Supabase default privileges give EXECUTE to anon and authenticated, so revoke explicitly.
REVOKE ALL ON FUNCTION
  public.start_game(TEXT),
  public.get_next_question(UUID),
  public.submit_answer(UUID, UUID, INTEGER),
  public.end_game(UUID),
  public.credit_microphones(TEXT),
  public.refund_microphones(TEXT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.start_game(TEXT),
  public.get_next_question(UUID),
  public.submit_answer(UUID, UUID, INTEGER),
  public.end_game(UUID)
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.credit_microphones(TEXT),
  public.refund_microphones(TEXT)
TO service_role;
