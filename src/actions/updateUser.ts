'use server';

import { createSupabaseActionClient } from '@/lib/supabase/actions';

interface UserProfileData {
  // Define the structure of data you expect to update, e.g.:
  userPhotos?: {
    userSelfies?: string[];
    [key: string]: unknown;
  };
  // Add other profile fields that can be updated
  [key: string]: unknown;
}

export async function updateUser(data: UserProfileData, userId: string): Promise<{ success: boolean; message: string; error?: unknown }> {
  const supabase = createSupabaseActionClient();

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

    return { success: true, message: 'Profil berhasil diperbarui.' };

  } catch (error: unknown) {
    console.error('Kesalahan tak terduga dalam updateUser:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: 'Terjadi kesalahan tak terduga.', error: errorMessage };
  }
}
