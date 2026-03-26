-- VUE Communities Supabase setup
-- Purpose: complete the lightweight marketing/admin backend without mixing Oasis and Cornerstone data
-- Safe to run in Supabase SQL editor for project povizsshrvyqcaszwzmr

begin;

-- ---------------------------------------------------------------------------
-- contact_submissions: align schema with admin dashboard expectations
-- ---------------------------------------------------------------------------

alter table if exists public.contact_submissions
  add column if not exists reviewed boolean not null default false;

create index if not exists idx_contact_submissions_created_at
  on public.contact_submissions (created_at desc);

create index if not exists idx_contact_submissions_reviewed
  on public.contact_submissions (reviewed);

create index if not exists idx_contact_submissions_community
  on public.contact_submissions (community);

-- Keep community values constrained so data does not drift or get mixed.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contact_submissions_community_check'
  ) then
    alter table public.contact_submissions
      add constraint contact_submissions_community_check
      check (
        community is null
        or community in ('The Oasis', 'Cornerstone', 'Still deciding')
      );
  end if;
end $$;

alter table public.contact_submissions enable row level security;

-- Public website: allow anonymous inserts only.
drop policy if exists "anon_insert_contact_submissions" on public.contact_submissions;
create policy "anon_insert_contact_submissions"
  on public.contact_submissions
  for insert
  to anon
  with check (
    community is null
    or community in ('The Oasis', 'Cornerstone', 'Still deciding')
  );

-- Admin users: authenticated users can read all submissions.
drop policy if exists "authenticated_select_contact_submissions" on public.contact_submissions;
create policy "authenticated_select_contact_submissions"
  on public.contact_submissions
  for select
  to authenticated
  using (true);

-- Admin users: authenticated users can update reviewed status / metadata.
drop policy if exists "authenticated_update_contact_submissions" on public.contact_submissions;
create policy "authenticated_update_contact_submissions"
  on public.contact_submissions
  for update
  to authenticated
  using (true)
  with check (
    community is null
    or community in ('The Oasis', 'Cornerstone', 'Still deciding')
  );

-- ---------------------------------------------------------------------------
-- availability: public read, authenticated admin write
-- ---------------------------------------------------------------------------

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  community text not null,
  unit_type text not null,
  status text not null,
  notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint availability_community_check
    check (community in ('The Oasis', 'Cornerstone')),

  constraint availability_status_check
    check (status in ('available', 'limited', 'waitlist', 'unavailable')),

  constraint availability_unique_community_unit unique (community, unit_type)
);

create index if not exists idx_availability_community
  on public.availability (community);

create index if not exists idx_availability_status
  on public.availability (status);

alter table public.availability enable row level security;

-- Public website can read availability badges.
drop policy if exists "public_read_availability" on public.availability;
create policy "public_read_availability"
  on public.availability
  for select
  to anon, authenticated
  using (true);

-- Admin users can manage availability rows.
drop policy if exists "authenticated_insert_availability" on public.availability;
create policy "authenticated_insert_availability"
  on public.availability
  for insert
  to authenticated
  with check (
    community in ('The Oasis', 'Cornerstone')
    and status in ('available', 'limited', 'waitlist', 'unavailable')
  );

drop policy if exists "authenticated_update_availability" on public.availability;
create policy "authenticated_update_availability"
  on public.availability
  for update
  to authenticated
  using (true)
  with check (
    community in ('The Oasis', 'Cornerstone')
    and status in ('available', 'limited', 'waitlist', 'unavailable')
  );

-- Seed the expected unit rows so the admin UI has a stable base.
insert into public.availability (community, unit_type, status, notes)
values
  ('The Oasis', '1BR', 'available', null),
  ('The Oasis', '2BR', 'available', null),
  ('The Oasis', '2BR + Office/Study', 'available', null),
  ('The Oasis', '3BR + Office/Study', 'available', null),
  ('The Oasis', '4BR', 'available', null),
  ('The Oasis', '6BR', 'available', null),
  ('Cornerstone', '3BR/3BA', 'available', null)
on conflict (community, unit_type) do nothing;

commit;
