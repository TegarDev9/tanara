import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, symbol, interval, indicators, settings } = body;
    if (!telegramId) return NextResponse.json({ error: 'telegramId required' }, { status: 400 });

    // ensure user exists
    await supabase.from('users').upsert({ telegram_id: telegramId }, { onConflict: 'telegram_id' });

    const { data, error } = await supabase.from('preferences').upsert({ telegram_id: telegramId, symbol, interval, indicators, settings }, { onConflict: 'telegram_id' });
    if (error) throw error;
    return NextResponse.json(data?.[0] ?? {});
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const telegramId = url.searchParams.get('telegramId') || '';
    if (!telegramId) return NextResponse.json({ error: 'telegramId required' }, { status: 400 });
    const { data, error } = await supabase.from('preferences').select('*').eq('telegram_id', telegramId).limit(1);
    if (error) throw error;
    return NextResponse.json(data?.[0] ?? null);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
