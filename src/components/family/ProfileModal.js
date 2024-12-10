import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { familyService } from '../../services/familyService';
import { storageService } from '../../services/storageService';

function ProfileModal({ member, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: member.first_name || '',
    last_name: member.last_name || '',
    birth_date: member.birth_date || '',
    bio: member.bio || '',
    profile_picture_url: member.profile_picture_url || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      first_name: member.first_name,
      last_name: member.last_name,
      birth_date: member.birth_date,
      bio: member.bio || '',
      profile_picture_url: member.profile_picture_url || ''
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const updates = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        birth_date: editData.birth_date || null,
        bio: editData.bio || null,
        profile_picture_url: editData.profile_picture_url || null
      };

      const updatedMember = await familyService.updateFamilyMember(member.id, updates);
      Object.assign(member, updatedMember); // Update the modal's displayed member
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      // We need familyId for uploading. If not stored in member, you can store it in the member or pass it as a prop.
      // If not available, consider passing it down to ProfileModal as well.
      // For now, let's assume you have `member.family_id` available.
      const url = await storageService.uploadFile(file, member.family_id, member.id);
      setEditData({ ...editData, profile_picture_url: url });
    } catch (err) {
      setError('Error uploading image. Please try again.');
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {isEditing ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Edit Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded focus:outline-none focus:border-blue-500"
                  value={editData.first_name}
                  onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded focus:outline-none focus:border-blue-500"
                  value={editData.last_name}
                  onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded focus:outline-none focus:border-blue-500"
                  value={editData.birth_date || ''}
                  onChange={(e) => setEditData({...editData, birth_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  className="w-full border p-2 rounded focus:outline-none focus:border-blue-500"
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                {editData.profile_picture_url && (
                  <img
                    src={editData.profile_picture_url}
                    alt="Profile"
                    className="w-24 h-24 object-cover rounded mb-2"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border p-2 rounded focus:outline-none focus:border-blue-500"
                  onChange={handleFileSelect}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p className="text-sm text-gray-600 mt-1">Uploading...</p>}
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800"
                disabled={loading || uploadingImage}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={loading || uploadingImage}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">{member.first_name} {member.last_name}</h2>
            {member.profile_picture_url ? (
              <img
                src={member.profile_picture_url}
                alt={`${member.first_name}'s profile`}
                className="w-32 h-32 object-cover rounded mb-4 mx-auto"
              />
            ) : (
              <p className="text-gray-500 text-center mb-4">No profile picture</p>
            )}
            <p className="text-gray-700 mb-2">Relationship: {member.relationship}</p>
            {member.birth_date && (
              <p className="text-gray-700 mb-2">Birth Date: {member.birth_date}</p>
            )}
            {member.bio && (
              <p className="text-gray-700 mb-2">Bio: {member.bio}</p>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleEdit}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileModal;
