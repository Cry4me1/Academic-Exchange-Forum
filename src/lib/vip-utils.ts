// 学者等级定义与工具函数 (Scholar Level Utilities)
// 遵循 Apple Liquid Glass 规范：纯净中性底质、纯无色菲涅尔内高光、严禁深色科技渐变色与霓虹色

export interface ScholarLevelInfo {
    level: number
    name: string
    title: string            // 称号（Lv1 ~ Lv6）
    minExp: number           // 所需综合学术经验值
    minPosts: number         // 最低有效发帖数 (PQS >= 60)
    minLikes: number         // 最低累计获赞数
    minContributions: number // 最低同行共建数 (采纳+评审+对决)
    monthlyBonus: number     // 每月学者研讨津贴 (Credits)
    perks: string[]          // 特权描述列表
    minSpent?: number        // 兼容旧字段
    
    // 纯中性 Apple Liquid Glass 光学视觉样式 (无深色科技渐变)
    color: string            // 文字颜色 (中性黑白灰)
    bgClass: string          // 通透毛玻璃底质
    insetLight: string       // 菲涅尔顶光
    softShadow: string       // 环境漫反射
    capsuleText: string      // 水滴文字排版
}

// 兼容别名
export type VipLevelInfo = ScholarLevelInfo

// 统一白底、彩字配置 (Lv1 ~ Lv6 彩字按等级划分，最高级 Lv6 必须为红色)
const LEVEL_STYLES: Record<number, Pick<ScholarLevelInfo, 'color' | 'bgClass' | 'insetLight' | 'softShadow' | 'capsuleText'>> = {
    1: {
        color: 'text-zinc-600',
        bgClass: 'bg-white',
        insetLight: 'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95)]',
        softShadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        capsuleText: 'font-mono font-bold',
    },
    2: {
        color: 'text-emerald-600',
        bgClass: 'bg-white',
        insetLight: 'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95)]',
        softShadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        capsuleText: 'font-mono font-bold',
    },
    3: {
        color: 'text-sky-600',
        bgClass: 'bg-white',
        insetLight: 'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95)]',
        softShadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        capsuleText: 'font-mono font-bold',
    },
    4: {
        color: 'text-violet-600',
        bgClass: 'bg-white',
        insetLight: 'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95)]',
        softShadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        capsuleText: 'font-mono font-bold',
    },
    5: {
        color: 'text-amber-600',
        bgClass: 'bg-white',
        insetLight: 'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95)]',
        softShadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        capsuleText: 'font-mono font-bold',
    },
    6: {
        color: 'text-red-600', // 最高级红色
        bgClass: 'bg-white',
        insetLight: 'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95)]',
        softShadow: 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        capsuleText: 'font-mono font-bold',
    },
}

// 默认标准学者等级配置 (Lv1 ~ Lv6)
export const DEFAULT_SCHOLAR_LEVELS: ScholarLevelInfo[] = [
    {
        level: 1,
        name: 'Lv1',
        title: 'Lv1',
        minExp: 0,
        minPosts: 0,
        minLikes: 0,
        minContributions: 0,
        monthlyBonus: 100,
        minSpent: 0,
        perks: ['基础学术浏览与交流', '常规发帖与评论', '月度研讨津贴 100 积分'],
        ...LEVEL_STYLES[1],
    },
    {
        level: 2,
        name: 'Lv2',
        title: 'Lv2',
        minExp: 100,
        minPosts: 2,
        minLikes: 5,
        minContributions: 0,
        monthlyBonus: 180,
        minSpent: 0,
        perks: ['解锁学术对决预测质押', '解锁边缘学术批注权限', '月度研讨津贴 180 积分'],
        ...LEVEL_STYLES[2],
    },
    {
        level: 3,
        name: 'Lv3',
        title: 'Lv3',
        minExp: 400,
        minPosts: 8,
        minLikes: 30,
        minContributions: 1,
        monthlyBonus: 280,
        minSpent: 0,
        perks: ['解锁帖子历史版本追溯对比', '解锁撰写同行评审资格', '月度研讨津贴 280 积分'],
        ...LEVEL_STYLES[3],
    },
    {
        level: 4,
        name: 'Lv4',
        title: 'Lv4',
        minExp: 1200,
        minPosts: 20,
        minLikes: 120,
        minContributions: 5,
        monthlyBonus: 420,
        minSpent: 0,
        perks: ['解锁深度推理思考链通道', '优质解答专享流光高亮', '解锁创建协作实验室', '月度研讨津贴 420 积分'],
        ...LEVEL_STYLES[4],
    },
    {
        level: 5,
        name: 'Lv5',
        title: 'Lv5',
        minExp: 3000,
        minPosts: 40,
        minLikes: 350,
        minContributions: 15,
        monthlyBonus: 600,
        minSpent: 0,
        perks: ['同行评审 1.5 倍权威系数', '专属黑曜石液态玻璃名牌', '月度研讨津贴 600 积分'],
        ...LEVEL_STYLES[5],
    },
    {
        level: 6,
        name: 'Lv6',
        title: 'Lv6',
        minExp: 8000,
        minPosts: 80,
        minLikes: 1000,
        minContributions: 35,
        monthlyBonus: 1000,
        minSpent: 0,
        perks: ['全站顶峰学术荣誉标牌', '全息流光粒子勋章', '月度研讨津贴 1000 积分'],
        ...LEVEL_STYLES[6],
    },
]

// 兼容别名导出
export const VIP_LEVELS = DEFAULT_SCHOLAR_LEVELS
export const DEFAULT_VIP_LEVELS = DEFAULT_SCHOLAR_LEVELS

