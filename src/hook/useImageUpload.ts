import { useState } from 'react';
export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  interface ImageToUpload {
    file: File;
    pixels: number;
  }

  const uploadImages = async (images: Array<ImageToUpload>): Promise<boolean> => {
    if (images.length === 0) {
      setError("Please select at least one image before uploading.");
      return false;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Supabase image upload logic removed.
      // If image upload is still required, it needs to be re-implemented
      // using a different storage solution or a custom backend.
      setError("Image upload functionality is currently disabled as Supabase integration has been removed.");
      return false;

    } catch (err: unknown) {
      console.error("Error during image upload process:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Operation failed: ${errorMessage || "An unknown error occurred"}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImages, isUploading, error };
};
