import SupabaseDB, { supabase } from './supabaseDB';

// Sign in existing user (Login flow)
export async function signIn(email, password) {
  // Use the Supabase client helper
  const { data, error } = await SupabaseDB.auth.signIn(email, password);
  // supabase.signIn returns data with { session, user } in newer SDKs
  return { user: data?.user || null, session: data?.session || null, error };
}

// Sign up new user and create a profile document in backend (MongoDB)
export async function signUpAndCreateProfile({ email, password, profile }) {
  // 1) Create Supabase Auth user
  const { data, error } = await SupabaseDB.auth.signUp(email, password, profile);
  if (error) return { user: null, session: null, error };

  // data may contain user and session depending on your Supabase settings
  const user = data?.user ?? null;
  const session = data?.session ?? null;

  // 2) Notify backend to create the MongoDB profile for this email/user
  //    Backend endpoint must exist and accept a payload like: { email, profile, supabaseId }
  try {
    const resp = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, profile, supabaseId: user?.id }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('Failed creating profile on backend:', text);
      // Do not treat this as fatal in all apps — but surface error to caller
      return { user, session, error: new Error('Profile creation failed on server') };
    }
  } catch (err) {
    console.error('Error calling backend to create profile:', err);
    return { user, session, error: err };
  }

  return { user, session, error: null };
}
