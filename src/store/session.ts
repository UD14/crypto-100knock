// セッション状態管理ストア（Zustand）
import { create } from "zustand";
import type { TradeAction, Scenario, SessionAction, SessionResult } from "@/types";

interface SessionState {
  // セッション情報
  sessionId: string | null;
  currentKnock: number;
  totalKnocks: number;

  // 現在のシナリオ
  currentScenario: Scenario | null;
  revealedCount: number;       // 公開済みキャンドル数
  hasPosition: boolean;        // ポジションを持っているか
  positionType: "long" | "short" | null;
  entryPrice: number | null;

  // 累積結果
  actions: SessionAction[];
  totalPnl: number;
  wins: number;
  losses: number;
  holds: number;

  // アクション
  setSessionId: (id: string) => void;
  setScenario: (scenario: Scenario) => void;
  revealNextCandle: () => void;
  submitAction: (action: TradeAction) => void;
  addActionResult: (result: SessionAction) => void;
  nextKnock: () => void;
  reset: () => void;
  getResult: () => SessionResult;
}

const initialState = {
  sessionId: null,
  currentKnock: 1,
  totalKnocks: 100,
  currentScenario: null,
  revealedCount: 0,
  hasPosition: false,
  positionType: null as "long" | "short" | null,
  entryPrice: null as number | null,
  actions: [] as SessionAction[],
  totalPnl: 0,
  wins: 0,
  losses: 0,
  holds: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),

  setScenario: (scenario) => set({ currentScenario: scenario, revealedCount: 0 }),

  revealNextCandle: () =>
    set((state) => ({ revealedCount: state.revealedCount + 1 })),

  submitAction: (action) => {
    const state = get();
    if (!state.currentScenario) return;

    const currentCandles = state.currentScenario.candles;
    const lastCandle = currentCandles[currentCandles.length - 1];

    if (action === "buy") {
      set({
        hasPosition: true,
        positionType: "long",
        entryPrice: lastCandle.close,
      });
    } else if (action === "sell") {
      set({
        hasPosition: true,
        positionType: "short",
        entryPrice: lastCandle.close,
      });
    } else if (action === "stop_loss" && state.hasPosition) {
      // ストップロスは即座にポジション解消
      set({
        hasPosition: false,
        positionType: null,
        entryPrice: null,
      });
    }
  },

  addActionResult: (result) =>
    set((state) => ({
      actions: [...state.actions, result],
      totalPnl: state.totalPnl + result.pnl,
      wins: result.pnl > 0 ? state.wins + 1 : state.wins,
      losses: result.pnl < 0 ? state.losses + 1 : state.losses,
      holds: result.action === "hold" ? state.holds + 1 : state.holds,
    })),

  nextKnock: () =>
    set((state) => ({
      currentKnock: state.currentKnock + 1,
      currentScenario: null,
      revealedCount: 0,
      hasPosition: false,
      positionType: null,
      entryPrice: null,
    })),

  reset: () => set(initialState),

  getResult: () => {
    const state = get();
    const winActions = state.actions.filter((a) => a.pnl > 0);
    const lossActions = state.actions.filter((a) => a.pnl < 0);

    const totalProfit = winActions.reduce((sum, a) => sum + a.pnl, 0);
    const totalLoss = Math.abs(lossActions.reduce((sum, a) => sum + a.pnl, 0));

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    const avgWin = winActions.length > 0 ? totalProfit / winActions.length : 0;
    const avgLoss = lossActions.length > 0 ? totalLoss / lossActions.length : 0;
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    const totalTrades = winActions.length + lossActions.length;
    const winRate = totalTrades > 0 ? winActions.length / totalTrades : 0;
    const expectedValue = winRate * avgWin - (1 - winRate) * avgLoss;

    return {
      profitFactor,
      riskRewardRatio,
      expectedValue,
      winRate,
      totalTrades,
      winTrades: winActions.length,
      lossTrades: lossActions.length,
      holdCount: state.holds,
      totalPnl: state.totalPnl,
      actions: state.actions,
    };
  },
}));
