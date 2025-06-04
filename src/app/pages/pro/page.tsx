'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';

// Define plan structures (can be shared with backend or fetched)
const plans = {
  trial: { id: 'trial', name: 'Scanner Pro - Trial', price: 10000, duration: '1 Week', features: ['Basic scanner access', 'Limited daily scans'] },
  monthly: { id: 'monthly', name: 'Scanner Pro - Monthly', price: 50000, duration: 'Monthly', features: ['Full scanner access', 'Unlimited daily scans', 'Priority support'] },
  yearly: { id: 'yearly', name: 'Scanner Pro - Yearly', price: 500000, duration: 'Yearly', features: ['Full scanner access', 'Unlimited daily scans', 'Priority support', 'Early access to new features'] },
};

type PlanKey = keyof typeof plans;

interface SnapWindow extends Window {
  snap?: {
    pay: (token: string, options?: SnapPayOptions) => void;
    // Add other methods if you use them, like snap.hide()
  };
}

interface SnapPayOptions {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
  // Add other callback options as needed from Midtrans documentation
}

export default function ProPage() {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  // You'll need to get actual user details from your authentication system
  const currentUser = {
    id: 'user123', // Replace with actual dynamic user ID
    email: 'user@example.com', // Replace with actual dynamic user email
    name: 'Current User' // Replace with actual dynamic user name
  };

  useEffect(() => {
    // Load Midtrans Snap.js script
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js"; // Use sandbox for testing, production URL for live
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'YOUR_MIDTRANS_CLIENT_KEY_PLACEHOLDER');
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Clean up script when component unmounts
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const handlePurchase = async (planId: PlanKey) => {
    setLoadingPlan(planId);
    setError(null);
    try {
      const response = await fetch('/api/payment/midtrans/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: planId,
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to initiate payment');
      }

      const token = data.token;
      if (token) {
        (window as SnapWindow).snap?.pay(token, {
          onSuccess: function(result){
            /* You may add your own implementation here */
            alert("Payment success! See console for details."); 
            console.log('Payment Success:', result);
            // Optionally, redirect or update UI. Notification handler should confirm subscription.
            // router.push(`/payment/success?order_id=${data.orderId}`);
            setLoadingPlan(null);
          },
          onPending: function(result){
            /* You may add your own implementation here */
            alert("Payment pending! See console for details."); 
            console.log('Payment Pending:', result);
            // router.push(`/payment/pending?order_id=${data.orderId}`);
            setLoadingPlan(null);
          },
          onError: function(result){
            /* You may add your own implementation here */
            alert("Payment error! See console for details."); 
            console.error('Payment Error:', result);
            setError('Payment failed. Please try again.');
            setLoadingPlan(null);
          },
          onClose: function(){
            /* You may add your own implementation here */
            // alert('You closed the popup without finishing the payment');
            console.log('Payment popup closed by user.');
            if (loadingPlan) { // Only reset if a payment was in progress
                setError('Payment cancelled.');
            }
            setLoadingPlan(null);
          }
        });
      } else {
        throw new Error('Failed to get payment token.');
      }

    } catch (err: unknown) {
      console.error('Purchase Error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'An unexpected error occurred.');
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Head>
        <title>Scanner Pro Plans</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-12 text-primary">Upgrade to Scanner Pro</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {(Object.keys(plans) as PlanKey[]).map((planKey) => {
            const plan = plans[planKey];
            return (
              <div key={plan.id} className="bg-neutral-800 shadow-xl rounded-lg p-6 flex flex-col text-neutral-200 hover:scale-105 transition-transform duration-300">
                <h2 className="text-2xl font-semibold mb-2 text-primary">{plan.name}</h2>
                <p className="text-4xl font-bold mb-4 text-white">
                  Rp{plan.price.toLocaleString('id-ID')} <span className="text-lg font-normal text-neutral-400">/{plan.duration}</span>
                </p>
                <ul className="mb-6 space-y-2 text-neutral-300 flex-grow">
                  {plan.features.map(feature => <li key={feature} className="flex items-center"><svg className="w-5 h-5 text-green-400 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>{feature}</li>)}
                </ul>
                <button
                  onClick={() => handlePurchase(planKey)}
                  disabled={loadingPlan === planKey}
                  className={`w-full mt-auto bg-primary hover:bg-primary-focus text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 
                              ${loadingPlan === planKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingPlan === planKey ? 'Processing...' : `Choose ${plan.duration}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-neutral-400">
            <p>Payments are securely processed by Midtrans.</p>
            <p>Your subscription will be activated upon successful payment.</p>
        </div>
      </div>
    </>
  );
} 