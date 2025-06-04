import { supabase } from '@/lib/supabaseClient';
import {
  useTonWallet,
  Wallet,
  TonConnectButton
} from '@tonconnect/ui-react';
import { useCallback, useEffect, useState } from 'react';

export default function LoginButton() {

  const wallet = useTonWallet(); 
  const [userSubscription, setUserSubscription] = useState<string | null>(null);

  const fetchUserSubscription = useCallback(async (userId: string) => {
    if (!supabase) {
        console.error('Supabase client is not initialized for fetchUserSubscription.');
        return null;
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
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

    // Pastikan kita menggunakan 'connectedWallet' dari parameter fungsi ini
    const userFriendlyAddress = connectedWallet.account.address;
    const chain = connectedWallet.account.chain;

    console.log(`Attempting to upsert user with wallet: ${userFriendlyAddress}, chain: ${chain}`);

    try {
      const { data: userData, error: upsertError } = await supabase
        .from('users')
        .upsert({
          wallet_address: userFriendlyAddress,
          chain: chain,
          last_login_at: new Date().toISOString(), // Gunakan toISOString() untuk format standar
        })
        .select('id, subscription_status') // Pastikan kolom subscription_status ada di tabel users jika Anda ingin mengambilnya di sini
        .single();

      if (upsertError) throw upsertError;

      if (userData) {
        console.log('User logged in/updated:', userData);
        // Menggunakan userData.id untuk fetchUserSubscription
        const subscription = await fetchUserSubscription(userData.id);
        setUserSubscription(subscription);
        console.log('User subscription status:', subscription);

        // Logika berdasarkan status langganan
        if (subscription === 'free_with_ads') {
          console.log('User is on free plan with ads. Show ads.');
        } else if (subscription === 'pro') {
          console.log('User is on pro plan. Unlock pro features.');
        }
      } else {
        console.warn('No user data returned from upsert.');
      }
    } catch (error) {
      console.error('Error during Supabase login/upsert:', error);
      // Hindari penggunaan alert() di produksi, gunakan sistem notifikasi yang lebih baik
      // alert('Terjadi kesalahan saat login ke Supabase.');
      // Untuk sekarang, biarkan agar mudah di-debug
      if (typeof window !== 'undefined') {
        window.alert('Terjadi kesalahan saat login ke Supabase. Cek konsol untuk detail.');
      }
    }
  }, [fetchUserSubscription]); // setUserSubscription tidak perlu di sini karena sudah di dalam scope useCallback

  useEffect(() => {
    if (wallet) { // 'wallet' dari useTonWallet() digunakan di sini
      console.log('Wallet connected:', wallet);
      // Memastikan address dan chain ada sebelum login
      if (wallet.account && wallet.account.address && wallet.account.chain) {
        handleSupabaseLogin(wallet); // Meneruskan 'wallet' sebagai 'connectedWallet' ke handleSupabaseLogin
      } else {
        console.warn('Wallet object is present, but account details (address/chain) are missing.');
      }
    } else {
      console.log('Wallet not connected yet or disconnected.');
      // Reset status langganan jika wallet terputus
      setUserSubscription(null);
    }
  }, [wallet, handleSupabaseLogin]);


  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-center mb-4">
        <TonConnectButton className="ton-connect-button" /> {/* Anda bisa menambahkan styling kustom jika perlu */}
      </div>
      {wallet && (
        <div className="mt-4 p-3 bg-gray-700 rounded text-white text-sm break-all">
          <p className="font-semibold">Connected Wallet:</p>
          <p className="mb-1">Address: {wallet.account.address}</p>
          <p>Chain: {wallet.account.chain}</p>
          {userSubscription && <p className="mt-2 pt-2 border-t border-gray-600">Subscription: <span className="font-bold">{userSubscription}</span></p>}
        </div>
      )}
      {userSubscription === 'free_with_ads' && (
        <div className="mt-4 p-3 bg-yellow-500 text-black rounded text-center">
          Anda menggunakan versi gratis dengan iklan.
        </div>
      )}
       {/* Styling untuk tombol TonConnect jika default tidak sesuai */}
      <style jsx global>{`
        .ton-connect-button button {
          background-color: #007aff; // Contoh warna biru TON
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