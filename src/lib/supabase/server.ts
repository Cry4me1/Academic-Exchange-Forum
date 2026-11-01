import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";

export function createPublicClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * 服务端 Supabase Client：
 * 采用 React.cache() 针对单次请求生命周期实现单例复用，并在单例上记忆化 getUser 结果，
 * 彻底消除在同一个 SSR 请求周期内从 Layout、Page 到 Server Actions 产生的重复鉴权瀑布流网络开销。
 */
export const createClient = cache(async () => {
    const cookieStore = await cookies();

    const client = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    // 单次请求内记忆化复用 getUser 结果，杜绝 Layout 与 Page 串行发起重复鉴权网络调用
    const originalGetUser = client.auth.getUser.bind(client.auth);
    let cachedUserPromise: ReturnType<typeof originalGetUser> | null = null;
    client.auth.getUser = ((jwt?: string) => {
        if (!jwt) {
            if (!cachedUserPromise) {
                cachedUserPromise = originalGetUser();
            }
            return cachedUserPromise;
        }
        return originalGetUser(jwt);
    }) as typeof client.auth.getUser;

    return client;
});
