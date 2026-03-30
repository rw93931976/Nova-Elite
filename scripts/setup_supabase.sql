-- SQL Setup for Nova Phase 2: Nervous System (Supabase)
-- Apply this in your Supabase SQL Editor for project: nqrtqfgbnwzsveemuyuu

-- 1. Nova Thoughts (OODAR Logs)
CREATE TABLE IF NOT EXISTS public.nova_thoughts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage TEXT NOT NULL,
    content TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    message_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Nova Messages (Conversation History)
CREATE TABLE IF NOT EXISTS public.nova_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Nova Tasks (Task Memory)
CREATE TABLE IF NOT EXISTS public.nova_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nova_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_tasks ENABLE ROW LEVEL SECURITY;

-- Public Access Policies (for development)
CREATE POLICY "Public full access thoughts" ON public.nova_thoughts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access messages" ON public.nova_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access tasks"    ON public.nova_tasks    FOR ALL USING (true) WITH CHECK (true);
