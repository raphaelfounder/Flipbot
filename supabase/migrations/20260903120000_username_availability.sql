create or replace function public.username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    candidate ~ '^[a-z0-9][a-z0-9_]{1,22}[a-z0-9]$'
    and not exists (
      select 1
      from public.profiles
      where lower(username) = lower(candidate)
    );
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
