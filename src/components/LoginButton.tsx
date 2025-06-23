import {
  useTonWallet,
  TonConnectButton,
  useTonConnectUI
} from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { Address, beginCell, toNano } from '@ton/core';
export default function LoginButton() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const processTonLogin = async () => {
      if (wallet && wallet.account && wallet.account.address && !isLoggedIn) {
        console.log('TON Wallet connected:', wallet.account.address);
        setIsLoading(true);
        setErrorMessage(null);

        try {
          const loginMessage = 'Login to your account';

          const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [
              {
                address: wallet.account.address,
                amount: toNano('0.000000001').toString(),
                payload: beginCell().storeUint(0, 32).storeStringTail(loginMessage).endCell().toBoc().toString('base64'),
              },
            ],
          };

          console.log('Attempting to send dummy transaction for signature...');
          const result = await tonConnectUI.sendTransaction(transaction);
          console.log('Transaction result (BOC):', result.boc);

          const signature = result.boc;
          const tonAddress = wallet.account.address;
          const message = loginMessage;

          const response = await fetch('/api/auth/ton-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tonAddress,
              signature,
              message,
            }),
          });

          if (!response.ok) {
            const responseText = await response.text();
            console.error('TON Login API raw error response:', responseText);
            let errorData;
            try {
              errorData = JSON.parse(responseText);
            } catch {
              errorData = responseText;
            }
            throw new Error(errorData.error || errorData || `TON Login failed: ${responseText}`);
          }

          const data = await response.json();
          console.log('TON Login API response:', data);
          setIsLoggedIn(true);
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
          setIsLoggedIn(false);
        } finally {
          setIsLoading(false);
        }
      } else if (!wallet) {
        console.log('TON Wallet disconnected or not yet connected.');
        setIsLoggedIn(false);
        setErrorMessage(null);
      }
    };

    processTonLogin();
  }, [wallet, isLoggedIn, tonConnectUI]);

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
