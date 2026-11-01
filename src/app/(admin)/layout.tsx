import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "管理后台 - Scholarly",
  description: "Scholarly 学术论坛管理后台",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 检查管理员权限
  const { data: adminRole } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!adminRole) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, email")
    .eq("id", user.id)
    .single();

  const adminUser = {
    id: user.id,
    role: adminRole.role as string,
    fullName: profile?.username ?? "管理员",
    avatarUrl: profile?.avatar_url ?? null,
    email: profile?.email ?? user.email ?? "",
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-100/80 dark:bg-zinc-950">
      {/* 纯物理环境柔和漫射底光 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-white/70 dark:bg-white/[0.03] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-sky-500/[0.05] dark:bg-sky-400/[0.04] blur-3xl" />
      </div>

      <AdminSidebar role={adminUser.role} />
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={adminUser} />
        <main className="flex-1 overflow-y-auto px-4 pb-8 pt-4 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
