# KopiMaster - Comprehensive Implementation Plan

## Overview
Transform KopiMaster into a full-featured personal finance platform with bank integrations, offline support, analytics, budgeting, gamification, and social features - all working as ONE cohesive system.

---

## Architecture Principles
- **Single Source of Truth**: Supabase (PostgreSQL with RLS)
- **Offline-First**: IndexedDB + Sync Queue + Service Worker
- **Modular but Interconnected**: Zustand stores with shared selectors
- **Consistent Patterns**: Reuse existing modal/card/form patterns
- **i18n Complete**: All features in 6 languages

---

## Implementation Phases

### Phase 1: Foundation (Critical) ✅ COMPLETED

**Files created:**
- `supabase/migrations/001_extended_schema.sql` - Extended database schema
- `src/stores/` - Zustand stores (replace useFinanceStore)
- `src/lib/db.ts` - Dexie.js IndexedDB setup
- `src/components/accounts/` - Multiple accounts UI
- `src/types/finance.ts` - Extended type definitions

**Features completed:**
- [x] Multiple accounts (checking, savings, credit, cash, investment)
- [x] Account switcher component
- [x] Transfers between accounts
- [x] Zustand + IndexedDB persistence
- [x] Extended database schema with 10+ new tables
- [x] RLS policies for all new tables
- [x] MCC categories for auto-categorization
- [x] Achievements system database
- [x] Gamification store (XP, levels, streaks)

**Database tables added:**
- `accounts` - Multiple account types
- `bank_connections` - Monobank, Plaid, Nordigen
- `mcc_categories` - MCC code to category mapping
- `budgets` - Monthly limits per category
- `budget_history` - Budget tracking over time
- `recurring_transactions` - Templates for scheduled items
- `achievements` - Badge definitions
- `user_achievements` - Unlocked badges per user
- `user_stats` - XP, level, streaks
- `referrals` - Invite tracking
- `push_subscriptions` - PWA notifications
- `sync_queue` - Offline sync queue

**Zustand stores created:**
- `useAccountsStore` - Multiple accounts management
- `useTransactionsStore` - Transactions with offline sync
- `useGoalsStore` - Savings goals
- `useBudgetsStore` - Budget management
- `useGamificationStore` - XP, levels, achievements
- `useSyncStore` - Offline sync queue

---

### Phase 2: PWA & Offline ✅ COMPLETED

**Files created:**
- `vite.config.ts` - Configured vite-plugin-pwa with Workbox
- `public/favicon.svg` - PWA icon source
- `src/services/sync/SyncManager.ts` - Offline sync service
- `src/components/pwa/InstallPrompt.tsx` - Smart install banner
- `src/components/pwa/OfflineIndicator.tsx` - Sync status indicator
- `src/components/pwa/UpdatePrompt.tsx` - Update notification
- `src/hooks/usePWA.ts` - PWA registration hook

**Features completed:**
- [x] Service Worker (Workbox) - auto-update, precaching
- [x] Install prompt with dismiss/remember
- [x] Offline indicator with sync status
- [x] Background sync with SyncManager
- [x] Runtime caching for Supabase API

---

### Phase 3: Bank Integrations 🔜 NEXT

**Files to create:**
- `src/services/banking/MonobankProvider.ts`
- `src/services/banking/PlaidProvider.ts`
- `src/services/banking/NordigenProvider.ts`
- `src/services/banking/mccMapping.ts`
- `src/components/banking/` - Connection UI
- `supabase/functions/bank-sync/` - Edge function

**Features:**
- [ ] Monobank API (Ukraine) - free, token-based
- [ ] Plaid (US/EU) - OAuth, paid
- [ ] Nordigen (EU) - OAuth, free tier
- [ ] Auto-categorization by MCC codes
- [ ] Transaction reconciliation

---

### Phase 4: Budgets & Recurring

**Files to create:**
- `src/components/budgets/`
- `src/components/recurring/`
- `src/pages/Budgets.tsx`
- `src/pages/Recurring.tsx`

**Features:**
- [ ] Monthly budgets per category
- [ ] Budget progress bars
- [ ] Alerts at 80%, 100%
- [ ] Recurring transaction templates
- [ ] Auto-creation on schedule
- [ ] Reminders (push notifications)

---

### Phase 5: Analytics & Charts

**Files to create:**
- `src/components/analytics/`
- `src/pages/Analytics.tsx`
- `src/pages/stats/[userId].tsx` - Shareable stats

