-- Per-category monthly spending budgets, used by the dashboard to show
-- progress bars and flag overspending.
create table public.category_budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.category_budgets enable row level security;

create policy "users own their category budgets" on public.category_budgets
  for all using (auth.uid() = user_id);

create trigger category_budgets_updated_at before update on public.category_budgets
  for each row execute function update_updated_at();
