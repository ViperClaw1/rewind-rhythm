# Rewind Rhythm — миграция с Lovable Cloud

Статус: draft · Дата: 2026-11-08 · Связанные ADR: [0001](adr/0001-target-backend-platform.md), [0002](adr/0002-server-authoritative-game-logic.md), [0003](adr/0003-data-access-layer.md), [0004](adr/0004-microphone-economy-and-payments.md)

---

## 1. Аудит текущего состояния

### Стек
- Vite 5 + React 18 + TS + shadcn/ui + Tailwind, react-router 6, react-query (подключён, но не используется для данных).
- Backend = **Lovable Cloud** = managed Supabase-проект `xyfchqqatgifjfnolnbs` (`supabase/config.toml`). Доступа к дашборду, `service_role`, `SUPABASE_DB_URL` у владельца репо нет.
- Чистый SPA. Своего сервера нет. Edge Functions нет.

### Схема (`supabase/migrations/20251226193245_*.sql`)
| Таблица | Назначение | RLS |
|---|---|---|
| `profiles` | `user_id → auth.users`, `email`, `has_watched_rules` | select/insert/update own |
| `user_progress` | `(user_id, category)` unique, `current_level`, `correct_answers`, `total_questions_answered` | select/insert/update own |
| `questions` | `category`, `level`, `question_text`, `options jsonb`, `correct_answer int` | select для всех |

Триггеры: `update_updated_at_column`, `handle_new_user` (`AFTER INSERT ON auth.users` → создаёт профиль).

### Точки доступа к данным
Всего 3 файла:
- `src/integrations/supabase/client.ts` — `createClient<Database>`
- `src/hooks/useAuth.tsx` — `signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`, `onAuthStateChange`
- `src/hooks/useGameState.tsx` — `profiles` select/update, `user_progress` select/upsert

Страницы ходят только через `useAuth` / `useGameState` → поверхность миграции маленькая.

### Проблемы (приоритет сверху вниз)
1. **Вопросы и правильные ответы захардкожены в бандле** — `src/lib/gameData.ts`, `MOCK_QUESTIONS` (~100 шт., `correctAnswer` в клиенте). Таблица `questions` в БД не используется. Чит через DevTools тривиален.
2. **Прогресс пишется клиентом напрямую** — RLS разрешает `upsert` любых значений в `user_progress`. Любой может выставить себе `current_level = 4` (Diamond).
3. **Покупка микрофонов бесплатная** — `handlePurchase` просто делает `setMicrophones(microphones + count)`. Оплаты нет, баланс не персистится, после reload сбрасывается в `DEFAULT_MICROPHONES = 3`.
4. **Stale closure в `GameScreen.tsx`** — `moveToNextQuestion()` вызывается из `setTimeout` и сохраняет `totalCorrect` / `totalAnswered` из замыкания до инкремента → в БД всегда уходят значения на 1 ответ позади. То же в `handleTimeUp` (`microphones`) и `handleDeclinePurchase`.
5. **Неоднозначная логика уровней** — эффект level-up: `LEVELS.find(l => l.requiredCorrect > totalCorrect)` → `setCurrentLevel(nextLevel.level - 1)`. При `totalCorrect = 7` уровень остаётся Base, Gold наступает только с 10. Семантика `requiredCorrect` не задокументирована.
6. **`.env` закоммичен** (коммит `25955a6`) — URL + publishable key. Ключ публичный по дизайну, но это ключ Lovable-проекта; после миграции — удалить из git, добавить в `.gitignore`.
7. **Lovable-хвосты**: `lovable-tagger` в devDependencies, `componentTagger()` в `vite.config.ts`, комментарий «automatically generated» в `client.ts`, `bun.lockb` + `package-lock.json` одновременно.
8. Нет тестов, нет CI, нет `supabase/seed.sql`, нет индекса на `questions(category, level)`.

---

## 2. Решение (кратко)

**Рекомендация: Вариант A — собственный Supabase-проект.** Prisma — только как Вариант B, если появится отдельный backend (см. ADR-0001).

