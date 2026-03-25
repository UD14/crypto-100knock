// セッション状態管理ストア（Zustand + LocalStorage 永続化）
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionState, SessionResult, SessionAction, TradeAction } from "@/types";

interface SessionStore extends SessionState {
  sessionHistory: SessionResult[];
  setSessionId: (id: string | null) => void;
  startSession: (symbol: string, timeframe: string) => void;
  nextKnock: () => void;
  submitAction: (action: TradeAction) => void;
  addActionResult: (result: SessionAction) => void;
  getResult: () => SessionResult;
  saveToHistory: () => void;
  reset: () => void;
}

const initialState: SessionState = {
  sessionId: null,
  userId: "guest",
  status: "idle",
  currentKnock: 1,
  totalPnl: 0,
  winCount: 0,
  lossCount: 0,
  holdCount: 0,
  actionResults: [],
  hasPosition: false,
  positionType: null,
  entryPrice: null,
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      sessionHistory: [],

      setSessionId: (id) => set({ sessionId: id }),

      startSession: (symbol, timeframe) =>
        set({
          ...initialState,
          sessionId: `local-${Date.now()}`,
          status: "active",
        }),

      nextKnock: () =>
        set((state) => ({
          currentKnock: state.currentKnock + 1,
        })),

      submitAction: (action) => {
        const state = get();
        if (action === "buy") {
          set({ hasPosition: true, positionType: "long" });
        } else if (action === "sell") {
          set({ hasPosition: true, positionType: "short" });
        } else if (action === "stop_loss" || (action === "hold" && state.hasPosition)) {
          set({ hasPosition: false, positionType: null, entryPrice: null });
        }
      },

      addActionResult: (result) =>
        set((state) => ({
          actionResults: [...state.actionResults, result],
          totalPnl: state.totalPnl + result.pnl,
          winCount: result.pnl > 0 ? state.winCount + 1 : state.winCount,
          lossCount: result.pnl < 0 ? state.lossCount + 1 : state.lossCount,
          holdCount: result.action === "hold" ? state.holdCount + 1 : state.holdCount,
        })),

      getResult: () => {
        const state = get();
        const totalTrades = state.winCount + state.lossCount;
        const winRate = totalTrades > 0 ? (state.winCount / totalTrades) * 100 : 0;

        const totalProfit = state.actionResults
          .filter((r) => r.pnl > 0)
          .reduce((sum, r) => sum + r.pnl, 0);
        const totalLoss = Math.abs(
          state.actionResults.filter((r) => r.pnl < 0).reduce((sum, r) => sum + r.pnl, 0)
        );

        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 99 : 0;

        return {
          totalKnocks: state.currentKnock - 1,
          winRate,
          totalPnl: state.totalPnl,
          profitFactor,
          riskRewardRatio: 1.5,
          expectedValue: state.totalPnl / (state.currentKnock || 1),
          totalTrades,
          winTrades: state.winCount,
          lossTrades: state.lossCount,
          holdCount: state.holdCount,
          actions: state.actionResults,
        };
      },

      saveToHistory: () => {
        const state = get();
        if (state.actionResults.length === 0) return;
        const result = state.getResult();
        set((s) => ({
          sessionHistory: [result, ...s.sessionHistory].slice(0, 10), // 最新10件保持
        }));
      },

      reset: () => {
        const { sessionHistory } = get();
        set({ ...initialState, sessionHistory });
      },
    }),
    {
      name: "crypto-100knock-storage",
    }
  )
);
