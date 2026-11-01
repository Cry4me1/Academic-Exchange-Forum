import { notFound } from "next/navigation";
import TestMathClient from "./TestMathClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "数学公式测试 (Dev Only) - Scholarly",
    robots: {
        index: false,
        follow: false,
    },
};

export default function TestMathPage() {
    // 限制仅开发环境可访问，生产环境直接触发 404
    if (process.env.NODE_ENV !== "development") {
        notFound();
    }

    return <TestMathClient />;
}
