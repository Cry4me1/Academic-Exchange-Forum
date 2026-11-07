export type DuelRefereePresetKey =
  | "youth_friendly"
  | "academic_rigor"
  | "strict_logic";

export interface DuelRefereeConfig {
  model: string;
  thinking_enabled: boolean;
  active_preset: DuelRefereePresetKey;
  custom_instructions: string;
  max_evidence_score: number;
  max_citation_score: number;
  max_logic_score: number;
  fallacy_penalty: number;
  fallacy_lp_deduction: number;
  jaccard_threshold: number;
  min_content_length: number;
  max_content_length: number;
}

export interface DuelEconomyConfig {
  creation_fee: number;
  auto_refund_on_pending_cancel: boolean;
  initial_lp: number;
  negative_ko_threshold: number;
  allowed_rounds: number[];
  win_reputation_reward: number;
  loss_reputation_penalty: number;
  min_bet_level: number;
  min_bet_amount: number;
  max_bet_amount: number;
  stall_warning_hours: number;
  invite_expire_hours: number;
}

export interface DuelConfig {
  referee: DuelRefereeConfig;
  economy: DuelEconomyConfig;
}

export interface DuelScoreResult {
  evidenceScore: number;
  citationScore: number;
  logicScore: number;
  hasFallacy: boolean;
  fallacyType?: string;
  fallacyPenalty: number;
  isDuplicate: boolean;
  totalScore: number;
  analysis: string;
  highlights: string[];
  weaknesses: string[];
}

export const DEFAULT_DUEL_CONFIG: DuelConfig = {
  referee: {
    model: "deepseek-v4-flash",
    thinking_enabled: true,
    active_preset: "youth_friendly",
    custom_instructions: "",
    max_evidence_score: 5,
    max_citation_score: 3,
    max_logic_score: 2,
    fallacy_penalty: -10,
    fallacy_lp_deduction: 10,
    jaccard_threshold: 0.7,
    min_content_length: 20,
    max_content_length: 8000,
  },
  economy: {
    creation_fee: 100,
    auto_refund_on_pending_cancel: true,
    initial_lp: 100,
    negative_ko_threshold: -30,
    allowed_rounds: [3, 5, 7],
    win_reputation_reward: 10,
    loss_reputation_penalty: 5,
    min_bet_level: 2,
    min_bet_amount: 1,
    max_bet_amount: 10000,
    stall_warning_hours: 48,
    invite_expire_hours: 72,
  },
};

export const DUEL_REFEREE_PRESETS: Record<
  DuelRefereePresetKey,
  {
    label: string;
    badge: string;
    summary: string;
    personaHeader: string;
    qualityRule: string;
    closingNote: string;
  }
> = {
  youth_friendly: {
    label: "初高中亲和启发（默认）",
    badge: "默认保留",
    summary:
      "完整保留现有初高中生讨论风格：鼓励独立思考、允许课本知识与生活实例支撑，对偷懒复读与耍赖零容忍。",
    personaHeader:
      "你是一位公正但亲和的辩论裁判（AI Referee），负责为初高中生的学术讨论打分。你的风格是鼓励思考、注重说理，但对偷懒和耍赖零容忍。",
    qualityRule: `这是一个面向初高中生的讨论论坛，不强制要求学术文献引用。但论点必须：
- 有自己的思考和推理过程，不能只喊口号
- 尽量用具体的例子、数据或事实来支撑观点（不要求学术论文，生活常识和课本知识也算！）
- 认真回应对方的论点，而不是自说自话`,
    closingNote: "对初高中生要鼓励为主，但评分要实事求是。",
  },
  academic_rigor: {
    label: "高校学术严谨审稿",
    badge: "高标准证据",
    summary:
      "强调实证数据、数学推导、定理引述或可核验文献来源，严格审视因果链条与概念边界。",
    personaHeader:
      "你是一位严谨客观的高校学术研讨会主裁（Academic Referee），采用同行评审视角评估双方论辩质量。你高度看重数学逻辑严密性、实证数据与可验证论据。",
    qualityRule: `这是一场高标准的学术观点交锋，论点应当：
- 具备严密的演绎或归纳推理链条，清晰界定核心概念与适用前提
- 优先使用可核验的实验数据、数学推导、经典定理或权威文献支撑；纯主观臆断不得高分
- 精准拆解对手的论证前提或隐含假设，推进学术讨论深度`,
    closingNote: "请保持审稿人级别的客观冷静，严格按证据强度与推导严密性赋分。",
  },
  strict_logic: {
    label: "铁面逻辑形式严判",
    badge: "零容忍谬误",
    summary:
      "聚焦形式逻辑完备性与反驳命中率，严查滑坡、偷换概念、稻草人及循环论证，适合硬核决赛局。",
    personaHeader:
      "你是一位铁面无私的形式逻辑裁判（Strict Logic Arbiter）。你只看重命题推理的有效性、前提真实性与交锋命中率，对任何修辞包装或情绪渲染完全免疫。",
    qualityRule: `论点必须通过严格的形式逻辑检验：
- 每一项结论必须由明确的前提推导得出，严禁跳跃式断言
- 论据必须与核心命题具备直接因果或统计相关性
- 对任何擦边的偷换概念、滑坡谬误、诉诸权威或稻草人靶子均须果断触发谬误判罚`,
    closingNote: "铁面判罚，绝不给同情分；分析评语须一针见血指出逻辑结构得失。",
  },
};

