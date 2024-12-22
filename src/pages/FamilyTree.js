// src/pages/FamilyTree.js
import React, { useState, useEffect, useCallback } from 'react';
import { familyService } from '../services/familyService';
import { useAuth } from '../context/AuthContext';
import FamilyTreeBubble from '../components/family/FamilyTreeBubble';
import AddFirstMemberForm from '../components/family/AddFirstMemberForm';
import { UserCircleIcon } from '@heroicons/react/24/solid';

function FamilyTree() {
  const [family, setFamily] = useState(null);
  const [rootMember, setRootMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedParentMember, setSelectedParentMember] = useState(null);
  const { user } = useAuth();

  const loadFamilyTree = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Get or create family
      const familyData = await familyService.getOrCreateFamily(`${user.email}'s Family`);
      console.log('Family data:', familyData);
      setFamily(familyData);

      // Get family members with relationships
      const membersData = await familyService.getFamilyMembersWithRelationships(
        familyData.id,
        user.id
      );
      console.log('Members data:', membersData);

      // Find the root member (Self)
      const root = membersData.find(m => m.relationship === 'Self');
      console.log('Root member:', root);
      
      if (root) {
        setRootMember(root);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading family tree:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  // Initial load
  useEffect(() => {
    loadFamilyTree();
  }, [loadFamilyTree]);

  // Remove automatic refresh and use manual refresh after actions
  const handleAddFirstMember = async (memberData) => {
    try {
      setLoading(true);
      setError(null);

      // Get or create family first
      const familyData = await familyService.getOrCreateFamily(`${user.email}'s Family`);
      setFamily(familyData);

      const newMember = await familyService.addFirstFamilyMember(familyData.id, {
        ...memberData,
        userId: user.id
      });

      if (!newMember) {
        throw new Error('Failed to create family member');
      }

      // Set the root member directly
      setRootMember({
        ...newMember,
        relationship: 'Self'
      });
      
      console.log('New member added:', newMember);
    } catch (err) {
      console.error('Error adding first member:', err);
      setError(err.message || 'Failed to add family member');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (parentMember) => {
    setSelectedParentMember(parentMember);
    setShowAddMemberModal(true);
  };

  const handleAddMemberSubmit = async (newMemberData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Adding new member:', { ...newMemberData, parentMemberId: selectedParentMember.id });

      const newMember = await familyService.addFamilyMember(family.id, {
        ...newMemberData,
        parentMemberId: selectedParentMember.id,
        relationship: newMemberData.relationship
      });

      console.log('New member added:', newMember);

      // Close modal before refreshing
      setShowAddMemberModal(false);
      setSelectedParentMember(null);

      // Manually refresh the tree
      await loadFamilyTree();
    } catch (err) {
      console.error('Error adding family member:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const AddMemberModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Add Family Member</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleAddMemberSubmit({
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            relationship: formData.get('relationship'),
            birthDate: formData.get('birthDate') || null,
            bio: formData.get('bio') || null
          });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship</label>
              <select
                name="relationship"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select relationship</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Spouse">Spouse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Birth Date</label>
              <input
                type="date"
                name="birthDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                name="bio"
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddMemberModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-red-500">Error: {error}</div>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          {family?.name || 'Family Tree'}
        </h1>

        <div className="flex justify-center">
          {!rootMember ? (
            <div className="text-center bg-white rounded-lg shadow p-6">
              <UserCircleIcon className="w-20 h-20 mx-auto text-gray-400 mb-4" />
              <p className="mb-4 text-gray-700">
                Start by adding yourself as the first member of the family:
              </p>
              <AddFirstMemberForm onSubmit={handleAddFirstMember} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
              <FamilyTreeBubble 
                member={rootMember}
                onAddMember={handleAddMember}
                viewingMemberId={rootMember.id}
              />
            </div>
          )}
        </div>
      </div>
      
      {showAddMemberModal && <AddMemberModal />}
    </div>
  );
}

export default FamilyTree;