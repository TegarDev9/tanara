import { supabase } from '@/lib/supabaseClient';
import {
  useTonWallet,
  Wallet,
  TonConnectButton
} from '@tonconnect/ui-react';
import { useCallback, useEffect, useState } from 'react';
import type { User, Subscription } from '@supabase/supabase-js'; // Import User and Subscription type

export default function LoginButton() {
  const wallet = useTonWallet();
  const [userSubscription, setUserSubscription] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // State to hold Supabase user

  // Effect to listen for auth changes and set the current user
  useEffect(() => {
    const getSessionData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      console.log('Initial session user:', session?.user);
    };

    getSessionData();

    // supabase.auth.onAuthStateChange returns an object with a `data` property,
    // which in turn has a `subscription` property.
    const authSubscriptionObject = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      console.log('Auth state changed, new user:', session?.user);
      if (event === 'SIGNED_OUT') {
        setUserSubscription(null); // Reset subscription on sign out
      }
    });

    // The actual subscription object is inside authSubscriptionObject.data
    // Explicitly type subscriptionInstance with the imported Subscription type
    const subscriptionInstance: Subscription = authSubscriptionObject.data.subscription;

    return () => {
      // Call unsubscribe on the subscription instance
      subscriptionInstance?.unsubscribe();
    };
  }, []);


  const fetchUserSubscription = useCallback(async (userId: string) => {
    if (!supabase) {
      console.error('Supabase client is not initialized for fetchUserSubscription.');
      return null;
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
    return data ? data.status : 'free_with_ads';
  }, []);

  const handleSupabaseLogin = useCallback(async (connectedWallet: Wallet) => {
    if (!supabase) {
      console.error("Supabase client tidak terinisialisasi.");
      return;
    }

    let supabaseUser = currentUser;
    if (!supabaseUser) {
        const { data: { session } } = await supabase.auth.getSession();
        supabaseUser = session?.user ?? null;
        if (session?.user) setCurrentUser(session.user);
    }

    if (!supabaseUser) {
      console.error("Pengguna Supabase tidak terautentikasi. Tidak dapat melanjutkan login/upsert profil.");
      if (typeof window !== 'undefined') {
        window.alert('Sesi pengguna Supabase tidak ditemukan. Pastikan Anda sudah login ke aplikasi atau coba lagi.');
      }
      return;
    }

    const userFriendlyAddress = connectedWallet.account.address;
    const chain = connectedWallet.account.chain;

    console.log(`Attempting to upsert profile for user ID: ${supabaseUser.id} with wallet: ${userFriendlyAddress}, chain: ${chain}`);

    try {
      const { data: profileData, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: supabaseUser.id,
            wallet_address: userFriendlyAddress,
            chain: chain,
            last_login_at: new Date().toISOString(),
            email: supabaseUser.email,
          },
          {
            onConflict: 'id',
          }
        )
        .select('id, subscription_status')
        .single();

      if (upsertError) {
        console.error('Supabase upsert error details:', upsertError);
        throw upsertError;
      }

      if (profileData) {
        console.log('Profile upserted/retrieved:', profileData);
        const subscription = await fetchUserSubscription(profileData.id);
        setUserSubscription(subscription);
        console.log('User subscription status:', subscription);

        if (subscription === 'free_with_ads') {
          console.log('User is on free plan with ads. Show ads.');
        } else if (subscription === 'pro') {
          console.log('User is on pro plan. Unlock pro features.');
        }
      } else {
        console.warn('No profile data returned from upsert. This might be due to RLS or if the select query returned nothing.');
      }
    } catch (error) {
      console.error('Error during Supabase login/upsert:', error);
      if (typeof window !== 'undefined') {
        const displayError = error instanceof Error ? error.message : 'Detail tidak diketahui.';
        window.alert(`Terjadi kesalahan saat login ke Supabase: ${displayError}. Cek konsol untuk detail teknis.`);
      }
    }
  }, [fetchUserSubscription, currentUser]);

  useEffect(() => {
    if (wallet && wallet.account && wallet.account.address && wallet.account.chain) {
      console.log('TON Wallet connected:', wallet);
      handleSupabaseLogin(wallet);
    } else if (!wallet) {
      console.log('TON Wallet not connected yet or disconnected.');
      setUserSubscription(null);
    }
  }, [wallet, handleSupabaseLogin]);


  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-center mb-4">
        <TonConnectButton className="ton-connect-button" />
      </div>
      {wallet && (
        <div className="mt-4 p-3 bg-gray-700 rounded text-white text-sm break-all">
          <p className="font-semibold">Connected TON Wallet:</p>
          <p className="mb-1">Address: {wallet.account.address}</p>
          <p>Chain: {wallet.account.chain}</p>
          {currentUser && (
            <p className="mt-1 pt-1 border-t border-gray-600 text-xs">Supabase User ID: {currentUser.id}</p>
          )}
          {userSubscription && <p className="mt-2 pt-2 border-t border-gray-600">Subscription: <span className="font-bold">{userSubscription}</span></p>}
        </div>
      )}
      {userSubscription === 'free_with_ads' && (
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