Почему не Prisma сразу: Prisma — ORM, работает только на сервере. Сервера нет. Переход на Prisma = добавить backend + хостинг + замену Auth + перенос RLS в код API. Для 3 таблиц и SPA — избыточно. Supabase сохраняет Auth, RLS, генерацию типов, и закрывает все проблемы аудита через Postgres RPC + Edge Functions.

Архитектура уровня доступа к данным делается через repository-интерфейсы (ADR-0003) → переход на Prisma позже не потребует переписывать UI.

---

## 3. Вариант A — собственный Supabase (рекомендуемый)

### Фаза 0. Подготовка (0.5 дня)
- [ ] Отключить Lovable two-way sync или заморозить правки в Lovable на время миграции.
- [ ] Ветка `migration/own-supabase`.
- [ ] Создать новый Supabase-проект (регион ближе к аудитории). Два окружения: `staging`, `prod`.
- [ ] Установить CLI: `npm i -D supabase`.
- [ ] `npx supabase init` (перезапишет `supabase/config.toml` → новый `project_id`).
- [ ] `npx supabase link --project-ref <NEW_REF>`.

### Фаза 1. Экспорт данных из Lovable Cloud (0.5 дня)
Два пути, выбрать один:
- **Официальный**: Lovable → More → Cloud → Overview → Advanced settings → **Export project data**. Получаем `.backup` (pg custom format, zstd), включает `auth` и `public`.
- **Bridge-функция** (если экспорт недоступен на плане): временная Edge Function в Lovable-проекте отдаёт `SUPABASE_DB_URL`, защищена ключом → `pg_dump`. Удалить функцию сразу после.

Важно:
- `auth.users` с хэшами паролей переносятся → пользователям не нужен сброс пароля.
- Сессии/refresh-токены не переносятся → все разлогинятся один раз.
- Storage не используется → переносить нечего.

### Фаза 2. Схема в коде (1 день)
- [ ] Восстановить схему на **staging** (пустой проект):
  ```sh
  npx supabase db push            # применяет supabase/migrations/*
  ```
- [ ] Сравнить фактическую схему Lovable с миграциями репо (могли быть ручные правки):
  ```sh
  pg_restore --schema-only -f lovable_schema.sql lovable.backup
  npx supabase db diff --linked   # расхождения → новая миграция
  ```
- [x] Новые миграции в `supabase/migrations/` (префикс `2026110800000N_`: версии сортируются как строки, поэтому `0002_` применился бы раньше исходной схемы `20251226…`):
  - `…02_categories.sql` — `CHECK (category IN ('hip-hop','movies','tv','rnb'))`.
  - `…03_questions_hardening.sql` — проверки `options`, `correct_answer`, `level`, индекс `(category, level)`, таблица закрыта для `anon`/`authenticated` полностью.
  - `…04_game_sessions.sql` — `game_sessions`, `game_answers`.
  - `…05_wallet.sql` — `microphone_balance`, `microphone_ledger`, `microphone_packs`, `purchases`.
  - `…06_rpc.sql` — `compute_level`, `start_game`, `get_next_question`, `submit_answer`, `end_game`, `credit_microphones`, `refund_microphones`.
  - `…07_progress_lockdown.sql` — запись в `user_progress` только через RPC, в `profiles` клиенту доступна только `has_watched_rules`. **Ломает текущий `saveProgress`: выкатывать вместе с новым фронтом.**
- [x] `supabase/seed.sql` — сгенерирован из `MOCK_QUESTIONS` (100 вопросов, стабильные uuid v5, можно накатывать повторно).
- [x] `supabase/tests/game_rpc.sql` — проверки на `ASSERT`, запуск через `psql -v ON_ERROR_STOP=1 -f`. Прогнаны на локальном Postgres 18 с заглушкой `auth`; на настоящем стеке Supabase ещё не запускались.

### Фаза 3. Импорт данных (0.5 дня)
- [ ] Импорт на staging:
  ```sh
  pg_restore --data-only --no-owner --no-privileges \
    --schema=auth --schema=public \
    --exclude-table=auth.sessions --exclude-table=auth.refresh_tokens \
    --exclude-table=auth.flow_state --exclude-table=auth.one_time_tokens \
    --exclude-table=auth.audit_log_entries \
    -d "$STAGING_DB_URL" lovable.backup
  ```
  При конфликтах FK — `SET session_replication_role = replica;` на время импорта.
