import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DebugClient from "./DebugClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "系统运行态诊断 - Scholarly",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function DebugPage() {
    const isDev = process.env.NODE_ENV === "development";

    // 生产环境中严格进行权限鉴权：必须已登录且具备 super_admin 权限
    if (!isDev) {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // 未登录则直接触发 404，不暴露路由的存在
        if (!user) {
            notFound();
        }

        const { data: adminRole } = await supabase
            .from("admin_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "super_admin")
            .maybeSingle();

        // 非 super_admin 直接 404
        if (!adminRole) {
            notFound();
        }
    }

    return <DebugClient isDev={isDev} />;
}
