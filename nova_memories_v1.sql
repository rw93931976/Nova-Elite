-- Nova voice memory v1 (run once in Supabase SQL editor if columns are missing)
-- Existing table already has: id, created_at, category, content, importance, metadata, embedding

create extension if not exists vector;

alter table public.nova_memories
  add column if not exists user_id text default 'ray-sovereign';

create index if not exists nova_memories_user_id_idx on public.nova_memories (user_id);

create index if not exists nova_memories_category_idx on public.nova_memories (category);

-- Optional semantic search (requires non-null embeddings)
create or replace function public.match_nova_memories(
  query_embedding vector(1536),
  match_count int default 5,
  filter_user_id text default 'ray-sovereign'
)
returns table (
  id uuid,
  content text,
  category text,
  importance float,
  similarity float
)
language sql stable
as $$
  select
    m.id,
    m.content,
    m.category,
    m.importance,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.nova_memories m
  where m.embedding is not null
    and (m.user_id = filter_user_id or m.metadata->>'user_id' = filter_user_id)
    and m.category not in ('business', 'emotion')
  order by m.embedding <=> query_embedding
  limit match_count;
$$;