export function normalizeDuelConfig(raw: unknown): DuelConfig {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const ref = (
    obj.referee && typeof obj.referee === "object" ? obj.referee : {}
  ) as Record<string, unknown>;
  const eco = (
    obj.economy && typeof obj.economy === "object" ? obj.economy : {}
  ) as Record<string, unknown>;

  const presetRaw = String(ref.active_preset || "youth_friendly");
  const activePreset: DuelRefereePresetKey =
    presetRaw === "academic_rigor" || presetRaw === "strict_logic"
      ? presetRaw
      : "youth_friendly";

  const rawRounds = Array.isArray(eco.allowed_rounds)
    ? eco.allowed_rounds
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 15)
    : DEFAULT_DUEL_CONFIG.economy.allowed_rounds;

  return {
    referee: {
      model:
        typeof ref.model === "string" && ref.model.trim()
          ? ref.model.trim()
          : DEFAULT_DUEL_CONFIG.referee.model,
      thinking_enabled:
        typeof ref.thinking_enabled === "boolean"
          ? ref.thinking_enabled
          : DEFAULT_DUEL_CONFIG.referee.thinking_enabled,
      active_preset: activePreset,
      custom_instructions:
        typeof ref.custom_instructions === "string"
          ? ref.custom_instructions
          : "",
      max_evidence_score: Math.max(
        1,
        Math.min(20, Math.round(Number(ref.max_evidence_score ?? 5)))
      ),
      max_citation_score: Math.max(
        1,
        Math.min(20, Math.round(Number(ref.max_citation_score ?? 3)))
      ),
      max_logic_score: Math.max(
        1,
        Math.min(20, Math.round(Number(ref.max_logic_score ?? 2)))
      ),
      fallacy_penalty: -Math.abs(
        Math.round(Number(ref.fallacy_penalty ?? -10)) || 10
      ),
      fallacy_lp_deduction: Math.max(
        0,
        Math.min(100, Math.round(Number(ref.fallacy_lp_deduction ?? 10)))
      ),
      jaccard_threshold: Math.max(
        0.3,
        Math.min(0.95, Number(ref.jaccard_threshold ?? 0.7))
      ),
      min_content_length: Math.max(
        5,
        Math.min(500, Math.round(Number(ref.min_content_length ?? 20)))
      ),
      max_content_length: Math.max(
        500,
        Math.min(30000, Math.round(Number(ref.max_content_length ?? 8000)))
      ),
    },
    economy: {
      creation_fee: Math.max(
        0,
        Math.min(10000, Math.round(Number(eco.creation_fee ?? 100)))
      ),
      auto_refund_on_pending_cancel:
        typeof eco.auto_refund_on_pending_cancel === "boolean"
          ? eco.auto_refund_on_pending_cancel
          : true,
      initial_lp: Math.max(
        10,
        Math.min(500, Math.round(Number(eco.initial_lp ?? 100)))
      ),
      negative_ko_threshold: -Math.abs(
        Math.round(Number(eco.negative_ko_threshold ?? -30)) || 30
      ),
      allowed_rounds: rawRounds.length > 0 ? rawRounds : [3, 5, 7],
      win_reputation_reward: Math.max(
        0,
        Math.min(200, Math.round(Number(eco.win_reputation_reward ?? 10)))
      ),
      loss_reputation_penalty: Math.max(
        0,
        Math.min(200, Math.round(Number(eco.loss_reputation_penalty ?? 5)))
      ),
      min_bet_level: Math.max(
        1,
        Math.min(10, Math.round(Number(eco.min_bet_level ?? 2)))
      ),
      min_bet_amount: Math.max(
        1,
        Math.min(1000, Math.round(Number(eco.min_bet_amount ?? 1)))
      ),
      max_bet_amount: Math.max(
        10,
        Math.min(100000, Math.round(Number(eco.max_bet_amount ?? 10000)))
      ),
      stall_warning_hours: Math.max(
        1,
        Math.min(720, Math.round(Number(eco.stall_warning_hours ?? 48)))
      ),
      invite_expire_hours: Math.max(
        1,
        Math.min(720, Math.round(Number(eco.invite_expire_hours ?? 72)))
      ),
    },
  };
}

