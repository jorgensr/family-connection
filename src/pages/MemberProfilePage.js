// src/pages/MemberProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { familyService } from '../services/familyService';
import { storageService } from '../services/storageService';
import InviteMemberModal from '../components/family/InviteMemberModal';
import { toast } from 'react-hot-toast';

function MemberProfilePage() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadMemberData = useCallback(async () => {
    if (!memberId) return;

    try {
      setLoading(true);
      setError(null);

      // Load member details
      const memberData = await familyService.getFamilyMember(memberId);
      setMember(memberData);

      // Load member memories
      const memoriesData = await familyService.getMemberMemories(memberId);
      setMemories(memoriesData);
    } catch (err) {
      console.error('Error loading member data:', err);
      setError(err.message || 'Failed to load member data');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Upload photo to storage
      const fileName = `profile_photos/${memberId}_${Date.now()}`;
      const photoUrl = await storageService.uploadFile(file, 'profile_photos', fileName);

      // Update member profile with new photo URL
      await familyService.updateFamilyMember(memberId, {
        profile_picture_url: photoUrl
      });

      // Reload member data
      await loadMemberData();
      toast.success('Profile photo updated successfully');
    } catch (err) {
      console.error('Error uploading photo:', err);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleInviteSuccess = () => {
    toast.success('Invite sent successfully!');
    setShowInviteModal(false);
    // Reload member data to reflect the updated invite status
    loadMemberData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-600">
          Member not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"
                  style={{
                    background: member.gender === 'male' ? '#E3F2FD' : '#FCE4EC',
                  }}
                >
                  {member.profile_picture_url ? (
                    <img
                      src={member.profile_picture_url}
                      alt={`${member.first_name} ${member.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span 
                      className="text-3xl"
                      style={{
                        color: member.gender === 'male' ? '#1565C0' : '#C2185B',
                      }}
                    >
                      {member.first_name[0]}{member.last_name[0]}
                    </span>
                  )}
                </div>
                {member.is_claimed && (
                  <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-lg">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                    {uploadingPhoto ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                    ) : (
                      <span>📷</span>
                    )}
                  </label>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {member.first_name} {member.last_name}
                </h1>
                {member.birth_date && (
                  <p className="text-gray-600 mt-1">
                    Birth Date: {new Date(member.birth_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            {!member.is_claimed && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
                title="Invite to claim profile"
              >
                <span>✉</span>
                <span>Invite to Claim Profile</span>
              </button>
            )}
          </div>
          
          {member.bio && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Bio</h2>
              <p className="text-gray-700">{member.bio}</p>
            </div>
          )}

          {member.is_claimed && (
            <div className="mt-4 bg-blue-50 text-blue-700 px-4 py-2 rounded-md">
              ✓ Profile Claimed
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Memories</h2>
        {memories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-600">
            No memories shared yet.
          </div>
        ) : (
          <div className="grid gap-6">
            {memories.map(memory => (
              <div key={memory.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{memory.title}</h3>
                  {memory.description && (
                    <p className="text-gray-700 mb-4">{memory.description}</p>
                  )}
                  {memory.media_url && (
                    <img 
                      src={memory.media_url} 
                      alt={memory.title}
                      className="w-full h-auto rounded-lg"
                    />
                  )}
                  <div className="mt-4 text-sm text-gray-500">
                    Shared on {new Date(memory.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          member={{
            id: member.id,
            first_name: member.first_name,
            last_name: member.last_name
          }}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
}

export default MemberProfilePage;