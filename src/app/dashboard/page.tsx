// ダッシュボードページ（サーバーコンポーネント）
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // 過去のセッションを取得（進行中セッション＆完了セッション）
  const { data: sessions } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <DashboardClient
      user={user}
      sessions={sessions ?? []}
    />
  );
}
