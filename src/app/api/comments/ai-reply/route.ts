import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { markdownToTipTap } from "@/lib/markdown-to-tiptap";

export const maxDuration = 60; // 允许长推理时间

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// ====== Token 计费模型（与编辑器 AI 一致） ======
const MIN_CREDIT_COST = 8;
const TOKENS_PER_CREDIT = 40;

function calculateCreditCost(totalTokens: number): number {
    return Math.max(MIN_CREDIT_COST, Math.ceil(totalTokens / TOKENS_PER_CREDIT));
}

const SCHOLARLY_AI_ID = "00000000-0000-0000-0000-0000000000a1";

const AI_REPLY_SYSTEM_PROMPT = `你是一位名为“Scholarly AI”的高级学术智能助手，驻扎在 Scholarly 学术论坛。
学者们在评论区中通过 @Scholarly AI 呼唤你，向你请教学术疑惑、论文推导、算法分析或论点辨析。

## 你的学术准则：
1. **深厚严谨的学者素养**：论据扎实，逻辑环环相扣，态度求真、谦逊。
2. **公式规范（极其重要，违者将无法渲染）**：
   - 论坛数学渲染引擎仅支持单个美元符号包裹公式，即 \`$公式$\`。
   - **绝对严禁使用双美元符号“$$”**（严禁写形如 \`$$ ... $$\` 的公式，这在本站无法解析，会导致整块内容渲染失败）。无论是行内公式还是独立一行的块级推导公式，**必须且只能使用单个美元符号 \`$ ... $\`**（例如 \`$E = mc^2$\` 或 \`$\\sum_{i=1}^n x_i$\`）！
   - 若公式中含有中文词汇（如“命题”、“结论”等），务必使用 \\text{...} 包裹（例如 $\\text{命题}_1$），严禁在数学符号环境内直接裸露中文。
3. **Markdown 格式与排版规范**：
   - 合理使用清晰的 Markdown 层次结构，善用小标题（如 ### 小标题）、无序列表（- 项目）、有序列表（1. 步骤）和加粗强调（**核心词**），使解答易读且美观。
   - 代码与算法：规范使用带语言名称的 Markdown 代码块（如 \`\`\`python 或 \`\`\`cpp）。
4. **文章上下文关联**：你完全能够阅读并理解当前学者发表的整篇文章内容。请紧密结合文章中的公式、算法、定理与论点来回应学者的评论与提问。
5. **精炼高效**：切忌繁文缛节与空洞客套，直接对学者的疑问展开清晰、透彻的学术剖析与解答。
6. **语言**：始终使用专业、通顺的中文作答。`;

/**
 * 递归解析 TipTap / ProseMirror AST 结构，提取完整的 Markdown 学术文章
 */
function extractArticleMarkdown(node: any): string {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (node.text) return node.text;

    const children = Array.isArray(node.content)
        ? node.content.map(extractArticleMarkdown).join("")
        : "";

    switch (node.type) {
        case "heading": {
            const lvl = "#".repeat(node.attrs?.level || 2);
            return `\n${lvl} ${children.trim()}\n`;
        }
        case "paragraph":
            return children.trim() ? `${children}\n` : "\n";
        case "codeBlock": {
            const lang = node.attrs?.language || "";
            return `\n\`\`\`${lang}\n${children}\n\`\`\`\n`;
        }
        case "blockquote":
            return `\n> ${children.trim()}\n`;
        case "bulletList":
        case "orderedList":
            return `\n${children}\n`;
        case "listItem":
            return `- ${children.trim()}\n`;
        case "mathematics":
        case "math":
            return `$${node.attrs?.latex || children}$`;
        case "horizontalRule":
            return "\n---\n";
        default:
            return children;
    }
}



