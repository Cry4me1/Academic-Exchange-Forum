import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 游客可访问的公开路由（不需要登录）
const PUBLIC_ROUTES = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/pending-verification",
    "/auth/callback",
    "/updates",
    "/rules",
    "/rule",
];

// 使用前缀匹配的公开路由
const PUBLIC_PREFIXES = [
    "/api/",  // API 路由自行处理认证
    "/rules",
    "/rule",
];

export async function updateSession(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);

    let supabaseResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: requestHeaders,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // refreshing the auth token
    const { data: { user } } = await supabase.auth.getUser();

    // 已登录用户访问登录/注册页面时，重定向到 dashboard
    if (user && (pathname === "/login" || pathname === "/register")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