/**
 * 构建 AI 裁判完整 System Prompt
 * 当 active_preset === 'youth_friendly' 且采用默认分值 (5/3/2/-10) 时，与原有初高中生亲和提示词保持 100% 语义一致
 */
export function buildDuelRefereeSystemPrompt(ref: DuelRefereeConfig): string {
  const preset =
    DUEL_REFEREE_PRESETS[ref.active_preset] ??
    DUEL_REFEREE_PRESETS.youth_friendly;
  const maxEv = ref.max_evidence_score;
  const maxCit = ref.max_citation_score;
  const maxLog = ref.max_logic_score;
  const absPen = Math.abs(ref.fallacy_penalty);

  const customSection = ref.custom_instructions.trim()
    ? `\n### 5. 管理员附加执裁准则\n${ref.custom_instructions.trim()}\n`
    : "";

  return `${preset.personaHeader}

## 重要前置规则

### 1. 重复内容检测（最高优先级！）
你必须将当前论点与该作者之前提交的所有论点进行逐一比对。
- 如果当前论点与该作者之前提交的任何一个论点在核心论据、论证逻辑或表述上高度相似（超过 60% 的内容重复或仅做了表面改写），则判定为"重复内容"：
  - isDuplicate 设为 true
  - evidenceScore 设为 0
  - citationScore 设为 0
  - logicScore 设为 0
  - totalScore 设为 0
  - analysis 中必须明确说明"检测到重复或高度相似内容，不予计分"
- 注意：与对手的论点相似不算重复（反驳对方观点是正常的）。只有与自己之前的论点雷同才算重复。

### 2. 内容质量要求
${preset.qualityRule}

### 3. 立场一致性检测（重要！）
每位辩手有明确的立场（正方或反方）。你必须检查论点内容是否与作者的立场一致。
- **如果该辩手的论点实质上在支持对方的立场**（即正方在帮反方说话，或反方在帮正方说话），则判定为"立场背离"：
  - evidenceScore 设为 0
  - citationScore 设为 0
  - logicScore 设为 0
  - totalScore 设为 0
  - hasFallacy 设为 false（这不是逻辑谬误，是立场问题）
  - analysis 中必须说明"论点内容与你的立场（X方）不符，你在帮对方说话"
  - 在 weaknesses 中添加"立场背离：内容支持了对方观点"
- 注意区分：**有策略地承认对方部分观点再反驳**（"虽然…但是…"）属于高级辩论技巧，不算立场背离。只有**整体论点都在支撑对方立场**才判定为背离。

### 4. 关联帖子原文参考（如果提供）
如果系统提供了“决斗关联的帖子原文内容”，说明这场决斗是由于该帖子引发的争论。你必须：
- 评估当前辩手的论点是否契合或有效回应了原帖子中阐述的核心事实、问题或讨论主旨。
- 如果论点完全偏离原帖子论题，属于答非所问或脱离背景自说自话，应在 weaknesses 中明确指出“偏离原帖主题”，并对“推理质量”或“对话互动”进行扣分。
${customSection}
## 评分标准

### 加分项
1. **推理质量 (0-${maxEv}分)** - 论证层次与思维深度
   - ${maxEv}分: 思路清晰、层层递进、有独到见解，让人眼前一亮
   - 中高分: 有自己的分析和推理，观点站得住脚
   - 低分: 只是表达了看法，但缺少"为什么"的解释
   - 0分: 纯粹喊口号、复读机、或为重复内容

2. **论据支撑 (0-${maxCit}分)** - 事实、数据与案例干货
   - ${maxCit}分: 用了具体的事实、数据、真实案例、定理推导或可信来源来支撑
   - 中等分: 有一些例子或事实，但不够具体或相关性一般
   - 1分: 论据很模糊，比如"大家都知道"、"很多人认为"
   - 0分: 完全没有任何支撑，纯观点输出

3. **对话互动 (0-${maxLog}分)** - 交锋回应有效性
   - ${maxLog}分: 有效回应了对方的核心论点，指出了对方的漏洞或补充了新角度
   - 中等分: 提到了对方的观点，但回应不够有力
   - 0分: 完全无视对方说了什么，自说自话（第一回合例外，首发可满分）

### 扣分项 - 逻辑谬误 / 不当行为 (-${absPen}分)
检测以下问题，如发现则扣 ${absPen} 分：
- **人身攻击**: 骂人、嘲讽对手本人而不是讨论观点
- **偷换概念**: 偷偷改变讨论的定义或范围
- **稻草人论证**: 故意歪曲对方的意思然后攻击
- **虚假二分法**: "要么 A 要么 B"，不给其他选项
- **诉诸情感**: 纯靠煽情而不讲道理
- **以偏概全**: 用一两个特例推广到所有情况
- **循环论证**: 用结论证明结论

## 输出要求
请评估论点，计算总分 = 推理质量 + 论据支撑 + 对话互动 + 谬误扣分。
如果是重复内容或立场背离，总分 = 0。
保持客观公正，不要因为立场偏向任何一方。
${preset.closingNote}

## 输出格式
你必须返回一个严格的 JSON 对象，不要有任何其他文字。格式如下：
{
  "evidenceScore": <0-${maxEv}的整数>,
  "citationScore": <0-${maxCit}的整数>,
  "logicScore": <0-${maxLog}的整数>,
  "hasFallacy": <true或false>,
  "fallacyType": "<谬误类型，如无则为空字符串>",
  "fallacyPenalty": <0或-${absPen}>,
  "isDuplicate": <true或false>,
  "totalScore": <总分整数>,
  "analysis": "<60字以内的评分分析说明>",
  "highlights": ["<亮点1>", "<亮点2>"],
  "weaknesses": ["<不足1>", "<不足2>"]
}
`;
}

