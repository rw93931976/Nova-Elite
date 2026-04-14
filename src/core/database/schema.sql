-- Sovereign Persistence Schema (v1.0)

-- 1. Sessions: Tracking high-level conversation state
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id TEXT DEFAULT 'ray-sovereign',
    summary TEXT,
    status TEXT DEFAULT 'active' -- active, completed, archived
);

-- 2. Leads: Persistence for trade leads managed by Nova
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    client_name TEXT,
    phone TEXT,
    email TEXT,
    vertical TEXT, -- hvac, plumbing, etc.
    score INTEGER DEFAULT 0, -- AI qualification score (1-10)
    source TEXT, -- missed_call, chat, referral
    notes TEXT,
    status TEXT DEFAULT 'new' -- new, following_up, dead, converted
);

-- 3. Events: Granular logs within a session
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    type TEXT, -- user_input, ai_response, system_alert, lead_capture
    content JSONB,
    metadata JSONB
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Simple policies for Ray (Sovereign Access)
CREATE POLICY "Allow all access to Ray" ON public.sessions FOR ALL USING (true);
CREATE POLICY "Allow all access to Ray" ON public.leads FOR ALL USING (true);
CREATE POLICY "Allow all access to Ray" ON public.events FOR ALL USING (true);
