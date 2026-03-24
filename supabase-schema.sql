-- ========================================
-- 仮想通貨100本ノック Supabaseスキーマ
-- Supabase SQL Editor でこのSQLを実行してください
-- ========================================

-- ユーザーセッション（1回の100本ノック）
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL DEFAULT 'BTC',
  timeframe TEXT NOT NULL DEFAULT '4h',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_knock INTEGER NOT NULL DEFAULT 1,
  total_knocks INTEGER NOT NULL DEFAULT 0,
  profit_factor REAL,
  risk_reward_ratio REAL,
  expected_value REAL,
  win_rate REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
DROP POLICY IF EXISTS "user_sessions_select" ON user_sessions;
CREATE POLICY "user_sessions_select" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_sessions_insert" ON user_sessions;
CREATE POLICY "user_sessions_insert" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_sessions_update" ON user_sessions;
CREATE POLICY "user_sessions_update" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- OHLCVデータ（ヒストリカルチャートデータ）
CREATE TABLE IF NOT EXISTS ohlcv_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL NOT NULL,
  UNIQUE(symbol, timeframe, timestamp)
);

-- OHLCVデータは全ユーザーがSELECT可能（Read Only）
ALTER TABLE ohlcv_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ohlcv_data_select" ON ohlcv_data;
CREATE POLICY "ohlcv_data_select" ON ohlcv_data
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ohlcv_data_insert" ON ohlcv_data;
CREATE POLICY "ohlcv_data_insert" ON ohlcv_data
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ohlcv_data_update" ON ohlcv_data;
CREATE POLICY "ohlcv_data_update" ON ohlcv_data
  FOR UPDATE USING (true);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_ohlcv_symbol_timeframe ON ohlcv_data(symbol, timeframe, timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id, created_at DESC);
