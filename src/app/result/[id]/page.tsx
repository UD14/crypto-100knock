"use client";

// セッション結果ページ
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/store/session";
import { motion } from "framer-motion";
import type { SessionResult } from "@/types";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  BarChart3,
  ArrowLeft,
  RotateCcw,
  Zap,
} from "lucide-react";

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const store = useSessionStore();
  const supabase = createClient();

  const [result, setResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    // ストアにデータがあればそれを使用
    const storeResult = store.getResult();
    if (storeResult.totalTrades > 0 || storeResult.holdCount > 0) {
      setResult(storeResult);
    } else {
      // DBから取得を試みる（後日実装時のフォールバック）
      loadFromDb();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const loadFromDb = async () => {
    try {
      const { data: session } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (session) {
        setResult({
          profitFactor: session.profit_factor ?? 0,
          riskRewardRatio: session.risk_reward_ratio ?? 0,
          expectedValue: session.expected_value ?? 0,
          winRate: session.win_rate ?? 0,
          totalTrades: session.total_knocks ?? 0,
          winTrades: 0,
          lossTrades: 0,
          holdCount: 0,
          totalPnl: 0,
          actions: [],
        });
      }
    } catch {
      // フォールバック：デモ結果
      setResult({
        profitFactor: 1.5,
        riskRewardRatio: 1.2,
        expectedValue: 0.8,
        winRate: 0.55,
        totalTrades: 10,
        winTrades: 6,
        lossTrades: 4,
        holdCount: 3,
        totalPnl: 5.2,
        actions: [],
      });
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 総合評価
  const getGrade = () => {
    if (result.winRate >= 0.7 && result.profitFactor >= 2) return { grade: "S", color: "text-yellow-400", msg: "卓越した判断力。市場を支配している。" };
    if (result.winRate >= 0.6 && result.profitFactor >= 1.5) return { grade: "A", color: "text-green-400", msg: "優秀。一貫したロジックで市場を読んでいる。" };
    if (result.winRate >= 0.5) return { grade: "B", color: "text-blue-400", msg: "及第点。まだ改善の余地あり。パターン認識を鍛えろ。" };
    if (result.winRate >= 0.4) return { grade: "C", color: "text-amber-400", msg: "不十分。Fakeoutへの耐性が低い。もっと出来高を見ろ。" };
    return { grade: "D", color: "text-red-400", msg: "再訓練が必要。感情ではなくロジックで判断しろ。" };
  };

  const grade = getGrade();

  const kpiCards = [
    {
      icon: Target,
      label: "勝率",
      value: `${(result.winRate * 100).toFixed(1)}%`,
      color: result.winRate >= 0.5 ? "text-green-400" : "text-red-400",
    },
    {
      icon: BarChart3,
      label: "Profit Factor",
      value: result.profitFactor >= 99 ? "∞" : result.profitFactor.toFixed(2),
      color: result.profitFactor >= 1.5 ? "text-green-400" : "text-amber-400",
    },
    {
      icon: Shield,
      label: "R:R比率",
      value: result.riskRewardRatio >= 99 ? "∞" : result.riskRewardRatio.toFixed(2),
      color: result.riskRewardRatio >= 1.5 ? "text-green-400" : "text-amber-400",
    },
    {
      icon: Zap,
      label: "期待値 (EV)",
      value: `${result.expectedValue >= 0 ? "+" : ""}${result.expectedValue.toFixed(2)}`,
      color: result.expectedValue >= 0 ? "text-green-400" : "text-red-400",
    },
  ];

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`text-6xl md:text-8xl font-black ${grade.color} mb-2`}
        >
          {grade.grade}
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-gray-400 max-w-xs mx-auto"
        >
          {grade.msg}
        </motion.p>
      </div>

      {/* 累積損益 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card glow-border p-5 text-center mb-6"
      >
        <div className="text-xs text-gray-500 mb-1">累積損益</div>
        <div
          className={`text-3xl font-black ${
            result.totalPnl >= 0 ? "text-green-400" : "text-red-400"
          } flex items-center justify-center gap-2`}
        >
          {result.totalPnl >= 0 ? (
            <TrendingUp className="w-6 h-6" />
          ) : (
            <TrendingDown className="w-6 h-6" />
          )}
          {result.totalPnl >= 0 ? "+" : ""}
          {result.totalPnl.toFixed(2)}%
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500">
          <span>
            {result.totalTrades + result.holdCount}問完了
          </span>
          <span>
            {result.winTrades}勝 {result.lossTrades}敗 {result.holdCount}ホールド
          </span>
        </div>
      </motion.div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] text-gray-500">{kpi.label}</span>
            </div>
            <div className={`text-xl font-black ${kpi.color}`}>
              {kpi.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 判断履歴（直近5件） */}
      {result.actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            判断履歴（直近5件）
          </h3>
          <div className="space-y-2">
            {result.actions.slice(-5).map((action, i) => (
              <div key={i} className="glass-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">
                    #{action.knock_number}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      action.pnl >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {action.pnl >= 0 ? "+" : ""}
                    {action.pnl.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">{action.feedback}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* アクションボタン */}
      <div className="flex gap-3">
        <button
          id="back-to-dashboard"
          onClick={() => {
            store.reset();
            router.push("/dashboard");
          }}
          className="flex-1 glass-card py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードへ
        </button>
        <button
          id="retry-session"
          onClick={() => {
            store.reset();
            router.push("/dashboard");
          }}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 py-3 rounded-2xl text-sm font-bold text-white hover:from-blue-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          もう一度挑戦
        </button>
      </div>
    </div>
  );
}
