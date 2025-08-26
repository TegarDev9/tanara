import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, name, payload } = body;
    if (!telegramId) return NextResponse.json({ error: 'telegramId required' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    await supabase.from('users').upsert({ telegram_id: telegramId }, { onConflict: 'telegram_id' });
    const { data, error } = await supabase.from('presets').insert({ telegram_id: telegramId, name, payload }).select();
    if (error) throw error;
    return NextResponse.json(data || []);
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
    const { data, error } = await supabase.from('presets').select('*').eq('telegram_id', telegramId);
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, presetId } = body;
    if (!telegramId || !presetId) return NextResponse.json({ error: 'telegramId and presetId required' }, { status: 400 });
    const { error } = await supabase.from('presets').delete().match({ id: presetId, telegram_id: telegramId });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
