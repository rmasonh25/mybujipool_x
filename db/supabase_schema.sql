
-- Supabase SQL Schema for Mining Pool Marketplace

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  is_paid_member boolean default false,
  created_at timestamp default now()
);

create table asics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id),
  model text,
  hashrate numeric,
  power numeric,
  reserve_price numeric,
  image_url text,
  availability jsonb,
  listed boolean default false,
  created_at timestamp default now()
);

create table auctions (
  id uuid primary key default gen_random_uuid(),
  asic_id uuid references asics(id),
  reserve_price numeric,
  current_bid numeric,
  current_bidder uuid references users(id),
  end_time timestamp,
  status text default 'active',
  created_at timestamp default now()
);

create table bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid references auctions(id),
  user_id uuid references users(id),
  amount numeric,
  created_at timestamp default now()
);
