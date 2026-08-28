-- ==============================================================================
-- 迁移：写入 Scholarly v1.1.7 正式版全站公告并替换旧版本通知
-- ==============================================================================

-- 1. 将历史版本更新类型的活跃公告置为非活跃
UPDATE public.system_announcements
SET is_active = FALSE
WHERE category = 'update' AND is_active = TRUE;

-- 2. 写入最新的 v1.1.7 正式版全站公告
INSERT INTO public.system_announcements (
    title,
    content,
    category,
    target_audience,
    start_time,
    is_active
) VALUES (
    '【重磅发布】Scholarly v1.1.7 正式上线：英汉全站双语、16:9 封面图与三大核心 UI 深度重构',
    'Scholarly v1.1.7 正式发布！全栈接入中英双语国际化（i18n），上线 16:9 帖子封面图与正文配图智能提取，深度重构控制台主页、帖子编辑器与个人主页三大核心 UI，并推出 3 步迎新向导、6 步互动式新手教学营、用户搜索学术名片卡及学术聊天代码高亮功能。',
    'update',
    'all',
    NOW(),
    TRUE
);

