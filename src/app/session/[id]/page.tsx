"use client";

// 100本ノック セッションメイン画面
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/store/session";
import CandlestickChart from "@/components/CandlestickChart";
import ExitModal from "@/components/ExitModal";
import { motion, AnimatePresence } from "framer-motion";
import type { OhlcvData, TradeAction } from "@/types";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Pause,
  ShieldAlert,
  X,
  ChevronRight,
  Volume2,
} from "lucide-react";

// デモ用ダミーデータ生成（Supabase未接続時のフォールバック）
function generateDemoCandles(count: number, startPrice: number): OhlcvData[] {
  const candles: OhlcvData[] = [];
  let price = startPrice;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const volatility = price * 0.02;
    const open = price;
    const close = open + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 1000 + 500;

    candles.push({
      id: `demo-${i}`,
      symbol: "BTC",
      timeframe: "4h",
      timestamp: new Date(now - (count - i) * 4 * 60 * 60 * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });
    price = close;
  }
  return candles;
}

// Tough Loveフィードバックメッセージ生成
function generateFeedback(
  action: TradeAction,
  pnl: number,
  candles: OhlcvData[]
): string {
  const lastCandle = candles[candles.length - 1];
  const avgVolume =
    candles.slice(-10).reduce((sum, c) => sum + c.volume, 0) / Math.min(candles.length, 10);
  const volumeRatio = lastCandle.volume / avgVolume;

  if (action === "hold") {
    return "⏸️ ホールド。市場を観察する判断。エントリー条件が揃うまで待つのは正しい。";
  }

  if (pnl > 0) {
    if (pnl > 3) {
      return `✅ +${pnl.toFixed(2)}% — 優れた判断。トレンドの方向を正確に読んだ。`;
    }
    return `✅ +${pnl.toFixed(2)}% — 利益確保。ただし、より良いエントリーポイントがあった可能性あり。`;
  }

  if (pnl < -3) {
    if (volumeRatio < 0.5) {
      return `❌ ${pnl.toFixed(2)}% — 出来高は平均比${(volumeRatio * 100).toFixed(0)}%。ボリューム不足でのエントリーは危険。Fakeoutを疑え。`;
    }
    return `❌ ${pnl.toFixed(2)}% — 大きな損失。損切りの判断が遅い。エントリーロジックを再評価しろ。`;
  }

  if (action === "stop_loss") {
    return `🛡️ ストップロス発動。損失を限定した。${pnl.toFixed(2)}% — 生き残ることが最優先。`;
  }

  return `⚠️ ${pnl.toFixed(2)}% — 小幅な損失。次の判断に活かせ。`;
}

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const supabase = createClient();

  const store = useSessionStore();
  const [visibleCandles, setVisibleCandles] = useState<OhlcvData[]>([]);
  const [hiddenCandles, setHiddenCandles] = useState<OhlcvData[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [loading, setLoading] = useState(true);

  // シナリオの読み込み
  const loadScenario = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      // Supabaseからデータ取得を試みる
      // 本来はconfigから動的に取得すべきだが、一旦BTC/4hで動作確認
      const { data: ohlcvData, error } = await supabase
        .from("ohlcv_data")
        .select("*")
        .eq("symbol", "BTC")
        .eq("timeframe", "4h")
        .order("timestamp", { ascending: true })
        .limit(1000);

      if (error) throw error;

      if (ohlcvData && ohlcvData.length > 50) {
        // ランダムな開始点を選択（100本ノック分+バッファが必要なため後方に余裕を持たせる）
        const maxStart = Math.max(0, ohlcvData.length - 200);
        const startIdx = Math.floor(Math.random() * maxStart);
        
        // 50本分を1つのシナリオとして切り出す
        const scenarioData = ohlcvData.slice(startIdx, startIdx + 50);
        const visible = scenarioData.slice(0, 30);
        const hidden = scenarioData.slice(30);
        
        setVisibleCandles(visible);
        setHiddenCandles(hidden);
      } else {
        console.warn("十分なデータが見つかりませんでした。デモデータを使用します。");
        const basePrice = 40000 + Math.random() * 30000;
        const allCandles = generateDemoCandles(50, basePrice);
        setVisibleCandles(allCandles.slice(0, 30));
        setHiddenCandles(allCandles.slice(30));
      }
    } catch (err) {
      console.error("データ取得エラー:", err);
      const basePrice = 40000 + Math.random() * 30000;
      const allCandles = generateDemoCandles(50, basePrice);
      setVisibleCandles(allCandles.slice(0, 30));
      setHiddenCandles(allCandles.slice(30));
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    store.setSessionId(sessionId);
    loadScenario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // アクション実行
  const handleAction = async (action: TradeAction) => {
    if (isRevealing) return;
    setIsRevealing(true);

    const currentPrice = visibleCandles[visibleCandles.length - 1]?.close ?? 0;

    // 次のキャンドルを1本ずつ追加表示（3本分）
    let finalPrice = currentPrice;
    const revealCount = Math.min(3, hiddenCandles.length);

    for (let i = 0; i < revealCount; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const nextCandle = hiddenCandles[i];
      setVisibleCandles((prev) => [...prev, nextCandle]);
      finalPrice = nextCandle.close;
    }

    // 損益計算
    let pnl = 0;
    if (action === "buy") {
      pnl = ((finalPrice - currentPrice) / currentPrice) * 100;
    } else if (action === "sell") {
      pnl = ((currentPrice - finalPrice) / currentPrice) * 100;
    } else if (action === "stop_loss" && store.hasPosition) {
      pnl = store.positionType === "long"
        ? ((finalPrice - (store.entryPrice ?? currentPrice)) / (store.entryPrice ?? currentPrice)) * 100
        : (((store.entryPrice ?? currentPrice) - finalPrice) / (store.entryPrice ?? currentPrice)) * 100;
      pnl = Math.min(pnl, -0.5); // ストップロスは損失として計上
    }

    // フィードバック生成
    const fbMsg = generateFeedback(action, pnl, visibleCandles);
    setFeedback(fbMsg);

    // ストアに記録
    store.addActionResult({
      id: `${sessionId}-${store.currentKnock}`,
      session_id: sessionId,
      knock_number: store.currentKnock,
      action,
      entry_price: currentPrice,
      exit_price: finalPrice,
      pnl,
      feedback: fbMsg,
      created_at: new Date().toISOString(),
    });

    store.submitAction(action);
    setIsRevealing(false);
  };

  // 次の問題へ
  const handleNext = () => {
    if (store.currentKnock >= 100) {
      // 100本完了 → 結果ページへ
      handleComplete();
      return;
    }
    store.nextKnock();
    loadScenario();
  };

  // セッション完了
  const handleComplete = async () => {
    store.saveToHistory();
    router.push(`/result/${sessionId}`);
  };

  // 保存して中断
  const handleSaveAndExit = async () => {
    // LocalStorage (persist) により、遷移して戻るだけで再開可能
    router.push("/dashboard");
  };

  // ここまでで判定
  const handleJudgeAndExit = async () => {
    store.saveToHistory();
    router.push(`/result/${sessionId}`);
  };

  const progressPercent = ((store.currentKnock - 1) / 100) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">シナリオを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">
            #{store.currentKnock}
          </span>
          <span className="text-xs text-gray-500">/100</span>
        </div>

        {/* プログレスバー */}
        <div className="flex-1 mx-4">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 累積損益 */}
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-bold ${
              store.totalPnl >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {store.totalPnl >= 0 ? "+" : ""}
            {store.totalPnl.toFixed(2)}%
          </span>
          <button
            id="exit-btn"
            onClick={() => setShowExitModal(true)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* チャート */}
      <div className="flex-1 px-2 py-2">
        <CandlestickChart
          candles={visibleCandles}
          className="h-[45vh] md:h-[55vh]"
        />
      </div>

      {/* フィードバック */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mb-3"
          >
            <div className="glass-card p-3 text-xs leading-relaxed text-gray-300">
              {feedback}
            </div>
            <div className="flex justify-end mt-2">
              <button
                id="next-knock-btn"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1 transition-colors"
              >
                {store.currentKnock >= 100 ? "結果を見る" : "次の問題へ"}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* アクションボタン — 固定下部 */}
      {!feedback && (
        <div className="px-4 pb-6 pt-2 border-t border-gray-800 bg-[#0a0e17]/90 backdrop-blur-sm">
          {/* 出来高インジケーター */}
          <div className="flex items-center gap-1 mb-3 justify-center">
            <Volume2 className="w-3 h-3 text-gray-600" />
            <span className="text-[10px] text-gray-600">
              Vol:{" "}
              {visibleCandles.length > 0
                ? visibleCandles[visibleCandles.length - 1].volume.toFixed(0)
                : "—"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              id="action-buy"
              onClick={() => handleAction("buy")}
              disabled={isRevealing}
              className="action-btn action-btn-buy"
            >
              <ArrowUpCircle className="w-5 h-5" />
              BUY
            </button>
            <button
              id="action-sell"
              onClick={() => handleAction("sell")}
              disabled={isRevealing}
              className="action-btn action-btn-sell"
            >
              <ArrowDownCircle className="w-5 h-5" />
              SELL
            </button>
            <button
              id="action-hold"
              onClick={() => handleAction("hold")}
              disabled={isRevealing}
              className="action-btn action-btn-hold"
            >
              <Pause className="w-5 h-5" />
              HOLD
            </button>
            <button
              id="action-stop"
              onClick={() => handleAction("stop_loss")}
              disabled={isRevealing || !store.hasPosition}
              className="action-btn action-btn-stop disabled:opacity-30"
            >
              <ShieldAlert className="w-5 h-5" />
              STOP
            </button>
          </div>
        </div>
      )}

      {/* 途中離脱モーダル */}
      <ExitModal
        isOpen={showExitModal}
        currentKnock={store.currentKnock}
        onSaveAndExit={handleSaveAndExit}
        onJudgeAndExit={handleJudgeAndExit}
        onCancel={() => setShowExitModal(false)}
      />
    </div>
  );
}
