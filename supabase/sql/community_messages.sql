-- Community feed hardening for production:
-- - explicit read/write policies for anon/authenticated
-- - deterministic RPC feed endpoint
-- - whoami RPC to inspect JWT role/claims from the app

alter table if exists public.community_messages enable row level security;

do $$
begin
  if to_regclass('public.community_messages') is null then
    raise exception 'public.community_messages does not exist';
  end if;
end $$;

drop policy if exists community_messages_select_public on public.community_messages;
create policy community_messages_select_public
  on public.community_messages
  for select
  to anon, authenticated
  using (true);

drop policy if exists community_messages_insert_public on public.community_messages;
create policy community_messages_insert_public
  on public.community_messages
  for insert
  to anon, authenticated
  with check (length(trim(coalesce(content, ''))) > 0);

grant select, insert on public.community_messages to anon, authenticated;

create or replace function public.community_whoami()
returns table (
  db_role text,
  auth_role text,
  auth_uid uuid,
  jwt_role text,
  jwt_sub text,
  jwt_iss text,
  jwt_exp bigint
)
language sql
stable
security invoker
set search_path = public, auth
as $$
with claims as (
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb as jwt_claims
)
select
  current_user::text as db_role,
  auth.role()::text as auth_role,
  auth.uid() as auth_uid,
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    claims.jwt_claims ->> 'role'
  ) as jwt_role,
  claims.jwt_claims ->> 'sub' as jwt_sub,
  claims.jwt_claims ->> 'iss' as jwt_iss,
  nullif(claims.jwt_claims ->> 'exp', '')::bigint as jwt_exp
from claims;
$$;

create or replace function public.community_feed(p_limit integer default 50)
returns table (
  id text,
  public_user_id text,
  author_name text,
  author_avatar text,
  content text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id::text,
    m.public_user_id::text,
    m.author_name,
    m.author_avatar,
    m.content,
    m.created_at
  from public.community_messages m
  order by m.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

grant execute on function public.community_whoami() to anon, authenticated;
grant execute on function public.community_feed(integer) to anon, authenticated;
