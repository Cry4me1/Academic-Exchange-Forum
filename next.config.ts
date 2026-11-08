import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  serverExternalPackages: ["@supabase/ssr"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    // 使用更高效的图片格式
    formats: ["image/avif", "image/webp"],
    // 优化图片尺寸断点
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // 30天图片缓存
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // 启用压缩
  compress: true,

  // 生产环境移除 console.log (减小 bundle)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // 包体积优化 - tree-shake 大型依赖
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-avatar",
      "@tiptap/react",
      "@tiptap/core",
    ],
  },

  // 重定向：兼容 /rule -> /rules 以及 /tutorials -> /announcements/tutorials
  async redirects() {
    return [
      {
        source: "/rule",
        destination: "/rules",
        permanent: true,
      },
      {
        source: "/tutorials",
        destination: "/announcements/tutorials",
        permanent: true,
      },
      {
        source: "/tutorial",
        destination: "/announcements/tutorials",
        permanent: true,
      },
    ];
  },

  // 同源反向代理：将 /supabase-api 请求转发至 Supabase 官方后端，消除浏览器端跨域预检 (CORS OPTIONS) 与跨海直连丢包
  async rewrites() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) return [];

    return [
      {
        source: "/supabase-api/:path*",
        destination: `${supabaseUrl}/:path*`,
      },
    ];
  },

  // 自定义响应头 - 安全标头 + 字体长缓存 + DNS 预解析
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // 字体文件 1 年不可变缓存
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              // 静态资源长缓存（仅生产环境；开发环境 chunk 无哈希，immutable 会锁死旧缓存导致 Hydration 报错）
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : [
            {
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "no-store, must-revalidate",
                },
              ],
            },
          ]),
    ];
  },
};

export default nextConfig;
