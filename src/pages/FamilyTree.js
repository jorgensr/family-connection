// src/pages/FamilyTree.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { familyService } from '../services/familyService';
import AddFamilyMemberModal from '../components/family/AddFamilyMemberModal';
import EnhancedFamilyTree from '../components/family/EnhancedFamilyTree';

function FamilyTree() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const { user } = useAuth();

  const loadFamilyTree = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get or create family
      const family = await familyService.getOrCreateFamily(`${user.email}'s Family`);
      
      // Get family members
      const members = await familyService.getFamilyMembers(family.id);
      setFamilyMembers(members);

      // Get relationships
      const rels = await familyService.getFamilyRelationships(family.id);
      setRelationships(rels);

    } catch (err) {
      console.error('Error loading family tree:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    loadFamilyTree();
  }, [loadFamilyTree]);

  const handleAddMember = (member) => {
    setSelectedMember(member);
    setShowAddModal(true);
  };

  const handleAddFamilyMember = async (newMember) => {
    try {
      setError(null);
      await familyService.addFamilyMember(newMember);
      await loadFamilyTree();
      setShowAddModal(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Error adding family member:', err);
      setError(err.message);
    }
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {user?.email}'s Family
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <EnhancedFamilyTree
          familyMembers={familyMembers}
          relationships={relationships}
          onAddMember={handleAddMember}
        />
      </div>

      {showAddModal && (
        <AddFamilyMemberModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedMember(null);
          }}
          onAdd={handleAddFamilyMember}
          relativeTo={selectedMember}
        />
      )}
    </div>
  );
}

export default FamilyTree;