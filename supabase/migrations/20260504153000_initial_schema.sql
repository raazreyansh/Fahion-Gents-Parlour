create extension if not exists "pgcrypto";

create type user_role as enum ('customer', 'owner', 'staff');
create type booking_status as enum ('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type payment_method as enum ('pay_at_salon');
create type payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'restricted', 'cancelled');

create table users (
  id uuid primary key default gen_random_uuid(),
  google_id text unique not null,
  name text not null,
  email text unique not null,
  phone text,
  photo_url text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table services (
  id text primary key,
  name text not null,
  name_hindi text,
  price_inr integer not null check (price_inr > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  category text not null,
  description text not null,
  is_active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table salon_settings (
  id boolean primary key default true,
  accepting_bookings boolean not null default true,
  blocked_dates date[] not null default '{}',
  business_hours jsonb not null default '{"open":"09:00","close":"21:00","slotIntervalMinutes":30}',
  gstin text,
  subscription_status subscription_status not null default 'trialing',
  constraint singleton_settings check (id)
);

create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id),
  date date not null,
  start_time time not null,
  end_time time not null,
  status booking_status not null default 'pending_payment',
  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  total_amount integer not null check (total_amount >= 0),
  qr_code_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_time_order check (end_time > start_time)
);

create table booking_services (
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id text not null references services(id),
  price_inr integer not null,
  duration_minutes integer not null,
  primary key (booking_id, service_id)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  salon_owner_id uuid not null references users(id),
  platform_upi_id text,
  last_upi_reference text,
  status subscription_status not null default 'trialing',
  plan text not null default 'standard',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  provider text not null check (provider = 'upi'),
  provider_ref text not null,
  amount_inr integer not null,
  status text not null check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now()
);

create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  type text not null check (type in ('sms', 'push', 'email')),
  destination text not null,
  status text not null check (status in ('queued', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references users(id),
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index bookings_date_time_idx on bookings(date, start_time, end_time);
create index bookings_customer_idx on bookings(customer_id);
create index notifications_booking_idx on notifications_log(booking_id);

alter table users enable row level security;
alter table staff_profiles enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;
alter table booking_services enable row level security;
alter table salon_settings enable row level security;
alter table blocked_dates enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table notifications_log enable row level security;
alter table admin_activity_log enable row level security;

insert into salon_settings (id) values (true);
