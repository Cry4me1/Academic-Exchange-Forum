import { eachDayOfInterval, format, subDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface HeatmapDayDetail {
    count: number;
    posts: number;
    comments: number;
    others: number;
}

export interface YearActivityBreakdown {
    total: number;
    posts: number;
    comments: number;
    others: number;
    activeDays: number;
}

export interface DomainRadarItem {
    subject: string;
    total: number;
    creation: number;
    postsCount: number;
    commentsCount: number;
    likesCount: number;
    totalSharePercent: number;
    creationSharePercent: number;
}

export interface ScholarAnalyticsData {
    lastSeenAt: string | null;
    showOnlineStatus: boolean;
    heatmapMap: Record<string, HeatmapDayDetail>;
    yearBreakdown: YearActivityBreakdown;
    currentStreak: number;
    longestStreak: number;
    longestRangeLabel: string | null;
    hourlyCounts: number[];
    totalHourlyEvents: number;
    peakPeriodLabel: string | null;
    personaLabel: string | null;
    peakSharePercent: number;
    isNightPeak: boolean;
    domains: DomainRadarItem[];
    hasDomainData: boolean;
}

const TAG_ZH_MAP: Record<string, string> = {
    "Computer Science": "计算机",
    "computer science": "计算机",
    AI: "人工智能",
    ai: "人工智能",
    "Artificial Intelligence": "人工智能",
    Mathematics: "数学",
    mathematics: "数学",
    Math: "数学",
    Physics: "物理",
    physics: "物理",
    Biology: "生物",
    biology: "生物",
    Chemistry: "化学",
    chemistry: "化学",
    Engineering: "工程",
    engineering: "工程",
    Economics: "经济",
    economics: "经济",
    Philosophy: "哲学",
    philosophy: "哲学",
};

const DEFAULT_RADAR_AXES = ["计算机", "人工智能", "数学", "物理", "工程", "哲学"];

export function toShortChineseDomain(rawTag: string): string {
    const trimmed = rawTag.trim();
    if (TAG_ZH_MAP[trimmed]) {
        return TAG_ZH_MAP[trimmed];
    }
    return trimmed.length > 5 ? `${trimmed.slice(0, 4)}…` : trimmed;
}

/**
 * 格式化极简中文离线相对时间（如 "12 分钟前在线" / "昨天在线"）
 */
export function formatLastSeenShort(isoString: string | null | undefined): string | null {
    if (!isoString) return null;
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return null;

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 2) return "刚刚在线";
    if (diffMin < 60) return `${diffMin} 分钟前在线`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} 小时前在线`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "昨天在线";
    if (diffDays < 7) return `${diffDays} 天前在线`;

    if (date.getFullYear() === now.getFullYear()) {
        return `${date.getMonth() + 1}月${date.getDate()}日在线`;
    }
    return `${date.getFullYear()}年${date.getMonth() + 1}月在线`;
}

/**
 * 格式化完整中文精确时间（用于悬浮提示框）
 */
export function formatExactDateTime(isoString: string | null | undefined): string | null {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return null;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 计算近 365 天的汇总构成、当前连续活跃天数、历史最长连续天数及起止日期
 */
export function computeActivityStreaks(heatmapMap: Record<string, HeatmapDayDetail>): {
    yearBreakdown: YearActivityBreakdown;
    currentStreak: number;
    longestStreak: number;
    longestRangeLabel: string | null;
} {
    const today = new Date();
    const start = subDays(today, 364);
    const days = eachDayOfInterval({ start, end: today });

    let total = 0;
    let posts = 0;
    let comments = 0;
    let others = 0;
    let activeDays = 0;

    let longestStreak = 0;
    let longestStartDate: Date | null = null;
    let longestEndDate: Date | null = null;

    let runningStreak = 0;
    let runningStartDate: Date | null = null;

    for (const d of days) {
        const key = format(d, "yyyy-MM-dd");
        const detail = heatmapMap[key];
        const c = detail?.count || 0;

        if (c > 0) {
            total += c;
            posts += detail?.posts || 0;
            comments += detail?.comments || 0;
            others += detail?.others || 0;
            activeDays += 1;

            if (runningStreak === 0) {
                runningStartDate = d;
            }
            runningStreak += 1;
            if (runningStreak >= longestStreak) {
                longestStreak = runningStreak;
                longestStartDate = runningStartDate;
                longestEndDate = d;
            }
        } else {
            runningStreak = 0;
            runningStartDate = null;
        }
    }

    let longestRangeLabel: string | null = null;
    if (longestStreak > 0 && longestStartDate && longestEndDate) {
        const fmtMd = (dt: Date) => `${dt.getMonth() + 1}月${dt.getDate()}日`;
        longestRangeLabel =
            longestStreak === 1
                ? fmtMd(longestStartDate)
                : `${fmtMd(longestStartDate)} - ${fmtMd(longestEndDate)}`;
    }

    // 计算当前连续活跃：若今天有活跃则从今天倒推，否则从昨天倒推
    let currentStreak = 0;
    const todayKey = format(today, "yyyy-MM-dd");
    const startOffset = (heatmapMap[todayKey]?.count || 0) > 0 ? 0 : 1;

    for (let i = days.length - 1 - startOffset; i >= 0; i--) {
        const key = format(days[i], "yyyy-MM-dd");
        if ((heatmapMap[key]?.count || 0) > 0) {
            currentStreak += 1;
        } else {
            break;
        }
    }

    return {
        yearBreakdown: {
            total,
            posts,
            comments,
            others,
            activeDays,
        },
        currentStreak,
        longestStreak,
        longestRangeLabel,
    };
}

/**
 * 基于 24 小时活跃分布计算 3 小时常活跃时段、活跃画像标签及占比
 */
export function computePeakPeriodAndPersona(hourlyCounts: number[]): {
    peakPeriodLabel: string | null;
    personaLabel: string | null;
    peakSharePercent: number;
    totalHourlyEvents: number;
    isNightPeak: boolean;
} {
    if (!hourlyCounts || hourlyCounts.length !== 24) {
        return {
            peakPeriodLabel: null,
            personaLabel: null,
            peakSharePercent: 0,
            totalHourlyEvents: 0,
            isNightPeak: false,
        };
    }

    const sumAll = hourlyCounts.reduce((a, b) => a + b, 0);
    if (sumAll <= 0) {
        return {
            peakPeriodLabel: null,
            personaLabel: null,
            peakSharePercent: 0,
            totalHourlyEvents: 0,
            isNightPeak: false,
        };
    }

    let bestStart = 0;
    let bestWindowSum = -1;
    for (let h = 0; h < 24; h++) {
        const windowSum =
            hourlyCounts[h] +
            hourlyCounts[(h + 1) % 24] +
            hourlyCounts[(h + 2) % 24];
        if (windowSum > bestWindowSum) {
            bestWindowSum = windowSum;
            bestStart = h;
        }
    }

    const endHourRaw = (bestStart + 3) % 24;
    const startStr = `${String(bestStart).padStart(2, "0")}:00`;
    const endStr =
        endHourRaw === 0 && bestStart === 21
            ? "24:00"
            : `${String(endHourRaw).padStart(2, "0")}:00`;

    const centerHour = (bestStart + 1) % 24;
    const isNightPeak = centerHour >= 19 || centerHour < 6;

    let personaLabel = "日间活跃";
    if (centerHour >= 5 && centerHour < 9) {
        personaLabel = "清晨活跃";
    } else if (centerHour >= 9 && centerHour < 12) {
        personaLabel = "上午活跃";
    } else if (centerHour >= 12 && centerHour < 15) {
        personaLabel = "午间活跃";
    } else if (centerHour >= 15 && centerHour < 19) {
        personaLabel = "午后活跃";
    } else if (centerHour >= 19 && centerHour < 23) {
        personaLabel = "晚间活跃";
    } else {
        personaLabel = "深夜活跃";
    }

    const peakSharePercent = Math.min(100, Math.max(1, Math.round((bestWindowSum / sumAll) * 100)));

    return {
        peakPeriodLabel: `${startStr} - ${endStr}`,
        personaLabel,
        peakSharePercent,
        totalHourlyEvents: sumAll,
        isNightPeak,
    };
}

interface RawDomainInput {
    tag: string;
    posts_count?: number;
    comments_count?: number;
    likes_count?: number;
    creation: number;
    total: number;
}

/**
 * 归一化生成标准 6 维雷达图数据，并附带真实可读的发帖/评论/点赞次数与百分比占比
 */
export function buildRadarDomains(rawDomains: RawDomainInput[]): {
    domains: DomainRadarItem[];
    hasDomainData: boolean;
} {
    const mergedMap = new Map<
        string,
        {
            postsCount: number;
            commentsCount: number;
            likesCount: number;
            creation: number;
            total: number;
        }
    >();

    for (const item of rawDomains) {
        if (!item.tag) continue;
        const label = toShortChineseDomain(item.tag);
        const prev = mergedMap.get(label) || {
            postsCount: 0,
            commentsCount: 0,
            likesCount: 0,
            creation: 0,
            total: 0,
        };
        mergedMap.set(label, {
            postsCount: prev.postsCount + Number(item.posts_count || 0),
            commentsCount: prev.commentsCount + Number(item.comments_count || 0),
            likesCount: prev.likesCount + Number(item.likes_count || 0),
            creation: prev.creation + Number(item.creation || 0),
            total: prev.total + Number(item.total || 0),
        });
    }

    const sortedEntries = Array.from(mergedMap.entries()).sort(
        (a, b) => b[1].total - a[1].total || b[1].creation - a[1].creation
    );

    const sumAllTotalScore = sortedEntries.reduce((acc, [, v]) => acc + v.total, 0);
    const sumAllCreationScore = sortedEntries.reduce((acc, [, v]) => acc + v.creation, 0);
    const hasDomainData = sumAllTotalScore > 0;

    const chosen = sortedEntries.slice(0, 6);
    for (const fallbackAxis of DEFAULT_RADAR_AXES) {
        if (chosen.length >= 6) break;
        if (!chosen.some(([k]) => k === fallbackAxis)) {
            chosen.push([
                fallbackAxis,
                { postsCount: 0, commentsCount: 0, likesCount: 0, creation: 0, total: 0 },
            ]);
        }
    }

    const maxTotal = Math.max(1, ...chosen.map(([, v]) => v.total));
    const maxCreation = Math.max(1, ...chosen.map(([, v]) => v.creation));

    const scaleSmooth = (val: number, maxVal: number) => {
        if (val <= 0) return 0;
        const ratio = Math.log1p(val) / Math.log1p(maxVal);
        return Math.min(100, Math.max(16, Math.round(ratio * 84 + 16)));
    };

    const domains: DomainRadarItem[] = chosen.map(([subject, val]) => ({
        subject,
        total: scaleSmooth(val.total, maxTotal),
        creation: scaleSmooth(val.creation, maxCreation),
        postsCount: val.postsCount,
        commentsCount: val.commentsCount,
        likesCount: val.likesCount,
        totalSharePercent:
            sumAllTotalScore > 0 ? Math.round((val.total / sumAllTotalScore) * 100) : 0,
        creationSharePercent:
            sumAllCreationScore > 0 ? Math.round((val.creation / sumAllCreationScore) * 100) : 0,
    }));

    return { domains, hasDomainData };
}

function getShanghaiDateAndHour(iso: string): { dateKey: string; hour: number } | null {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const utcMs = d.getTime() + d.getTimezoneOffset() * 60_000;
    const shanghai = new Date(utcMs + 8 * 3600_000);
    const y = shanghai.getFullYear();
    const m = String(shanghai.getMonth() + 1).padStart(2, "0");
    const day = String(shanghai.getDate()).padStart(2, "0");
    return {
        dateKey: `${y}-${m}-${day}`,
        hour: shanghai.getHours(),
    };
}

/**
 * 双轨获取学者多元数据：
 * 1. 优先通过最新版 `get_scholar_profile_analytics` RPC 单次获取含细分明细的数据；
 * 2. 若远端尚未执行或仍处于旧版无细分字段的 RPC，自动走标准表精确聚合，确保悬浮框始终展示真实篇数与明细。
 */
export async function fetchScholarAnalytics(
    supabase: SupabaseClient,
    targetUserId: string,
    isOwner: boolean
): Promise<ScholarAnalyticsData> {
    try {
        const { data, error } = await supabase.rpc("get_scholar_profile_analytics", {
            p_target_user_id: targetUserId,
        });

        // 校验是否为包含细分计数的新版 RPC 返回结构
        const hasNewDomainCounts =
            !Array.isArray(data?.domains) ||
            data.domains.length === 0 ||
            typeof data.domains[0].posts_count === "number";
        const hasNewHeatmapBreakdown =
            !Array.isArray(data?.heatmap) ||
            data.heatmap.length === 0 ||
            typeof data.heatmap[0].posts === "number";

        if (!error && data && hasNewDomainCounts && hasNewHeatmapBreakdown) {
            const heatmapMap: Record<string, HeatmapDayDetail> = {};
            if (Array.isArray(data.heatmap)) {
                for (const row of data.heatmap) {
                    if (row?.date && typeof row.count === "number") {
                        heatmapMap[row.date] = {
                            count: row.count,
                            posts: Number(row.posts || 0),
                            comments: Number(row.comments || 0),
                            others: Number(row.others || 0),
                        };
                    }
                }
            }

            const hourlyCounts: number[] =
                Array.isArray(data.hourly) && data.hourly.length === 24
                    ? data.hourly.map((n: unknown) => Number(n) || 0)
                    : new Array(24).fill(0);

            const { yearBreakdown, currentStreak, longestStreak, longestRangeLabel } =
                computeActivityStreaks(heatmapMap);
            const {
                peakPeriodLabel,
                personaLabel,
                peakSharePercent,
                totalHourlyEvents,
                isNightPeak,
            } = computePeakPeriodAndPersona(hourlyCounts);
            const { domains, hasDomainData } = buildRadarDomains(
                Array.isArray(data.domains) ? data.domains : []
            );

            return {
                lastSeenAt: data.last_seen_at || null,
                showOnlineStatus: data.show_online_status !== false,
                heatmapMap,
                yearBreakdown,
                currentStreak,
                longestStreak,
                longestRangeLabel,
                hourlyCounts,
                totalHourlyEvents,
                peakPeriodLabel,
                personaLabel,
                peakSharePercent,
                isNightPeak,
                domains,
                hasDomainData,
            };
        }
    } catch {
        // 静默进入客户端细分聚合通道
    }

    // === 客户端标准表精确细分聚合通道 ===
    const sinceIso = subDays(new Date(), 375).toISOString();

    const [postsRes, commentsRes, likesRes, profileRes] = await Promise.all([
        supabase
            .from("posts")
            .select("created_at, tags, is_published, is_hidden, review_status")
            .eq("author_id", targetUserId),
        supabase
            .from("comments")
            .select("created_at, post:posts(tags, is_published, is_hidden)")
            .eq("author_id", targetUserId)
            .gte("created_at", sinceIso),
        supabase
            .from("likes")
            .select("created_at, post:posts(tags, is_published, is_hidden)")
            .eq("user_id", targetUserId)
            .limit(200),
        supabase
            .from("profiles")
            .select("*")
            .eq("id", targetUserId)
            .maybeSingle(),
    ]);

    const heatmapMap: Record<string, HeatmapDayDetail> = {};
    const hourlyCounts = new Array<number>(24).fill(0);
    const domainAccum = new Map<
        string,
        {
            posts_count: number;
            comments_count: number;
            likes_count: number;
            creation: number;
            total: number;
        }
    >();
    let latestTimestampMs = 0;

    const recordTimestamp = (iso?: string | null) => {
        if (!iso) return;
        const ms = new Date(iso).getTime();
        if (!Number.isNaN(ms) && ms > latestTimestampMs) {
            latestTimestampMs = ms;
        }
    };

    const bumpDay = (dateKey: string, kind: "posts" | "comments" | "others") => {
        const cur = heatmapMap[dateKey] || { count: 0, posts: 0, comments: 0, others: 0 };
        cur.count += 1;
        cur[kind] += 1;
        heatmapMap[dateKey] = cur;
    };

    const bumpDomain = (
        tags: unknown,
        pDelta: number,
        cDelta: number,
        lDelta: number,
        cWeight: number,
        tWeight: number
    ) => {
        if (!Array.isArray(tags)) return;
        for (const t of tags) {
            if (typeof t === "string" && t.trim()) {
                const key = t.trim();
                const prev = domainAccum.get(key) || {
                    posts_count: 0,
                    comments_count: 0,
                    likes_count: 0,
                    creation: 0,
                    total: 0,
                };
                domainAccum.set(key, {
                    posts_count: prev.posts_count + pDelta,
                    comments_count: prev.comments_count + cDelta,
                    likes_count: prev.likes_count + lDelta,
                    creation: prev.creation + cWeight,
                    total: prev.total + tWeight,
                });
            }
        }
    };

    for (const p of postsRes.data || []) {
        if (
            p.is_published === false ||
            p.is_hidden === true ||
            (p.review_status && p.review_status !== "approved")
        ) {
            continue;
        }
        recordTimestamp(p.created_at);
        const parsed = getShanghaiDateAndHour(p.created_at);
        if (parsed) {
            if (p.created_at >= sinceIso) {
                bumpDay(parsed.dateKey, "posts");
            }
            hourlyCounts[parsed.hour] += 1;
        }
        bumpDomain(p.tags, 1, 0, 0, 3, 3);
    }

    for (const c of (commentsRes.data as any[]) || []) {
        recordTimestamp(c.created_at);
        const parsed = getShanghaiDateAndHour(c.created_at);
        if (parsed) {
            bumpDay(parsed.dateKey, "comments");
            hourlyCounts[parsed.hour] += 1;
        }
        const postObj = Array.isArray(c.post) ? c.post[0] : c.post;
        if (postObj && postObj.is_published !== false && postObj.is_hidden !== true) {
            bumpDomain(postObj.tags, 0, 1, 0, 1.5, 2);
        }
    }

    for (const l of (likesRes.data as any[]) || []) {
        recordTimestamp(l.created_at);
        const postObj = Array.isArray(l.post) ? l.post[0] : l.post;
        if (postObj && postObj.is_published !== false && postObj.is_hidden !== true) {
            bumpDomain(postObj.tags, 0, 0, 1, 0, 1);
        }
    }

    const profileRow: any = profileRes.data;
    const showOnlineStatus = profileRow?.show_online_status !== false;
    const rawLastSeen =
        profileRow?.last_seen_at ||
        (latestTimestampMs > 0
            ? new Date(latestTimestampMs).toISOString()
            : profileRow?.created_at || null);

    const { yearBreakdown, currentStreak, longestStreak, longestRangeLabel } =
        computeActivityStreaks(heatmapMap);
    const {
        peakPeriodLabel,
        personaLabel,
        peakSharePercent,
        totalHourlyEvents,
        isNightPeak,
    } = computePeakPeriodAndPersona(hourlyCounts);

    const rawDomainsList: RawDomainInput[] = Array.from(domainAccum.entries()).map(
        ([tag, v]) => ({
            tag,
            posts_count: v.posts_count,
            comments_count: v.comments_count,
            likes_count: v.likes_count,
            creation: v.creation,
            total: v.total,
        })
    );
    const { domains, hasDomainData } = buildRadarDomains(rawDomainsList);

    return {
        lastSeenAt: isOwner || showOnlineStatus ? rawLastSeen : null,
        showOnlineStatus,
        heatmapMap,
        yearBreakdown,
        currentStreak,
        longestStreak,
        longestRangeLabel,
        hourlyCounts,
        totalHourlyEvents,
        peakPeriodLabel,
        personaLabel,
        peakSharePercent,
        isNightPeak,
        domains,
        hasDomainData,
    };
}