**Features:**
- [ ] Pie chart (expenses by category)
- [ ] Line chart (monthly trends)
- [ ] Budget vs actual comparison
- [ ] Shareable public stats page
- [ ] Export to PDF

---

### Phase 6: Gamification & Social

**Files to create:**
- `src/services/gamification/`
- `src/components/gamification/`
- `src/components/social/`
- `src/pages/Achievements.tsx`
- `src/pages/achievements/[userId].tsx`

**Features:**
- [ ] XP & levels system
- [ ] Achievement badges
- [ ] Daily streaks
- [ ] Unlock animations
- [ ] Referral system
- [ ] Share progress (opens new tab)

---

### Phase 7: CTA & Polish

**Files to create:**
- `src/components/cta/FloatingActionButton.tsx`

**Features:**
- [ ] Floating "+" button with quick actions
- [ ] Context-aware menu
- [ ] All 6 languages complete
- [ ] Performance optimization

---

## Key Components Structure

```
src/components/
├── accounts/          ✅ DONE
│   ├── AccountList.tsx
│   ├── AccountCard.tsx
│   ├── AccountSwitcher.tsx
│   ├── AddAccountModal.tsx
│   └── TransferModal.tsx
├── banking/           📋 TODO
│   ├── ConnectBankModal.tsx
│   ├── MonobankConnect.tsx
│   ├── PlaidConnect.tsx
│   └── SyncStatus.tsx
├── budgets/           📋 TODO
│   ├── BudgetOverview.tsx
│   ├── BudgetProgressBar.tsx
│   └── AddBudgetModal.tsx
├── analytics/         📋 TODO
│   ├── ExpensesPieChart.tsx
│   ├── MonthlyTrendsChart.tsx
│   └── ShareableStats.tsx
├── gamification/      📋 TODO
│   ├── UserLevel.tsx
│   ├── AchievementCard.tsx
│   └── StreakIndicator.tsx
├── pwa/               📋 TODO
│   ├── InstallPrompt.tsx
│   ├── OfflineIndicator.tsx
│   └── SyncProgress.tsx
└── cta/               📋 TODO
    └── FloatingActionButton.tsx
```

---

## Store Architecture (Zustand) ✅ DONE

```
src/stores/
├── useAccountsStore.ts      ✅ Multiple accounts
├── useTransactionsStore.ts  ✅ Transactions + sync
├── useBudgetsStore.ts       ✅ Budget management
├── useGoalsStore.ts         ✅ Savings goals
├── useGamificationStore.ts  ✅ XP, levels, achievements
├── useSyncStore.ts          ✅ Offline sync queue
└── index.ts                 ✅ Combined exports
```

---

## Data Flow

```
User Action → Zustand Store → IndexedDB (immediate)
                    ↓
              Sync Queue (if offline)
                    ↓
              [Online?] → Supabase API
                    ↓
              Realtime Subscription → Update Store
```

---

## Dependencies

**Installed:**
- [x] `zustand` - State management
- [x] `dexie` - IndexedDB wrapper
- [x] `dexie-react-hooks` - React hooks for Dexie
- [x] `recharts` - Charts library
- [x] `vite-plugin-pwa` - PWA support
- [x] `workbox-window` - Service worker

**To add later:**
- [ ] `@plaid/link` - Plaid bank integration

---

## Verification Plan

1. **Accounts**: Create account → Add transaction → Verify balance
2. **Offline**: Disable network → Add transaction → Enable network → Verify sync
3. **Bank**: Connect Monobank → Sync → Verify categorization
4. **Budget**: Set budget → Add expenses → Verify alerts
5. **Recurring**: Create template → Wait for schedule → Verify creation
6. **Gamification**: Complete actions → Verify XP/achievements
7. **PWA**: Install app → Test offline → Verify notifications

---

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Framer Motion
- **State**: Zustand + IndexedDB (Dexie)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Hosting**: GitHub Pages
- **i18n**: react-i18next (6 languages)
- **Charts**: Recharts
- **PWA**: Workbox + vite-plugin-pwa

---

## Progress Summary

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Done | Foundation - Accounts, Stores, IndexedDB |
| Phase 2 | ✅ Done | PWA & Offline |
| Phase 3 | 🔜 Next | Bank Integrations |
| Phase 4 | 📋 Todo | Budgets & Recurring |
| Phase 5 | 📋 Todo | Analytics & Charts |
| Phase 6 | 📋 Todo | Gamification & Social |
| Phase 7 | 📋 Todo | CTA & Polish |
