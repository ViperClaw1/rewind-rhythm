# ADR-0001: Целевая backend-платформа — собственный Supabase вместо Lovable Cloud

- Статус: Proposed
- Дата: 2026-11-08
- Решающие: tech lead / владелец репо
- Связано: ADR-0002, ADR-0003, ADR-0004, `docs/MIGRATION_PLAN.md`

## Контекст

Rewind Rhythm — SPA (Vite + React + TS), backend — Lovable Cloud (managed Supabase-проект `xyfchqqatgifjfnolnbs`).

Ограничения Lovable Cloud:
- нет доступа к Supabase Dashboard, `service_role`, прямому connection string;
- миграции и Edge Functions управляются через Lovable, не через CI репо;
- нет staging/prod окружений, нет контроля над Auth-настройками (SMTP, redirect URLs, rate limits);
- биллинг и lifecycle проекта привязаны к Lovable.

Текущий объём данных: 3 таблицы (`profiles`, `user_progress`, `questions`), Supabase Auth (email/password). Прямые вызовы `supabase-js` — только в `useAuth.tsx`, `useGameState.tsx`. Своего сервера нет.

Нужно: владение инфраструктурой, CI/CD миграций, серверная авторитетность игровой логики (ADR-0002), реальные платежи (ADR-0004).

## Рассмотренные варианты

### A. Собственный Supabase-проект
Postgres + Auth + RLS + RPC (PL/pgSQL) + Edge Functions (Deno).
- \+ Минимальные изменения фронта: тот же `supabase-js`, те же типы.
- \+ `auth.users` с bcrypt-хэшами переносится → без сброса паролей.
- \+ RLS = авторизация на уровне БД, работает для любого клиента.
- \+ Supabase CLI: локальный стек, `db diff`, `db push`, `gen types`, pgTAP.
- − Бизнес-логика в PL/pgSQL — сложнее тестировать и ревьюить, чем TS.
- − Lock-in на Supabase Auth/RLS-конвенции (`auth.uid()`).

### B1. Prisma ORM + Node API + Supabase Auth
- \+ Логика в TS, типобезопасный ORM, удобные транзакции.
- \+ БД переносима (Neon/RDS) — кроме Auth.
- − Нужен новый сервис + хостинг + мониторинг.
- − RLS не работает через Prisma (подключение под привилегированной ролью) → авторизация переезжает в код, риск утечек при ошибке в `where`.
- − Двойной источник схемы (`auth` в Supabase, `public` в Prisma).

### B2. Prisma ORM + Node API + собственный Auth (Better Auth / Auth.js)
- \+ Полная независимость от Supabase.
- − Максимальный объём: Auth-флоу, email, reset, сессии — всё своё.
- − Перенос хэшей паролей вручную.

### C. Остаться на Lovable Cloud
- − Не решает ни одну проблему из контекста. Отклонено.

## Решение

**Вариант A — собственный Supabase-проект.**

Prisma (B1) — отложенная опция. Триггеры пересмотра:
- появляется серверная логика, которую неудобно выражать в SQL/Edge Functions (матчмейкинг, мультиплеер, сложные интеграции);
- требование уйти с Supabase (стоимость, комплаенс, self-host);
- команда > 3 backend-разработчиков и PL/pgSQL становится узким местом.

Чтобы переход в B1 был дешёвым — доступ к данным изолируется за repository-интерфейсами (ADR-0003).

## Последствия

Положительные:
- Полный контроль: Dashboard, ключи, окружения staging/prod, CI-миграции.
- Срок ~6–8 дней против ~12–18 для Prisma.
- Пользователи логинятся старыми паролями.

Отрицательные:
- Все пользователи один раз разлогинятся (сессии не переносятся).
- Игровая логика в PL/pgSQL требует pgTAP-тестов и code review SQL.
- Оплата Supabase-проекта (Free tier паузится после 7 дней неактивности → для prod нужен Pro).

Нейтральные:
- `supabase/config.toml` получает новый `project_id`.
- `.env` убирается из git; ключи нового проекта — в CI secrets и хостинге фронта.

## Проверка решения
- Логин существующего пользователя на staging старым паролем — успешен.
- `npx supabase db diff --linked` пуст после применения всех миграций.
- Ни одного импорта `@/integrations/supabase/client` вне `src/data/supabase/*`.
