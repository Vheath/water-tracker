# Трекер воды

Веб-приложение для учёта выпитой воды: быстрые кнопки (`+250 / +500 / +750`), свой объём, прогресс за день, история записей и настройка дневной нормы. Данные хранятся во внешнем n8n-воркфлоу, Next.js выступает прокси между клиентом и вебхуками.

## Стек

| Слой | Технология |
|---|---|
| Фреймворк | [Next.js 16](https://nextjs.org/) (App Router, React Server Components) |
| UI | React 19, TypeScript 5.7 |
| **Библиотека компонентов** | **[shadcn/ui](https://ui.shadcn.com/)** (стиль `base-nova`) на примитивах [Base UI](https://base-ui.com/) — `@base-ui/react` |
| Иконки | `lucide-react` |
| Стили | Tailwind CSS 4 (`@tailwindcss/postcss`), `tw-animate-css` |
| Тесты | Vitest 5, Testing Library (React, user-event, jest-dom), jsdom |
| Пакетный менеджер | pnpm (версия зафиксирована в `package.json`) |

Компоненты shadcn/ui лежат в `components/ui/`, конфигурация — в `components.json`.

## Требования

- **Node.js ≥ 20.9** (проверено на Node 24).
- **pnpm 12.3.4** — версия указана в поле `packageManager`. Проще всего включить [Corepack](https://nodejs.org/api/corepack.html):

  ```bash
  corepack enable
  ```

- Доступ к n8n-вебхукам (для реальных данных). Без него интерфейс запустится, но загрузка состояния завершится ошибкой соединения.

## Установка

```bash
corepack enable          # один раз, если pnpm ещё не установлен
pnpm install
```

Альтернатива без Corepack:

```bash
npm install -g pnpm@12.3.4
pnpm install
```

## Настройка окружения

Создайте в корне проекта файл `.env.local`:

```dotenv
N8N_WEBHOOK_BASE_URL=https://n8n-itmo.cyrweb.ru/webhook
```

| Переменная | Обязательна | По умолчанию | Назначение |
|---|---|---|---|
| `N8N_WEBHOOK_BASE_URL` | Нет | `https://n8n-itmo.cyrweb.ru/webhook` | Базовый URL n8n-вебхуков, используется только на сервере (`lib/n8n.ts`) |

Особенности:

- переменная **серверная** (без префикса `NEXT_PUBLIC_`) и не попадает в клиентский бандл;
- после изменения `.env.local` перезапустите `pnpm dev` / `pnpm start`;
- файлы `.env*` исключены из git (`.gitignore`), секреты в репозиторий не коммитятся.

### Ожидаемые вебхуки n8n

| Hook | Метод | Назначение |
|---|---|---|
| `get-state` | GET | Текущая норма и записи за сегодня |
| `add-water` | POST | Добавить запись (`amount`, `source`, `at`) |
| `remove-water` | POST | Удалить запись (`id`) |
| `set-goal` | POST | Сохранить дневную норму (`goal`) |

Таймаут запроса к n8n — 10 секунд. Ошибки (нет соединения, 404, не-2xx) превращаются в понятные сообщения на русском и отдаются клиенту со статусом `502`.

## Запуск приложения

```bash
pnpm dev        # режим разработки, http://localhost:3000
```

Продакшен-сборка:

```bash
pnpm build
pnpm start      # http://localhost:3000
```

## Тесты

```bash
pnpm test          # однократный прогон (vitest run)
pnpm test:watch    # watch-режим
pnpm typecheck     # проверка типов (tsc --noEmit)
```

Тесты находятся в `components/water-tracker/water-tracker.test.tsx` и проверяют видимое поведение интерфейса:

- рендер формы, начальных данных и пустого состояния;
- валидацию (пустое поле, отрицательное число, `0`, превышение лимита) — `fetch` при этом не вызывается;
- блокировку кнопки на время запроса и защиту от повторной отправки;
- успешное добавление записи с очисткой поля;
- ошибку сервера (`500`) и сетевую ошибку с разблокировкой кнопки для повтора.

`fetch` подменяется через `vi.fn` + `vi.stubGlobal`, задержка ответа эмулируется `setTimeout`, взаимодействие — через `@testing-library/user-event`.

### Настройки тестового окружения

- `vitest.config.mts` — окружение `jsdom`, глобальные API Vitest, alias `@` → корень проекта, `clearMocks` / `restoreMocks` между тестами.
- `vitest.setup.ts` — подключение matchers `@testing-library/jest-dom/vitest`.
- CSS в тестах не загружается; проверяются семантика, роли и атрибуты (`role="alert"`, `aria-busy`, `disabled`, `aria-valuenow`).

## API приложения

| Метод и путь | Описание |
|---|---|
| `GET /` | Server Component загружает состояние через n8n (`get-state`) и передаёт его в `WaterTracker` |
| `POST /api/water` | Добавить воду, валидация `1…1500` мл |
| `DELETE /api/water/:id` | Удалить запись |
| `PUT /api/goal` | Сохранить норму, валидация `500…6000` мл |

## Структура проекта

```
app/
  page.tsx                  # серверная загрузка состояния
  layout.tsx                # шрифт, метаданные, Vercel Analytics
  api/
    water/route.ts          # POST /api/water
    water/[id]/route.ts     # DELETE /api/water/:id
    goal/route.ts           # PUT /api/goal
  globals.css               # Tailwind 4 + тема shadcn/ui
components/
  ui/button.tsx             # shadcn/ui-кнопка на Base UI
  water-tracker/            # фича: формы, список, прогресс, API-клиент, тесты
lib/
  n8n.ts                    # клиент n8n и маппинг ошибок
  water-state.ts            # типы и загрузка состояния
vitest.config.mts
vitest.setup.ts
```

## Важные настройки проекта

- **TypeScript**: строгий режим (`strict: true`), alias `@/*` → `./*` (`tsconfig.json`); тот же alias продублирован в `vitest.config.mts`.
- **Next.js** (`next.config.mjs`): `typescript.ignoreBuildErrors: true` (сборка не падает на типах — типы проверяются отдельно через `pnpm typecheck`) и `images.unoptimized: true`.
- **Tailwind CSS 4**: подключается через PostCSS (`postcss.config.mjs`), без `tailwind.config`; CSS-переменные темы — в `app/globals.css`.
- **Динамический рендер**: на главной странице выставлен `export const dynamic = 'force-dynamic'`, чтобы состояние загружалось при каждом запросе, а не кешировалось.
