import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. 读取并注入环境变量
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
    console.error("❌ 找不到 .env.local 配置文件！");
    process.exit(1);
}

const envFile = fs.readFileSync(envPath, "utf-8");
envFile.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx > -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        process.env[k] = v;
    }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiUrl = process.env.EMBEDDING_API_URL || "https://api.cohere.com/v1/embed";
const apiKey = process.env.EMBEDDING_API_KEY;
const modelName = process.env.EMBEDDING_MODEL || (apiUrl.includes("cohere") ? "embed-multilingual-v3.0" : undefined);

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ 缺少 Supabase 连接配置 (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
    process.exit(1);
}

if (!apiKey) {
    console.error("❌ 缺少 EMBEDDING_API_KEY 配置");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const isCohere = apiUrl.includes("cohere");
const force = process.argv.includes("--force");

function extractPlainText(content) {
    if (!content || typeof content !== "object") return "";
    const texts = [];
    function walk(node) {
        if (!node || typeof node !== "object") return;
        if (node.type === "academicBlock" && node.attrs) {
            const type = node.attrs.academicType || "theorem";
            const num = node.attrs.number ? ` ${node.attrs.number}` : "";
            const title = node.attrs.title ? ` (${node.attrs.title})` : "";
            texts.push(`\n【学术${type}${num}${title}】:`);
        }
        if (node.type === "sidenote" && node.attrs?.content) {
            texts.push(`[边注: ${node.attrs.content}]`);
        }
        if (node.type === "text" && node.text) {
            texts.push(node.text);
        }
        if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) {
                walk(child);
            }
        }
    }
    walk(content);
    return texts.join(" ").replace(/\s+/g, " ").trim();
}

async function run() {
    console.log("=========================================");
    console.log("   🧬 Scholarly 知识图谱向量全库同步工具   ");
    console.log("=========================================");
    console.log(`模式: ${force ? "强制全量重算" : "增量补全缺失向量"}`);
    console.log(`模型: ${modelName || "默认"} (${isCohere ? "Cohere" : "兼容模式"})`);
    console.log(`接口: ${apiUrl}`);

    let query = supabase.from("posts").select("id, title, content, tags, embedding");
    if (!force) {
        query = query.is("embedding", null);
    }

    const { data: posts, error } = await query;
    if (error) {
        console.error("❌ 获取帖子数据失败:", error);
        process.exit(1);
    }

    if (!posts || posts.length === 0) {
        console.log("✅ 全站所有已发布帖子均已具备 1024 维 Embedding 向量，无需补充！");
        return;
    }

    console.log(`\n📦 发现待处理帖子: ${posts.length} 篇\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        process.stdout.write(`[${i + 1}/${posts.length}] 正在向量化: "${post.title.slice(0, 20)}"... `);

        const plainText = extractPlainText(post.content);
        const textToEmbed = `${post.title}\n\n${post.tags?.join(", ") || ""}\n\n${plainText}`.slice(0, 8000);

        try {
            const requestBody = isCohere
                ? { model: modelName, texts: [textToEmbed], input_type: "search_document" }
                : { model: modelName, input: textToEmbed };

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(12000),
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            }

            const data = await res.json();
            const emb = isCohere ? data.embeddings?.[0] : data.data?.[0]?.embedding;
            if (!emb || !Array.isArray(emb)) {
                throw new Error("返回向量格式异常");
            }

            const { error: updErr } = await supabase
                .from("posts")
                .update({ embedding: JSON.stringify(emb) })
                .eq("id", post.id);

            if (updErr) {
                throw new Error(`数据库更新失败: ${updErr.message}`);
            }

            console.log(`✅ 成功 (${emb.length}维)`);
            successCount++;
        } catch (err) {
            console.log(`❌ 失败: ${err.message}`);
            failCount++;
        }

        // 避免触发 API 频控保护
        await new Promise((r) => setTimeout(r, 600));
    }

    console.log("\n=========================================");
    console.log(`🎉 向量同步结束！成功: ${successCount} 篇, 失败: ${failCount} 篇`);
    console.log("=========================================\n");
}

run();
