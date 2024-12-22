import { supabase } from '../config/supabase';

export const storageService = {
  async uploadFile(file, folder, fileName) {
    try {
      const { data, error } = await supabase.storage
        .from('memories')
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
        .from('memories')
        .getPublicUrl(`${folder}/${fileName}`);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('memories')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};