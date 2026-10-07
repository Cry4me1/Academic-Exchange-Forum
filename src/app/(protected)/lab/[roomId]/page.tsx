import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getLabRoom } from "../actions";
import LabRoomClient from "./LabRoomClient";

interface LabRoomPageProps {
    params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: LabRoomPageProps) {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: room } = await supabase
        .from("lab_rooms")
        .select("name, description")
        .eq("id", roomId)
        .maybeSingle();

    if (!room) {
        return { title: "共创研讨室 - Scholarly" };
    }
    return {
        title: `${room.name} - 共创实验室 - Scholarly`,
        description: room.description || "Scholarly 多人实时学术共创研讨室",
    };
}

export default async function LabRoomPage({ params }: LabRoomPageProps) {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/lab/${roomId}`);
    }

    // 获取当前用户 profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

    // 获取研讨室详情
    const roomRes = await getLabRoom(roomId);
    const room = roomRes?.data;

    if (!room) {
        notFound();
    }

    // 检查当前用户是否已是房间成员
    const members = room.lab_members || [];
    const isMember = members.some((m: any) => m.user?.id === user.id);
    const isOwner = room.created_by === user.id;

    // 若不是成员且不是创建者，重定向至受邀加入页面
    if (!isMember && !isOwner) {
        redirect(`/lab/join/${roomId}`);
    }

    // 若是创建者但不在成员列表中（容错机制），自动补全 owner 记录
    if (isOwner && !isMember) {
        await supabase
            .from("lab_members")
            .insert({
                room_id: roomId,
                user_id: user.id,
                role: "owner",
            });
        
        // 重新获取包含自身为 owner 的最新房间数据
        const refreshed = await getLabRoom(roomId);
        if (refreshed?.data) {
            return (
                <LabRoomClient
                    room={refreshed.data}
                    currentUserId={user.id}
                    currentUsername={profile?.username || "学者"}
                    currentAvatarUrl={profile?.avatar_url}
                />
            );
        }
    }

    return (
        <LabRoomClient
            room={room}
            currentUserId={user.id}
            currentUsername={profile?.username || "学者"}
            currentAvatarUrl={profile?.avatar_url}
        />
    );
}
