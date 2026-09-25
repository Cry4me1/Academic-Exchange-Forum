import { CreditRechargeProvider } from "@/components/payments/CreditRechargeProvider";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { MobileNavigationShell } from "@/components/navigation/MobileNavigationShell";
import { GlobalMessageListener } from "@/components/notifications";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  let supabase;

  try {
    supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    console.warn("[ProtectedLayout] 获取用户会话失败:", err);
  }

  if (!user || !supabase) {
    redirect("/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/pending-verification");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // 检查新用户的入驻与公约签署完成状态
  let isOnboardingCompleted = true;

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && profile && typeof profile.onboarding_completed === "boolean") {
      isOnboardingCompleted = profile.onboarding_completed;
    }
  } catch (err) {
    console.warn("[ProtectedLayout] Onboarding check fallback:", err);
  }

  const isAllowedPathWithoutOnboarding =
    pathname.startsWith("/welcome") ||
    pathname.startsWith("/rules") ||
    pathname.startsWith("/rule") ||
    pathname.startsWith("/api/");

  if (!isOnboardingCompleted && !isAllowedPathWithoutOnboarding) {
    redirect("/welcome");
  }

  return (
    <div className="min-h-screen bg-background">
      <PresenceProvider currentUserId={user.id}>
        {children}
        <CreditRechargeProvider />
        <MobileNavigationShell currentUserId={user.id} />
        <GlobalMessageListener currentUserId={user.id} />
      </PresenceProvider>
    </div>
  );
}
