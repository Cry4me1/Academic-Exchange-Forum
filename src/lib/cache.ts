import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import { buildLandingShowcase, type LandingShowcase, type RawLandingPost } from "@/lib/landing-showcase";
import type { RegistrationMode } from "@/lib/invite/service";

/**
 * 缓存热门帖子列表 — 5 分钟刷新
 * 避免每个用户都独立查询东京数据库
 */
export const getCachedTrendingPosts = unstable_cache(
  async (sortBy: string = "hot", limit: number = 30) => {
    const supabase = createPublicClient();

    const orderColumn = sortBy === "likes" ? "like_count" : "view_count";

    let query = supabase
      .from("posts")
      .select(
        `
        id, title, content, tags, created_at, view_count, like_count, comment_count,
        author:profiles!author_id (id, username, avatar_url)
      `
      )
      .eq("is_published", true)
      .eq("is_hidden", false);

    // 过滤专栏中设置“主页仅展示导读文章”的后续篇章
    try {
      const { data: excludedRows } = await supabase.rpc("get_feed_excluded_collection_post_ids");
      const excludedIds = (excludedRows || []).map((r: any) => r.post_id).filter(Boolean);
      if (excludedIds.length > 0) {
        query = query.not("id", "in", `(${excludedIds.join(",")})`);
      }
    } catch {
      // 容错降级
    }

    const { data, error } = await query
      .order(orderColumn, { ascending: false })
      .order("like_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getCachedTrendingPosts error:", error);
      return [];
    }

    if (sortBy === "hot" && data) {
      return data
        .map((post) => ({
          ...post,
          hotScore:
            (post.view_count || 0) * 1 +
            (post.like_count || 0) * 5 +
            (post.comment_count || 0) * 3,
        }))
        .sort(
          (a, b) =>
            (b as { hotScore: number }).hotScore -
            (a as { hotScore: number }).hotScore
        );
    }

    return data || [];
  },
  ["trending-posts"],
  { revalidate: 300, tags: ["trending"] }
);

/**
 * 缓存最新帖子 Feed — 1 分钟刷新
 */
export const getCachedLatestPosts = unstable_cache(
  async (limit: number = 20) => {
    const supabase = createPublicClient();

    let query = supabase
      .from("posts")
      .select(
        `
        id, title, content, tags, created_at, updated_at,
        view_count, like_count, comment_count,
        author:profiles!author_id (id, username, avatar_url, special_title, badges)
      `
      )
      .eq("is_published", true)
      .eq("is_hidden", false);

    // 过滤专栏中设置“主页仅展示导读文章”的后续篇章
    try {
      const { data: excludedRows } = await supabase.rpc("get_feed_excluded_collection_post_ids");
      const excludedIds = (excludedRows || []).map((r: any) => r.post_id).filter(Boolean);
      if (excludedIds.length > 0) {
        query = query.not("id", "in", `(${excludedIds.join(",")})`);
      }
    } catch {
      // 容错降级
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getCachedLatestPosts error:", error);
      return [];
    }

    return data || [];
  },
  ["latest-posts"],
  { revalidate: 60, tags: ["posts"] }
);

/**
 * 缓存公告 — 5 分钟刷新
 */
export const getCachedAnnouncements = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    return data || [];
  },
  ["announcements-v2.0.0"],
  { revalidate: 60, tags: ["announcements"] }
);

/**
 * 缓存热门标签 — 10 分钟刷新
 */
export const getCachedPopularTags = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    // 从 posts 表聚合标签
    const { data: posts } = await supabase
      .from("posts")
      .select("tags")
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!posts) return [];

    // 统计标签频次
    const tagCount: Record<string, number> = {};
    posts.forEach((post) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  },
  ["popular-tags"],
  { revalidate: 600, tags: ["tags"] }
);

/**
 * 缓存热门帖子列表（首页 StoryBanner）— 10 分钟刷新
 */
