-- Воркеры
create table if not exists workers (
  id text primary key,
  name text not null,
  emoji text not null default '👤',
  total_profit numeric default 0,
  created_at timestamptz default now()
);

-- Анкеты
create table if not exists anketas (
  id text primary key,
  worker_id text references workers(id) on delete cascade,
  name text not null,
  age integer,
  telegram text,
  cities jsonb default '[]',
  birth_dates jsonb default '[]',
  notes text,
  photos jsonb default '[]',
  videos jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Профиты
create table if not exists profits (
  id text primary key,
  worker_id text references workers(id) on delete cascade,
  anketa_id text references anketas(id) on delete set null,
  amount numeric not null,
  type text not null,
  my_share numeric not null,
  note text,
  created_at timestamptz default now()
);

-- Профиль (одна строка)
create table if not exists profile (
  id integer primary key default 1,
  name text default 'Crowley',
  level integer default 1,
  xp integer default 0,
  total_earned numeric default 0,
  goals jsonb default '[]',
  settings jsonb default '{"rubToUsd": 90, "usdToUah": 43.70}'
);

-- Отключить RLS (личное приложение)
alter table workers disable row level security;
alter table anketas disable row level security;
alter table profits disable row level security;
alter table profile disable row level security;
