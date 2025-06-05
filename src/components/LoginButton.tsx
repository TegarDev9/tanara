import { supabase } from '@/lib/supabaseClient';
import {
  useTonWallet,
  Wallet,
  TonConnectButton
} from '@tonconnect/ui-react';
import { useCallback, useEffect, useState } from 'react';
import type { User, Subscription as SupabaseSubscription } from '@supabase/supabase-js';

export default function LoginButton() {
  const wallet = useTonWallet();
  const [userSubscriptionStatus, setUserSubscriptionStatus] = useState<string | null>(null);
  const [currentSupabaseUser, setCurrentSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Effect 1: Manage Supabase auth state
  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);

    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
        }
        setCurrentSupabaseUser(session?.user ?? null);
        console.log('Initial Supabase session user:', session?.user?.id ?? 'None');
      } catch (e) {
        console.error("Exception during initial session fetch:", e);
        setErrorMessage("Gagal memuat sesi awal.");
      }
    };

    getInitialSession();

    const { data: authListenerData } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentSupabaseUser(session?.user ?? null);
      console.log('Supabase auth state changed. Event:', event, '. New session user ID:', session?.user?.id ?? 'None');
      if (event === 'SIGNED_OUT') {
        setUserSubscriptionStatus(null);
        setErrorMessage(null);
      }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setIsLoading(false);
      }
    });

    const actualSubscription: SupabaseSubscription | undefined = authListenerData?.subscription;

    return () => {
      actualSubscription?.unsubscribe();
    };
  }, []);

  const fetchUserSubscription = useCallback(async (userId: string) => {
    if (!supabase) {
      console.error('Supabase client is not initialized for fetchUserSubscription.');
      return null;
    }
    const { data, error: fetchSubError } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (fetchSubError) {
      console.error('Error fetching subscription:', fetchSubError);
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
          email: userToLink.email || undefined,
        }, {
          onConflict: 'id',
        })
        .select('id, subscription_status')
        .single();

      if (upsertError) throw upsertError;

      if (profileData) {
        console.log('Profile upserted/retrieved:', profileData);
        if (profileData.subscription_status) {
            setUserSubscriptionStatus(profileData.subscription_status);
        }
        const freshSubscriptionStatus = await fetchUserSubscription(profileData.id);
        setUserSubscriptionStatus(freshSubscriptionStatus);
        console.log('User subscription status (fresh):', freshSubscriptionStatus);
      } else {
        console.warn('No profile data returned from upsert. This could be RLS or if the select returned no rows.');
        const fallbackSubscriptionStatus = await fetchUserSubscription(userToLink.id);
        setUserSubscriptionStatus(fallbackSubscriptionStatus);
      }
    } catch (e) {
      console.error('Error during profile upsert:', e);
      const upsertErrorMsg = e instanceof Error ? e.message : 'Detail tidak diketahui.';
      setErrorMessage(`Gagal memperbarui profil: ${upsertErrorMsg}`);
    }
  }, [fetchUserSubscription]);


  // Effect 2: Handle TON Wallet connection and link/create Supabase user
  useEffect(() => {
    const processWalletConnection = async () => {
      if (wallet && wallet.account && wallet.account.address) {
        console.log('TON Wallet connected:', wallet.account.address);
        setIsLoading(true);
        setErrorMessage(null);

        let userToLink: User | null = currentSupabaseUser;

        if (!userToLink) {
          console.log('No active Supabase session. Attempting anonymous sign-in...');
          try {
            const { data: anonSession, error: anonError } = await supabase.auth.signInAnonymously();
            if (anonError) throw anonError;

            if (anonSession?.user) {
              userToLink = anonSession.user;
              console.log('Anonymous sign-in successful. New Supabase user ID:', userToLink.id);
            } else {
              throw new Error("Anonymous sign-in did not return a user.");
            }
          } catch (e) {
            console.error('Error during anonymous sign-in:', e);
            const signInErrorMsg = e instanceof Error ? e.message : 'Detail tidak diketahui.';
            setErrorMessage(`Registrasi/Login otomatis gagal: ${signInErrorMsg}`);
            setIsLoading(false);
            return;
          }
        }

        if (userToLink) {
          await linkWalletAndUpsertProfile(wallet, userToLink);
        } else {
          console.error("Failed to establish a Supabase user session for wallet linking.");
          setErrorMessage("Gagal membuat sesi pengguna untuk penautan dompet.");
        }
        setIsLoading(false);
      } else if (!wallet) {
        console.log('TON Wallet disconnected or not yet connected.');
        setUserSubscriptionStatus(null);
      }
    };

    if (supabase) {
        processWalletConnection();
    }
  // Added linkWalletAndUpsertProfile to the dependency array
  }, [wallet, currentSupabaseUser, linkWalletAndUpsertProfile]);


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
