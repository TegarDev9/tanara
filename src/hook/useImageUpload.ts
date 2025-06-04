import { useState } from 'react';
// Ubah impor dari @supabase/auth-helpers-nextjs ke @supabase/ssr dan @supabase/supabase-js
import { createBrowserClient } from "@supabase/ssr"; 
import type { SupabaseClient } from "@supabase/supabase-js"; // Impor tipe SupabaseClient
import { updateUser } from '../actions/updateUser'; // Changed to plural 'actions'

// Define a more specific type for the Supabase client if needed,
// otherwise SupabaseClient from @supabase/auth-helpers-nextjs is generally fine.
// type CustomSupabaseClient = SupabaseClient<YourDatabaseSchema>;

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize Supabase client menggunakan createBrowserClient.
  // Explicitly type if you have a custom schema, otherwise SupabaseClient is inferred.
  const supabase: SupabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  /**
   * Represents an image to be uploaded.
   * file: The File object.
   * pixels: This property is currently not used in the upload logic.
   * Consider removing it if it's not needed, or implement its usage.
   */
  interface ImageToUpload {
    file: File;
    pixels: number; // Note: 'pixels' is not currently used in the logic below.
  }

  const uploadImages = async (images: Array<ImageToUpload>): Promise<boolean> => {
    if (images.length === 0) {
      setError("Please select at least one image before uploading.");
      return false;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error fetching user:", userError);
        throw new Error("Authentication error: Could not fetch user details.");
      }
      if (!user) {
        throw new Error("User not authenticated. Please log in.");
      }

      const uploadedUrls: string[] = [];

      // 2. Loop through images and upload each one
      for (const { file } of images) {
        // Generate a more unique file name using crypto.randomUUID() if available
        const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${randomPart}${fileExtension ? '.' + fileExtension : ''}`;
        const filePath = `${user.id}/selfies/${fileName}`; // Store images in a user-specific folder

        // Upload the file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("userphotos") // Ensure this bucket name is correct and RLS policies are set
          .upload(filePath, file, {
            cacheControl: "3600", // Cache for 1 hour
            upsert: false, // Do not overwrite if file already exists (throws error)
          });

        if (uploadError) {
          console.error("Supabase storage upload error:", uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get the public URL for the uploaded image
        // Destrukturisasi ini sudah benar
        const { data: publicUrlData } = supabase.storage
          .from("userphotos")
          .getPublicUrl(filePath);

        // Check for urlError before using publicUrlData
        if (!publicUrlData) {
          console.error("Error getting public URL for file");
          throw new Error(`Failed to get public URL for ${fileName}`);
        }

        // Corrected: Use publicUrl (lowercase 'u') as per TypeScript error
        if (!publicUrlData || !publicUrlData.publicUrl) { 
            console.error("Public URL data is invalid or null:", publicUrlData);
            throw new Error(`Could not retrieve a valid public URL for ${fileName}.`);
        }
        
        uploadedUrls.push(publicUrlData.publicUrl); 
      }

      // 3. Update the user's profile or relevant data with the new image URLs
      // Ensure the structure { userPhotos: { userSelfies: uploadedUrls } }
      // matches what your `updateUser` action expects.
      await updateUser({ userPhotos: { userSelfies: uploadedUrls } }, user.id);

      // Optionally, you might want to clear the error state on success
      // setError(null); 
      return true;

    } catch (err: unknown) {
      console.error("Error during image upload process:", err);
      // Use err.message if err is an instance of Error, otherwise convert to string
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Operation failed: ${errorMessage || "An unknown error occurred"}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImages, isUploading, error };
};