- [ ] Сверка: `count(*)` по `auth.users`, `profiles`, `user_progress` source vs target.
- [ ] Проверить, что у каждого `auth.users` есть `profiles` (триггер `handle_new_user` при импорте данных не срабатывает — профили должны прийти из дампа).
- [ ] Залить вопросы: `psql "$STAGING_DB_URL" -f supabase/seed.sql`.
- [ ] Пересчитать уровни, записанные клиентом: `psql "$STAGING_DB_URL" -f supabase/post_import.sql`.

### Фаза 4. Auth-конфигурация (0.5 дня)
- [ ] Dashboard → Auth → URL Configuration: `Site URL`, `Redirect URLs` (prod-домен, staging, `http://localhost:8080`).
- [ ] SMTP (Resend/Postmark) — дефолтный SMTP Supabase сильно лимитирован.
- [ ] Email templates (confirm, reset) — перенести, если кастомизировались в Lovable.
- [ ] Включить leaked-password protection, rate limits.

### Фаза 5. Frontend (2–3 дня)
- [ ] **Data layer** (ADR-0003): `src/data/` с интерфейсами `AuthRepository`, `ProfileRepository`, `GameRepository`; реализация `supabase/*`. Хуки зависят от интерфейсов, не от `supabase`.
- [ ] Перевести загрузку на react-query (`useQuery(['progress'])`, `useMutation(submitAnswer)`) — он уже в зависимостях.
- [ ] `GameScreen.tsx`:
  - вопросы получать через `get_next_question(session_id)` (без `correct_answer`);
  - ответ — `submit_answer(session_id, question_id, answer_index)` → `{ is_correct, correct_index, microphones, total_correct, level }`;
  - удалить локальный `saveProgress` после каждого вопроса → stale-closure баг исчезает, т.к. источник истины — ответ RPC;
  - level-up считать на сервере (`compute_level(correct)`), клиент только рендерит.
- [ ] Удалить `MOCK_QUESTIONS`, `getQuestionsUpToLevel` из `src/lib/gameData.ts`; оставить `CATEGORIES`, `LEVELS`, `TIMER_DURATION` как UI-константы (или читать из БД).
- [ ] `PurchasePopup` → `create_checkout` Edge Function (ADR-0004). До подключения оплаты — скрыть покупки за feature-flag.
- [ ] Регенерировать типы: `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts` → скрипт `npm run db:types`.
- [ ] Удалить Lovable: `npm rm lovable-tagger`, убрать `componentTagger` из `vite.config.ts`, удалить комментарий «automatically generated», удалить `bun.lockb` (или `package-lock.json` — оставить один менеджер).
- [ ] `.env` → `git rm --cached .env`, добавить `.env` в `.gitignore`, создать `.env.example`.

### Фаза 6. Качество (1–2 дня)
- [ ] Подключить `supabase/tests/game_rpc.sql` к CI через `psql` (негативные кейсы RLS/RPC уже покрыты).
- [ ] Vitest для data layer (моки репозиториев), Playwright e2e: signup → rules → game → game over.
- [ ] CI (GitHub Actions): `lint`, `tsc --noEmit`, `vitest`, `supabase db lint`, `supabase/tests/game_rpc.sql` на локальном стеке (`supabase start`).
- [ ] CD: миграции `supabase db push` на staging по merge в `main`, на prod — по тегу.

### Фаза 7. Cutover (0.5 дня + окно отката 7 дней)
1. Объявить maintenance window (или принять потерю прогресса за окно — данных мало).
2. Freeze Lovable-проекта (отключить signup, если можно).
3. Финальный экспорт → импорт в **prod** (Фаза 3 на prod).
4. Деплой фронта (Vercel/Netlify/Cloudflare Pages) с новыми `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; SPA fallback на `index.html`.
5. Smoke: signup, login старым паролем, reset password, игра, прогресс сохраняется.
6. Lovable-проект не удалять 7 дней (rollback = вернуть env и редеплой).
7. После окна: удалить bridge-функцию (если была), отвязать Lovable, ротировать ключи.

**Оценка Варианта A: ~6–8 рабочих дней.**

---

## 4. Вариант B — Prisma ORM (если нужен свой backend)

Брать, если: планируется сложная серверная логика (матчмейкинг, лидерборды с античитом, интеграции), команда хочет TS-first домен вместо PL/pgSQL, или нужен уход от vendor lock-in Supabase.

### Целевая архитектура
```
apps/web  (Vite SPA, как сейчас)
  └── fetch → apps/api
