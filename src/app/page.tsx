"use client";

// ランディングページ兼ログイン画面
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  LogIn,
  Mail,
  Lock,
  AlertTriangle,
} from "lucide-react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage("確認メールを送信しました。メール内のリンクをクリックしてください。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: "100本ノック",
      desc: "100連続トレード判断で実戦力を鍛える",
    },
    {
      icon: Shield,
      title: "Survival Training",
      desc: "Fakeout・清算カスケードを見破る",
    },
    {
      icon: Zap,
      title: "Tough Love",
      desc: "甘えなし。ロジカルに批評する",
    },
    {
      icon: BarChart3,
      title: "実データ",
      desc: "2024-2026年のリアルチャート使用",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* 背景グラデーション */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e17] via-[#111827] to-[#0a0e17]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* ヒーロー */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            仮想通貨
          </span>
          <br />
          <span className="text-white">100本ノック</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
          過去の実チャートで鍛える。Fakeoutを見破れ。
          <br />
          甘えは一切ない。ロジックで殴る。
        </p>
      </motion.div>

      {/* 特徴カード */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 max-w-2xl w-full"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            className="glass-card p-4 text-center"
          >
            <f.icon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <h3 className="text-xs font-bold text-white mb-1">{f.title}</h3>
            <p className="text-[10px] text-gray-500">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ログインフォーム */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card glow-border p-6 md:p-8 w-full max-w-sm"
      >
        <h2 className="text-lg font-bold text-center mb-6 text-white">
          {isSignUp ? "アカウント作成" : "ログイン"}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              id="email-input"
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              id="password-input"
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-400 text-xs bg-green-400/10 p-3 rounded-lg">
              {message}
            </div>
          )}

          <button
            id="auth-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold text-sm hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading
              ? "処理中..."
              : isSignUp
                ? "アカウント作成"
                : "ログイン"}
          </button>
        </form>

        <button
          id="toggle-auth-mode"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setMessage(null);
          }}
          className="w-full text-center text-xs text-gray-500 hover:text-gray-300 mt-4 transition-colors"
        >
          {isSignUp
            ? "すでにアカウントをお持ちですか？ログイン"
            : "アカウントをお持ちでないですか？新規登録"}
        </button>
      </motion.div>
    </div>
  );
}
