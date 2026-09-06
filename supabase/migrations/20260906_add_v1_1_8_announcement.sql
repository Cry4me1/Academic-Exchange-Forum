-- ==============================================================================
-- 迁移：写入 Scholarly v1.1.8 正式版全站公告并替换旧版本通知
-- ==============================================================================

-- 1. 将历史版本更新类型的活跃公告置为非活跃
UPDATE public.system_announcements
SET is_active = FALSE
WHERE category = 'update' AND is_active = TRUE;

-- 2. 写入最新的 v1.1.8 正式版全站公告
INSERT INTO public.system_announcements (
    title,
    content,
    category,
    target_audience,
    start_time,
    is_active
) VALUES (
    '【重磅发布】Scholarly v1.1.8 正式上线：评论区 @ 提及系统、交互式 Scholarly AI 学术智脑、零基础数学公式/函数符号面板与极简 AI 续写流光',
    'Scholarly v1.1.8 正式发布！评论区上线 Bento 风格 @ 提及学者与 0ms 闪电模糊搜索浮窗；重磅推出交互式官方学术智能体「Scholarly AI」，支持 8000 字符全文学术深层理解与 KaTeX 公式推导答疑；发帖编辑器集成全新学术快捷工具栏、零基础公式模板点选助手与数学函数符号面板，并升级极简低调奢华 AI 续写流光胶囊。',
    'update',
    'all',
    NOW(),
    TRUE
);
