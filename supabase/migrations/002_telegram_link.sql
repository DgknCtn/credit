-- Telegram link code support: user generates a short-lived code in the app,
-- sends it to the bot via /start <code>, and the webhook matches it back to their account.
alter table public.notification_settings
  add column if not exists link_code text,
  add column if not exists link_code_expires_at timestamptz;

create unique index if not exists notification_settings_link_code_idx
  on public.notification_settings (link_code)
  where link_code is not null;
