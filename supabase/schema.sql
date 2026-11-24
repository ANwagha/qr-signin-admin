-- Musterpass database: tables, security rules and photo storage.
-- Paste this whole file into Supabase → SQL Editor → New query, then Run.
-- Safe to run again after changes: it only creates what's missing and replaces functions and rules.
--
-- Who can do what:
--   * Company users (signed in) see and change only their own company's rows (row level security).
--   * Workers clocking in never sign in. Their clock-ins go through the app's server
--     (app/api/clock/*), which uses the secret key and checks each request itself.
--   * Photos live in a private bucket. Company users get short-lived links to their own photos only.

-- ---------- Tables ----------

create table if not exists public.companies (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(name) between 1 and 120),
  owner_name text not null default '',
  owner_email text not null default '',
  plan text not null default 'trial' check (plan in ('trial', 'crew', 'company', 'enterprise')),
  trial_ends_at timestamptz not null default now() + interval '30 days',
  brand jsonb,
  created_at timestamptz not null default now()
);

-- Links a signed-in user to the company they manage.
create table if not exists public.members (
  company_id text not null references public.companies on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'supervisor')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
create index if not exists members_user_idx on public.members (user_id);

create table if not exists public.sites (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public.companies on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  address text not null default '',
  lat double precision,
  lng double precision,
  radius_m integer not null default 150 check (radius_m between 25 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists sites_company_idx on public.sites (company_id);

create table if not exists public.people (
  id text primary key,
  company_id text not null references public.companies on delete cascade,
  name text not null,
  employer text not null default '',
  phone text not null default '',
  role text not null check (role in ('safety_manager', 'supervisor', 'worker', 'subcontractor', 'visitor')),
  consent_version text,
  -- sha256 of the random key kept on the worker's phone; proves it's the same phone next time.
  device_key_hash text,
  created_at timestamptz not null default now()
);
create index if not exists people_company_idx on public.people (company_id);

create table if not exists public.invites (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public.companies on delete cascade,
  email text not null,
  role text not null check (role in ('safety_manager', 'supervisor')),
  created_at timestamptz not null default now()
);
create index if not exists invites_company_idx on public.invites (company_id);

create table if not exists public.forms (
  company_id text not null references public.companies on delete cascade,
  id text not null,
  position integer not null default 0,
  def jsonb not null,
  primary key (company_id, id)
);

create table if not exists public.check_ins (
  id text primary key,
  company_id text not null references public.companies on delete cascade,
  site_id text not null references public.sites on delete cascade,
  person_id text not null references public.people on delete cascade,
  in_at timestamptz not null default now(),
  out_at timestamptz,
  selfie jsonb not null,
  presence jsonb not null,
  forms jsonb not null default '[]',
  out_forms jsonb not null default '[]',
  visitor jsonb,
  photos jsonb not null default '[]',
  signature text,
  review jsonb not null default '{"selfie": "pending", "countersignedAt": null, "countersignedBy": null}',
  created_at timestamptz not null default now()
);
create index if not exists check_ins_company_idx on public.check_ins (company_id, in_at desc);
create index if not exists check_ins_person_idx on public.check_ins (person_id, in_at desc);

-- ---------- Helpers ----------

-- True when the signed-in user belongs to the company. Runs with owner rights so the
-- rules below can use it without being able to read members directly.
create or replace function public.is_member(cid text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.members m where m.company_id = cid and m.user_id = auth.uid());
$$;

-- A poster link that no other site uses. The demo's links stay free for the demo.
create or replace function public.unique_slug(base text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  root text := coalesce(nullif(trim(both '-' from regexp_replace(lower(coalesce(base, '')), '[^a-z0-9]+', '-', 'g')), ''), 'site');
  candidate text := root;
  n integer := 1;
begin
  root := left(root, 60);
  candidate := root;
  while candidate in ('lonsdale-tower', 'brentwood-yard') or exists (select 1 from public.sites s where s.slug = candidate) loop
    n := n + 1;
    candidate := root || '-' || n;
  end loop;
  return candidate;
end;
$$;

-- Sign-up: creates the company, makes the caller its owner, and adds the first site,
-- starter forms and invites in one go.
create or replace function public.create_company(
  p_name text,
  p_owner_name text,
  p_owner_email text,
  p_site jsonb,
  p_forms jsonb,
  p_invites jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  cid text;
  sid text := gen_random_uuid()::text;
  site_slug text;
  f jsonb;
  i integer := 0;
  inv jsonb;
begin
  if uid is null then
    raise exception 'Sign in first.' using errcode = '28000';
  end if;
  if exists (select 1 from public.members m where m.user_id = uid) then
    raise exception 'This account already has a company.' using errcode = '23505';
  end if;

  insert into public.companies (name, owner_name, owner_email)
  values (trim(p_name), trim(p_owner_name), trim(p_owner_email))
  returning id into cid;

  insert into public.members (company_id, user_id, role) values (cid, uid, 'owner');

  insert into public.people (id, company_id, name, employer, role)
  values (gen_random_uuid()::text, cid, trim(p_owner_name), trim(p_name), 'safety_manager');

  site_slug := public.unique_slug(p_site ->> 'name');
  insert into public.sites (id, company_id, slug, name, address, lat, lng, radius_m)
  values (
    sid, cid, site_slug,
    trim(p_site ->> 'name'),
    coalesce(p_site ->> 'address', ''),
    (p_site ->> 'lat')::double precision,
    (p_site ->> 'lng')::double precision,
    coalesce((p_site ->> 'radiusM')::integer, 150)
  );

  for f in select * from jsonb_array_elements(coalesce(p_forms, '[]'::jsonb)) loop
    insert into public.forms (company_id, id, position, def) values (cid, f ->> 'id', i, f);
    i := i + 1;
  end loop;

  for inv in select * from jsonb_array_elements(coalesce(p_invites, '[]'::jsonb)) loop
    insert into public.invites (company_id, email, role) values (cid, inv ->> 'email', inv ->> 'role');
  end loop;

  return jsonb_build_object('companyId', cid, 'siteId', sid, 'slug', site_slug);
end;
$$;

-- Adds a site with a poster link no other site uses.
create or replace function public.add_site(p_company text, p_site jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sid text := gen_random_uuid()::text;
  site_slug text;
begin
  if not public.is_member(p_company) then
    raise exception 'Not your company.' using errcode = '42501';
  end if;
  site_slug := public.unique_slug(p_site ->> 'name');
  insert into public.sites (id, company_id, slug, name, address, lat, lng, radius_m)
  values (
    sid, p_company, site_slug,
    trim(p_site ->> 'name'),
    coalesce(p_site ->> 'address', ''),
    (p_site ->> 'lat')::double precision,
    (p_site ->> 'lng')::double precision,
    coalesce((p_site ->> 'radiusM')::integer, 150)
  );
  return jsonb_build_object('id', sid, 'slug', site_slug);
end;
$$;

-- Command center overview of every company. Only the server (secret key) can call it.
create or replace function public.command_company_stats()
returns table (
  id text,
  name text,
  owner_email text,
  plan text,
  trial_ends_at timestamptz,
  created_at timestamptz,
  sites bigint,
  people bigint,
  check_ins bigint,
  on_site bigint,
  last_check_in timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id, c.name, c.owner_email, c.plan, c.trial_ends_at, c.created_at,
    (select count(*) from public.sites s where s.company_id = c.id),
    (select count(*) from public.people p where p.company_id = c.id),
    (select count(*) from public.check_ins k where k.company_id = c.id),
    (select count(*) from public.check_ins k where k.company_id = c.id and k.out_at is null and k.in_at > now() - interval '24 hours'),
    (select max(k.in_at) from public.check_ins k where k.company_id = c.id)
  from public.companies c
  order by c.created_at desc;
$$;

-- ---------- Who may call what ----------

revoke all on function public.is_member(text) from public, anon;
revoke all on function public.unique_slug(text) from public, anon, authenticated;
revoke all on function public.create_company(text, text, text, jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.add_site(text, jsonb) from public, anon;
revoke all on function public.command_company_stats() from public, anon, authenticated;
grant execute on function public.is_member(text) to authenticated;
grant execute on function public.create_company(text, text, text, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.add_site(text, jsonb) to authenticated;
grant execute on function public.command_company_stats() to service_role;

-- Start from nothing, then grant only what the app uses. Signed-out visitors get no table access.
revoke all on public.companies, public.members, public.sites, public.people, public.invites, public.forms, public.check_ins from anon, authenticated;

grant select on public.companies to authenticated;
grant update (name, owner_name, brand, plan) on public.companies to authenticated;
grant select on public.members to authenticated;
grant select, update (name, address, lat, lng, radius_m) on public.sites to authenticated;
-- No device_key_hash: that stays server-side.
grant select (id, company_id, name, employer, phone, role, consent_version, created_at) on public.people to authenticated;
grant select, insert, delete on public.invites to authenticated;
grant select, insert, update, delete on public.forms to authenticated;
grant select, update (review) on public.check_ins to authenticated;

-- ---------- Row level security ----------

alter table public.companies enable row level security;
alter table public.members enable row level security;
alter table public.sites enable row level security;
alter table public.people enable row level security;
alter table public.invites enable row level security;
alter table public.forms enable row level security;
alter table public.check_ins enable row level security;

drop policy if exists "members read their company" on public.companies;
create policy "members read their company" on public.companies for select to authenticated using (public.is_member(id));
drop policy if exists "members update their company" on public.companies;
create policy "members update their company" on public.companies for update to authenticated using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists "users read their memberships" on public.members;
create policy "users read their memberships" on public.members for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "members manage sites" on public.sites;
create policy "members manage sites" on public.sites for all to authenticated using (public.is_member(company_id)) with check (public.is_member(company_id));

drop policy if exists "members read people" on public.people;
create policy "members read people" on public.people for select to authenticated using (public.is_member(company_id));

drop policy if exists "members manage invites" on public.invites;
create policy "members manage invites" on public.invites for all to authenticated using (public.is_member(company_id)) with check (public.is_member(company_id));

drop policy if exists "members manage forms" on public.forms;
create policy "members manage forms" on public.forms for all to authenticated using (public.is_member(company_id)) with check (public.is_member(company_id));

drop policy if exists "members read and review check-ins" on public.check_ins;
create policy "members read and review check-ins" on public.check_ins for all to authenticated using (public.is_member(company_id)) with check (public.is_member(company_id));

-- ---------- Live dashboard ----------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'check_ins'
  ) then
    alter publication supabase_realtime add table public.check_ins;
  end if;
end;
$$;

-- ---------- Photo storage ----------

-- Private bucket. Files are stored as {company id}/{check-in id}/{photo id}.jpg by the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members read their photos" on storage.objects;
create policy "members read their photos" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_member((storage.foldername(name))[1]));
