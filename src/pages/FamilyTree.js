// src/pages/FamilyTree.js
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { familyService } from '../services/familyService';
import AddFamilyMemberModal from '../components/family/AddFamilyMemberModal';
import EnhancedFamilyTree from '../components/family/EnhancedFamilyTree';
import { ReactFlowProvider } from 'reactflow';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

function FamilyTree() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const { user } = useAuth();

  console.log('FamilyTree render:', {
    loading,
    membersCount: familyMembers.length,
    relationshipsCount: relationships.length,
    user: user?.id
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

      // Get or create family
      const family = await familyService.getOrCreateFamily(`${user.email}'s Family`);
      console.log('Family loaded:', family);
      
      // Get family members and relationships concurrently
      const [members, rels] = await Promise.all([
        familyService.getFamilyMembers(family.id),
        familyService.getFamilyRelationships(family.id)
      ]);

      console.log('Data loaded:', {
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
  }, [user?.id, user?.email]);

  useEffect(() => {
    console.log('Load effect triggered, user:', user?.id);
    if (user?.id) {
      loadFamilyTree();
    }
  }, [loadFamilyTree, user?.id]);

  const handleAddMember = useCallback((member) => {
    setSelectedMember(member);
    setShowAddModal(true);
  }, []);

  const handleAddFamilyMember = useCallback(async (newMember) => {
    try {
      setError(null);

      if (newMember.simulate) {
        // Preview relationships
        const family = await familyService.getOrCreateFamily(`${user.email}'s Family`);
        const previewData = await familyService.previewMemberAddition({
          ...newMember,
          familyId: family.id
        });
        return previewData;
      } else {
        // Actually add the member
        const family = await familyService.getOrCreateFamily(`${user.email}'s Family`);
        await familyService.addFamilyMember({
          ...newMember,
          familyId: family.id
        });
        await loadFamilyTree();
        setShowAddModal(false);
        setSelectedMember(null);
      }
    } catch (err) {
      console.error('Error adding family member:', err);
      setError(err.message);
      throw err;
    }
  }, [loadFamilyTree, user?.email]);

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
        {user?.email}'s Family
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-6" style={{ height: '80vh' }}>
        <Suspense fallback={<LoadingSpinner />}>
          <ReactFlowProvider>
            {familyMembers.length > 0 && relationships.length > 0 ? (
              <EnhancedFamilyTree
                key={`tree-${familyMembers.length}-${relationships.length}`}
                familyMembers={familyMembers}
                relationships={relationships}
                onAddMember={handleAddMember}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500 mb-4">No family members yet</p>
                <button
                  onClick={() => handleAddMember(null)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Add First Family Member
                </button>
              </div>
            )}
          </ReactFlowProvider>
        </Suspense>
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