import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminRole, hasPermission } from "@/lib/admin/permissions";
import {
  DEFAULT_DUEL_CONFIG,
  buildDuelRefereeSystemPrompt,
  normalizeDuelConfig,
  parseAndClampDuelScore,
  type DuelRefereeConfig,
} from "@/lib/duel-config";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "服务端未配置 DEEPSEEK_API_KEY" },
        { status: 400 }
      );
    }

    const role = await getAdminRole();
    if (!role || !hasPermission(role, "moderator")) {
      return NextResponse.json(
        { error: "权限不足：需要版主及以上权限" },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const body = (await req.json()) as {
      mode: "rejudge_round" | "sandbox";
      roundId?: string;
      sandboxInput?: {
        topic: string;
        description?: string;
        position: string;
        content: string;
      };
      overrideRefereeConfig?: Partial<DuelRefereeConfig>;
    };

    const { data: settingRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "duel_config")
      .maybeSingle();

    const baseConfig = settingRow?.value
      ? normalizeDuelConfig(settingRow.value)
      : DEFAULT_DUEL_CONFIG;

    const refCfg: DuelRefereeConfig = body.overrideRefereeConfig
      ? normalizeDuelConfig({
          referee: { ...baseConfig.referee, ...body.overrideRefereeConfig },
          economy: baseConfig.economy,
        }).referee
      : baseConfig.referee;

    const startedAt = Date.now();

    // 模式 A：在线沙盒试跑（不写任何数据库表）
    if (body.mode === "sandbox") {
      const input = body.sandboxInput;
      if (!input?.topic?.trim() || !input?.content?.trim()) {
        return NextResponse.json(
          { error: "沙盒演练需填写测试辩题与测试论点" },
          { status: 400 }
        );
      }

      const systemPrompt = buildDuelRefereeSystemPrompt(refCfg);
      const userPrompt = `
## 辩题
${input.topic.trim()}

## 辩题背景描述
${input.description?.trim() || "无额外描述"}

## 决斗关联的帖子原文内容
无关联帖子原文

## 当前论点作者的立场
${input.position || "正方"}

## 之前的完整辩论记录
（沙盒单回合独立测试，无前置交锋记录）

---

## 【当前需要评分的论点内容】
${input.content.trim()}

请直接输出 JSON 对象，不要有任何额外文字。
`;

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
      return NextResponse.json({
        success: true,
        durationMs: Date.now() - startedAt,
        scoreData,
      });
    }

    // 模式 B：真实孤儿回合 / 争议回合 AI 重新评判并原子入库
    if (!body.roundId) {
      return NextResponse.json({ error: "缺少 roundId" }, { status: 400 });
    }

    const { data: round } = await supabase
      .from("duel_rounds")
      .select("id, duel_id, round_number, author_id, content_text, created_at")
      .eq("id", body.roundId)
      .maybeSingle();

    if (!round || !round.content_text) {
      return NextResponse.json(
        { error: "未找到该回合或回合纯文本内容为空" },
        { status: 404 }
      );
    }

    const { data: duel } = await supabase
      .from("duels")
      .select(
        "id, topic, description, challenger_id, challenger_position, opponent_position, post_id"
      )
      .eq("id", round.duel_id)
      .maybeSingle();

    if (!duel) {
      return NextResponse.json({ error: "关联对决不存在" }, { status: 404 });
    }

    const { data: prevRoundsData } = await supabase
      .from("duel_rounds")
      .select(
        "id, round_number, author_id, content_text, created_at, author:profiles!author_id(username)"
      )
      .eq("duel_id", duel.id)
      .lt("created_at", round.created_at)
      .order("created_at", { ascending: true });

    const previousRoundsText =
      prevRoundsData && prevRoundsData.length > 0
        ? prevRoundsData
            .map((r) => {
              const pos =
                r.author_id === duel.challenger_id
                  ? duel.challenger_position
                  : duel.opponent_position;
              const uname =
                (r.author as unknown as { username?: string } | null)
                  ?.username || "学者";
              return `【第${r.round_number}回合 - ${pos}方 @${uname}】\n${r.content_text || ""}`;
            })
            .join("\n\n---\n\n")
        : "（这是第一个回合，没有之前的辩论记录）";

    const authorPosition =
      round.author_id === duel.challenger_id
        ? duel.challenger_position
        : duel.opponent_position;

    const systemPrompt = buildDuelRefereeSystemPrompt(refCfg);
    const userPrompt = `
## 辩题
${duel.topic}

## 辩题背景描述
${duel.description || "无额外描述"}

## 当前论点作者的立场
${authorPosition}

## 之前的完整辩论记录
${previousRoundsText}

---

## 【当前需要评分的论点内容】
${round.content_text}

请直接输出 JSON 对象，不要有任何额外文字。
`;

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

    const { data: rpcRes, error: rpcError } = await supabase.rpc(
      "admin_override_round_score",
      {
        p_round_id: round.id,
        p_evidence_score: scoreData.evidenceScore,
        p_citation_score: scoreData.citationScore,
        p_logic_score: scoreData.logicScore,
        p_has_fallacy: scoreData.hasFallacy,
        p_fallacy_type: scoreData.fallacyType || "",
        p_fallacy_penalty: scoreData.fallacyPenalty,
        p_analysis: scoreData.analysis,
        p_reason: "管理员触发 AI 裁判重新评判补分",
      }
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      durationMs: Date.now() - startedAt,
      scoreData,
      rpcResult: rpcRes,
    });
  } catch (error) {
    console.error("[Admin Duel Reanalyze] Error:", error);
    return NextResponse.json(
      {
        error:
          "AI 评判执行失败: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