export function parseAndClampDuelScore(
  responseText: string,
  ref: DuelRefereeConfig
): DuelScoreResult {
  let raw: Partial<DuelScoreResult>;
  try {
    raw = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      raw = JSON.parse(jsonMatch[1].trim());
    } else {
      const braceMatch = responseText.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        raw = JSON.parse(braceMatch[0]);
      } else {
        throw new Error("无法从 AI 返回中解析 JSON 评分结果");
      }
    }
  }

  const evidenceScore = Math.max(
    0,
    Math.min(ref.max_evidence_score, Math.round(Number(raw.evidenceScore || 0)))
  );
  const citationScore = Math.max(
    0,
    Math.min(ref.max_citation_score, Math.round(Number(raw.citationScore || 0)))
  );
  const logicScore = Math.max(
    0,
    Math.min(ref.max_logic_score, Math.round(Number(raw.logicScore || 0)))
  );
  const hasFallacy = Boolean(raw.hasFallacy);
  const fallacyPenalty = hasFallacy ? -Math.abs(ref.fallacy_penalty) : 0;
  const isDuplicate = Boolean(raw.isDuplicate);

  if (isDuplicate) {
    return {
      evidenceScore: 0,
      citationScore: 0,
      logicScore: 0,
      hasFallacy: false,
      fallacyType: "",
      fallacyPenalty: 0,
      isDuplicate: true,
      totalScore: 0,
      analysis: raw.analysis || "检测到重复或高度相似内容，不予计分",
      highlights: Array.isArray(raw.highlights)
        ? raw.highlights.slice(0, 3)
        : [],
      weaknesses: Array.isArray(raw.weaknesses)
        ? raw.weaknesses.slice(0, 3)
        : [],
    };
  }

  const totalScore = evidenceScore + citationScore + logicScore + fallacyPenalty;

  return {
    evidenceScore,
    citationScore,
    logicScore,
    hasFallacy,
    fallacyType: hasFallacy ? String(raw.fallacyType || "逻辑谬误") : "",
    fallacyPenalty,
    isDuplicate: false,
    totalScore,
    analysis: String(raw.analysis || ""),
    highlights: Array.isArray(raw.highlights) ? raw.highlights.slice(0, 3) : [],
    weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses.slice(0, 3) : [],
  };
}
