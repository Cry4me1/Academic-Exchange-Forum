import { createBrowserClient } from "@supabase/ssr";

let clientSingleton: ReturnType<typeof createBrowserClient> | null = null;

/**
 * 专线同源 fetch 代理：
 * 在浏览器环境下将发往 Supabase 官方域名的 REST/Auth 请求重写至同源专线 `/supabase-api`，
 * 彻底消灭浏览器的跨域 OPTIONS 预检请求（消灭 12+ 次多余网络 RTT 往返），
 * 同时入参保留真实的 NEXT_PUBLIC_SUPABASE_URL，确保 Cookie storageKey (`sb-${projectRef}-auth-token`)
 * 与服务端 SSR Client 保持 100% 绝对一致，杜绝任何鉴权状态丢失与不同步问题。
 */
const customFetch: typeof fetch = (input, init) => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
        if (typeof input === "string" && input.startsWith(supabaseUrl)) {
            const rewritten = input.replace(supabaseUrl, "/supabase-api");
            return fetch(rewritten, init);
        }
        if (input instanceof URL && input.href.startsWith(supabaseUrl)) {
            const rewritten = input.href.replace(supabaseUrl, "/supabase-api");
            return fetch(rewritten, init);
        }
        if (typeof Request !== "undefined" && input instanceof Request && input.url.startsWith(supabaseUrl)) {
            const rewritten = input.url.replace(supabaseUrl, "/supabase-api");
            return fetch(new Request(rewritten, input), init);
        }
    }
    return fetch(input, init);
};

export function createClient() {
    if (!clientSingleton) {
        clientSingleton = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    fetch: customFetch,
                },
            }
        );
    }
    return clientSingleton;
}
