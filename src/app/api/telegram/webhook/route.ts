import { NextRequest, NextResponse } from 'next/server';
import TelegramBot, { Update as TelegramUpdate } from 'node-telegram-bot-api';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN_PLACEHOLDER';
const PAYMENT_PROVIDER_TOKEN = process.env.TELEGRAM_STARS_PROVIDER_TOKEN || 'YOUR_TELEGRAM_STARS_PROVIDER_TOKEN_PLACEHOLDER';

// Initialize the bot without polling, as we're using a webhook
// Make sure BOT_TOKEN is set in your environment variables
let bot: TelegramBot;
if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_PLACEHOLDER') {
    bot = new TelegramBot(BOT_TOKEN);
} else {
    console.warn('Telegram Bot Token not found. Telegram features will be disabled.');
    // You might want to throw an error here or handle it more gracefully
    // For now, we'll let it proceed but bot operations will fail.
}

// Define Scanner Pro plans with prices in Telegram Stars (XTR)
// Prices are in the smallest units (1 Star = 1 unit for XTR)
const telegramPlans = {
  trial: { id: 'scanner_pro_trial_tg', name: 'Scanner Pro - Trial (1 Week)', stars: 70, duration_days: 7, description: '7-day trial of Scanner Pro.' },
  monthly: { id: 'scanner_pro_monthly_tg', name: 'Scanner Pro - Monthly', stars: 350, duration_days: 30, description: 'Monthly access to Scanner Pro.' },
  yearly: { id: 'scanner_pro_yearly_tg', name: 'Scanner Pro - Yearly', stars: 3500, duration_days: 365, description: 'Yearly access to Scanner Pro.' },
};
type TelegramPlanKey = keyof typeof telegramPlans;

// Updated function to use Supabase for Telegram subscriptions
async function updateUserSubscriptionForTelegram(
    telegramUserId: number, 
    telegramUsername: string | undefined, 
    planKey: TelegramPlanKey, 
    starsAmount: number, 
    telegramPaymentChargeId: string
) {
    console.log(`Updating Telegram subscription for Telegram UserID: ${telegramUserId}, PlanKey: ${planKey}`);

    const planDetails = telegramPlans[planKey];
    if (!planDetails) {
        console.error(`Invalid plan key: ${planKey} for Telegram user ${telegramUserId}`);
        return { success: false, message: "Invalid plan details." };
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + planDetails.duration_days);

    const profileDataToUpsert = {
        // id: auth.uid() - This would only work if the user is somehow authenticated via Supabase auth flow first.
        // For a bot-first interaction, we usually link by telegram_id.
        // If a profile for this telegram_id doesn't exist, a new one is created with a new UUID for its 'id' PK.
        // If it exists, it's updated.
        telegram_id: telegramUserId,
        telegram_username: telegramUsername,
        pro_plan_id_telegram: planDetails.id, // Store the specific plan ID like 'scanner_pro_trial_tg'
        pro_expiry_telegram: expiryDate.toISOString(),
        last_telegram_charge_id: telegramPaymentChargeId,
        // You might want to add other fields like last_seen_telegram, etc.
    };

    // Upsert into 'profiles' table. Assumes 'telegram_id' is a column you want to match on.
    // If 'telegram_id' is unique, this will update the existing row or insert a new one.
    // If your primary key is 'id' and you want to update based on 'telegram_id',
    // ensure 'telegram_id' has a unique constraint for this upsert to behave as expected for updates.
    const { data, error: supabaseError } = await supabase
        .from('profiles') // YOUR PROFILES TABLE NAME
        .upsert(profileDataToUpsert, { onConflict: 'telegram_id' }) // Match on telegram_id
        .select() // Return the upserted/updated row
        .single(); // Expect a single row

    if (supabaseError) {
        console.error(`Supabase error upserting profile for Telegram UserID ${telegramUserId}:`, supabaseError);
        return { success: false, message: `Supabase upsert failed: ${supabaseError.message}` };
    }

    const successMessage = `Subscription for ${planDetails.name} via Telegram activated for user ${telegramUserId}. Expires: ${expiryDate.toISOString()}`;
    console.log(successMessage + ` Supabase profile upserted/updated: ${JSON.stringify(data)}`);
    return { success: true, message: successMessage, profile: data };
}

