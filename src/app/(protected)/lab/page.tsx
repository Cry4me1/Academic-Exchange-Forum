import { getMyLabRooms } from "./actions";
import LabListClient from "./LabListClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "共创实验室 - Scholarly",
    description: "学术文献同读、Yjs 实时协同笔记推演与多人成果共创",
};

export default async function LabPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?next=/lab");
    }

    const res = await getMyLabRooms();
    const rooms = (res?.data || []) as any[];

    return <LabListClient rooms={rooms} />;
}
