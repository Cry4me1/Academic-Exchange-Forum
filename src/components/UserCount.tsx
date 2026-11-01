"use client";

import { getUserCount } from "@/actions/user";
import { useEffect, useState } from "react";

interface UserCountProps {
    initialCount?: number;
}

export function UserCount({ initialCount }: UserCountProps) {
    const [count, setCount] = useState<number | null>(
        typeof initialCount === "number" ? initialCount : null
    );

    useEffect(() => {
        if (typeof initialCount === "number") return;

        let mounted = true;
        getUserCount()
            .then((data) => {
                if (mounted) setCount(data);
            })
            .catch(() => {
                if (mounted) setCount(0);
            });
        return () => {
            mounted = false;
        };
    }, [initialCount]);

    // 加载中或数据过少时不再展示虚构的 1000+，以真实表述兜底
    if (count === null || count <= 0) {
        return <span className="tabular-nums">多位</span>;
    }

    return <span className="tabular-nums">{count.toLocaleString()}</span>;
}
