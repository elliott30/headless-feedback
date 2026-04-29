create extension if not exists "pgcrypto";

create table accounts (
  id uuid primary key default gen_random_uuid(),
  api_key text unique not null default encode(gen_random_bytes(32), 'hex'),
  account_id text unique not null,
  ip text,
  created_at timestamptz not null default now()
);

create index on accounts (api_key);
create index on accounts (ip);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  account_id text not null references accounts(account_id) on delete cascade,
  content text not null check (char_length(content) >= 4),
  created_at timestamptz not null default now()
);

create index on feedback (account_id);

create table upvotes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references feedback(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  unique (feedback_id, voter_id)
);

create index on upvotes (feedback_id);
