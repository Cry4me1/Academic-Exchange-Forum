import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 游客可访问的公开路由精确匹配（不需要登录）
const PUBLIC_EXACT_ROUTES = new Set([
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
    "/invite-820",
    "/debug",
]);

// 游客可访问的前缀匹配公开路由
const PUBLIC_PREFIXES = [
    "/api/",
    "/rules/",
    "/rule/",
    "/announcements/",
    "/invite-820/",
];

// 判断路由是否是对游客公开开放的
function isPublicRoute(pathname: string): boolean {
    if (PUBLIC_EXACT_ROUTES.has(pathname)) {
        return true;
    }
    if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
    }
    // 帖子详情页 /posts/[id] 对游客开放；发帖 /posts/new 和编辑 /posts/[id]/edit 属于受保护路由
    if (pathname.startsWith("/posts/")) {
        const isEditing = pathname.endsWith("/edit");
        const isHistory = pathname.endsWith("/history");
        const isNewPost = pathname === "/posts/new";
        return !isEditing && !isHistory && !isNewPost;
    }
    return false;
}

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

    // 增加异常捕获，防止网络闪断或 Supabase Auth 故障时导致整个中间件抛出未捕获异常返回 500/502
    let user = null;
    try {
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
    } catch (authError) {
        console.warn("[Middleware] Auth token check error:", authError);
    }

    // 1. 已登录用户访问登录/注册页面时，平滑重定向到 /dashboard
    if (user && (pathname === "/login" || pathname === "/register")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
    }

    // 2. 未登录游客直接在地址栏敲入受保护路由（如 /dashboard, /friends, /messages, /settings 等）
    // 在中间件第一道防线直接以 <5ms 极速拦截并 307 重定向到 /login，彻底杜绝请求穿透到服务端组件引发的 Layout 与 Page 并发竞态冲突与 502 崩溃！
    if (!user && !isPublicRoute(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        if (pathname !== "/" && pathname !== "/dashboard") {
            url.searchParams.set("redirectedFrom", pathname);
        }
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
    }

    return supabaseResponse;
}
