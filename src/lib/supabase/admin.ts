import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client for server-only contexts that must act outside a
// user's session (Telegram webhook, cron reminders). Never import from
// client components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY tanımlı değil.')
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