apps/api  (Hono или Fastify, Node 20+)
  ├── Prisma Client (+ @prisma/adapter-pg)
  ├── auth middleware (верификация Supabase JWT  ИЛИ  Better Auth)
  └── routes: /games, /games/:id/answers, /progress, /checkout, /webhooks/stripe
packages/shared (zod-схемы DTO, общие константы LEVELS/CATEGORIES)
Postgres: Supabase (только как БД+Auth) или Neon/RDS
```

### Шаги
1. **Монорепо**: pnpm workspaces / Turborepo; перенести текущий код в `apps/web`.
2. **Prisma init**: `npx prisma init`; `DATABASE_URL` (pooler, port 6543, `?pgbouncer=true`) + `DIRECT_URL` (5432) для миграций.
3. **Интроспекция существующей схемы**: `npx prisma db pull` → `schema.prisma`. Затем `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql` и `npx prisma migrate resolve --applied 0_init` (baseline).
4. **Auth** — выбрать одно:
   - **B1 (меньше риска)**: оставить Supabase Auth. Фронт как сейчас логинится через `supabase.auth`, шлёт `Authorization: Bearer <access_token>`; API валидирует JWT через JWKS (`jose`). `auth.users` остаётся в Supabase, Prisma видит только `public` (`schemas = ["public"]`, FK на `auth.users` — через raw SQL-миграцию).
   - **B2 (полный уход)**: Better Auth / Auth.js + своя таблица `users`. Перенос bcrypt-хэшей из `auth.users.encrypted_password` (bcrypt совместим). Больше работы, полный контроль.
5. **RLS → авторизация в коде**: Prisma ходит под ролью с полными правами, RLS не применяется. Каждый запрос фильтровать по `userId` из JWT. Обязательно: `prisma.$extends` с принудительным `where: { userId }` для пользовательских моделей или сервисный слой без прямого доступа к Prisma из роутов.
6. **Игровая логика** (ADR-0002) реализуется как сервисы API в транзакциях `prisma.$transaction` вместо PL/pgSQL.
7. **Фронт**: реализация репозиториев `src/data/http/*` вместо `src/data/supabase/*` (ADR-0003) — UI не меняется.
8. **Деплой API**: Fly.io / Railway / Render (долгоживущий Node; serverless требует Prisma Accelerate или pooler).
9. **Тесты**: Vitest + Testcontainers (Postgres) для сервисов; supertest для роутов.
10. Cutover — как в Варианте A, Фаза 7, плюс деплой API.

**Оценка Варианта B: ~12–18 рабочих дней** (B1 ближе к 12, B2 — к 18).

### `schema.prisma` (целевой, сокращённо)
Отличия от текущей схемы, требующие миграции после baseline: `category text` → enum, `profiles.id` удалён (`user_id` = PK), `user_progress` — составной PK вместо `id`. FK на `auth.users` в Prisma не описывается (другая схема) — держать в raw SQL-миграции.
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Category {
  hip_hop @map("hip-hop")
  movies
  tv
  rnb
  @@map("category")
}

model Profile {
  userId            String   @id @map("user_id") @db.Uuid
  email             String?
  hasWatchedRules   Boolean  @default(false) @map("has_watched_rules")
  microphoneBalance Int      @default(0) @map("microphone_balance")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz
  progress          UserProgress[]
  sessions          GameSession[]
  purchases         Purchase[]
  @@map("profiles")
}

model UserProgress {
  userId                 String   @map("user_id") @db.Uuid
  category               Category
  currentLevel           Int      @default(0) @map("current_level")
  correctAnswers         Int      @default(0) @map("correct_answers")
  totalQuestionsAnswered Int      @default(0) @map("total_questions_answered")
  updatedAt              DateTime @updatedAt @map("updated_at") @db.Timestamptz
  profile                Profile  @relation(fields: [userId], references: [userId], onDelete: Cascade)
  @@id([userId, category])
  @@map("user_progress")
}

model Question {
  id            String   @id @default(uuid()) @db.Uuid
  category      Category
  level         Int      @default(0)
  questionText  String   @map("question_text")
  options       Json
  correctAnswer Int      @map("correct_answer")
  isActive      Boolean  @default(true) @map("is_active")
  answers       GameAnswer[]
  @@index([category, level])
  @@map("questions")
}

model GameSession {
  id           String    @id @default(uuid()) @db.Uuid
  userId       String    @map("user_id") @db.Uuid
  category     Category
  microphones  Int
  correctCount Int       @default(0) @map("correct_count")
  startedAt    DateTime  @default(now()) @map("started_at") @db.Timestamptz
  endedAt      DateTime? @map("ended_at") @db.Timestamptz
  profile      Profile   @relation(fields: [userId], references: [userId], onDelete: Cascade)
  answers      GameAnswer[]
  @@index([userId, startedAt])
  @@map("game_sessions")
}

model GameAnswer {
  id          String      @id @default(uuid()) @db.Uuid
  sessionId   String      @map("session_id") @db.Uuid
  questionId  String      @map("question_id") @db.Uuid
  answerIndex Int?        @map("answer_index") // null = timeout
  isCorrect   Boolean     @map("is_correct")
  servedAt    DateTime    @map("served_at") @db.Timestamptz
  answeredAt  DateTime?   @map("answered_at") @db.Timestamptz
  session     GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question    Question    @relation(fields: [questionId], references: [id])
  @@unique([sessionId, questionId])
  @@map("game_answers")
}

model Purchase {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  packSize        Int      @map("pack_size")
  amountCents     Int      @map("amount_cents")
  currency        String   @default("usd")
  provider        String   // stripe | apple | google
  providerRef     String   @unique @map("provider_ref")
  status          String   // pending | paid | refunded
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  profile         Profile  @relation(fields: [userId], references: [userId], onDelete: Cascade)
  @@map("purchases")
}
```

---

## 5. Сравнение вариантов

| Критерий | A: Supabase | B1: Prisma + Supabase Auth | B2: Prisma + свой Auth |
|---|---|---|---|
| Новые компоненты | 0 (Edge Fn для оплаты) | API-сервер, хостинг | API, хостинг, auth-библиотека |
| Изменения фронта | data layer + GameScreen | + HTTP-клиент | + замена auth UI-флоу |
| Авторизация данных | RLS в БД | код API | код API |
| Перенос паролей | как есть | как есть | bcrypt-хэши, совместимо |
| Типы | `supabase gen types` | Prisma Client + zod DTO | то же |
| Vendor lock-in | средний (Auth, RLS, RPC) | низкий по БД, средний по Auth | низкий |
| Оценка | 6–8 дн | 12–15 дн | 15–18 дн |
| Ops | минимальный | сервер + мониторинг | сервер + auth-инфра |

---

## 6. Риски

| Риск | Митигация |
|---|---|
| Схема Lovable расходится с миграциями репо | `supabase db diff` против `pg_restore --schema-only` до импорта |
| Экспорт Lovable недоступен на плане | Bridge Edge Function → `pg_dump`; удалить после |
| Пользователи не могут войти | Проверить на staging логин 3+ реальными аккаунтами (с согласия) до cutover; fallback — массовый reset |
| Потеря записей в окне cutover | Freeze + финальный дельта-экспорт; данных мало — ок |
| Сетевая задержка RPC ломает таймер 10 с | Сервер проверяет `answered_at - served_at <= 10s + 1.5s grace`; клиентский таймер — UX |
| Регресс игрового флоу | Playwright e2e до/после на одном сценарии |
| Prisma (B) обходит RLS | Сервисный слой + обязательный `userId`-scope, тесты на чужие данные |
