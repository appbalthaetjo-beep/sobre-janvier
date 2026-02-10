-- user_devices: maps an authenticated user + deviceKey -> Expo push token

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_key text not null,
  expo_push_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_devices_device_key_uq on public.user_devices (device_key);
create index if not exists user_devices_user_id_idx on public.user_devices (user_id);

alter table public.user_devices enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_devices' and policyname = 'user_devices_select_own'
  ) then
    create policy user_devices_select_own
      on public.user_devices
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_devices' and policyname = 'user_devices_insert_own'
  ) then
    create policy user_devices_insert_own
      on public.user_devices
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_devices' and policyname = 'user_devices_update_own'
  ) then
    create policy user_devices_update_own
      on public.user_devices
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_devices_set_updated_at on public.user_devices;
create trigger user_devices_set_updated_at
before update on public.user_devices
for each row execute function public.set_updated_at();

