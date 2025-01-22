// src/pages/FamilyTree.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ReactFlowProvider } from 'reactflow';
import { PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from '../config/supabase';
import AddFamilyMemberModal from '../components/family/AddFamilyMemberModal';
import FamilyTreeStart from '../components/family/FamilyTreeStart';
import FamilyTreeControls from '../components/family/FamilyTreeControls';
import HierarchicalFamilyTree from '../components/family/HierarchicalFamilyTree';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { familyService } from '../services/familyService';

const FamilyTreeContent = ({ familyMembers, relationships, onAddMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showControls, setShowControls] = useState(false);

  console.log('FamilyTreeContent render:', { 
    hasFamilyMembers: Boolean(familyMembers?.length),
    membersCount: familyMembers?.length,
    members: familyMembers 
  });

  // Only show FamilyTreeStart if familyMembers is explicitly empty
  if (!familyMembers || familyMembers.length === 0) {
    console.log('Showing FamilyTreeStart');
    return <FamilyTreeStart onStartTree={onAddMember} />;
  }

  console.log('Showing HierarchicalFamilyTree');
  return (
    <ReactFlowProvider>
      <div className="relative h-full">
        <FamilyTreeControls
          onReset={() => {}} // Will be implemented in HierarchicalFamilyTree
          onSearch={() => {}} // Will be implemented in HierarchicalFamilyTree
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showControls={showControls}
          setShowControls={setShowControls}
        />
        <div className="w-full h-full">
          <HierarchicalFamilyTree
            key={`tree-${familyMembers.length}-${relationships.length}`}
            familyMembers={familyMembers}
            relationships={relationships}
            onAddMember={onAddMember}
            searchQuery={searchQuery}
          />
        </div>
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
  const [showFirstMemberForm, setShowFirstMemberForm] = useState(false);
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
    if (familyMembers.length === 0) {
      setShowFirstMemberForm(true);
    } else if (member) {
      // Find spouse if exists
      const spouseRelationship = relationships.find(rel => 
        rel.relationship_type === 'spouse' && 
        (rel.member1_id === member.id || rel.member2_id === member.id)
      );
      
      let spouse = null;
      if (spouseRelationship) {
        const spouseId = spouseRelationship.member1_id === member.id 
          ? spouseRelationship.member2_id 
          : spouseRelationship.member1_id;
        spouse = familyMembers.find(m => m.id === spouseId);
      }
      
      setSelectedMember({ ...member, spouse });
      setShowAddModal(true);
    }
  }, [familyMembers, relationships]);

  const handleAddFirstMember = async (memberData) => {
    try {
      console.log('Adding first member:', memberData);
      setLoading(true);

      if (!family) {
        // Create new family
        const newFamily = await familyService.getOrCreateFamily('My Family');
        console.log('Created new family:', newFamily);
        
        if (!newFamily?.id) {
          throw new Error('Failed to create family');
        }

        // Add first member
        const result = await familyService.addFirstFamilyMember(newFamily.id, {
          ...memberData,
          userId: user.id
        });

        console.log('Added first member:', result);
        
        if (!result?.id) {
          throw new Error('Failed to add first member');
        }

        // Update local state
        setFamily(newFamily);
        setFamilyMembers([result]);
        setShowFirstMemberForm(false);

        // Reload full tree data
        await loadFamilyTree();
      } else {
        throw new Error('Family already exists');
      }
    } catch (error) {
      console.error('Error adding first member:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRelative = async (memberData) => {
    try {
      setLoading(true);
      console.log('Adding relative:', memberData);

      const result = await familyService.addFamilyMember({
        ...memberData,
        familyId: family.id
      });

      console.log('Added relative:', result);

      if (!result?.member?.id) {
        throw new Error('Failed to add family member');
      }

      // Reload full tree data
      await loadFamilyTree();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding relative:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-none bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Family Tree</h1>
            <button
              onClick={() => handleAddMember(null)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Family Member
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <FamilyTreeContent
          familyMembers={familyMembers}
          relationships={relationships}
          onAddMember={handleAddMember}
        />
      </div>

      {showFirstMemberForm && (
        <AddFamilyMemberModal
          isOpen={showFirstMemberForm}
          onClose={() => setShowFirstMemberForm(false)}
          familyId={family?.id}
          onSuccess={handleAddFirstMember}
        />
      )}

      {showAddModal && selectedMember && (
        <AddFamilyMemberModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          familyId={family?.id}
          onSuccess={handleAddRelative}
          relativeTo={selectedMember}
        />
      )}
    </div>
  );
}

export default FamilyTree;