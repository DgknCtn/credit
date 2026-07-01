-- Cards table
create table public.cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  bank_name text not null,
  card_name text not null,
  last_four_digits char(4) not null,
  statement_day integer not null check (statement_day between 1 and 31),
  payment_due_days integer not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Statements table
create table public.statements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id uuid references public.cards(id) on delete cascade not null,
  period_month integer not null check (period_month between 1 and 12),
  period_year integer not null,
  statement_total numeric(12,2),
  minimum_payment numeric(12,2),
  due_date date,
  uploaded_at timestamptz not null default now(),
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  unique (card_id, period_month, period_year)
);

-- Transactions table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  statement_id uuid references public.statements(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_date date not null,
  description text not null,
  amount numeric(12,2) not null,
  currency char(3) not null default 'TRY',
  category text not null default 'Diğer',
  user_category text,
  installment_info text,
  confidence_score numeric(3,2) default 1.0,
  raw_text text,
  created_at timestamptz not null default now()
);

-- Category overrides (user corrections for better future predictions)
create table public.category_overrides (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  description_pattern text not null,
  category text not null,
  created_at timestamptz not null default now(),
  unique (user_id, description_pattern)
);

-- Notification settings
create table public.notification_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  telegram_chat_id text,
  reminder_days integer[] not null default '{3,1,0}',
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notification logs
create table public.notification_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id uuid references public.cards(id) on delete cascade not null,
  statement_id uuid references public.statements(id) on delete cascade not null,
  sent_at timestamptz not null default now(),
  status text not null check (status in ('sent', 'failed')),
  error_message text
);

-- Row Level Security
alter table public.cards enable row level security;
alter table public.statements enable row level security;
alter table public.transactions enable row level security;
alter table public.category_overrides enable row level security;
alter table public.notification_settings enable row level security;
alter table public.notification_logs enable row level security;

-- RLS Policies
create policy "users own their cards" on public.cards
  for all using (auth.uid() = user_id);

create policy "users own their statements" on public.statements
  for all using (auth.uid() = user_id);

create policy "users own their transactions" on public.transactions
  for all using (auth.uid() = user_id);

create policy "users own their category overrides" on public.category_overrides
  for all using (auth.uid() = user_id);

create policy "users own their notification settings" on public.notification_settings
  for all using (auth.uid() = user_id);

create policy "users own their notification logs" on public.notification_logs
  for all using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cards_updated_at before update on public.cards
  for each row execute function update_updated_at();

create trigger notification_settings_updated_at before update on public.notification_settings
  for each row execute function update_updated_at();
