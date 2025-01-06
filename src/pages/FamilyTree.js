// src/pages/FamilyTree.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { familyService } from '../services/familyService';
import AddFamilyMemberModal from '../components/family/AddFamilyMemberModal';
import HierarchicalFamilyTree from '../components/family/HierarchicalFamilyTree';
import { ReactFlowProvider } from 'reactflow';
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const EmptyState = ({ onAddMember }) => (
  <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center">
    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
      <PlusIcon className="h-8 w-8 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Family Tree</h3>
    <p className="text-gray-500 mb-6">Begin by adding your first family member to create your family tree.</p>
    <button
      onClick={() => onAddMember(null)}
      className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      <PlusIcon className="h-5 w-5 mr-2" />
      Add First Family Member
    </button>
  </div>
);

const FamilyTreeControls = ({ onReset, onSearch, searchQuery, setSearchQuery, showControls, setShowControls }) => (
  <div className="absolute top-4 left-4 z-10 space-y-2">
    <div className="bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
      <div className="relative">
        <input
          type="text"
          placeholder="Search family members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
      </div>
      <button
        onClick={onReset}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        title="Reset view"
      >
        <ArrowPathIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => setShowControls(!showControls)}
        className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${showControls ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
        title="Show controls"
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5" />
      </button>
    </div>

    <Transition
      show={showControls}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1"
    >
      <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Controls</h3>
          <button
            onClick={() => setShowControls(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Pan</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">Drag or Arrow Keys</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Zoom</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">Scroll or +/-</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Reset View</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">R</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
);

const FamilyTreeContent = ({ familyMembers, relationships, onAddMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showControls, setShowControls] = useState(false);

  if (familyMembers?.length === 0) {
    return <EmptyState onAddMember={onAddMember} />;
  }

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
        <HierarchicalFamilyTree
          key={`tree-${familyMembers.length}-${relationships.length}`}
          familyMembers={familyMembers}
          relationships={relationships}
          onAddMember={onAddMember}
          searchQuery={searchQuery}
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

      // Skip relationship preview for first member
      if (!newMember.relatedMemberId && newMember.simulate) {
        return {
          member: {
            id: uuidv4(),
            family_id: currentFamily?.id || uuidv4(),
            first_name: newMember.firstName,
            last_name: newMember.lastName,
            birth_date: newMember.birthDate,
            generation_level: 0,
            family_side: 'neutral'
          },
          directRelation: null,
          inferredRelations: []
        };
      }

      if (newMember.simulate) {
        // For simulation, use existing family if available, otherwise use a proper UUID
        const familyId = currentFamily?.id || uuidv4();
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

      <div className="flex-1 relative">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="max-w-md mx-auto mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center">
              <XMarkIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        ) : (
          <FamilyTreeContent
            familyMembers={familyMembers}
            relationships={relationships}
            onAddMember={handleAddMember}
          />
        )}
      </div>

      {showAddModal && (
        <AddFamilyMemberModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedMember(null);
          }}
          onSubmit={handleAddFamilyMember}
          relativeTo={selectedMember}
        />
      )}
    </div>
  );
}

export default FamilyTree;