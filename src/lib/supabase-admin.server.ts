import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Server-only Supabase client using the service role. Never import from browser code.
export function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server env not configured");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
