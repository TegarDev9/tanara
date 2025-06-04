import { NextRequest, NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import crypto from 'crypto';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client

// Initialize Midtrans Core API client
const core = new Midtrans.CoreApi({
    isProduction: process.env.NODE_ENV === 'production',
    serverKey: process.env.YOUR_MIDTRANS_SERVER_KEY || 'YOUR_MIDTRANS_SERVER_KEY_PLACEHOLDER',
    clientKey: process.env.YOUR_MIDTRANS_CLIENT_KEY || 'YOUR_MIDTRANS_CLIENT_KEY_PLACEHOLDER'
});

// Plan definitions - ideally, share this with the charge route or fetch from DB
const midtransPlans = {
  trial: { id: 'scanner_pro_trial', name: 'Scanner Pro - Trial (1 Week)', price: 10000, duration_days: 7 },
  monthly: { id: 'scanner_pro_monthly', name: 'Scanner Pro - Monthly', price: 50000, duration_days: 30 },
  yearly: { id: 'scanner_pro_yearly', name: 'Scanner Pro - Yearly', price: 500000, duration_days: 365 },
};
type MidtransPlanKey = keyof typeof midtransPlans;


// Updated function to use Supabase
async function updateUserSubscriptionViaMidtrans(
    orderId: string, 
    midtransPlanIdKey: MidtransPlanKey, // e.g., 'trial', 'monthly', 'yearly' 
    paymentStatus: string, 
    transactionTime: string, 
    paymentType: string,
    userId: string | null // SUPABASE USER ID from Midtrans custom_field1 or extracted from orderId
) {
    console.log(`Updating Midtrans subscription for Supabase userId: ${userId}, orderId: ${orderId}`);
    console.log(`Plan Key: ${midtransPlanIdKey}, Status: ${paymentStatus}`);

    if (!userId) {
        console.error('Supabase user ID not provided for Midtrans notification. Cannot update subscription.');
        return { success: false, message: "User ID missing." };
    }

    const planDetails = midtransPlans[midtransPlanIdKey];
    if (!planDetails) {
        console.error(`Invalid plan key: ${midtransPlanIdKey} received from Midtrans notification for order ${orderId}`);
        return { success: false, message: "Invalid plan details." };
    }

    type ProfileUpdateData = {
        last_midtrans_order_id: string;
        pro_plan_id_midtrans?: MidtransPlanKey;
        pro_expiry_midtrans?: string;
        // Add other fields like payment_type, transaction_time if you store them
    };

    let updateData: ProfileUpdateData = {
        last_midtrans_order_id: orderId,
        // You might want to store payment_type, transaction_time as well
    };
    let successMessage = "Subscription status checked.";

    if (paymentStatus === 'settlement' || paymentStatus === 'capture') {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + planDetails.duration_days);

        updateData = {
            ...updateData,
            pro_plan_id_midtrans: midtransPlanIdKey,
            pro_expiry_midtrans: expiryDate.toISOString(),
        };
        successMessage = `Subscription for ${planDetails.name} activated. Expires: ${expiryDate.toISOString()}`;
        console.log(`Granting access for user ${userId} to plan ${planDetails.name} until ${expiryDate.toISOString()}`);

    } else if (paymentStatus === 'expire' || paymentStatus === 'cancel' || paymentStatus === 'deny') {
        // If a user had an active subscription from this order_id that is now cancelled/expired,
        // you might want to nullify their current Midtrans plan if it matches this order.
        // This logic can get complex depending on if you allow multiple active subs or only one.
        // For simplicity, let's assume we update if the current plan was tied to this order.
        // More robustly, you might just log this and handle expirations via a cron job checking pro_expiry_midtrans.
        updateData = {
            ...updateData,
            // Potentially set pro_plan_id_midtrans: null, pro_expiry_midtrans: null
            // if you want to immediately reflect this. Requires careful consideration of user experience.
        };
        successMessage = `Subscription for order ${orderId} ended with status: ${paymentStatus}`;
        console.log(`Payment status for user ${userId}, order ${orderId}: ${paymentStatus}`);
    }
    // 'pending' status might just be logged or you could update UI to show pending state.

    // Update the user's profile in Supabase
    // Assumes you have a 'profiles' table linked to auth.users by 'id'
    const { error: supabaseError } = await supabase
        .from('profiles') // YOUR PROFILES TABLE NAME
        .update(updateData)
        .eq('id', userId); // Match the Supabase auth user ID

    if (supabaseError) {
        console.error(`Supabase error updating profile for user ${userId}, order ${orderId}:`, supabaseError);
        return { success: false, message: `Supabase update failed: ${supabaseError.message}` };
    }

    console.log(successMessage + ` Supabase profile updated for user ${userId}.`);
    return { success: true, message: successMessage };
}

