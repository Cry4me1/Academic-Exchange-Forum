import { createDeepSeek } from "@ai-sdk/deepseek";
import { createServerClient } from "@supabase/ssr";
import { generateText } from "ai";
import {
    DEFAULT_DUEL_CONFIG,
    buildDuelRefereeSystemPrompt,
    normalizeDuelConfig,
    parseAndClampDuelScore,
    type DuelConfig,
} from "@/lib/duel-config";

export const runtime = "edge";

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// Edge 实例级 30 秒轻量缓存，兼顾后台热切换实时生效与零额外数据库压力
let cachedDuelConfig: { config: DuelConfig; expiresAt: number } | null = null;

function createSupabaseEdgeClient(req: Request) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    const cookieHeader = req.headers.get("cookie") || "";
                    return cookieHeader
                        .split(";")
                        .map((c) => {
                            const [name, ...rest] = c.trim().split("=");
                            return { name, value: rest.join("=") };
                        })
                        .filter((c) => c.name);
                },
                setAll() {
                    // Edge 函数中不设置 cookie
                },
            },
        }
    );
}

async function loadHotDuelConfig(
    supabase: ReturnType<typeof createSupabaseEdgeClient>
): Promise<DuelConfig> {
    const now = Date.now();
    if (cachedDuelConfig && cachedDuelConfig.expiresAt > now) {
        return cachedDuelConfig.config;
    }

    try {
        const { data } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "duel_config")
            .maybeSingle();

        const config = data?.value
            ? normalizeDuelConfig(data.value)
            : DEFAULT_DUEL_CONFIG;

        cachedDuelConfig = { config, expiresAt: now + 30_000 };
        return config;
    } catch {
        return DEFAULT_DUEL_CONFIG;
    }
}

interface PreviousRound {
    round: number;
    author: string;
    position: string;
    content: string;
}

export async function POST(req: Request): Promise<Response> {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: "缺少 DEEPSEEK_API_KEY" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const supabase = createSupabaseEdgeClient(req);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new Response(
            JSON.stringify({ error: "请先登录" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const duelConfig = await loadHotDuelConfig(supabase);
        const refCfg = duelConfig.referee;

        const body = await req.json();
        const {
            duelId,
            roundId,
            topic,
            description,
            position,
            previousRounds,
            postContent,
        } = body as {
            duelId: string;
            roundId: string;
            topic: string;
            description?: string;
            position?: string;
            previousRounds?: PreviousRound[];
            postContent?: string | null;
        };

        if (!duelId || !roundId || !topic) {
            return new Response(
                JSON.stringify({ error: "缺少必要参数: duelId, roundId, topic" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // 回合归属校验：只能分析本人提交的回合
        const { data: round, error: roundError } = await supabase
            .from("duel_rounds")
            .select("id, duel_id, author_id, content_text")
            .eq("id", roundId)
            .eq("duel_id", duelId)
            .single();

        if (roundError || !round) {
            return new Response(
                JSON.stringify({ error: "回合不存在" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        if (round.author_id !== user.id) {
            return new Response(
                JSON.stringify({ error: "只能分析本人提交的论点" }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        const content = round.content_text || "";
        if (!content) {
            return new Response(
                JSON.stringify({ error: "论点内容为空" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        if (content.length > refCfg.max_content_length) {
            return new Response(
                JSON.stringify({
                    error: `论点内容过长（上限 ${refCfg.max_content_length} 字符）`,
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const previousRoundsText =
            previousRounds && previousRounds.length > 0
                ? previousRounds
                      .map(
                          (r) =>
                              `【第${r.round}回合 - ${r.position}方 @${r.author}】\n${r.content}`
                      )
                      .join("\n\n---\n\n")
                : "（这是第一个回合，没有之前的辩论记录）";

        const userPrompt = `
## 辩题
${topic}

## 辩题背景描述
${description || "无额外描述"}

## 决斗关联的帖子原文内容
${postContent || "无关联帖子原文"}

## 当前论点作者的立场
${position || "未指定"}

## 之前的完整辩论记录
${previousRoundsText}

---

## 【当前需要评分的论点内容】
${content}

请根据评分标准，对以上论点进行评分。注意仔细对比该作者之前的论点，并结合关联的帖子原文背景，检查论点是否紧扣主题、是否存在重复提交。
请直接输出 JSON 对象，不要有任何额外文字。
`;

        const systemPrompt = buildDuelRefereeSystemPrompt(refCfg);

        const result = await generateText({
            model: deepseek(refCfg.model || "deepseek-v4-flash"),
            ...(refCfg.thinking_enabled
                ? { providerOptions: { deepseek: { thinking: { type: "enabled" } } } }
                : {}),
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        const scoreData = parseAndClampDuelScore(result.text, refCfg);

        return new Response(JSON.stringify(scoreData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("[Duel Analyze] Error:", error);
        return new Response(
            JSON.stringify({
                error:
                    "分析失败: " +
                    (error instanceof Error ? error.message : String(error)),
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
