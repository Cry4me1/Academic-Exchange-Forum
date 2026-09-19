import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PendingVerificationClient } from "./PendingVerificationClient";

export const dynamic = "force-dynamic";

export default async function PendingVerificationPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 若已经完成邮箱验证，直接进入主控台
    if (user.email_confirmed_at) {
        redirect("/dashboard");
    }

    return <PendingVerificationClient email={user.email || ""} />;
}
