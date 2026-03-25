"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, Zap, Shield, BarChart3, Play } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: BarChart3,
      title: "リアルな歴史データ",
      desc: "2024年の半減期や大暴落時の実データを再現",
    },
    {
      icon: TrendingUp,
      title: "Tough Love",
      desc: "甘えなし。ロジカルに批評するフィードバック",
    },
    {
      icon: Zap,
      title: "High Intensity",
      desc: "100回連続のトレード判断で脳に叩き込む",
    },
    {
      icon: Shield,
      title: "Survival First",
      desc: "利益より生存。退場しないための嗅覚を養う",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* 背景グラデーション */}
      <div className="fixed inset-0 -z-10 bg-[#0a0e17]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-4xl w-full text-center space-y-12">
        {/* ヒーロー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            <Zap className="w-3 h-3 fill-current" />
            <span>Survival Trading Simulator</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-none">
            CRYPTO<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              100 KNOCK
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            感情を殺し、チャートの真実だけを見よ。<br />
            生き残るための「嗅覚」を、今ここで手に入れろ。
          </p>
        </motion.div>

        {/* スタートボタン */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="group relative px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] flex items-center gap-3 mx-auto"
          >
            <Play className="w-6 h-6 fill-current" />
            トレーニングを開始する
          </button>
          <p className="mt-4 text-gray-500 text-xs uppercase tracking-[0.2em]">No Login Required • Start Instantly</p>
        </motion.div>

        {/* 特徴 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-12"
        >
          {features.map((f, i) => (
            <div key={i} className="glass-card p-6 space-y-3 text-center border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto text-blue-400">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">{f.title}</h3>
              <p className="text-[10px] text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <footer className="mt-20 py-8 text-gray-700 text-[10px] tracking-[0.3em] uppercase">
        &copy; 2026 Crypto 100 Knock - Survival of the Fittest
      </footer>
    </div>
  );
}
