// src/pages/FamilyTree.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { familyService } from '../services/familyService';
import AddFamilyMemberModal from '../components/family/AddFamilyMemberModal';
import HierarchicalFamilyTree from '../components/family/HierarchicalFamilyTree';
import { ReactFlowProvider } from 'reactflow';
import { supabase } from '../config/supabase';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const FamilyTreeContent = ({ familyMembers, relationships, onAddMember }) => {
  if (familyMembers?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 mb-4">No family members yet</p>
        <button
          onClick={() => onAddMember(null)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Add First Family Member
        </button>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div style={{ height: '100%' }}>
        <HierarchicalFamilyTree
          key={`tree-${familyMembers.length}-${relationships.length}`}
          familyMembers={familyMembers}
          relationships={relationships}
          onAddMember={onAddMember}
        />
      </div>
    </ReactFlowProvider>
  );
};

function FamilyTree() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [family, setFamily] = useState(null);
  const { user } = useAuth();

  console.log('FamilyTree render:', {
    loading,
    membersCount: familyMembers.length,
    relationshipsCount: relationships.length,
    user: user?.id,
    familyId: family?.id
  });

  const loadFamilyTree = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available');
      return;
    }

    try {
      console.log('Loading family tree for user:', user.id);
      setLoading(true);
      setError(null);

      // First check for any claimed profiles for this user
      const { data: claimedMembers, error: claimError } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user.id)
        .eq('is_claimed', true)
        .order('claimed_at', { ascending: false }) // Get most recently claimed first
        .limit(1);

      if (claimError) throw claimError;

      let currentFamily = null;
      if (claimedMembers && claimedMembers.length > 0) {
        // User has a claimed profile, use that family
        const claimedMember = claimedMembers[0];
        console.log('Found claimed profile:', {
          memberId: claimedMember.id,
          name: `${claimedMember.first_name} ${claimedMember.last_name}`,
          familyId: claimedMember.family_id,
          claimedAt: claimedMember.claimed_at
        });
        
        if (!claimedMember.families) {
          throw new Error('Family data not found for claimed profile');
        }
        
        currentFamily = claimedMember.families;
        setFamily(currentFamily);
      } else {
        // Check for existing family created by user
        const { data: existingFamilies, error: fetchError } = await supabase
          .from('families')
          .select('*')
          .eq('created_by', user.id)
          .limit(1);

        if (fetchError) throw fetchError;

        if (existingFamilies && existingFamilies.length > 0) {
          currentFamily = existingFamilies[0];
          setFamily(currentFamily);
          console.log('Found existing family:', {
            familyId: currentFamily.id,
            name: currentFamily.name
          });
        } else {
          // No family exists yet, clear the states
          console.log('No family found for user');
          setFamily(null);
          setFamilyMembers([]);
          setRelationships([]);
          setLoading(false);
          return;
        }
      }

      // Only load members and relationships if we have a family
      console.log('Loading family data for:', currentFamily.id);
      const [members, rels] = await Promise.all([
        familyService.getFamilyMembers(currentFamily.id),
        familyService.getFamilyRelationships(currentFamily.id)
      ]);

      console.log('Data loaded:', {
        familyId: currentFamily.id,
        membersCount: members.length,
        relationshipsCount: rels.length
      });

      // Batch state updates
      setFamilyMembers(members);
      setRelationships(rels);
    } catch (err) {
      console.error('Error loading family tree:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('Load effect triggered, user:', user?.id);
    if (user?.id) {
      loadFamilyTree();
    }
  }, [loadFamilyTree, user?.id]);

  const handleAddMember = useCallback((member) => {
    console.log('Adding member relative to:', member);
    // If member exists, check if they have a spouse
    if (member) {
      const hasSpouse = relationships.some(rel => 
        (rel.relationship_type === 'spouse' && 
         (rel.member1_id === member.id || rel.member2_id === member.id))
      );
      setSelectedMember({ ...member, hasSpouse });
    } else {
      setSelectedMember(null);
    }
    setShowAddModal(true);
  }, [relationships]);

  const handleAddFamilyMember = useCallback(async (newMember) => {
    try {
      setError(null);

      // Get or create family only if we're actually adding a member (not simulating)
      let currentFamily = family;
      if (!currentFamily && !newMember.simulate) {
        // First check if user already has a family
        const { data: existingFamilies, error: fetchError } = await supabase
          .from('families')
          .select('*')
          .eq('created_by', user.id)
          .limit(1);

        if (fetchError) throw fetchError;

        if (existingFamilies && existingFamilies.length > 0) {
          currentFamily = existingFamilies[0];
          setFamily(currentFamily);
        } else {
          currentFamily = await familyService.getOrCreateFamily(`${user.email}'s Family`);
          setFamily(currentFamily);
        }
      }

      if (newMember.simulate) {
        // For simulation, use existing family if available, otherwise use a temporary ID
        const familyId = currentFamily?.id || 'temp-family-id';
        // Preview relationships
        const previewData = await familyService.previewMemberAddition({
          ...newMember,
          familyId
        });
        return previewData;
      } else {
        // If this is the first member (no relativeTo member), use addFirstFamilyMember
        if (!newMember.relatedMemberId) {
          await familyService.addFirstFamilyMember(currentFamily.id, {
            firstName: newMember.firstName,
            lastName: newMember.lastName,
            birthDate: newMember.birthDate,
            userId: user.id,
            gender: newMember.gender
          });
        } else {
          await familyService.addFamilyMember({
            ...newMember,
            familyId: currentFamily.id,
            gender: newMember.gender
          });
        }
        
        await loadFamilyTree();
        setShowAddModal(false);
        setSelectedMember(null);
      }
    } catch (err) {
      console.error('Error adding family member:', err);
      setError(err.message);
      throw err;
    }
  }, [loadFamilyTree, user?.email, user?.id, family]);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setSelectedMember(null);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {user?.email}'s Family Tree
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-6" style={{ height: '80vh' }}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <FamilyTreeContent
            familyMembers={familyMembers}
            relationships={relationships || []}
            onAddMember={handleAddMember}
          />
        )}
      </div>

      {showAddModal && (
        <AddFamilyMemberModal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          onAdd={handleAddFamilyMember}
          relativeTo={selectedMember}
        />
      )}
    </div>
  );
}

export default FamilyTree;