export async function POST(req: NextRequest) {
    try {
        const notificationJson = await req.json();
        console.log('Received Midtrans Notification:', notificationJson);

        // It's highly recommended to re-fetch transaction status from Midtrans as the source of truth
        const statusResponse = await core.transaction.status(notificationJson.order_id);
        console.log('Midtrans transaction.status response:', statusResponse);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;
        // Additional details from statusResponse
        const transactionTime = statusResponse.transaction_time;
        const paymentType = statusResponse.payment_type;
        const grossAmount = statusResponse.gross_amount;

        // IMPORTANT: Signature verification - implement this robustly based on Midtrans docs
        const serverKey = core.apiConfig.serverKey; // Get server key from initialized client
        const expectedSignatureKey = crypto.createHash('sha512')
                                     .update(`${orderId}${statusResponse.status_code}${grossAmount}${serverKey}`)
                                     .digest('hex');

        if (notificationJson.signature_key !== expectedSignatureKey && process.env.NODE_ENV === 'production') {
            console.warn('Midtrans signature key mismatch for order_id:', orderId);
            // For production, you might choose to return an error or rely solely on the statusResponse if signature fails
            // return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
            // For now, we proceed but heavily log the warning.
        }

        // Extract Supabase User ID. This is CRITICAL.
        // OPTION 1: From custom_field1 (Recommended)
        // You need to modify the /api/payment/midtrans/charge route to pass `userId` (Supabase auth ID)
        // as `custom_field1` in the Midtrans `parameter` object.
        const supabaseUserId: string | null = statusResponse.custom_field1 || null;
        
        // OPTION 2: Extract from order_id if you have a very specific format (less ideal)
        // Example: if orderId is `SCANNER_PRO-YEARLY-SUPABASE_USER_ID-TIMESTAMP`
        // This requires changing orderId format in the charge route.
        // if (!supabaseUserId && orderId.startsWith('SCANNER_PRO-')) {
        //     const parts = orderId.split('-');
        //     if (parts.length === 4) { // Example: SCANNER_PRO-YEARLY-USERID-TIMESTAMP
        //         supabaseUserId = parts[2];
        //     }
        // }

        if (!supabaseUserId) {
            console.error('CRITICAL: Supabase User ID could not be determined from Midtrans notification for order:', orderId);
            // Still acknowledge to Midtrans to prevent retries, but log critical error
            return NextResponse.json({ message: 'Notification received, but user ID missing for processing.' }, { status: 200 });
        }

        // Extract plan key (e.g., 'trial', 'monthly', 'yearly')
        let planKey: MidtransPlanKey | null = null;
        const orderIdPrefix = 'SCANNER_PRO-';
        if (orderId.startsWith(orderIdPrefix)) {
            const planPart = orderId.substring(orderIdPrefix.length).split('-')[0]; // YEARLY, MONTHLY, TRIAL
            const potentialKey = planPart.toLowerCase() as MidtransPlanKey;
            if (midtransPlans[potentialKey]) {
                planKey = potentialKey;
            }
        }

        if (!planKey) {
            console.error(`Could not determine planKey from orderId: ${orderId}`);
            return NextResponse.json({ message: 'Notification received, but plan could not be determined.' }, { status: 200 });
        }

        if ((transactionStatus === 'settlement' || transactionStatus === 'capture') && fraudStatus === 'accept') {
            console.log(`Payment successful and accepted for order ${orderId}`);
            await updateUserSubscriptionViaMidtrans(orderId, planKey, transactionStatus, transactionTime, paymentType, supabaseUserId);
        } else if (transactionStatus === 'pending') {
            console.log(`Payment pending for order ${orderId}`);
            // Optionally update Supabase with pending status if your UI needs to show it
            // await updateUserSubscriptionViaMidtrans(orderId, planKey, transactionStatus, transactionTime, paymentType, supabaseUserId);
        } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
            console.log(`Payment failed/expired for order ${orderId}. Status: ${transactionStatus}`);
            await updateUserSubscriptionViaMidtrans(orderId, planKey, transactionStatus, transactionTime, paymentType, supabaseUserId);
        }

        return NextResponse.json({ message: 'Notification received successfully' }, { status: 200 });

    } catch (error) {
        console.error('Midtrans Notification Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: 'Failed to process Midtrans notification', details: errorMessage }, { status: 500 });
    }
} 