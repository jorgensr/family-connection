import React, { useState } from 'react';
import { storageService } from '../../services/storageService';

function MediaUpload({ familyId, memberId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const fileUrl = await storageService.uploadFile(file, familyId, memberId);
      onUploadComplete(fileUrl);
    } catch (err) {
      setError('Error uploading file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4">
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      <label className="block">
        <span className="sr-only">Choose file</span>
        <input
          type="file"
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50"
          onChange={handleFileSelect}
          disabled={uploading}
          accept="image/*,.pdf,.doc,.docx"
        />
      </label>
      {uploading && (
        <div className="mt-2 text-sm text-gray-600">
          Uploading...
        </div>
      )}
    </div>
  );
}

export default MediaUpload;