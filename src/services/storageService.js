import { supabase } from '../config/supabase';

export const storageService = {
  async uploadFile(file, familyId, memberId) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${familyId}/${memberId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('family-media')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('family-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('family-media')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};