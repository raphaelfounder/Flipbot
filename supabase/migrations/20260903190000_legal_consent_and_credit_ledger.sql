create table public.legal_acceptances (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  acceptable_use_version text not null,
  accepted_at timestamptz not null default now(),
  constraint legal_acceptances_versions_present check (
    char_length(terms_version) > 0 and
    char_length(privacy_version) > 0 and
    char_length(acceptable_use_version) > 0
  )
);

create table public.marketing_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_opt_in boolean not null default false,
  changed_at timestamptz not null default now()
);

create table public.credit_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  subscription_credits integer not null default 0 check (subscription_credits >= 0),
  subscription_credits_expire_at timestamptz,
  purchased_credits integer not null default 0 check (purchased_credits >= 0),
  updated_at timestamptz not null default now(),
  constraint subscription_credit_expiry_required check (
    subscription_credits = 0 or subscription_credits_expire_at is not null
  )
);

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key text not null,
  reason text not null check (char_length(reason) between 1 and 120),
  subscription_delta integer not null default 0,
  purchased_delta integer not null default 0,
  related_entry_id bigint references public.credit_ledger (id),
  created_at timestamptz not null default now(),
  constraint credit_ledger_nonzero check (subscription_delta <> 0 or purchased_delta <> 0),
  constraint credit_ledger_idempotency_unique unique (user_id, idempotency_key)
);

insert into public.marketing_preferences (user_id, email_opt_in)
select id, false from auth.users
on conflict (user_id) do nothing;

insert into public.credit_accounts (user_id)
select id from auth.users
on conflict (user_id) do nothing;

alter table public.legal_acceptances enable row level security;
alter table public.marketing_preferences enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_ledger enable row level security;

create policy "Users can read their own legal acceptances"
on public.legal_acceptances for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own marketing preference"
on public.marketing_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their own marketing preference"
on public.marketing_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read their own credit account"
on public.credit_accounts for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own credit ledger"
on public.credit_ledger for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.legal_acceptances, public.marketing_preferences, public.credit_accounts, public.credit_ledger from anon, authenticated;
grant select on public.legal_acceptances, public.marketing_preferences, public.credit_accounts, public.credit_ledger to authenticated;
grant update (email_opt_in) on public.marketing_preferences to authenticated;

create or replace function flipbot_private.set_preference_changed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.changed_at = now();
  return new;
end;
$$;

revoke all on function flipbot_private.set_preference_changed_at() from public;

create trigger marketing_preferences_set_changed_at
before update on public.marketing_preferences
for each row execute function flipbot_private.set_preference_changed_at();

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
    raise exception using errcode = 'check_violation', message = 'Username is not allowed';
  end if;

  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Flipbot member'),
    requested_username
  );
  insert into public.user_settings (id) values (new.id);
  insert into public.credit_accounts (user_id) values (new.id);
  insert into public.marketing_preferences (user_id, email_opt_in)
  values (new.id, coalesce((new.raw_user_meta_data ->> 'marketing_email_consent')::boolean, false));
  insert into public.legal_acceptances (
    user_id, terms_version, privacy_version, acceptable_use_version
  ) values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'accepted_terms_version', ''), 'unknown'),
    coalesce(nullif(new.raw_user_meta_data ->> 'accepted_privacy_version', ''), 'unknown'),
    coalesce(nullif(new.raw_user_meta_data ->> 'accepted_acceptable_use_version', ''), 'unknown')
  );
  return new;
end;
$$;

revoke all on function flipbot_private.handle_new_auth_user() from public;

create or replace function public.spend_credits(
  amount integer,
  operation_reason text,
  operation_key text
)
returns public.credit_ledger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account public.credit_accounts;
  subscription_spend integer;
  purchased_spend integer;
  entry public.credit_ledger;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if amount <= 0 then raise exception 'Credit amount must be positive'; end if;
  if char_length(operation_reason) not between 1 and 120 then raise exception 'Invalid reason'; end if;
  if char_length(operation_key) not between 8 and 160 then raise exception 'Invalid operation key'; end if;

  select * into account from public.credit_accounts
  where user_id = current_user_id for update;
  if not found then raise exception 'Credit account not found'; end if;

  if account.subscription_credits_expire_at <= now() then
    account.subscription_credits := 0;
    account.subscription_credits_expire_at := null;
  end if;
  if account.subscription_credits + account.purchased_credits < amount then
    raise exception 'Insufficient credits';
  end if;

  subscription_spend := least(account.subscription_credits, amount);
  purchased_spend := amount - subscription_spend;

  update public.credit_accounts set
    subscription_credits = account.subscription_credits - subscription_spend,
    purchased_credits = account.purchased_credits - purchased_spend,
    updated_at = now()
  where user_id = current_user_id;

  insert into public.credit_ledger (
    user_id, idempotency_key, reason, subscription_delta, purchased_delta
  ) values (
    current_user_id, operation_key, operation_reason, -subscription_spend, -purchased_spend
  ) returning * into entry;
  return entry;
end;
$$;

revoke all on function public.spend_credits(integer, text, text) from public, anon, service_role;
grant execute on function public.spend_credits(integer, text, text) to authenticated;

create or replace function flipbot_private.restore_credit_entry(
  spent_entry_id bigint,
  restore_key text
)
returns public.credit_ledger
language plpgsql
security definer
set search_path = ''
as $$
declare
  spent public.credit_ledger;
  restored public.credit_ledger;
begin
  select * into spent from public.credit_ledger where id = spent_entry_id for update;
  if not found or spent.subscription_delta > 0 or spent.purchased_delta > 0 then
    raise exception 'Charge entry not found';
  end if;
  if exists (select 1 from public.credit_ledger where related_entry_id = spent.id) then
    raise exception 'Credits already restored';
  end if;

  update public.credit_accounts set
    subscription_credits = subscription_credits + (-spent.subscription_delta),
    purchased_credits = purchased_credits + (-spent.purchased_delta),
    updated_at = now()
  where user_id = spent.user_id;

  insert into public.credit_ledger (
    user_id, idempotency_key, reason, subscription_delta, purchased_delta, related_entry_id
  ) values (
    spent.user_id, restore_key, 'Automatic restoration for failed operation',
    -spent.subscription_delta, -spent.purchased_delta, spent.id
  ) returning * into restored;
  return restored;
end;
$$;

revoke all on function flipbot_private.restore_credit_entry(bigint, text) from public;
grant execute on function flipbot_private.restore_credit_entry(bigint, text) to service_role;
