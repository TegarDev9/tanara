import {
  useTonWallet,
  TonConnectButton
} from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';

export default function LoginButton() {
  const wallet = useTonWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state to track TON login status

  useEffect(() => {
    const processTonLogin = async () => {
      if (wallet && wallet.account && wallet.account.address) {
        console.log('TON Wallet connected:', wallet.account.address);
        setIsLoading(true);
        setErrorMessage(null);

        try {
          // Call your TON login API endpoint
          const response = await fetch('/api/auth/ton-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tonAddress: wallet.account.address,
              // In a real app, you'd include a signature here after a challenge
              // For now, we're assuming the backend validates the address directly or uses a dummy signature
              signature: "dummy_signature", 
              message: "TON Login",
            }),
          });

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (jsonError) {
              // If response is not JSON, try to read as text
              errorData = await response.text();
            }
            throw new Error(errorData.error || errorData || 'TON Login failed');
          }

          const data = await response.json(); // Only parse as JSON if response.ok is true
          console.log('TON Login API response:', data);
          setIsLoggedIn(true); // Set login status to true on successful TON login
          alert('Login TON berhasil!');

        } catch (e: unknown) {
          let errorMessageText = 'Detail tidak diketahui.';
          if (e instanceof Error) {
            errorMessageText = e.message;
          } else if (typeof e === 'string') {
            errorMessageText = e;
          } else if (typeof e === 'object' && e !== null) {
            try {
              errorMessageText = JSON.stringify(e);
            } catch {
              errorMessageText = `Objek error tidak dapat diserialisasi: ${String(e)}`;
            }
          }
          console.error('Error during TON login process:', e);
          setErrorMessage(`Login TON gagal: ${errorMessageText}`);
          setIsLoggedIn(false); // Ensure login status is false on error
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('TON Wallet disconnected or not yet connected.');
        setIsLoggedIn(false); // Set login status to false if wallet is disconnected
        setErrorMessage(null);
      }
    };

    processTonLogin();
  }, [wallet]); // Depend on wallet object to re-run when connection status changes

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
          {isLoggedIn && (
            <p className="mt-2 pt-2 border-t border-gray-600">
              Status Login: <span className="font-bold">Berhasil</span>
            </p>
          )}
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
