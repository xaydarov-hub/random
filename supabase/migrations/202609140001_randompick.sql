begin;
create extension if not exists pgcrypto;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, settings jsonb not null default '{}', created_at timestamptz not null default now());
create table public.instagram_integrations (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, account jsonb not null, encrypted_access_token text not null, token_expires_at timestamptz not null, connected_at timestamptz not null default now(), unique(user_id));
create table public.participant_lists (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null, type text not null check(type in ('participants','followers')), original_filename text, total_rows integer not null, valid_rows integer not null, created_at timestamptz not null default now(), unique(id,user_id));
create table public.participant_list_entries (id uuid primary key default gen_random_uuid(), list_id uuid not null, user_id uuid not null references auth.users(id) on delete cascade, username_original text not null, username_normalized text not null, ordinal integer not null, foreign key(list_id,user_id) references public.participant_lists(id,user_id) on delete cascade, unique(list_id,ordinal));
create table public.giveaway_sources (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, provider text not null, media jsonb not null, url text not null, cursor text, page_count integer not null default 0, complete boolean not null default false, created_at timestamptz not null default now(), unique(id,user_id));
create table public.comments (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, source_id uuid not null, comment_id text not null, payload jsonb not null, foreign key(source_id,user_id) references public.giveaway_sources(id,user_id) on delete cascade, unique(source_id,comment_id));
create table public.giveaways (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null, source_type text not null check(source_type in ('MANUAL_IMPORT','META_OFFICIAL','EXTERNAL_PROVIDER')), source jsonb not null, status text not null default 'ready' check(status in ('draft','ready','completed','archived')), filters jsonb not null, participant_count integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id));
create table public.giveaway_entries (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, giveaway_id uuid not null, payload jsonb not null, ordinal integer not null, foreign key(giveaway_id,user_id) references public.giveaways(id,user_id) on delete cascade, unique(id,giveaway_id,user_id), unique(giveaway_id,ordinal));
create table public.draws (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, giveaway_id uuid not null, sequence_number integer not null, eligible_count integer not null, winner_count integer not null, filters_snapshot jsonb not null, participant_pool_hash text not null check(length(participant_pool_hash)=64), pool_snapshot jsonb not null, random_method text not null, source jsonb not null, idempotency_key uuid not null, request_hash text not null, public boolean not null default false, created_at timestamptz not null default now(), foreign key(giveaway_id,user_id) references public.giveaways(id,user_id), unique(giveaway_id,sequence_number), unique(giveaway_id,idempotency_key), unique(id,giveaway_id,user_id));
create table public.winners (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, draw_id uuid not null, giveaway_id uuid not null, participant_entry_id uuid not null, username text not null, position integer not null, is_reserve boolean not null, comment_text text, created_at timestamptz not null default now(), foreign key(draw_id,giveaway_id,user_id) references public.draws(id,giveaway_id,user_id), foreign key(participant_entry_id,giveaway_id,user_id) references public.giveaway_entries(id,giveaway_id,user_id), unique(draw_id,position), unique(draw_id,participant_entry_id));
create table public.blacklist_entries (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, username text not null, created_at timestamptz not null default now(), unique(user_id,username));
create table public.audit_logs (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, action text not null, resource_id uuid not null, metadata jsonb not null default '{}', created_at timestamptz not null default now());
create table public.rate_limits (user_id uuid not null references auth.users(id) on delete cascade, bucket text not null, window_start timestamptz not null, hits integer not null, primary key(user_id,bucket));
do $$ declare t text; begin
  foreach t in array array['instagram_integrations','participant_lists','participant_list_entries','giveaway_sources','comments','giveaways','giveaway_entries','draws','winners','blacklist_entries','audit_logs','rate_limits'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create index on public.%I(user_id)',t);
    if t not in ('instagram_integrations','rate_limits') then
      execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t);
      execute format('grant select on public.%I to authenticated',t);
    end if;
    execute format('revoke insert, update, delete on public.%I from anon, authenticated',t);
  end loop;
end $$;
alter table public.profiles enable row level security;
create policy owner_read on public.profiles for select to authenticated using((select auth.uid())=id);
revoke all on public.instagram_integrations, public.rate_limits from anon, authenticated;
revoke insert,update,delete on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
create index on public.giveaway_entries(giveaway_id,ordinal);
create index on public.participant_list_entries(list_id,ordinal);
create index on public.comments(source_id);
create index on public.draws(giveaway_id,sequence_number);
create index on public.winners(giveaway_id);
-- Mutations go exclusively through authenticated server routes. Browser clients
-- cannot fabricate draws, change frozen entries or read encrypted tokens.
create function public.reject_audit_mutation() returns trigger language plpgsql as $$ begin raise exception 'Audit records are immutable'; end $$;
create trigger immutable_draws before update or delete on public.draws for each row execute function public.reject_audit_mutation();
create trigger immutable_winners before update or delete on public.winners for each row execute function public.reject_audit_mutation();
create trigger immutable_pool before update or delete on public.giveaway_entries for each row execute function public.reject_audit_mutation();
create trigger immutable_audit before update or delete on public.audit_logs for each row execute function public.reject_audit_mutation();
commit;
