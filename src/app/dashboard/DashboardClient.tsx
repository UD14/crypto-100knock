"use client";

// ダッシュボードクライアントコンポーネント (MVP: LocalStorage 版)
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSessionStore } from "@/store/session";
import type { SessionConfig } from "@/types";
import {
  Play,
  RotateCcw,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  Bitcoin,
  ChevronRight,
  Trash2,
  Zap,
} from "lucide-react";

export default function DashboardClient() {
  const router = useRouter();
  const store = useSessionStore();
  const [isMounted, setIsMounted] = useState(false);
  const [config, setConfig] = useState<SessionConfig>({
    symbol: "BTC",
    timeframe: "4h",
  });

  // Client-side hydration check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // 進行中セッション (Zustandに現在進行中があれば表示)
  const isSessionActive = store.status === "active";

  // 新規セッション開始
  const handleStartSession = () => {
    store.startSession(config.symbol, config.timeframe);
    router.push(`/session/${store.sessionId ?? "new"}`);
  };

  // 履歴クリア
  const handleClearHistory = () => {
    if (confirm("履歴をすべて削除しますか？")) {
      store.reset();
      localStorage.removeItem("crypto-100knock-storage");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 max-w-4xl mx-auto space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            DASHBOARD
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Survival Training Center</p>
        </div>
        <button
          onClick={handleClearHistory}
          className="text-gray-600 hover:text-red-400 transition-colors p-2"
          title="履歴をクリア"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 新規セッション開始 */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
            <Play className="w-4 h-4 text-blue-500" />
            Start Training
          </h2>
          <div className="glass-card glow-border p-6 space-y-6">
            <div className="space-y-4">
              {/* 通貨選択 */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Trading Pair</label>
                <div className="flex gap-2">
                  {(["BTC", "ETH"] as const).map((sym) => (
                    <button
                      key={sym}
                      onClick={() => setConfig((c) => ({ ...c, symbol: sym }))}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                        config.symbol === sym
                          ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                          : "bg-[#111827] border-white/5 text-gray-500 hover:border-white/10"
                      }`}
                    >
                      {sym === "BTC" && <Bitcoin className="w-3 h-3 inline mr-1" />}
                      {sym}/USDT
                    </button>
                  ))}
                </div>
              </div>

              {/* 時間足選択 */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Timeframe</label>
                <div className="flex gap-2">
                  {(["1h", "4h", "1d"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setConfig((c) => ({ ...c, timeframe: tf }))}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                        config.timeframe === tf
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-[#111827] border-white/5 text-gray-500 hover:border-white/10"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartSession}
              className="w-full bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              100本ノックを開始
            </button>
          </div>
        </section>

        {/* 状態 & 歴史 */}
        <div className="space-y-8">
          {/* 中断中のセッション */}
          {isSessionActive && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-amber-500 flex items-center gap-2 uppercase tracking-wider">
                <RotateCcw className="w-4 h-4" />
                Resume Training
              </h2>
              <button
                onClick={() => router.push(`/session/${store.sessionId}`)}
                className="glass-card w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all border-amber-500/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white uppercase">{config.symbol}/USDT</p>
                    <p className="text-[10px] text-gray-500">#{store.currentKnock} / 100 PROGRESS</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </section>
          )}

          {/* 過去の戦績 */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              Battle History
            </h2>
            {store.sessionHistory.length > 0 ? (
              <div className="space-y-3">
                {store.sessionHistory.map((session, idx) => (
                  <div
                    key={idx}
                    className="glass-card p-4 flex items-center justify-between border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${session.winRate >= 50 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                         {session.winRate >= 50 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{session.totalPnl.toFixed(2)}%</p>
                        <p className="text-[10px] text-gray-500">{session.totalKnocks}問 • 勝率 {session.winRate.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-gray-400 uppercase font-medium">PF {session.profitFactor.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 text-center border-dashed border-white/5">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">No Records Yet</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
