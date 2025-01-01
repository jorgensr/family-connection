import { supabase } from '../config/supabase';

export const storageService = {
  async uploadFile(file, folder, fileName) {
    try {
      // Determine the bucket based on the folder
      const bucket = folder === 'profile_photos' ? 'profiles' : 'memories';
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(`${folder}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(`${folder}/${fileName}`);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async deleteFile(filePath, folder) {
    try {
      // Determine the bucket based on the folder
      const bucket = folder === 'profile_photos' ? 'profiles' : 'memories';
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};