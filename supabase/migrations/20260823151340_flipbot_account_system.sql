create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  username text not null,
  location text not null default '',
  bio text not null default '',
  plan text not null default 'Starter' check (plan in ('Starter', 'Plus', 'Pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) between 1 and 80),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_location_length check (char_length(location) <= 120),
  constraint profiles_bio_length check (char_length(bio) <= 160)
);

create unique index profiles_username_lower_unique on public.profiles (lower(username));

create table public.user_settings (
  id uuid primary key references auth.users (id) on delete cascade,
  currency text not null default 'GBP' check (currency in ('GBP', 'USD', 'EUR')),
  region text not null default 'United Kingdom' check (char_length(region) <= 100),
  default_marketplace text not null default 'Facebook' check (default_marketplace in ('Facebook', 'eBay')),
  default_distance integer not null default 15 check (default_distance between 1 and 100),
  min_profit numeric(12, 2) not null default 40 check (min_profit >= 0),
  max_purchase numeric(12, 2) not null default 500 check (max_purchase >= 0),
  risk_tolerance text not null default 'Medium' check (risk_tolerance in ('Low', 'Medium', 'High')),
  email_alerts boolean not null default true,
  quiet_hours text not null default '22:00-08:00' check (char_length(quiet_hours) <= 32),
  compact_cards boolean not null default false,
  reduced_motion boolean not null default false,
  density text not null default 'Comfortable' check (density in ('Comfortable', 'Compact')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their own settings"
on public.user_settings for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own settings"
on public.user_settings for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on public.profiles from anon, authenticated;
revoke all on public.user_settings from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, username, location, bio) on public.profiles to authenticated;

grant select on public.user_settings to authenticated;
grant update (
  currency,
  region,
  default_marketplace,
  default_distance,
  min_profit,
  max_purchase,
  risk_tolerance,
  email_alerts,
  quiet_hours,
  compact_cards,
  reduced_motion,
  density
) on public.user_settings to authenticated;

create or replace function flipbot_private.set_account_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function flipbot_private.set_account_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function flipbot_private.set_account_updated_at();

create or replace function flipbot_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  if requested_username !~ '^[a-z0-9_]{3,24}$' then
    requested_username := 'user_' || left(replace(new.id::text, '-', ''), 12);
  end if;

  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Flipbot member'),
    requested_username
  );

  insert into public.user_settings (id) values (new.id);
  return new;
end;
$$;

revoke all on function flipbot_private.handle_new_auth_user() from public;
revoke all on function flipbot_private.set_account_updated_at() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function flipbot_private.handle_new_auth_user();
