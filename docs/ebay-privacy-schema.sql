-- Dedicated storage for the NEW official eBay integration only.
-- Existing catalogue, third-party evidence, accounts and billing are untouched.
create schema if not exists flipbot_ebay;
revoke all on schema flipbot_ebay from public, anon, authenticated;
grant usage on schema flipbot_ebay to service_role;

create table if not exists flipbot_ebay.user_data (
  id uuid primary key default gen_random_uuid(),
  ebay_user_id text not null check (length(ebay_user_id) between 1 and 1024),
  ebay_username text,
  ebay_eias_token text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists ebay_data_user on flipbot_ebay.user_data(ebay_user_id);
create index if not exists ebay_data_username on flipbot_ebay.user_data(ebay_username);
create index if not exists ebay_data_eias on flipbot_ebay.user_data(ebay_eias_token);
create table if not exists flipbot_ebay.derived_data (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references flipbot_ebay.user_data(id) on delete cascade,
  payload jsonb not null
);
create table if not exists flipbot_ebay.deleted_subjects (
  identifier_hash text primary key,
  deleted_at timestamptz not null default now()
);
create table if not exists flipbot_ebay.deletion_receipts (
  notification_id text primary key,
  processed_at timestamptz not null default now(),
  deleted_records integer not null
);
alter table flipbot_ebay.user_data enable row level security;
alter table flipbot_ebay.derived_data enable row level security;
alter table flipbot_ebay.deleted_subjects enable row level security;
alter table flipbot_ebay.deletion_receipts enable row level security;
revoke all on all tables in schema flipbot_ebay from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema flipbot_ebay to service_role;

create or replace function flipbot_ebay.guard_deleted_subject()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  -- Serialise new ingestion and deletion; low-volume integration correctness first.
  perform pg_catalog.pg_advisory_xact_lock(648928417);
  if exists (
    select 1 from flipbot_ebay.deleted_subjects d
    where d.identifier_hash in (
      encode(sha256(convert_to('id:' || new.ebay_user_id, 'UTF8')), 'hex'),
      encode(sha256(convert_to('name:' || new.ebay_username, 'UTF8')), 'hex'),
      encode(sha256(convert_to('eias:' || new.ebay_eias_token, 'UTF8')), 'hex')
    )
  ) then raise exception 'eBay subject was deleted'; end if;
  return new;
end;
$$;
revoke all on function flipbot_ebay.guard_deleted_subject() from public, anon, authenticated;
drop trigger if exists guard_deleted_subject on flipbot_ebay.user_data;
create trigger guard_deleted_subject before insert or update on flipbot_ebay.user_data
  for each row execute function flipbot_ebay.guard_deleted_subject();

create or replace function public.flipbot_process_ebay_api_deletion(
  p_notification_id text, p_user_id text, p_username text default null, p_eias_token text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare removed integer;
begin
  if p_notification_id is null or length(p_notification_id) not between 1 and 256 or
     p_user_id is null or length(p_user_id) not between 1 and 1024 then
    raise exception 'Invalid deletion request';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(648928417);
  if exists (select 1 from flipbot_ebay.deletion_receipts where notification_id=p_notification_id) then
    return jsonb_build_object('deleted',true,'duplicate',true);
  end if;
  insert into flipbot_ebay.deleted_subjects(identifier_hash)
    select encode(sha256(convert_to(value,'UTF8')),'hex')
    from (values ('id:' || p_user_id), ('name:' || nullif(p_username,'')), ('eias:' || nullif(p_eias_token,''))) v(value)
    where value is not null on conflict do nothing;
  delete from flipbot_ebay.user_data
    where ebay_user_id=p_user_id
       or (nullif(p_username,'') is not null and ebay_username=p_username)
       or (nullif(p_eias_token,'') is not null and ebay_eias_token=p_eias_token);
  get diagnostics removed = row_count;
  insert into flipbot_ebay.deletion_receipts(notification_id,deleted_records) values(p_notification_id,removed);
  return jsonb_build_object('deleted',true,'deletedRecords',removed);
end;
$$;
revoke all on function public.flipbot_process_ebay_api_deletion(text,text,text,text) from public, anon, authenticated;
grant execute on function public.flipbot_process_ebay_api_deletion(text,text,text,text) to service_role;
