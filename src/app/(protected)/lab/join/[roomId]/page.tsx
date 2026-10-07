import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import JoinLabClient from "./JoinLabClient";

interface JoinLabPageProps {
    params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: JoinLabPageProps) {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: room } = await supabase
        .from("lab_rooms")
        .select("name, description")
        .eq("id", roomId)
        .maybeSingle();

    if (!room) {
        return { title: "研讨室未找到 - Scholarly" };
    }

    return {
        title: `加入「${room.name}」 - Scholarly 共创实验室`,
        description: room.description || "受邀加入学术研讨室",
    };
}

export default async function JoinLabPage({ params }: JoinLabPageProps) {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/lab/join/${roomId}`);
    }

    // 获取研讨室信息与成员状态
    const { data: room, error } = await supabase
        .from("lab_rooms")
        .select(`
            id,
            name,
            description,
            room_type,
            max_members,
            access_code_hash,
            created_by,
            lab_members (
                id,
                user_id
            )
        `)
        .eq("id", roomId)
        .maybeSingle();

    if (error || !room) {
        notFound();
    }

    // 检查当前用户是否已经在房间内，若是则直接进入研讨室
    const members = room.lab_members || [];
    const isAlreadyMember = members.some((m: any) => m.user_id === user.id) || room.created_by === user.id;

    if (isAlreadyMember) {
        redirect(`/lab/${roomId}`);
    }

    const roomData = {
        id: room.id,
        name: room.name,
        description: room.description || undefined,
        room_type: room.room_type,
        max_members: room.max_members,
        memberCount: members.length,
        isEncrypted: Boolean(room.access_code_hash),
    };

    return <JoinLabClient room={roomData} />;
}
