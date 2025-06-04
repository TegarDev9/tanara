'use server'; // This file itself is not a server action, but its functions are for server actions.

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createSupabaseActionClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const store = await cookieStore;
          return store.get(name)?.value;
        },
        set: async (name: string, value: string, options: CookieOptions) => {
          const store = await cookieStore;
          store.set({ name, value, ...options });
        },
        remove: async (name: string, options: CookieOptions) => {
          const store = await cookieStore;
          store.delete({ name, ...options });
        },
      },
    }
  );
}; 