-- 开启 lab_post_links 与 lab_members 的实时广播监听发布
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'lab_post_links'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_post_links;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'lab_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_members;
    END IF;
END $$;
