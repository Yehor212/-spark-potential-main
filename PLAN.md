# План улучшения проекта КопиМастер (KopiMaster)

## Текущее состояние проекта

**Стек:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui
**Функционал:** Финансовый трекер (доходы, расходы, цели накоплений, статистика, экспорт CSV)
**Хранение:** localStorage (только браузер)
**Язык:** Русский (захардкожен)
**Авторизация:** Отсутствует

---

## Фаза 1: Безопасность и подготовка

### 1.1 Настройка .gitignore
```
.env
.env.local
.env.production
*.pem
*.key
secrets/
.DS_Store
node_modules/
dist/
```

### 1.2 Создание .env.example
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Google OAuth (через Supabase)
# Настраивается в Supabase Dashboard

# Ads (опционально)
VITE_ADSENSE_CLIENT_ID=your_adsense_id
```

### 1.3 Структура переменных окружения
- Все ключи через `VITE_` префикс для Vite
- Никогда не коммитить реальные значения
- Использовать `.env.local` для локальной разработки

---

## Фаза 2: Интернационализация (i18n)

### 2.1 Установка зависимостей
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### 2.2 Поддерживаемые языки
| Код | Язык | Статус |
|-----|------|--------|
| en | English | По умолчанию |
| uk | Українська | Добавить |
| fr | Français | Добавить |
| de | Deutsch | Добавить |
| es | Español | Добавить |
| ja | 日本語 | Добавить |

### 2.3 Структура переводов
```
src/
├── i18n/
│   ├── index.ts           # Конфигурация i18next
│   └── locales/
│       ├── en.json        # Английский (по умолчанию)
│       ├── uk.json        # Украинский
│       ├── fr.json        # Французский
│       ├── de.json        # Немецкий
│       ├── es.json        # Испанский
│       └── ja.json        # Японский
```

### 2.4 Что нужно перевести
- Категории доходов/расходов
- Названия кнопок и модалок
- Сообщения об ошибках
- Форматирование дат и чисел
- Валюта (локализованный формат)
- Placeholder тексты
- Toast уведомления

### 2.5 Переключатель языка
- Добавить в хедер/настройки
- Сохранять выбор в localStorage
- Автоопределение языка браузера

---

## Фаза 3: Интеграция Supabase

### 3.1 Установка
```bash
npm install @supabase/supabase-js
```

### 3.2 Схема базы данных

```sql
-- Таблица пользователей (расширение auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица транзакций
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица целей накоплений
CREATE TABLE savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#10b981',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON savings_goals FOR DELETE USING (auth.uid() = user_id);

-- Индексы для производительности
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);
```

### 3.3 Архитектура клиента
```
src/
├── lib/
│   └── supabase.ts        # Клиент Supabase
├── hooks/
│   ├── useAuth.ts         # Хук авторизации
│   ├── useTransactions.ts # CRUD транзакций
│   └── useSavingsGoals.ts # CRUD целей
├── contexts/
│   └── AuthContext.tsx    # Контекст авторизации
```

### 3.4 Миграция данных
- При первом входе: миграция из localStorage в Supabase
- Fallback: если нет интернета, работа с localStorage
- Синхронизация при восстановлении соединения

---

## Фаза 4: Google авторизация

### 4.1 Настройка в Supabase
1. Dashboard → Authentication → Providers → Google
2. Добавить Client ID и Client Secret из Google Cloud Console
3. Настроить Redirect URL

### 4.2 Настройка в Google Cloud Console
1. Создать проект
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Добавить authorized redirect URIs:
   - `https://<project>.supabase.co/auth/v1/callback`
   - `http://localhost:8080` (для разработки)

