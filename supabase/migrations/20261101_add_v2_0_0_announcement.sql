-- ==============================================================================
-- 迁移：写入 Scholarly v2.0.0 创世里程碑正式版全站公告并替换旧版本通知
-- ==============================================================================

-- 1. 将历史版本更新类型的活跃公告置为非活跃
UPDATE public.system_announcements
SET is_active = FALSE
WHERE category = 'update' AND is_active = TRUE;

-- 2. 写入最新的 v2.0.0 创世里程碑正式版全站公告
INSERT INTO public.system_announcements (
    title,
    content,
    category,
    target_audience,
    start_time,
    is_active
) VALUES (
    '【重磅发布】Scholarly v2.0.0 创世里程碑正式上线：次时代流体美学、多元学术数据看板、Apple Liquid Glass 与架构全量同步',
    'Scholarly 正式迈入 2.0 时代！本次里程碑大版本完整集成了近期开展的四大核心工程突破：从 Landing 首页次时代流体美学与 120fps 动效重塑，到个人主页多元活跃分析看板（学术热力图、原生六维领域雷达图与学者画像）；从全站 Apple Liquid Glass 无边框设计系统与专栏/对决精细化体验升级，到底层数据库架构全量同步、学者等级体系与企业级生产安全加固 —— 构筑起理性、通透、高效与安全的顶尖学术殿堂。',
    'update',
    'all',
    NOW(),
    TRUE
);
