'use server';

import { createSupabaseActionClient } from '@/lib/supabase/actions';
import TelegramBot from 'node-telegram-bot-api';

interface UserProfileData {
  // Define the structure of data you expect to update, e.g.:
  userPhotos?: {
    userSelfies?: string[];
    [key: string]: unknown; // Changed to unknown
  };
  // Add other profile fields that can be updated
  [key: string]: unknown; // Changed to unknown
}

export async function updateUser(data: UserProfileData, userId: string): Promise<{ success: boolean; message: string; error?: unknown }> {
  const supabase = createSupabaseActionClient();
  let telegramMessageSent = false;

  try {
    // 1. Update user profile in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return { success: false, message: 'Gagal memperbarui profil di Supabase.', error: updateError };
    }

    // 2. Fetch user's Telegram ID and username for notification
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_id, telegram_username')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.warn('Gagal mengambil data profil untuk notifikasi Telegram:', profileError);
      // Proceed even if Telegram notification fails, as Supabase update was successful
    }

    // 3. Send Telegram notification if telegram_id exists
    if (profileData?.telegram_id) {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        console.warn('TELEGRAM_BOT_TOKEN tidak diatur. Notifikasi Telegram dilewati.');
      } else {
        try {
          const bot = new TelegramBot(token);
          const message = `Halo ${profileData.telegram_username || 'Pengguna'}! Foto profil Anda telah berhasil diperbarui di aplikasi HandsFinance.

${data.userPhotos?.userSelfies && data.userPhotos.userSelfies.length > 0 ? `URL Foto baru: ${data.userPhotos.userSelfies[0]}` : 'Foto profil Anda telah diubah.'}`;
          await bot.sendMessage(profileData.telegram_id, message);
          telegramMessageSent = true;
        } catch (telegramError: unknown) {
          console.error('Gagal mengirim notifikasi Telegram:', telegramError);
          // Log this error but don't fail the whole operation if Supabase update was successful
        }
      }
    }

    let successMessage = 'Profil berhasil diperbarui.';
    if (telegramMessageSent) {
      successMessage += ' Notifikasi Telegram telah dikirim.';
    } else if (profileData?.telegram_id && !telegramMessageSent) { // check if telegram_id existed but message failed
      successMessage += ' Gagal mengirim notifikasi Telegram.';
    }

    return { success: true, message: successMessage };

  } catch (error: unknown) {
    console.error('Kesalahan tak terduga dalam updateUser:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'Terjadi kesalahan tak terduga.', error: errorMessage };
  }
}
