import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : process.env.VITE_SUPABASE_URL;
  const key = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : process.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && typeof url === 'string' && url.startsWith('http'));
}

export function getActiveBackendMode(): 'SUPABASE_CLOUD' | 'DEMO_MODE_LOCAL' {
  return isSupabaseConfigured() ? 'SUPABASE_CLOUD' : 'DEMO_MODE_LOCAL';
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    const url = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : process.env.VITE_SUPABASE_URL;
    const key = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : process.env.VITE_SUPABASE_ANON_KEY;
    if (url && key) {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
  }
  return supabaseInstance;
}
