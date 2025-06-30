/*
  # Initial Schema Setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `is_paid_member` (boolean)
      - `created_at` (timestamp)
    - `asics`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references users.id)
      - `model` (text)
      - `hashrate` (numeric)
      - `power` (numeric)
      - `reserve_price` (numeric)
      - `image_url` (text)
      - `availability` (jsonb)
      - `listed` (boolean)
      - `created_at` (timestamp)
    - `auctions`
      - `id` (uuid, primary key)
      - `asic_id` (uuid, references asics.id)
      - `reserve_price` (numeric)
      - `current_bid` (numeric)
      - `current_bidder` (uuid, references users.id)
      - `end_time` (timestamp)
      - `status` (text)
      - `created_at` (timestamp)
    - `bids`
      - `id` (uuid, primary key)
      - `auction_id` (uuid, references auctions.id)
      - `user_id` (uuid, references users.id)
      - `amount` (numeric)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
*/

-- Create users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  is_paid_member boolean default false,
  created_at timestamp default now()
);

-- Create asics table
create table if not exists asics (
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

-- Create auctions table
create table if not exists auctions (
  id uuid primary key default gen_random_uuid(),
  asic_id uuid references asics(id),
  reserve_price numeric,
  current_bid numeric,
  current_bidder uuid references users(id),
  end_time timestamp,
  status text default 'active',
  created_at timestamp default now()
);

-- Create bids table
create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid references auctions(id),
  user_id uuid references users(id),
  amount numeric,
  created_at timestamp default now()
);

-- Enable Row Level Security
alter table users enable row level security;
alter table asics enable row level security;
alter table auctions enable row level security;
alter table bids enable row level security;

-- Create policies for users table
create policy "Users can read their own data"
  on users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own data"
  on users
  for update
  to authenticated
  using (auth.uid() = id);

-- Create policies for asics table
create policy "Anyone can read listed ASICs"
  on asics
  for select
  to authenticated
  using (listed = true or owner_id = auth.uid());

create policy "Users can create their own ASICs"
  on asics
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update their own ASICs"
  on asics
  for update
  to authenticated
  using (owner_id = auth.uid());

create policy "Users can delete their own ASICs"
  on asics
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- Create policies for auctions table
create policy "Anyone can read auctions"
  on auctions
  for select
  to authenticated
  using (true);

create policy "Users can create auctions for their ASICs"
  on auctions
  for insert
  to authenticated
  with check (
    asic_id in (
      select id from asics where owner_id = auth.uid()
    )
  );

create policy "Users can update their own auctions"
  on auctions
  for update
  to authenticated
  using (
    asic_id in (
      select id from asics where owner_id = auth.uid()
    )
  );

-- Create policies for bids table
create policy "Anyone can read bids"
  on bids
  for select
  to authenticated
  using (true);

create policy "Users can create their own bids"
  on bids
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own bids"
  on bids
  for update
  to authenticated
  using (user_id = auth.uid());