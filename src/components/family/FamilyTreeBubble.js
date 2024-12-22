// src/components/family/FamilyTreeBubble.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, PlusIcon } from '@heroicons/react/24/solid';
import { familyService } from '../../services/familyService';

const FamilyTreeBubble = ({ member, onAddMember, viewingMemberId }) => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (!member?.family_id || !viewingMemberId) return;
      
      try {
        setLoading(true);
        const members = await familyService.getFamilyMembersWithRelationships(
          member.family_id,
          viewingMemberId
        );
        const filteredMembers = members.filter(m => m.id !== viewingMemberId);
        console.log('Loaded family members:', filteredMembers);
        setFamilyMembers(filteredMembers);
      } catch (err) {
        console.error('Error loading family members:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFamilyMembers();
  }, [member?.family_id, viewingMemberId]);

  const handleBubbleClick = useCallback((memberId) => {
    navigate(`/family-member/${memberId}`);
  }, [navigate]);

  const renderMemberBubble = useCallback((person) => (
    <div key={person.id} className="relative group">
      <button 
        onClick={() => handleBubbleClick(person.id)}
        className="relative w-20 h-20 rounded-full bg-white border-4 border-blue-500 overflow-hidden hover:border-blue-600 transition-colors"
      >
        {person.profile_picture_url ? (
          <img 
            src={person.profile_picture_url} 
            alt={`${person.first_name} ${person.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserCircleIcon className="w-full h-full text-gray-400" />
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddMember(person);
        }}
        className="absolute -right-2 -bottom-2 bg-blue-500 rounded-full p-1 hover:bg-blue-600 transition-colors"
        title="Add family member"
      >
        <PlusIcon className="w-4 h-4 text-white" />
      </button>
      <div className="mt-2 text-center">
        <div className="font-medium text-gray-900">{`${person.first_name} ${person.last_name}`}</div>
        <div className="text-sm text-gray-600">{person.relationship}</div>
      </div>
    </div>
  ), [handleBubbleClick, onAddMember]);

  const groupMembersByRelationship = () => {
    const groups = {
      parents: familyMembers.filter(m => m.relationship === 'Parent'),
      spouse: familyMembers.filter(m => m.relationship === 'Spouse'),
      siblings: familyMembers.filter(m => m.relationship === 'Sibling'),
      children: familyMembers.filter(m => m.relationship === 'Child'),
      extended: familyMembers.filter(m => m.relationship === 'Extended Family')
    };

    return groups;
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  const groups = groupMembersByRelationship();

  return (
    <div className="family-tree-container">
      {/* Parents */}
      {groups.parents.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-8 justify-center">
            {groups.parents.map(parent => renderMemberBubble(parent))}
          </div>
        </div>
      )}

      {/* Current Member and Spouse */}
      <div className="flex justify-center items-center gap-12 mb-8">
        {renderMemberBubble(member)}
        {groups.spouse.map(spouse => renderMemberBubble(spouse))}
      </div>

      {/* Siblings */}
      {groups.siblings.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-8 justify-center">
            {groups.siblings.map(sibling => renderMemberBubble(sibling))}
          </div>
        </div>
      )}

      {/* Children */}
      {groups.children.length > 0 && (
        <div className="mt-8">
          <div className="grid grid-cols-3 gap-8 justify-center">
            {groups.children.map(child => renderMemberBubble(child))}
          </div>
        </div>
      )}

      {/* Extended Family */}
      {groups.extended.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Extended Family</h3>
          <div className="grid grid-cols-4 gap-6">
            {groups.extended.map(member => renderMemberBubble(member))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTreeBubble;