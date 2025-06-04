import { NextRequest, NextResponse } from 'next/server';
import Midtrans from 'midtrans-client'; // Assuming you'll install this: npm install midtrans-client

// Initialize Midtrans Snap client
const snap = new Midtrans.Snap({
  isProduction: process.env.NODE_ENV === 'production', // Set to true for production
  serverKey: process.env.YOUR_MIDTRANS_SERVER_KEY || 'YOUR_MIDTRANS_SERVER_KEY_PLACEHOLDER',
  clientKey: process.env.YOUR_MIDTRANS_CLIENT_KEY || 'YOUR_MIDTRANS_CLIENT_KEY_PLACEHOLDER'
});

// Define plan structures
const plans = {
  trial: { id: 'scanner_pro_trial', name: 'Scanner Pro - Trial (1 Week)', price: 10000, duration_days: 7 },
  monthly: { id: 'scanner_pro_monthly', name: 'Scanner Pro - Monthly', price: 50000, duration_days: 30 },
  yearly: { id: 'scanner_pro_yearly', name: 'Scanner Pro - Yearly', price: 500000, duration_days: 365 },
};

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, userEmail, userName } = await req.json(); 
    // IMPORTANT: userId here MUST be the Supabase Authenticated User ID (auth.users.id)

    const plan = plans[planId as keyof typeof plans];

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }
    if (!userId) {
        // This is critical for linking the transaction to a Supabase user
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const orderId = `SCANNER_PRO-${plan.id.toUpperCase()}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: plan.price,
      },
      item_details: [{
        id: plan.id,
        price: plan.price,
        quantity: 1,
        name: plan.name,
      }],
      customer_details: {
        first_name: userName || 'Guest',
        email: userEmail || 'guest@example.com',
        // phone: userPhone, // Optional, if you collect it
      },
      custom_field1: userId, // Passing Supabase User ID to Midtrans
      // custom_field2: planId, // Optionally pass your internal planId string too
      // Optional: Callbacks for redirection after payment (Snap.js callbacks are often preferred)
      // callbacks: {
      //   finish: `${process.env.NEXT_PUBLIC_APP_URL}/payment/finish?order_id=${orderId}`,
      // },
    };

    const snapToken = await snap.createTransactionToken(parameter);
    return NextResponse.json({ token: snapToken, orderId: orderId, planName: plan.name }); // Return planName for potential UI use

  } catch (error) {
    console.error('Midtrans API Error in /charge:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to create Midtrans transaction', details: errorMessage }, { status: 500 });
  }
}

// Removed updateUserSubscriptionForTelegram as it belongs in the Telegram webhook route. 