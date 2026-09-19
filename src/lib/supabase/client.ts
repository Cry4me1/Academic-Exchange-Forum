import { createBrowserClient } from "@supabase/ssr";

let clientSingleton: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!clientSingleton) {
    // 浏览器环境下如果运行在 scholarly.wiki 生产域名，自动走同源 /supabase-api 专线：
    // 1. 同源请求彻底消除浏览器的 CORS OPTIONS 预检请求（消除 12+ 次多余网络往返）
    // 2. 享受香港三网优化专线加速，避免国内直连境外 Supabase 丢包
    const isProductionCustomDomain =
      typeof window !== "undefined" &&
      window.location.hostname.includes("scholarly.wiki");

    const supabaseUrl = isProductionCustomDomain
      ? `${window.location.origin}/supabase-api`
      : process.env.NEXT_PUBLIC_SUPABASE_URL!;

    clientSingleton = createBrowserClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return clientSingleton;
}