let _cachedLevels: ScholarLevelInfo[] | null = null
let _cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟缓存

/**
 * 从数据库加载学者等级配置
 */
export async function loadVipLevelsFromDB(): Promise<ScholarLevelInfo[]> {
    const now = Date.now()
    if (_cachedLevels && (now - _cacheTimestamp) < CACHE_TTL) {
        return _cachedLevels
    }

    try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase
            .from('vip_level_config')
            .select('*')
            .eq('is_active', true)
            .order('level', { ascending: true })

        if (error || !data || data.length === 0) {
            return DEFAULT_SCHOLAR_LEVELS
        }

        const levels: ScholarLevelInfo[] = data.map((row: any) => ({
            level: row.level,
            name: row.name || `Lv${row.level}`,
            title: row.title || `Lv${row.level}`,
            minExp: row.min_exp ?? 0,
            minPosts: row.min_posts ?? 0,
            minLikes: row.min_likes ?? 0,
            minContributions: row.min_contributions ?? 0,
            monthlyBonus: Number(row.monthly_bonus ?? 100),
            minSpent: Number(row.min_spent ?? 0),
            perks: Array.isArray(row.perks) ? row.perks : [],
            ...(LEVEL_STYLES[row.level] ?? LEVEL_STYLES[1]),
        }))

        _cachedLevels = levels
        _cacheTimestamp = now
        return levels
    } catch {
        return DEFAULT_SCHOLAR_LEVELS
    }
}

export function getVipLevels(): ScholarLevelInfo[] {
    return _cachedLevels ?? DEFAULT_SCHOLAR_LEVELS
}

export function getScholarLevels(): ScholarLevelInfo[] {
    return getVipLevels()
}

/**
 * 根据等级数字 (1-6) 直接获取学者等级信息
 */
export function getVipLevelByNumber(level: number): ScholarLevelInfo {
    const levels = getVipLevels()
    const target = Math.min(Math.max(Number(level) || 1, 1), 6)
    return levels.find((l) => l.level === target) || levels[0]
}

export const getScholarLevelByNumber = getVipLevelByNumber

/**
 * 兼容旧方法
 */
export function getVipLevel(totalSpent: number): ScholarLevelInfo {
    return getVipLevelByNumber(1)
}

/**
 * 获取多维学术成长进度
 */
export function getScholarProgress(
    currentLevel: number,
    stats: {
        exp: number
        posts: number
        likes: number
        contributions: number
    }
): {
    current: ScholarLevelInfo
    next: ScholarLevelInfo | null
    expProgress: number // 0-100
    postsProgress: number // 0-100
    likesProgress: number // 0-100
    contribProgress: number // 0-100
    overallProgress: number // 综合升级进度 0-100
    remainingExp: number
    remainingPosts: number
    remainingLikes: number
    remainingContrib: number
} {
    const levels = getVipLevels()
    const current = getVipLevelByNumber(currentLevel)
    const nextIndex = levels.findIndex((l) => l.level === current.level) + 1
    const next = nextIndex < levels.length ? levels[nextIndex] : null

    if (!next) {
        return {
            current,
            next: null,
            expProgress: 100,
            postsProgress: 100,
            likesProgress: 100,
            contribProgress: 100,
            overallProgress: 100,
            remainingExp: 0,
            remainingPosts: 0,
            remainingLikes: 0,
            remainingContrib: 0,
        }
    }

    const expRange = Math.max(1, next.minExp - current.minExp)
    const expDone = Math.max(0, stats.exp - current.minExp)
    const expProgress = Math.min(100, Math.round((expDone / expRange) * 100))

    const postsProgress = next.minPosts > 0 ? Math.min(100, Math.round((stats.posts / next.minPosts) * 100)) : 100
    const likesProgress = next.minLikes > 0 ? Math.min(100, Math.round((stats.likes / next.minLikes) * 100)) : 100
    const contribProgress = next.minContributions > 0 ? Math.min(100, Math.round((stats.contributions / next.minContributions) * 100)) : 100

    const overallProgress = Math.min(100, Math.round(
        (expProgress * 0.4) + (postsProgress * 0.2) + (likesProgress * 0.2) + (contribProgress * 0.2)
    ))

    return {
        current,
        next,
        expProgress,
        postsProgress,
        likesProgress,
        contribProgress,
        overallProgress,
        remainingExp: Math.max(0, next.minExp - stats.exp),
        remainingPosts: Math.max(0, next.minPosts - stats.posts),
        remainingLikes: Math.max(0, next.minLikes - stats.likes),
        remainingContrib: Math.max(0, next.minContributions - stats.contributions),
    }
}

/**
 * 兼容旧版的 getNextLevelProgressByLevel
 */
export function getNextLevelProgressByLevel(currentLevel: number, totalSpent: number): {
    current: ScholarLevelInfo
    next: ScholarLevelInfo | null
    progress: number
    remaining: number
} {
    const levels = getVipLevels()
    const current = getVipLevelByNumber(currentLevel)
    const nextIndex = levels.findIndex((l) => l.level === current.level) + 1
    const next = nextIndex < levels.length ? levels[nextIndex] : null

    if (!next) {
        return { current, next: null, progress: 100, remaining: 0 }
    }

    const range = Math.max(1, next.minExp - current.minExp)
    const done = Math.max(0, totalSpent - current.minExp)
    const progress = Math.min(100, Math.round((done / range) * 100))
    const remaining = Math.max(0, next.minExp - totalSpent)
    return { current, next, progress, remaining }
}

export function invalidateVipCache() {
    _cachedLevels = null
    _cacheTimestamp = 0
}
