-- ===========================================
-- KOPIMASTER - Extended Schema Migration
-- ===========================================
-- Run this SQL in Supabase SQL Editor AFTER the initial schema

-- ===========================================
-- ACCOUNTS TABLE
-- ===========================================
-- Multiple accounts: checking, savings, credit, investment, cash
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash')),
  currency TEXT DEFAULT 'USD',
  balance DECIMAL(12,2) DEFAULT 0,
  icon TEXT DEFAULT '💳',
  color TEXT DEFAULT 'hsl(38 92% 50%)',
  is_default BOOLEAN DEFAULT false,
  bank_connection_id UUID,
  external_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- BANK CONNECTIONS TABLE
-- ===========================================
-- Stores bank API connections (Monobank, Plaid, Nordigen)
CREATE TABLE IF NOT EXISTS bank_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('monobank', 'plaid', 'nordigen')),
  access_token TEXT,
  refresh_token TEXT,
  institution_id TEXT,
  institution_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error', 'disconnected')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- MCC CATEGORIES TABLE
-- ===========================================
-- Merchant Category Code to app category mapping
CREATE TABLE IF NOT EXISTS mcc_categories (
  mcc_code TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT
);

-- ===========================================
-- BUDGETS TABLE
-- ===========================================
-- Monthly budget limits per category
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  monthly_limit DECIMAL(12,2) NOT NULL CHECK (monthly_limit > 0),
  alert_threshold DECIMAL(3,2) DEFAULT 0.80 CHECK (alert_threshold > 0 AND alert_threshold <= 1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- ===========================================
-- BUDGET HISTORY TABLE
-- ===========================================
-- Track budget spending over time
CREATE TABLE IF NOT EXISTS budget_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  spent_amount DECIMAL(12,2) DEFAULT 0,
  limit_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- RECURRING TRANSACTIONS TABLE
-- ===========================================
-- Templates for recurring transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT DEFAULT '',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_occurrence DATE NOT NULL,
  last_created_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  reminder_days INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- ACHIEVEMENTS TABLE
-- ===========================================
-- Badge/achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name_key TEXT NOT NULL,
  description_key TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('savings', 'spending', 'streak', 'social', 'milestone')),
  xp_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- USER ACHIEVEMENTS TABLE
-- ===========================================
-- Unlocked achievements per user
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- ===========================================
-- USER STATS TABLE
-- ===========================================
-- XP, levels, streaks per user
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_transactions INTEGER DEFAULT 0,
  total_saved DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- REFERRALS TABLE
-- ===========================================
-- Referral/invite tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- PUSH SUBSCRIPTIONS TABLE
-- ===========================================
-- PWA push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- ===========================================
-- SYNC QUEUE TABLE
-- ===========================================
-- Offline sync queue for IndexedDB
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  record_id UUID NOT NULL,
  payload JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- ALTER EXISTING TABLES
-- ===========================================
-- Add new columns to transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mcc_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add new columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"push": true, "email": false, "budgetAlerts": true, "recurringReminders": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- ===========================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- ===========================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- ACCOUNTS POLICIES
-- ===========================================
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- BANK CONNECTIONS POLICIES
-- ===========================================
CREATE POLICY "Users can view own bank connections"
  ON bank_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank connections"
  ON bank_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank connections"
  ON bank_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank connections"
  ON bank_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- BUDGETS POLICIES
-- ===========================================
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- BUDGET HISTORY POLICIES
-- ===========================================
CREATE POLICY "Users can view own budget history"
  ON budget_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM budgets WHERE budgets.id = budget_history.budget_id AND budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own budget history"
  ON budget_history FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets WHERE budgets.id = budget_history.budget_id AND budgets.user_id = auth.uid()
  ));

-- ===========================================
-- RECURRING TRANSACTIONS POLICIES
-- ===========================================
CREATE POLICY "Users can view own recurring transactions"
  ON recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
  ON recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
  ON recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
  ON recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- USER ACHIEVEMENTS POLICIES
-- ===========================================
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- ===========================================
-- USER STATS POLICIES
-- ===========================================
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ===========================================
-- REFERRALS POLICIES
-- ===========================================
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update own referrals"
  ON referrals FOR UPDATE
  USING (auth.uid() = referrer_id);

