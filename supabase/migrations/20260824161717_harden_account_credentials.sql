create or replace function flipbot_private.is_allowed_username(candidate text)
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select
    candidate ~ '^[a-z0-9][a-z0-9_]{1,22}[a-z0-9]$'
    and candidate !~ '__'
    and candidate <> all (array[
      'admin', 'administrator', 'api', 'auth', 'billing', 'flipbot', 'help', 'moderator',
      'null', 'official', 'root', 'security', 'staff', 'support', 'system', 'undefined', 'www'
    ]::text[])
    and translate(candidate, '013457_-.', 'oieast') !~ '(nigger|nigga|faggot|kike|chink|spic|retard)';
$$;

revoke all on function flipbot_private.is_allowed_username(text) from public;

alter table public.profiles
  add constraint profiles_username_allowed
  check (flipbot_private.is_allowed_username(username)) not valid;

alter table public.profiles validate constraint profiles_username_allowed;

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
  if not flipbot_private.is_allowed_username(requested_username) then
    raise exception using
      errcode = 'check_violation',
      message = 'Username is not allowed';
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
