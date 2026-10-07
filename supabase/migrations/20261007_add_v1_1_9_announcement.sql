-- ==============================================================================
-- 迁移：写入 Scholarly v1.1.9 正式版全站公告并替换旧版本通知
-- ==============================================================================

-- 1. 将历史版本更新类型的活跃公告置为非活跃
UPDATE public.system_announcements
SET is_active = FALSE
WHERE category = 'update' AND is_active = TRUE;

-- 2. 写入最新的 v1.1.9 正式版全站公告
INSERT INTO public.system_announcements (
    title,
    content,
    category,
    target_audience,
    start_time,
    is_active
) VALUES (
    '【重磅发布】Scholarly v1.1.9 正式上线：学术共创实验室、Yjs CRDT 实时推演、3D 立体几何模型与行间划线学术批注',
    'Scholarly v1.1.9 正式发布！重磅推出「学术共创实验室」，支持密码加密研讨室、文献同读视口同频与自由分屏，并基于 Yjs CRDT 实现毫秒级多人在线笔记与公式推演，支持研讨成果联合署名发帖；编辑器迎来革命性「3D 立体几何模型」引擎，在长文中直接嵌入可 360° 交互旋转、带空间透视遮挡与 LaTeX 标签的三维几何结构；全新上线「行间学术批注与边注微线程研讨」，支持正文与公式划词展开四维学术语义探讨；同时构建 AI 审稿 AST 内容快照与违规隔离申诉闭环防御体系。',
    'update',
    'all',
    NOW(),
    TRUE
);
