"use client";

// ダッシュボードクライアントコンポーネント
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import type { UserSession, SessionConfig } from "@/types";
import {
  Play,
  RotateCcw,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  LogOut,
  Bitcoin,
  ChevronRight,
} from "lucide-react";

interface DashboardClientProps {
  user: User;
  sessions: UserSession[];
}

export default function DashboardClient({
  user,
  sessions,
}: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [config, setConfig] = useState<SessionConfig>({
    symbol: "BTC",
    timeframe: "4h",
  });
  const [starting, setStarting] = useState(false);

  // 進行中セッション
  const inProgressSessions = sessions.filter(
    (s) => s.status === "in_progress"
  );
  // 完了セッション
  const completedSessions = sessions.filter(
    (s) => s.status === "completed" || s.status === "abandoned"
  );

  // 新規セッション開始
  const handleStartSession = async () => {
    setStarting(true);
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .insert({
          user_id: user.id,
          symbol: config.symbol,
          timeframe: config.timeframe,
          status: "in_progress",
          current_knock: 1,
          total_knocks: 0,
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/session/${data.id}`);
    } catch (err) {
      console.error("セッション作成エラー:", err);
      setStarting(false);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">
            仮想通貨100本ノック
          </h1>
          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
        </div>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="text-gray-500 hover:text-gray-300 transition-colors p-2"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* 新規セッション開始 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glow-border p-6 mb-6"
      >
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Play className="w-4 h-4 text-blue-400" />
          新しいノックを開始
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* 通貨選択 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">通貨ペア</label>
            <div className="flex gap-2">
              {(["BTC", "ETH"] as const).map((sym) => (
                <button
                  key={sym}
                  id={`symbol-${sym.toLowerCase()}`}
                  onClick={() => setConfig((c) => ({ ...c, symbol: sym }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    config.symbol === sym
                      ? "bg-blue-600 text-white"
                      : "bg-[#1a1f2e] text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {sym === "BTC" && <Bitcoin className="w-3 h-3 inline mr-1" />}
                  {sym}/USDT
                </button>
              ))}
            </div>
          </div>

          {/* 時間足選択 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">時間足</label>
            <div className="flex gap-2">
              {(["1h", "4h", "1d"] as const).map((tf) => (
                <button
                  key={tf}
                  id={`timeframe-${tf}`}
                  onClick={() =>
                    setConfig((c) => ({ ...c, timeframe: tf }))
                  }
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    config.timeframe === tf
                      ? "bg-blue-600 text-white"
                      : "bg-[#1a1f2e] text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          id="start-session-btn"
          onClick={handleStartSession}
          disabled={starting}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-bold text-sm hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          {starting ? "準備中..." : "100本ノック開始"}
        </button>
      </motion.div>

      {/* 進行中セッション */}
      {inProgressSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            中断中のセッション
          </h2>
          <div className="space-y-2">
            {inProgressSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => router.push(`/session/${session.id}`)}
                className="glass-card w-full p-4 flex items-center justify-between hover:bg-[#232a3d] transition-colors text-left"
              >
                <div>
                  <span className="text-xs font-bold text-white">
                    {session.symbol}/USDT
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {session.timeframe}
                  </span>
                  <div className="text-[10px] text-gray-600 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {session.current_knock}/100 問目
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* 過去の成績 */}
      {completedSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            過去の成績
          </h2>
          <div className="space-y-2">
            {completedSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => router.push(`/result/${session.id}`)}
                className="glass-card w-full p-4 flex items-center justify-between hover:bg-[#232a3d] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-white">
                      {session.symbol}/USDT
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {session.timeframe}
                    </span>
                    {session.status === "abandoned" && (
                      <span className="text-[10px] text-amber-500 ml-2">
                        途中判定
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold">
                      {session.win_rate !== null ? (
                        <span
                          className={
                            session.win_rate >= 0.5
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {(session.win_rate * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {session.total_knocks}問完了
                    </div>
                  </div>
                  {session.win_rate !== null &&
                    (session.win_rate >= 0.5 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ))}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