export async function POST(req: NextRequest) {
  if (!bot) {
    return NextResponse.json({ error: 'Telegram Bot not initialized.' }, { status: 500 });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram Update:', JSON.stringify(update, null, 2));

    // Handle /start or /subscribe commands
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const from = update.message.from;

      if (!from || !from.id) {
        bot.sendMessage(chatId, 'Could not identify user.');
        return NextResponse.json({ message: 'OK' });
      }
      const userId = from.id;

      let planKey: TelegramPlanKey | null = null;
      if (text.startsWith('/subscribe trial') || text.startsWith('/start trial')) {
        planKey = 'trial';
      } else if (text.startsWith('/subscribe monthly') || text.startsWith('/start monthly')) {
        planKey = 'monthly';
      } else if (text.startsWith('/subscribe yearly') || text.startsWith('/start yearly')) {
        planKey = 'yearly';
      }
      // Basic help/info message
      else if (text.startsWith('/start') || text.startsWith('/help')) {
        const helpMessage = `Welcome to Scanner Pro Bot!\n\nUse commands to subscribe:\n/subscribe trial - ${telegramPlans.trial.stars} Stars for ${telegramPlans.trial.duration_days} days\n/subscribe monthly - ${telegramPlans.monthly.stars} Stars for ${telegramPlans.monthly.duration_days} days\n/subscribe yearly - ${telegramPlans.yearly.stars} Stars for ${telegramPlans.yearly.duration_days} days`;
        bot.sendMessage(chatId, helpMessage);
        return NextResponse.json({ message: 'OK' });
      }

      if (planKey) {
        const plan = telegramPlans[planKey];
        const uniquePayload = `${plan.id}-${userId}-${Date.now()}`; // Ensure this is unique

        await bot.sendInvoice(
          chatId,
          plan.name,
          plan.description,
          uniquePayload, // Unique deep-linking parameter or invoice payload
          PAYMENT_PROVIDER_TOKEN, // Your Telegram Stars payment provider token
          'XTR', // Currency code for Telegram Stars
          [{ label: plan.name, amount: plan.stars }], // Price breakdown
          {
            // photo_url: 'YOUR_PRODUCT_IMAGE_URL', // Optional: URL of a photo for the invoice
            // need_name: true, // Optional: if you need user's name
            // need_email: true, // Optional: if you need user's email
            // send_email_to_provider: true, // Optional
            // is_flexible: false, // Optional: set to true if you need to adjust price based on shipping, etc.
          }
        );
      }
    }
    // Handle pre-checkout query (user clicks "Pay")
    else if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      console.log('PreCheckoutQuery received:', query);
      // TODO: Add validation logic here if needed (e.g., check stock, user eligibility)
      // For now, we always confirm.
      await bot.answerPreCheckoutQuery(query.id, true);
      console.log('Responded to PreCheckoutQuery');
    }
    // Handle successful payment
    else if (update.message && update.message.successful_payment) {
      const payment = update.message.successful_payment;
      const chatId = update.message.chat.id;
      const from = update.message.from;

      if (!from || !from.id) {
        console.error('Successful payment but no user ID in `from` field.');
        bot.sendMessage(chatId, 'Payment received, but there was an issue identifying your account. Please contact support.');
        return NextResponse.json({ message: 'OK' });
      }
      const userId = from.id;
      const _username = from.username;

      // Extract planId from invoice_payload (which we set as uniquePayload)
      const payloadParts = payment.invoice_payload.split('-');
      const planIdFromPayload = payloadParts[0]; // e.g., 'scanner_pro_trial_tg'
      
      let matchedPlanKey: TelegramPlanKey | null = null;
      for (const key in telegramPlans) {
          if (telegramPlans[key as TelegramPlanKey].id === planIdFromPayload) {
              matchedPlanKey = key as TelegramPlanKey;
              break;
          }
      }

      if (matchedPlanKey) {
        const plan = telegramPlans[matchedPlanKey];
        const subResult = await updateUserSubscriptionForTelegram(userId, _username, matchedPlanKey, payment.total_amount, payment.telegram_payment_charge_id);
        if (subResult.success) {
          bot.sendMessage(chatId, `Thank you for your purchase of ${plan.name}! Your access has been granted.`);
        } else {
          bot.sendMessage(chatId, `Thank you for your payment! There was an issue activating your subscription: ${subResult.message}. Please contact support.`);
        }
      } else {
        console.error(`Could not match plan ID from payload: ${planIdFromPayload} for user ${userId}`);
        bot.sendMessage(chatId, 'Thank you for your payment! There was an error processing your subscription type. Please contact support.');
      }
    }

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    // Avoid sending error details back to Telegram unless it's a specific format they expect for retries etc.
    return NextResponse.json({ error: errorMessage, details: 'Failed to process Telegram update' }, { status: 200 }); // Respond 200 to Telegram to avoid retries on internal errors
  }
} 