export const getCachedFeaturedPosts = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    const { data } = await supabase
      .from("posts")
      .select(
        `
        id, title, tags, created_at, view_count, like_count,
        author:profiles!author_id (id, username, avatar_url)
      `
      )
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order("like_count", { ascending: false })
      .limit(6);

    return data || [];
  },
  ["featured-posts"],
  { revalidate: 600, tags: ["posts"] }
);

/**
 * 缓存 Landing 统计数据 — 5 分钟刷新
 * 优先调用数据库端聚合 RPC `get_landing_stats`，未执行迁移时自动并行降级查询。
 */
export const getCachedStats = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    try {
      const { data: rpcRows, error: rpcError } = await supabase.rpc("get_landing_stats");
      const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
      if (!rpcError && row) {
        return {
          postsCount: Number(row.posts_count) || 0,
          tagsCount: Number(row.tags_count) || 0,
          usersCount: Number(row.users_count) || 0,
        };
      }
    } catch {
      // 迁移尚未执行时平滑回退至并行查询
    }

    const [{ count: postCount }, { data: posts }, { count: usersCount }] = await Promise.all([
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .eq("is_hidden", false),
      supabase
        .from("posts")
        .select("tags")
        .eq("is_published", true)
        .eq("is_hidden", false),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
    ]);

    const tagsSet = new Set<string>();
    posts?.forEach((post) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => tagsSet.add(tag));
      }
    });

    return {
      postsCount: postCount || 0,
      tagsCount: tagsSet.size || 0,
      usersCount: usersCount || 0,
    };
  },
  ["landing-stats-v2"],
  { revalidate: 300, tags: ["stats"] }
);

/**
 * 缓存 Landing 真实帖子精选（Hero 精选卡 + Features 跑马灯）— 5 分钟刷新
 * 正文解析在缓存内完成，缓存与首屏 payload 中只保留精简字段。
 */
export const getCachedLandingShowcase = unstable_cache(
  async (): Promise<LandingShowcase> => {
    const supabase = createPublicClient();

    let query = supabase
      .from("posts")
      .select(
        `
        id, title, content, tags, view_count, like_count, comment_count,
        author:profiles!author_id (id, username, avatar_url, special_title)
      `
      )
      .eq("is_published", true)
      .eq("is_hidden", false);

    // 过滤专栏中设置“主页仅展示导读文章”的后续篇章
    try {
      const { data: excludedRows } = await supabase.rpc("get_feed_excluded_collection_post_ids");
      const excludedIds = ((excludedRows || []) as { post_id?: string }[])
        .map((r) => r.post_id)
        .filter(Boolean);
      if (excludedIds.length > 0) {
        query = query.not("id", "in", `(${excludedIds.join(",")})`);
      }
    } catch {
      // 容错降级
    }

    const { data, error } = await query
      .order("view_count", { ascending: false })
      .order("like_count", { ascending: false })
      .limit(40);

    if (error) {
      console.error("getCachedLandingShowcase error:", error);
      return { heroPosts: [], showcasePosts: [] };
    }

    return buildLandingShowcase((data || []) as RawLandingPost[]);
  },
  ["landing-showcase-v1"],
  { revalidate: 300, tags: ["trending", "posts"] }
);


/**
 * 缓存系统注册准入模式（供 Landing 落地页无 Cookie 静态渲染使用）
 * 后台修改设置时会通过 revalidateTag("system-settings") 立即失效刷新。
 */
export const getCachedRegistrationMode = unstable_cache(
  async (): Promise<RegistrationMode> => {
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "registration_mode")
        .maybeSingle();

      if (error || !data || !data.value) {
        return "INVITE_ONLY";
      }

      const mode =
        typeof data.value === "string"
          ? data.value
          : JSON.parse(JSON.stringify(data.value));

      if (["OPEN", "INVITE_ONLY", "CLOSED"].includes(mode)) {
        return mode as RegistrationMode;
      }

      return "INVITE_ONLY";
    } catch {
      return "INVITE_ONLY";
    }
  },
  ["system-registration-mode-v1"],
  { revalidate: 60, tags: ["system-settings"] }
);
