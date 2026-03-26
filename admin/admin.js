import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://povizsshrvyqcaszwzmr.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_4EFhT1Gx4qk_PHEm4cdRjw_kFKrEDZJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Redirect to login if no active session. Returns the session if authenticated.
 */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.replace('/admin/');
    return null;
  }
  return session;
}

/**
 * Sign out the current user and redirect to the login page.
 */
export async function signOut() {
  await supabase.auth.signOut();
  window.location.replace('/admin/');
}
