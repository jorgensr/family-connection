// src/pages/MemberProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { familyService } from '../services/familyService';

function MemberProfilePage() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMemberData = async () => {
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
    };

    loadMemberData();
  }, [memberId]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {member.first_name} {member.last_name}
          </h1>
          
          {member.birth_date && (
            <p className="text-gray-600 mb-2">
              Birth Date: {new Date(member.birth_date).toLocaleDateString()}
            </p>
          )}
          
          {member.bio && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Bio</h2>
              <p className="text-gray-700">{member.bio}</p>
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
    </div>
  );
}

export default MemberProfilePage;