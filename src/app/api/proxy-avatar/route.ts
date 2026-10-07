import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    try {
        // 安全检查：仅允许 http/https 协议
        const parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return new NextResponse("Invalid protocol", { status: 400 });
        }

        const res = await fetch(url, {
            headers: {
                "User-Agent": "Scholarly-Avatar-Proxy/1.0",
                Accept: "image/*",
            },
        });

        if (!res.ok) {
            return new NextResponse("Failed to fetch image", { status: res.status });
        }

        const contentType = res.headers.get("content-type") || "image/png";
        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Avatar proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