### 4.3 Компоненты авторизации
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginPage.tsx        # Страница входа
│   │   ├── GoogleButton.tsx     # Кнопка Google Sign In
│   │   ├── UserMenu.tsx         # Меню пользователя
│   │   └── ProtectedRoute.tsx   # Защищённый роут
```

### 4.4 Флоу авторизации
1. Пользователь нажимает "Sign in with Google"
2. Редирект на Google OAuth
3. Возврат в приложение с токеном
4. Создание/обновление профиля в Supabase
5. Сохранение сессии
6. Доступ к приватным данным

---

## Фаза 5: GitHub Pages деплой

### 5.1 Настройка Vite для GitHub Pages
```typescript
// vite.config.ts
export default defineConfig({
  base: '/repository-name/', // Имя репозитория
  // ... остальные настройки
})
```

### 5.2 GitHub Actions workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 5.3 Настройка репозитория
1. Settings → Pages → Source: gh-pages branch
2. Settings → Secrets → Add repository secrets
3. Custom domain (опционально)

### 5.4 SPA роутинг fix
```html
<!-- public/404.html -->
<!-- Редирект для SPA на GitHub Pages -->
```

---

## Фаза 6: Ненавязчивая реклама

### 6.1 Принципы
- Реклама НЕ блокирует функционал
- Никаких popup и interstitials
- Опция отключения для пользователей (Premium)
- Нативный вид, вписывается в дизайн

### 6.2 Типы рекламы
1. **Баннер внизу страницы** (728x90 desktop / 320x50 mobile)
2. **Нативная реклама** в списке транзакций (каждые 10-15 элементов)
3. **Спонсорские карточки** в секции целей

### 6.3 Реализация
```
src/
├── components/
│   ├── ads/
│   │   ├── AdBanner.tsx      # Баннер рекламы
│   │   ├── NativeAd.tsx      # Нативная реклама
│   │   └── AdProvider.tsx    # Контекст для рекламы
```

### 6.4 Варианты монетизации
- **Google AdSense** - простая интеграция
- **Carbon Ads** - для dev-аудитории (ненавязчивые)
- **Ethicalads.io** - privacy-friendly
- **Собственные спонсоры** - партнёрские карточки

### 6.5 Уважение к пользователю
- Показывать рекламу только после 5+ транзакций
- Ограничить частоту показов
- Respect AdBlockers (не ломать приложение)
- Добавить Premium подписку (без рекламы)

---

## Фаза 7: Дополнительные улучшения

### 7.1 PWA (Progressive Web App)
- Manifest.json
- Service Worker для офлайн режима
- Установка на устройство

### 7.2 Уведомления
- Напоминания о бюджете
- Достижение целей
- Еженедельный отчёт

### 7.3 Дополнительные валюты
- USD, EUR, UAH, JPY, GBP и др.
- Автоопределение по языку
- Возможность смены валюты

### 7.4 Темы оформления
- Светлая / Тёмная (уже есть)
- Системная (auto)
- Цветовые акценты (кастомизация)

---

## Порядок реализации

| № | Этап | Приоритет | Зависимости |
|---|------|-----------|-------------|
| 1 | Безопасность (.gitignore, .env) | 🔴 Критично | - |
| 2 | Интернационализация | 🔴 Критично | 1 |
| 3 | Supabase интеграция | 🔴 Критично | 1 |
| 4 | Google авторизация | 🟡 Высокий | 3 |
| 5 | GitHub Pages деплой | 🟡 Высокий | 1, 2, 3 |
| 6 | Реклама | 🟢 Средний | 5 |
| 7 | PWA и доп. функции | 🔵 Низкий | 5 |

---

## Оценка готовности к продакшену

### Чеклист перед публикацией
- [ ] Все ключи в .env (не в коде)
- [ ] .gitignore настроен корректно
- [ ] Supabase RLS политики активны
- [ ] Google OAuth работает
- [ ] Все языки переведены
- [ ] Мобильная версия протестирована
- [ ] Lighthouse score > 90
- [ ] Ошибки логируются (Sentry опционально)
- [ ] Реклама не блокирует функционал
- [ ] Privacy Policy и Terms of Service

---

## Структура проекта после улучшений

```
spark-potential-main/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   ├── 404.html
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn-ui
│   │   ├── auth/                  # Авторизация
│   │   ├── ads/                   # Реклама
│   │   ├── layout/                # Layouts
│   │   └── ... (существующие)
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTransactions.ts
│   │   ├── useSavingsGoals.ts
│   │   └── useFinanceStore.ts
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en.json
│   │       ├── uk.json
│   │       ├── fr.json
│   │       ├── de.json
│   │       ├── es.json
│   │       └── ja.json
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── utils.ts
│   │   └── exportCsv.ts
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── Login.tsx
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   ├── types/
│   │   └── finance.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
├── vite.config.ts
└── README.md
```

---

**Готов к реализации! Жду подтверждения для начала работы.**
