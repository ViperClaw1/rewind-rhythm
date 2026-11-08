# ADR-0003: Слой доступа к данным через repository-интерфейсы + react-query

- Статус: Proposed
- Дата: 2026-11-08
- Связано: ADR-0001, ADR-0002

## Контекст

- `supabase-js` вызывается напрямую из React-контекстов `useAuth.tsx` и `useGameState.tsx`.
- `useGameState` смешивает: серверное состояние (profile, progress), сессионное (microphones, selectedCategory) и I/O. Ошибки только в `console.error`, UI о них не знает.
- `@tanstack/react-query` подключён в `App.tsx`, но не используется.
- ADR-0001 оставляет открытым переход на Prisma + HTTP API → фронт не должен знать, откуда данные.

## Решение

### Структура
```
src/data/
  types.ts                 # доменные типы: Profile, CategoryProgress, GameSession, Question, AnswerResult
  repositories.ts          # интерфейсы
  supabase/
    client.ts              # бывший src/integrations/supabase/client.ts
    database.types.ts      # npx supabase gen types typescript --linked
    authRepository.ts
    profileRepository.ts
    gameRepository.ts      # обёртки над RPC из ADR-0002
  http/                    # будущая реализация для Prisma API (ADR-0001 B1)
  index.ts                 # выбор реализации (DI через React context)
src/features/
  auth/useSession.ts       # useQuery + onAuthStateChange
  profile/useProfile.ts    # useQuery(['profile']), useMutation(markRulesWatched)
  game/useGame.ts          # useMutation(startGame/submitAnswer), локальный UI-стейт
```

### Интерфейсы
```ts
export interface AuthRepository {
  getSession(): Promise<Session | null>;
  onChange(cb: (s: Session | null) => void): () => void;
  signUp(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}

export interface ProfileRepository {
  get(): Promise<Profile>;
  markRulesWatched(): Promise<void>;
}

export interface GameRepository {
  getProgress(): Promise<Record<Category, CategoryProgress>>;
  startGame(category: Category): Promise<GameSession>;
  nextQuestion(sessionId: string): Promise<PublicQuestion>;
  submitAnswer(sessionId: string, questionId: string, answerIndex: number | null): Promise<AnswerResult>;
  endGame(sessionId: string): Promise<GameSummary>;
}
```
Правила:
- Репозитории возвращают доменные типы (camelCase), маппинг snake_case → camelCase только внутри `src/data/supabase/*`.
- Ошибки — типизированные (`AuthError`, `NotFoundError`, `ConflictError`), не `console.error`.
- ESLint `no-restricted-imports`: `@/data/supabase/*` и `@supabase/supabase-js` разрешены только внутри `src/data/`.

### Состояние
- Серверное (profile, progress, ответы) → react-query (кэш, retry, invalidation после `submitAnswer`).
- Клиентское UI-состояние игры (selected answer, анимации, таймер) → локальный `useReducer` в `useGame`, не глобальный контекст.
- `GameProvider` удаляется; `selectedCategory` → URL-параметр `/game/:category` (переживает reload).

## Альтернативы
- **Оставить контексты, только заменить вызовы** — быстрее, но переход на Prisma снова потребует трогать UI. Отклонено.
- **Zustand/Redux для серверных данных** — дублирует react-query, который уже в зависимостях. Отклонено.
- **tRPC** — имеет смысл только при Node API (вариант B1); тогда `src/data/http/*` можно реализовать через tRPC-клиент.

## Последствия
- \+ Смена бэкенда (Supabase → Prisma API) = новая папка `src/data/http/`, UI не трогается.
- \+ Мокаемые репозитории → unit-тесты хуков и Storybook без БД.
- \+ Ошибки доходят до UI (toast/sonner).
- − ~+300 строк boilerplate.
- − Одноразовый рефакторинг 6 страниц (`Index`, `RulesScreen`, `CategoriesScreen`, `GoodLuckScreen`, `GameScreen`, `AuthPage`).

## Проверка
- `grep -rn "integrations/supabase\|@supabase/supabase-js" src --include=*.ts* | grep -v "^src/data/"` → пусто.
- Vitest: `useGame` с in-memory `GameRepository` проходит сценарий «3 ошибки → game over».
