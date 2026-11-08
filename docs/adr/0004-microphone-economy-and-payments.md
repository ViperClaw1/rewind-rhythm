# ADR-0004: Экономика микрофонов и платежи

- Статус: Proposed
- Дата: 2026-11-08
- Связано: ADR-0001, ADR-0002

## Контекст

- Микрофоны (жизни) — только React-state в `GameProvider`; `DEFAULT_MICROPHONES = 3`, после reload сбрасываются.
- `PurchasePopup` показывает паки `3/$0.99`, `5/$1.49`, `10/$2.49` (`MICROPHONE_PACKS`), но `handlePurchase` просто прибавляет число — оплаты нет.
- Монетизация без серверного баланса = бесплатные покупки или потеря купленного.

## Решение

### Баланс
- Каждая игра даёт 3 бесплатные жизни (`game_sessions.microphones`), как сейчас в `GoodLuckScreen`. Иначе бесплатный игрок оказался бы заблокирован навсегда после трёх ошибок.
- `profiles.microphone_balance int not null default 0 check (microphone_balance >= 0)` — только купленные микрофоны. Они тратятся после бесплатных; игра заканчивается, когда не осталось ни тех, ни других.
- Изменение баланса — только в `SECURITY DEFINER` функциях: `submit_answer` (списание, ADR-0002), `credit_microphones` и `refund_microphones` (вызываются только из Edge Function под `service_role`).
- Ledger для аудита:
```sql
create table public.microphone_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('answer_wrong','timeout','purchase','refund','admin')),
  ref_id text,             -- purchase id / game_answer id
  created_at timestamptz not null default now()
);
```
- Паки — таблица `microphone_packs (id, count, price_cents, currency, active)`; клиент читает, сервер — источник цены.

### Платежи (web)
- Stripe Checkout.
- Edge Function `create-checkout`: принимает `pack_id`, берёт цену из БД, создаёт Checkout Session с `metadata.user_id`, `metadata.pack_id`, пишет `purchases(status='pending')`.
- Edge Function `stripe-webhook`: верифицирует подпись (`STRIPE_WEBHOOK_SECRET`), на `checkout.session.completed` → идемпотентно (`purchases.provider_ref unique`) ставит `paid` и вызывает `credit_microphones`. На `charge.refunded` → `refund`.
- Клиент после редиректа на `success_url` инвалидирует `['profile']`.

### Мобильные сторы (если будет обёртка Capacitor/RN)
- Цифровые товары в iOS/Android обязаны идти через IAP. Тогда — RevenueCat + webhook в ту же `credit_microphones`. Отдельный ADR при появлении.

### До запуска платежей
- Feature flag `VITE_FEATURE_PURCHASES=false` → `PurchasePopup` показывает только «No Thanks»/бесплатное восстановление по таймеру (если нужно).

## Альтернативы
- **Lemon Squeezy / Paddle** (merchant of record, налоги на них) — разумно для соло-разработчика вне US/EU; контракт Edge Function тот же.
- **Баланс в localStorage** — отклонено (подделывается, теряется).

## Последствия
- \+ Покупки реальные и не теряются между устройствами.
- \+ Ledger → поддержка, возвраты, аналитика.
- − Нужны: Stripe-аккаунт, юр. лицо/merchant of record, политика возвратов, Terms.
- − Edge Functions + секреты → нужен CI-деплой `supabase functions deploy`.

## Проверка
- Прямой `update profiles set microphone_balance = 999` под `authenticated` → отказ (клиенту выдан только `GRANT UPDATE (has_watched_rules)`).
- Повторная доставка webhook с тем же `session.id` → баланс не меняется.
- `sum(delta)` по ledger == `microphone_balance` для каждого пользователя (pgTAP / nightly check).
