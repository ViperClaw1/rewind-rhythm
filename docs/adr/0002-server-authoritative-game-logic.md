# ADR-0002: Серверно-авторитетная игровая логика через Postgres RPC

- Статус: Proposed
- Дата: 2026-11-08
- Связано: ADR-0001, ADR-0003

## Контекст

Сейчас вся игра живёт в клиенте:
- `src/lib/gameData.ts` → `MOCK_QUESTIONS` (~100 вопросов) вместе с `correctAnswer` попадают в JS-бандл. Таблица `questions` в БД есть, но не используется.
- `GameScreen.tsx` сам решает, правильный ли ответ, сам считает уровень и сам пишет в `user_progress` через `upsert`.
- RLS на `user_progress` разрешает владельцу `INSERT`/`UPDATE` любых значений → `current_level = 4` одной строкой из консоли.
- Таймер 10 с только клиентский.
- Баг: `moveToNextQuestion()` вызывается из `setTimeout` и сохраняет `totalCorrect`/`totalAnswered` из устаревшего замыкания → в БД пишутся значения на 1 ответ позади.
- Уровень вычисляется эффектом с неочевидной семантикой (`requiredCorrect` — порог текущего или следующего уровня?).

## Решение

Сервер — единственный источник истины для вопросов, проверки ответов, жизней и прогресса.

### Схема
```sql
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  microphones int not null check (microphones >= 0),
  correct_count int not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.game_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  answer_index int,                 -- null = timeout
  is_correct boolean,
  served_at timestamptz not null default now(),
  answered_at timestamptz
);
```
`unique (session_id, question_id)` нет: когда вопросы заканчиваются, они повторяются, как и в текущей игре. Вместо этого в сессии может быть только один открытый вопрос (partial unique index).

### Доступ
- `questions`: таблица закрыта полностью, вопросы отдаёт только RPC. Колоночный `REVOKE SELECT (correct_answer)` не работает, пока действует табличный `GRANT SELECT`.
- `user_progress`, `game_sessions`, `game_answers`: только `SELECT own`. `INSERT/UPDATE/DELETE` для `authenticated` — нет. Запись — только из `SECURITY DEFINER` функций.

### RPC (все `SECURITY DEFINER`, `SET search_path = public`, проверка `auth.uid()`)
| Функция | Вход | Выход | Логика |
|---|---|---|---|
| `start_game(p_category)` | category | `session_id, microphones, level, total_correct` | Закрывает висящие сессии, выдаёт 3 бесплатные жизни на игру; `microphones` в ответе = бесплатные + купленные (ADR-0004) |
| `get_next_question(p_session_id)` | session | `question_id, question_text, options` | Открытый вопрос с прежним дедлайном, если он есть (перезагрузка не сбрасывает таймер); иначе случайный из наименее показанных с `level <= current_level`. В ответе также `seconds_left` |
| `submit_answer(p_session_id, p_question_id, p_answer_index)` | answer или null | `is_correct, correct_index, microphones, total_correct, level, game_over` | Проверка `now() - served_at <= interval '11.5 seconds'` (10 с + grace на сеть); иначе — timeout. Атомарно обновляет `game_answers`, `game_sessions`, `user_progress`, уровень через `compute_level()` |
| `end_game(p_session_id)` | session | итог | Ставит `ended_at` |
| `compute_level(p_correct int)` | int | int | `IMMUTABLE`; единственное место определения уровней. Пороги как в текущем клиенте: Gold с 10, далее каждые 5, Diamond с 25 |

Одна транзакция на `submit_answer` → нет гонок, нет stale-closure проблем: клиент рендерит то, что вернул сервер.

### Клиент
- `GameScreen` хранит только UI-состояние (выбранный индекс, анимация, таймер для отображения).
- `MOCK_QUESTIONS` удаляется; вопросы переезжают в `supabase/seed.sql`.
- `LEVELS` в клиенте — только имена/цвета для UI; пороги — в `compute_level`.

## Альтернативы
- **Edge Functions (Deno/TS) вместо RPC** — логика на TS, но +1 сетевой hop, cold start, транзакции сложнее (нет нативного `BEGIN` через supabase-js). Оставлено для оплаты (ADR-0004).
- **Оставить клиентскую логику, ужесточить RLS check-констрейнтами** (например, `current_level <= compute_level(correct_answers)`) — не мешает накрутить `correct_answers`. Отклонено.
- **Prisma-сервисы (ADR-0001 B1)** — эквивалентно по смыслу; при переходе на Prisma функции переписываются в `GameService` с тем же контрактом.

## Последствия
- \+ Античит: ответы не в бандле, прогресс не пишется напрямую.
- \+ Исчезают stale-closure баги сохранения.
- \+ Появляется история ответов → аналитика сложности вопросов.
- − Каждый ответ = сетевой запрос (~50–150 мс). Таймер компенсируется grace-периодом.
- − PL/pgSQL требует тестов (`supabase/tests/game_rpc.sql`).
- − Офлайн-игра невозможна.

## Проверка
- `select correct_answer from questions` под `authenticated` → permission denied.
- `update user_progress set current_level = 4` под `authenticated` → 0 строк / отказ.
- `submit_answer` через 12 с после `served_at` → `is_correct = false`, микрофон списан.
- `grep -r correctAnswer dist/` после `npm run build` → пусто.
