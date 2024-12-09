import React, { useState, useEffect, useCallback } from 'react';
import { familyService } from '../../services/familyService';


function MediaGallery({ familyId, memberId }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, [familyId, memberId]);

  const loadMedia = useCallback(async () => {
    try {
      const mediaData = await familyService.getFamilyMedia(familyId, memberId);
      setMedia(mediaData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [familyId, memberId]);
  
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  if (loading) return <div>Loading media...</div>;

  return (
    <div className="mt-4 grid grid-cols-3 gap-4">
      {media.map((item) => (
        <div key={item.id} className="relative group">
          {item.file_type.startsWith('image/') ? (
            <img 
              src={item.url} 
              alt={item.title || 'Family media'} 
              className="w-full h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">{item.file_type}</span>
            </div>
          )}
          {item.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
              {item.title}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MediaGallery;