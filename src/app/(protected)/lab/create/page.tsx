import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateLabClient from "./CreateLabClient";

export const metadata = {
    title: "创建共创研究室 - Scholarly",
    description: "配置并创建专属学术共创研讨室",
};

export default async function CreateLabPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?next=/lab/create");
    }

    return <CreateLabClient />;
}
