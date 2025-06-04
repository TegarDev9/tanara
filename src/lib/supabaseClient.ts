import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing. Check your .env.local file.');
}

// Create a single Supabase client instance
// We export the client directly. For server-side operations where you might need the service role key,
// you might have a separate client or a function to get a service role client.
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Optional: If you need a server-side client with the service role key for admin tasks
// Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment for this to work.
// export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
//     ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
//     : null;

// if (process.env.NODE_ENV !== 'production' && !supabaseAdmin && process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     console.warn('Supabase Service Role Key provided but admin client could not be initialized. This might be an issue if admin tasks are expected.')
// } else if (process.env.NODE_ENV !== 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     console.log('Supabase Service Role Key not provided. Supabase admin client not initialized. This is normal if not needed.');
// } 