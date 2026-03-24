"use client";

// 途中離脱モーダルコンポーネント
import { motion, AnimatePresence } from "framer-motion";
import { Save, BarChart3, X } from "lucide-react";

interface ExitModalProps {
  isOpen: boolean;
  currentKnock: number;
  onSaveAndExit: () => void;
  onJudgeAndExit: () => void;
  onCancel: () => void;
}

export default function ExitModal({
  isOpen,
  currentKnock,
  onSaveAndExit,
  onJudgeAndExit,
  onCancel,
}: ExitModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* モーダル */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-96 glass-card glow-border p-6 z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                セッションを中断しますか？
              </h3>
              <button
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-6">
              現在 <span className="text-white font-bold">{currentKnock}</span>
              /100 問目です。2つの選択肢があります。
            </p>

            <div className="space-y-3">
              {/* 保存して中断 */}
              <button
                id="save-and-exit-btn"
                onClick={onSaveAndExit}
                className="w-full glass-card p-4 flex items-center gap-3 hover:bg-[#232a3d] transition-colors text-left"
              >
                <Save className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">
                    保存して中断
                  </div>
                  <div className="text-[10px] text-gray-500">
                    後で続きから再開できます
                  </div>
                </div>
              </button>

              {/* ここまでで判定 */}
              <button
                id="judge-and-exit-btn"
                onClick={onJudgeAndExit}
                className="w-full glass-card p-4 flex items-center gap-3 hover:bg-[#232a3d] transition-colors text-left"
              >
                <BarChart3 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">
                    ここまでで判定
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {currentKnock - 1}問の成績で最終結果を表示
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
