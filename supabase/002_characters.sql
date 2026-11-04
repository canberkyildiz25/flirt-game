-- Kullanıcının oluşturduğu karakterler, portre deposu ve günlük ödül.
-- schema.sql'den sonra SQL Editor'de bir kez çalıştırın; tekrar çalıştırmak güvenlidir.

alter table public.profiles add column if not exists last_reward_date date;

create table if not exists public.custom_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  age integer not null check (age between 18 and 45),
  occupation text not null,
  personality text not null,
  hobbies text[] not null default '{}',
  speaking_style text not null,
  bio text not null default '' check (char_length(bio) <= 240),
  look jsonb not null,
  color text not null,
  portrait_url text not null,
  created_at timestamptz not null default now()
);

alter table public.custom_characters enable row level security;

-- Kullanıcı kendi karakterlerini görür ve silebilir; oluşturma yalnızca sunucudan (portre üretildikten sonra).
drop policy if exists "read own characters" on public.custom_characters;
create policy "read own characters" on public.custom_characters
  for select using (auth.uid() = user_id);

drop policy if exists "delete own characters" on public.custom_characters;
create policy "delete own characters" on public.custom_characters
  for delete using (auth.uid() = user_id);

-- Günlük portre sayacı; yalnızca sunucu yazar.
create table if not exists public.portrait_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.portrait_usage enable row level security;

create or replace function public.bump_portrait_usage(p_user uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.portrait_usage (user_id, day, count)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = portrait_usage.count + 1
  returning count;
$$;

revoke all on function public.bump_portrait_usage(uuid) from public, anon, authenticated;
grant execute on function public.bump_portrait_usage(uuid) to service_role;

-- Portreler herkese açık okunur (görsel adresi tahmin edilemez), yalnızca sunucu yükler.
insert into storage.buckets (id, name, public)
values ('portraits', 'portraits', true)
on conflict (id) do nothing;
