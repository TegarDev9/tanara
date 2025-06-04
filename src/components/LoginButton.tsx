import { supabase } from '@/lib/supabaseClient';
import {
  useTonWallet,
  Wallet,
  TonConnectButton
} from '@tonconnect/ui-react';
import { useCallback, useEffect, useState } from 'react';
import type { User, Subscription as SupabaseSubscription } from '@supabase/supabase-js'; // Renamed to avoid conflict if any

export default function LoginButton() {
  const wallet = useTonWallet();
  const [userSubscriptionStatus, setUserSubscriptionStatus] = useState<string | null>(null);
  const [currentSupabaseUser, setCurrentSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Effect 1: Manage Supabase auth state
  useEffect(() => {
    setIsLoading(true); // Start loading when component mounts or auth might change
    setErrorMessage(null);

    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
          // Don't throw here, let onAuthStateChange handle it or set user to null
        }
        setCurrentSupabaseUser(session?.user ?? null);
        console.log('Initial Supabase session user:', session?.user?.id ?? 'None');
      } catch (e) {
        console.error("Exception during initial session fetch:", e);
        setErrorMessage("Gagal memuat sesi awal.");
      }
      // setIsLoading(false); // Loading might not be fully done until onAuthStateChange confirms
    };

    getInitialSession();

    const { data: authListenerData } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentSupabaseUser(session?.user ?? null);
      console.log('Supabase auth state changed. Event:', event, '. New session user ID:', session?.user?.id ?? 'None');
      if (event === 'SIGNED_OUT') {
        setUserSubscriptionStatus(null);
        setErrorMessage(null); // Clear error on sign out
      }
      // Consider SIGNED_IN as a point where loading related to auth is resolved
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setIsLoading(false);
      }
    });

    const actualSubscription: SupabaseSubscription | undefined = authListenerData?.subscription;

    return () => {
      actualSubscription?.unsubscribe();
    };
  }, []);

  // Effect 2: Handle TON Wallet connection and link/create Supabase user
  useEffect(() => {
    const processWalletConnection = async () => {
      if (wallet && wallet.account && wallet.account.address) {
        console.log('TON Wallet connected:', wallet.account.address);
        setIsLoading(true);
        setErrorMessage(null);

        let userToLink: User | null = currentSupabaseUser;

        if (!userToLink) {
          // No existing Supabase session, attempt anonymous sign-in to create one
          console.log('No active Supabase session. Attempting anonymous sign-in...');
          try {
            const { data: anonSession, error: anonError } = await supabase.auth.signInAnonymously();
            if (anonError) throw anonError;

            if (anonSession?.user) {
              userToLink = anonSession.user;
              // setCurrentSupabaseUser(userToLink); // Auth listener will also set this
              console.log('Anonymous sign-in successful. New Supabase user ID:', userToLink.id);
            } else {
              throw new Error("Anonymous sign-in did not return a user.");
            }
          } catch (e) {
            console.error('Error during anonymous sign-in:', e);
            const signInErrorMsg = e instanceof Error ? e.message : 'Detail tidak diketahui.';
            setErrorMessage(`Registrasi/Login otomatis gagal: ${signInErrorMsg}`);
            setIsLoading(false);
            return; // Stop further processing if anonymous sign-in fails
          }
        }

        // At this point, userToLink should be a valid Supabase user (either existing or newly anonymous)
        if (userToLink) {
          await linkWalletAndUpsertProfile(wallet, userToLink);
        } else {
          // This case should ideally not be reached if anonymous sign-in is successful
          console.error("Failed to establish a Supabase user session for wallet linking.");
          setErrorMessage("Gagal membuat sesi pengguna untuk penautan dompet.");
        }
        setIsLoading(false);
      } else if (!wallet) {
        // TON Wallet disconnected or not yet connected
        console.log('TON Wallet disconnected or not yet connected.');
        // If user was anonymous and tied to this wallet, consider signing them out from Supabase
        // if (currentSupabaseUser && currentSupabaseUser.is_anonymous) {
        //   console.log("Signing out anonymous user as TON wallet disconnected.");
        //   await supabase.auth.signOut(); // This will trigger onAuthStateChange
        // }
        setUserSubscriptionStatus(null); // Clear subscription if wallet disconnects
      }
    };

    // Only run if supabase client is available.
    // The check for `currentSupabaseUser` being potentially null before anonymous sign-in is handled inside.
    if (supabase) {
        processWalletConnection();
    }

  }, [wallet, currentSupabaseUser]); // Rerun when wallet or Supabase user state changes. `linkWalletAndUpsertProfile` is memoized.

  const fetchUserSubscription = useCallback(async (userId: string) => {
    if (!supabase) {
      console.error('Supabase client is not initialized for fetchUserSubscription.');
      return null;
    }
    // Ensure RLS policies on 'subscriptions' table allow the user to read their own status.
    const { data, error: fetchSubError } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (fetchSubError) {
      console.error('Error fetching subscription:', fetchSubError);
      // PGRST116: "JSON object requested, multiple (or no) rows returned"
      // This means .single() failed. Default to 'free_with_ads' or handle appropriately.
      if (fetchSubError.code === 'PGRST116') {
        console.log('No subscription record found for user, defaulting status.');
        return 'free_with_ads';
      }
      return null;
    }
    return data ? data.status : 'free_with_ads';
  }, []);

  const linkWalletAndUpsertProfile = useCallback(async (connectedWallet: Wallet, userToLink: User) => {
    if (!supabase) {
      console.error("Supabase client tidak terinisialisasi untuk linkWalletAndUpsertProfile.");
      return;
    }
    // setIsLoading(true); // isLoading is managed by the calling useEffect
    // setErrorMessage(null);

    const userFriendlyAddress = connectedWallet.account.address;
    const chain = connectedWallet.account.chain;

    console.log(`Attempting to upsert profile for Supabase User ID: ${userToLink.id} with Wallet: ${userFriendlyAddress}`);

    try {
      const { data: profileData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userToLink.id,
          wallet_address: userFriendlyAddress,
          chain: chain,
          last_login_at: new Date().toISOString(),
          // Only set email if it's available and not null/undefined
          // For anonymous users, email will likely be null.
          email: userToLink.email || undefined, // Ensure email is not set if null
          // full_name: userToLink.user_metadata?.full_name, // If you collect full_name
        }, {
          onConflict: 'id',
        })
        .select('id, subscription_status') // Ensure 'subscription_status' exists in 'profiles'
        .single();

      if (upsertError) throw upsertError;

      if (profileData) {
        console.log('Profile upserted/retrieved:', profileData);
        // Update local subscription status based on profileData if available, then fetch fresh
        if (profileData.subscription_status) {
            setUserSubscriptionStatus(profileData.subscription_status);
        }
        const freshSubscriptionStatus = await fetchUserSubscription(profileData.id);
        setUserSubscriptionStatus(freshSubscriptionStatus);
        console.log('User subscription status (fresh):', freshSubscriptionStatus);
      } else {
        console.warn('No profile data returned from upsert. This could be RLS or if the select returned no rows.');
        // If no profile data, attempt to fetch subscription anyway, as profile might exist but select failed.
        const fallbackSubscriptionStatus = await fetchUserSubscription(userToLink.id);
        setUserSubscriptionStatus(fallbackSubscriptionStatus);
      }
    } catch (e) {
      console.error('Error during profile upsert:', e);
      const upsertErrorMsg = e instanceof Error ? e.message : 'Detail tidak diketahui.';
      setErrorMessage(`Gagal memperbarui profil: ${upsertErrorMsg}`);
      // window.alert might be too intrusive, rely on UI error message
    } finally {
      // setIsLoading(false); // isLoading is managed by the calling useEffect
    }
  }, [fetchUserSubscription]);


  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md text-white">
      <div className="flex justify-center mb-4">
        <TonConnectButton className="ton-connect-button" />
      </div>

      {isLoading && <p className="text-center text-sm my-2">Memproses...</p>}
      {errorMessage && <p className="text-center text-sm text-red-400 bg-red-900/50 p-2 my-2 rounded-md">{errorMessage}</p>}

      {wallet && (
        <div className="mt-4 p-3 bg-gray-700 rounded text-sm break-all">
          <p className="font-semibold">Dompet TON Terhubung:</p>
          <p className="mb-1">Alamat: {wallet.account.address}</p>
          <p>Chain: {wallet.account.chain}</p>
          {currentSupabaseUser && (
            <p className="mt-1 pt-1 border-t border-gray-600 text-xs">
              ID Pengguna Supabase: {currentSupabaseUser.id}
              {currentSupabaseUser.is_anonymous ? ' (Akun Anonim)' : ''}
            </p>
          )}
          {userSubscriptionStatus && !isLoading && (
            <p className="mt-2 pt-2 border-t border-gray-600">
              Langganan: <span className="font-bold">{userSubscriptionStatus}</span>
            </p>
          )}
        </div>
      )}

      {userSubscriptionStatus === 'free_with_ads' && !isLoading && (
        <div className="mt-4 p-3 bg-yellow-500 text-black rounded text-center">
          Anda menggunakan versi gratis dengan iklan.
        </div>
      )}
      <style jsx global>{`
        .ton-connect-button button {
          background-color: #007aff;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: bold;
          transition: background-color 0.3s ease;
        }
        .ton-connect-button button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
}