import { Metadata } from "next";
import { Suspense } from "react";
import { RulesClient } from "./RulesClient";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
    title: "用户协议、积分服务条款与社区公约 - Scholarly",
    description: "Scholarly 学术论坛用户服务协议、付费积分与充值服务条款（退款政策）与社区行为准则公约",
};

export default function CommunityRulesPage() {
    return (
        <Suspense
            fallback={
                <div className="container mx-auto max-w-4xl py-12 px-4 space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            }
        >
            <RulesClient />
        </Suspense>
    );
}
