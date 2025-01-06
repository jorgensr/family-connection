import { supabase } from '../config/supabase';

const logPerformance = (methodName, startTime, details = {}) => {
  const duration = performance.now() - startTime;
  console.debug(`${methodName} took ${duration.toFixed(2)}ms`, details);
};

export const storageService = {
  async uploadFile(file, folder, fileName) {
    const startTime = performance.now();
    try {
      // Log upload start
      console.debug('Upload started:', { folder, fileName, size: file.size });
      
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

      logPerformance('uploadFile', startTime, { folder, fileName, size: file.size });
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async deleteFile(filePath, folder) {
    const startTime = performance.now();
    try {
      console.debug('Delete started:', { filePath, folder });
      
      // Determine the bucket based on the folder
      const bucket = folder === 'profile_photos' ? 'profiles' : 'memories';
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      
      logPerformance('deleteFile', startTime, { filePath, folder });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};