export async function POST(req: Request) {
    try {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "服务端未配置 DEEPSEEK_API_KEY" },
                { status: 500 }
            );
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "请先登录" }, { status: 401 });
        }

        const body = await req.json();
        const { postId, commentId, prompt } = body;

        if (!postId || !commentId || !prompt) {
            return NextResponse.json(
                { error: "缺少必要参数 (postId, commentId, prompt)" },
                { status: 400 }
            );
        }

        // 1. 预检用户积分
        const { data: creditData } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", user.id)
            .single();

        const currentBalance = creditData?.balance ?? 0;
        if (currentBalance < MIN_CREDIT_COST) {
            return NextResponse.json(
                {
                    error: "INSUFFICIENT_CREDITS",
                    message: `积分不足（当前 ${currentBalance} 积分，唤醒 Scholarly AI 至少需 ${MIN_CREDIT_COST} 积分）`,
                    balance: currentBalance,
                },
                { status: 402 }
            );
        }

        // 2. 获取帖子完整学术文章内容（使用 adminClient 避免 RLS 阻断）
        const adminClient = createAdminClient();
        const { data: post, error: postError } = await adminClient
            .from("posts")
            .select("title, content, tags, academic_meta")
            .eq("id", postId)
            .single();

        let articleMarkdown = "";
        if (!postError && post?.content) {
            try {
                articleMarkdown = extractArticleMarkdown(post.content);
                // 限制最多 8000 字符，保留最核心的推导与全貌
                if (articleMarkdown.length > 8000) {
                    articleMarkdown = articleMarkdown.slice(0, 8000) + "\n\n...[篇幅较长，已保留前 8000 字符核心内容]...";
                }
            } catch (err) {
                console.error("[Scholarly AI] 解析文章内容失败:", err);
                articleMarkdown = "";
            }
        }

        const tagsStr = Array.isArray(post?.tags) && post.tags.length > 0 ? post.tags.join(", ") : "综合学术";

        const userPromptWithContext = `【当前讨论文章标题】：${post?.title || "学术文章"}
【文章学科标签】：${tagsStr}

【当前讨论文章学术全文】：
${articleMarkdown || "（作者未提供正文或正文为空）"}

------------------------------------
【学者在评论区的提问与互动发言】：
${prompt}

请作为 Scholarly AI，紧密结合上方学者的文章内容，对学者在评论区的疑问展开透彻、严谨且富有建设性的专业解答。`;

        // 3. 调用 DeepSeek API 生成解答
        const { text, usage } = await generateText({
            model: deepseek("deepseek-v4-flash"),
            providerOptions: { deepseek: { thinking: { type: "disabled" } } },
            system: AI_REPLY_SYSTEM_PROMPT,
            prompt: userPromptWithContext,
            temperature: 0.6,
        });

        const inputTokens = usage?.inputTokens || 0;
        const outputTokens = usage?.outputTokens || 0;
        const totalTokens = usage?.totalTokens || (inputTokens + outputTokens);
        const creditCost = calculateCreditCost(totalTokens);

        console.log(`[Scholarly AI Comment Reply] Tokens: ${totalTokens}, Cost: ${creditCost}`);

        // 4. 后置原子扣费
        let newBalance = currentBalance - creditCost;
        try {
            const { data: deductResult, error: deductError } = await adminClient.rpc(
                "deduct_user_credits",
                {
                    p_user_id: user.id,
                    p_amount: creditCost,
                    p_description: "Scholarly AI · 评论区学术答疑",
                    p_metadata: {
                        source: "comment_mention",
                        post_id: postId,
                        comment_id: commentId,
                        input_tokens: inputTokens,
                        output_tokens: outputTokens,
                        total_tokens: totalTokens,
                        credit_cost: creditCost,
                    },
                }
            );

            if (deductError) {
                console.error("[Scholarly AI] 扣费 RPC 异常:", deductError);
            } else if (deductResult && typeof deductResult.new_balance === "number") {
                newBalance = deductResult.new_balance;
            }
        } catch (deductErr) {
            console.error("[Scholarly AI] 扣费执行失败:", deductErr);
        }

        // 5. 组装 ProseMirror JSON 并通过 adminClient 写入 comments 表（绕过 RLS 对系统账号 author_id 的限制）
        const commentContent = markdownToTipTap(text);

        const { data: aiComment, error: commentError } = await adminClient
            .from("comments")
            .insert({
                post_id: postId,
                author_id: SCHOLARLY_AI_ID,
                parent_id: commentId,
                content: commentContent,
                review_status: "approved", // 官方 AI 免审直发
            })
            .select(`
                *,
                author:profiles!author_id (
                    id,
                    username,
                    avatar_url,
                    special_title,
                    vip_level,
                    is_verified,
                    badges
                )
            `)
            .single();

        if (commentError) {
            console.error("[Scholarly AI] 插入评论失败:", commentError);
            return NextResponse.json(
                { error: "AI 回答生成成功但写入评论区失败", rawText: text },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            comment: aiComment,
            creditCost,
            totalTokens,
            newBalance,
        });
    } catch (error) {
        console.error("[Scholarly AI Reply Error]:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "生成回答失败" },
            { status: 500 }
        );
    }
}
