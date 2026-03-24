// アプリケーション全体で使用する型定義

// OHLCVデータの1レコード
export interface OhlcvData {
  id: string;
  symbol: string;         // "BTC" | "ETH"
  timeframe: string;      // "1h" | "4h" | "1d"
  timestamp: string;      // ISO 8601
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ユーザーが選択できるアクション
export type TradeAction = "buy" | "sell" | "hold" | "stop_loss";

// 1問ごとのユーザー判断記録
export interface SessionAction {
  id: string;
  session_id: string;
  knock_number: number;   // 1〜100
  action: TradeAction;
  entry_price: number | null;
  exit_price: number | null;
  pnl: number;            // 損益（パーセント）
  feedback: string;       // Tough Loveフィードバックメッセージ
  created_at: string;
}

// セッション（1回の100本ノック）
export interface UserSession {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  status: "in_progress" | "completed" | "abandoned";
  current_knock: number;  // 現在の問題番号
  total_knocks: number;   // 完了した問題数
  profit_factor: number | null;
  risk_reward_ratio: number | null;
  expected_value: number | null;
  win_rate: number | null;
  created_at: string;
  updated_at: string;
}

// セッション設定（ノック開始時）
export interface SessionConfig {
  symbol: "BTC" | "ETH";
  timeframe: "1h" | "4h" | "1d";
}

// シナリオ（1問分のチャートデータ）
export interface Scenario {
  candles: OhlcvData[];       // 可視部分のキャンドルデータ
  hiddenCandles: OhlcvData[]; // 隠れた次のキャンドル群
  knockNumber: number;
}

// KPI結果
export interface SessionResult {
  profitFactor: number;
  riskRewardRatio: number;
  expectedValue: number;
  winRate: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  holdCount: number;
  totalPnl: number;
  actions: SessionAction[];
}
