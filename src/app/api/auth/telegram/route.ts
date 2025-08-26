import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyTelegramAuth } from '@/lib/telegram';

// Define a type for the user record to avoid using `any`.
interface User {
  id: number;
  telegram_id: string;
  created_at: string;
  // Add other user fields here as necessary.
}

// Endpoint to link a Telegram ID to a user record. If `authData` (the Telegram
// Web App auth object) is provided, validate it using BOT_TOKEN. Otherwise fall
// back to accepting a `telegramId` in the body (MVP).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let telegramId = body?.telegramId;

    if (body?.authData) {
      const botToken = process.env.BOT_TOKEN;
      if (!botToken) return NextResponse.json({ error: 'BOT_TOKEN not configured on server' }, { status: 500 });
      const ok = verifyTelegramAuth(body.authData, botToken);
      if (!ok) return NextResponse.json({ error: 'invalid authData' }, { status: 403 });
      telegramId = String(body.authData.id || telegramId);
    }

    if (!telegramId) return NextResponse.json({ error: 'telegramId required' }, { status: 400 });

    let userRecord: User | null = null;
    const { data: users } = await supabase.from('users').select('*').eq('telegram_id', telegramId).limit(1);
    if (!users || users.length === 0) {
      const { data: created } = await supabase.from('users').insert({ telegram_id: telegramId }).select();
      userRecord = created?.[0] ?? null;
    } else {
      userRecord = users[0] as User;
    }
    return NextResponse.json({ success: true, user: userRecord });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