-- ===========================================
-- PUSH SUBSCRIPTIONS POLICIES
-- ===========================================
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- SYNC QUEUE POLICIES
-- ===========================================
CREATE POLICY "Users can view own sync queue"
  ON sync_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync queue"
  ON sync_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync queue"
  ON sync_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync queue"
  ON sync_queue FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- INDEXES FOR NEW TABLES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_provider ON bank_connections(provider);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next ON recurring_transactions(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize user stats on profile creation
CREATE OR REPLACE FUNCTION public.init_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Generate referral code if not exists
  IF NEW.referral_code IS NULL THEN
    UPDATE public.profiles
    SET referral_code = generate_referral_code()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to init user stats
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.init_user_stats();

-- Function to update account balance after transaction
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      UPDATE accounts SET balance = balance +
        CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END,
        updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      UPDATE accounts SET balance = balance -
        CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END,
        updated_at = NOW()
      WHERE id = OLD.account_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    IF OLD.account_id IS NOT NULL THEN
      UPDATE accounts SET balance = balance -
        CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END,
        updated_at = NOW()
      WHERE id = OLD.account_id;
    END IF;
    -- Apply new transaction
    IF NEW.account_id IS NOT NULL THEN
      UPDATE accounts SET balance = balance +
        CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END,
        updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for account balance updates
DROP TRIGGER IF EXISTS on_transaction_change ON transactions;
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- Function to add XP and check level up
CREATE OR REPLACE FUNCTION public.add_xp(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  xp_for_next_level INTEGER;
  did_level_up BOOLEAN := false;
BEGIN
  SELECT xp, level INTO current_xp, current_level
  FROM user_stats WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, xp, level) VALUES (p_user_id, p_amount, 1);
    RETURN QUERY SELECT p_amount, 1, false;
    RETURN;
  END IF;

  current_xp := current_xp + p_amount;

  -- XP required for level: level * 100
  xp_for_next_level := current_level * 100;

  WHILE current_xp >= xp_for_next_level LOOP
    current_xp := current_xp - xp_for_next_level;
    current_level := current_level + 1;
    did_level_up := true;
    xp_for_next_level := current_level * 100;
  END LOOP;

  UPDATE user_stats
  SET xp = current_xp, level = current_level, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Also update profile for quick access
  UPDATE profiles SET xp = current_xp, level = current_level WHERE id = p_user_id;

  RETURN QUERY SELECT current_xp, current_level, did_level_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- SEED MCC CATEGORIES
-- ===========================================
INSERT INTO mcc_categories (mcc_code, category, description) VALUES
-- Food & Dining
('5411', 'food', 'Grocery Stores, Supermarkets'),
('5412', 'food', 'Convenience Stores'),
('5441', 'food', 'Candy, Nut, Confectionery Stores'),
('5451', 'food', 'Dairy Products Stores'),
('5462', 'food', 'Bakeries'),
('5499', 'food', 'Misc Food Stores'),
('5812', 'food', 'Eating Places, Restaurants'),
('5813', 'food', 'Drinking Places, Bars, Taverns'),
('5814', 'food', 'Fast Food Restaurants'),
-- Transport
('4111', 'transport', 'Local Passenger Transportation'),
('4112', 'transport', 'Passenger Railways'),
('4121', 'transport', 'Taxicabs and Limousines'),
('4131', 'transport', 'Bus Lines'),
('4784', 'transport', 'Tolls and Bridge Fees'),
('5541', 'transport', 'Service Stations'),
('5542', 'transport', 'Automated Fuel Dispensers'),
('7512', 'transport', 'Car Rental'),
-- Shopping
('5311', 'shopping', 'Department Stores'),
('5331', 'shopping', 'Variety Stores'),
('5399', 'shopping', 'Misc General Merchandise'),
('5611', 'shopping', 'Mens Clothing Stores'),
('5621', 'shopping', 'Womens Clothing Stores'),
('5631', 'shopping', 'Womens Accessory Stores'),
('5641', 'shopping', 'Childrens Wear Stores'),
('5651', 'shopping', 'Family Clothing Stores'),
('5661', 'shopping', 'Shoe Stores'),
('5691', 'shopping', 'Mens and Womens Clothing'),
('5699', 'shopping', 'Misc Apparel and Accessory'),
-- Entertainment
('7832', 'entertainment', 'Motion Picture Theaters'),
('7911', 'entertainment', 'Dance Halls, Studios'),
('7922', 'entertainment', 'Theatrical Productions'),
('7929', 'entertainment', 'Bands, Orchestras, Entertainment'),
('7932', 'entertainment', 'Billiard and Pool'),
('7933', 'entertainment', 'Bowling Alleys'),
('7941', 'entertainment', 'Sports Clubs'),
('7991', 'entertainment', 'Tourist Attractions'),
('7992', 'entertainment', 'Golf Courses'),
('7993', 'entertainment', 'Video Amusement Game'),
('7994', 'entertainment', 'Video Game Arcades'),
('7996', 'entertainment', 'Amusement Parks'),
('7997', 'entertainment', 'Recreation Services'),
('7998', 'entertainment', 'Aquariums, Dolphinariums'),
('7999', 'entertainment', 'Recreation Services'),
-- Bills & Utilities
('4812', 'bills', 'Telecom Equipment'),
('4813', 'bills', 'Telecom Services'),
('4814', 'bills', 'Telecom Services'),
('4816', 'bills', 'Computer Network Services'),
('4899', 'bills', 'Cable and Other Pay TV'),
('4900', 'bills', 'Utilities'),
-- Health
('5122', 'health', 'Drugs, Proprietaries'),
('5912', 'health', 'Drug Stores, Pharmacies'),
('8011', 'health', 'Doctors'),
('8021', 'health', 'Dentists, Orthodontists'),
('8031', 'health', 'Osteopaths'),
('8041', 'health', 'Chiropractors'),
('8042', 'health', 'Optometrists, Ophthalmologists'),
('8049', 'health', 'Podiatrists, Chiropodists'),
('8050', 'health', 'Nursing Care Facilities'),
('8062', 'health', 'Hospitals'),
('8071', 'health', 'Medical and Dental Labs'),
('8099', 'health', 'Health Practitioners'),
-- Education
('8211', 'education', 'Schools, Elementary and Secondary'),
('8220', 'education', 'Colleges, Universities'),
('8241', 'education', 'Correspondence Schools'),
('8244', 'education', 'Business and Secretarial Schools'),
('8249', 'education', 'Trade and Vocational Schools'),
('8299', 'education', 'Schools and Educational Services'),
-- Housing
('6513', 'housing', 'Real Estate Agents, Rentals'),
('1520', 'housing', 'Contractors, Residential'),
('1711', 'housing', 'HVAC Contractors'),
('1731', 'housing', 'Electrical Contractors'),
('1740', 'housing', 'Masonry, Stonework'),
('1750', 'housing', 'Carpentry Contractors'),
('1761', 'housing', 'Roofing and Siding'),
('1771', 'housing', 'Concrete Work'),
('5211', 'housing', 'Lumber and Building Materials'),
('5231', 'housing', 'Glass, Paint, Wallpaper'),
('5251', 'housing', 'Hardware Stores'),
('5261', 'housing', 'Lawn and Garden Supplies'),
('5712', 'housing', 'Furniture Stores'),
('5713', 'housing', 'Floor Covering Stores'),
('5714', 'housing', 'Drapery and Window Covering'),
('5718', 'housing', 'Fireplace Stores'),
('5719', 'housing', 'Misc Home Furnishing'),
('5722', 'housing', 'Household Appliance Stores')
ON CONFLICT (mcc_code) DO NOTHING;

-- ===========================================
-- SEED DEFAULT ACHIEVEMENTS
-- ===========================================
INSERT INTO achievements (id, name_key, description_key, icon, category, xp_reward, requirement_type, requirement_value, is_secret) VALUES
-- Savings achievements
('first_goal', 'achievements.first_goal.name', 'achievements.first_goal.desc', '🎯', 'savings', 50, 'goals_created', 1, false),
('goal_master', 'achievements.goal_master.name', 'achievements.goal_master.desc', '🏆', 'savings', 200, 'goals_completed', 5, false),
('big_saver', 'achievements.big_saver.name', 'achievements.big_saver.desc', '💰', 'savings', 500, 'total_saved', 1000, false),
-- Spending achievements
('first_transaction', 'achievements.first_transaction.name', 'achievements.first_transaction.desc', '📝', 'spending', 10, 'transactions', 1, false),
('tracker_10', 'achievements.tracker_10.name', 'achievements.tracker_10.desc', '📊', 'spending', 25, 'transactions', 10, false),
('tracker_100', 'achievements.tracker_100.name', 'achievements.tracker_100.desc', '📈', 'spending', 100, 'transactions', 100, false),
('tracker_1000', 'achievements.tracker_1000.name', 'achievements.tracker_1000.desc', '🌟', 'spending', 500, 'transactions', 1000, false),
('budget_keeper', 'achievements.budget_keeper.name', 'achievements.budget_keeper.desc', '🎖️', 'spending', 150, 'budgets_kept', 3, false),
-- Streak achievements
('streak_7', 'achievements.streak_7.name', 'achievements.streak_7.desc', '🔥', 'streak', 75, 'streak_days', 7, false),
('streak_30', 'achievements.streak_30.name', 'achievements.streak_30.desc', '💪', 'streak', 300, 'streak_days', 30, false),
('streak_100', 'achievements.streak_100.name', 'achievements.streak_100.desc', '⭐', 'streak', 1000, 'streak_days', 100, false),
-- Social achievements
('first_referral', 'achievements.first_referral.name', 'achievements.first_referral.desc', '🤝', 'social', 100, 'referrals', 1, false),
('influencer', 'achievements.influencer.name', 'achievements.influencer.desc', '📢', 'social', 500, 'referrals', 10, false),
-- Milestone achievements
('level_5', 'achievements.level_5.name', 'achievements.level_5.desc', '🌱', 'milestone', 0, 'level', 5, false),
('level_10', 'achievements.level_10.name', 'achievements.level_10.desc', '🌿', 'milestone', 0, 'level', 10, false),
('level_25', 'achievements.level_25.name', 'achievements.level_25.desc', '🌳', 'milestone', 0, 'level', 25, false),
('level_50', 'achievements.level_50.name', 'achievements.level_50.desc', '🏔️', 'milestone', 0, 'level', 50, false),
-- Secret achievements
('night_owl', 'achievements.night_owl.name', 'achievements.night_owl.desc', '🦉', 'milestone', 50, 'night_transactions', 10, true),
('early_bird', 'achievements.early_bird.name', 'achievements.early_bird.desc', '🐦', 'milestone', 50, 'morning_transactions', 10, true)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- GRANT PERMISSIONS FOR NEW TABLES
-- ===========================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
