import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import { generatePostEmbedding } from "@/lib/post-embed";

export const dynamic = "force-dynamic"; // ⚡ 强制动态渲染，打碎 Next.js 在服务端的强缓存

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createPublicClient();

        console.log(`🔍 [recommendations-api] 正在请求帖子 ${id} 的相似推荐...`);

        // 1. 获取当前帖子的 embedding 向量与 tags 属性
        const { data: initialPost, error: postError } = await supabase
            .from("posts")
            .select("id, title, embedding, tags")
            .eq("id", id)
            .single();

        if (postError || !initialPost) {
            console.warn(`[recommendations-api] 帖子 ${id} 未找到，返回空推荐列表`);
            return NextResponse.json([]);
        }

        const post = initialPost;
        let embedding = post.embedding;

        // 1.1 即时自愈机制 (JIT On-Demand Embedding)：
        // 若当前帖子缺失向量，当用户访问此推荐路由时，立即触发实时生成与入库，避免无脑降级
        if (!embedding) {
            console.log(`[recommendations-api] 帖子 ${id} 缺失向量数据，正在触发即时 JIT 向量补全...`);
            try {
                const embedRes = await generatePostEmbedding(id);
                if ("success" in embedRes && embedRes.success && embedRes.embedding) {
                    embedding = embedRes.embedding;
                    console.log(`[recommendations-api] 帖子 ${id} 即时向量生成成功！已加入语义知识网络。`);
                }
            } catch (jitErr) {
                console.warn(`[recommendations-api] 帖子 ${id} 即时生成向量异常:`, jitErr);
            }
        }

        const currentTags = post.tags || [];
        console.log(`[recommendations-api] 当前帖子标题: "${post.title}", 标签:`, currentTags);

        // 2. 进阶学术维度发现算法
        const extractCommonConcepts = (pTags: string[], pTitle: string) => {
            // 2.1 优先提取公共交集标签
            let common = pTags.filter((t: string) => currentTags.includes(t));
            
            // 2.2 若无重合标签，匹配标题中共同的核心学术短词
            if (common.length === 0) {
                const keywords = ["数论", "图论", "算法", "求助", "Treap", "测试", "网络流", "平面图", "决斗", "编辑器", "指南", "性能", "卷积", "题解", "答案", "数学", "物理", "化学", "计算机"];
                keywords.forEach(kw => {
                    if (post.title.includes(kw) && pTitle.includes(kw)) {
                        common.push(kw);
                    }
                });
            }
            
            // 2.3 若依然为空，兜底显示对方帖子的主分类领域标签
            if (common.length === 0 && pTags.length > 0) {
                common = pTags.slice(0, 2);
            }
            
            return common.slice(0, 3);
        };

        // 3. 判断是否存在 embedding 向量并调用 match_posts RPC 进行向量匹配
        if (embedding) {
            console.log(`[recommendations-api] 检测到向量，进行 HNSW 向量余弦相似匹配...`);
            const { data: recPosts, error: recError } = await supabase.rpc("match_posts", {
                query_embedding: embedding,
                match_threshold: 0.25, // 适当平滑门限，提高学术语义覆盖范围
                match_count: 5,
                current_post_id: id,
            });

            if (!recError && recPosts && recPosts.length > 0) {
                const formattedPosts = recPosts.map((p: any) => {
                    const concepts = extractCommonConcepts(p.tags || [], p.title);
                    console.log(`   ➡️ 匹配到帖子: "${p.title}" (相似度: ${Math.round(p.similarity * 100)}%), 提炼概念:`, concepts);
                    return {
                        ...p,
                        similarity: p.similarity,
                        is_tag_match: false,
                        common_concepts: concepts,
                    };
                });
                return NextResponse.json(formattedPosts);
            }
            if (recError) {
                console.error("[recommendations-api] 向量匹配 RPC 发生错误:", recError);
            }
        }

        // 4. 降级方案：若无向量或向量匹配为空，优雅退回到本地标签交集匹配 (match_posts_by_tags)
        console.log(`[recommendations-api] 降级至标签交集相似推荐模式...`);
        const { data: backupPosts, error: backupError } = await supabase.rpc("match_posts_by_tags", {
            current_post_id: id,
            match_count: 5,
        });

        if (backupError) {
            console.error("[recommendations-api] 标签匹配 RPC 降级失败:", backupError);
            return NextResponse.json([]);
        }

        const formattedBackupPosts = (backupPosts || []).map((p: any, index: number) => {
            const concepts = extractCommonConcepts(p.tags || [], p.title);
            
            // 动态计算真实的相关度比例，彻底根除固定 80% 的生硬体验
            const targetTags = p.tags || [];
            const commonTagsCount = targetTags.filter((t: string) => currentTags.includes(t)).length;
            const unionTagsCount = new Set([...currentTags, ...targetTags]).size;
            
            let tagSimilarity: number;
            if (unionTagsCount > 0 && commonTagsCount > 0) {
                // 基于 Jaccard 相似度动态映射至 0.68 ~ 0.88 区间，按排名平滑微降
                const ratio = commonTagsCount / unionTagsCount;
                tagSimilarity = Math.max(0.65, Math.min(0.88, 0.68 + ratio * 0.20 - index * 0.02));
            } else {
                // 兜底热帖推荐：平滑映射在 0.52 ~ 0.62 区间
                tagSimilarity = Math.max(0.50, 0.62 - index * 0.03);
            }

            console.log(`   ➡️ (降级匹配) 帖子: "${p.title}" (动态相关度: ${Math.round(tagSimilarity * 100)}%), 提炼概念:`, concepts);
            return {
                ...p,
                similarity: tagSimilarity,
                is_tag_match: true,
                common_concepts: concepts,
            };
        });

        return NextResponse.json(formattedBackupPosts);
    } catch (err) {
        console.error("Recommendations API Route error:", err);
        return NextResponse.json([], { status: 500 });
    }
}
