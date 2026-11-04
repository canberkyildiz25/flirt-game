-- flirt-game veritabanı şeması. Supabase panelinde SQL Editor'e yapıştırıp bir kez çalıştırın.
-- Tekrar çalıştırmak güvenlidir: her şey "if not exists" / "or replace" ile kurulur.

-- Oyuncu profili: kayıtta doğum tarihi zorunlu, 18 yaş altı kayıt olamaz.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  birth_date date not null,
  coins integer not null default 50 check (coins >= 0),
  created_at timestamptz not null default now(),
  constraint adult check (birth_date <= (current_date - interval '18 years'))
);

-- Karakter başına ilerleme.
create table if not exists public.character_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id text not null,
  affection integer not null default 0 check (affection between 0 and 100),
  stage text not null default 'stranger',
  is_unlocked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, character_id)
);

-- Karakter başına sohbet; mesajlar ve modele giden geçmiş birlikte tutulur.
create table if not exists public.conversations (
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id text not null,
  messages jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, character_id)
);

-- Günlük mesaj sayacı. Yalnızca sohbet sunucusu (service_role) yazar.
create table if not exists public.message_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.profiles enable row level security;
alter table public.character_progress enable row level security;
alter table public.conversations enable row level security;
alter table public.message_usage enable row level security;

-- Herkes yalnızca kendi satırlarını görür ve değiştirir.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own progress" on public.character_progress;
create policy "own progress" on public.character_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own conversations" on public.conversations;
create policy "own conversations" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "read own usage" on public.message_usage;
create policy "read own usage" on public.message_usage
  for select using (auth.uid() = user_id);

-- Doğum tarihi kullanıcı kaydında gelir; profil oluşturulamazsa (18 yaş altı) kayıt da iptal olur.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, birth_date)
  values (new.id, (new.raw_user_meta_data ->> 'birth_date')::date);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sohbet sunucusu her mesajda çağırır: bugünkü sayıyı bir artırır ve yeni değeri döner.
create or replace function public.bump_message_usage(p_user uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.message_usage (user_id, day, count)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = message_usage.count + 1
  returning count;
$$;

revoke all on function public.bump_message_usage(uuid) from public, anon, authenticated;
grant execute on function public.bump_message_usage(uuid) to service_role;
