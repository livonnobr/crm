/**
 * Oficina de Receita — conexão pública do Ritmo CRM ao Supabase.
 * Mantém apenas URL e chave publicável no cliente; autorização é reforçada por RLS no banco.
 */
import { createClient } from "@supabase/supabase-js";

const hostedSupabaseUrl = "https://obusiikzxehefoemuciy.supabase.co";
const hostedSupabasePublishableKey = "sb_publishable_uFn_wSc7EiY60sRGKmmqFg_hHF36m6g";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || hostedSupabaseUrl;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || hostedSupabasePublishableKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase não foi configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.");
  }

  return supabase;
}
