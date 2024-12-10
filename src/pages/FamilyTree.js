import React, { useState, useEffect, useCallback } from 'react';
import FamilyTreeNode from '../components/family/FamilyTreeNode';
import { familyService } from '../services/familyService';
import { useAuth } from '../context/AuthContext';
import AddFirstMemberForm from '../components/family/AddFirstMemberForm';
import ProfileModal from '../components/family/ProfileModal';

function FamilyTree() {
  const [family, setFamily] = useState(null);
  const [familyTree, setFamilyTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const { user } = useAuth();

  const loadFamilyTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const existingFamily = await familyService.getOrCreateFamily(`${user.email}'s Family`);
      setFamily(existingFamily);

      const treeData = await familyService.getFamilyTree(existingFamily.id);
      setFamilyTree(treeData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.email]);

  useEffect(() => {
    loadFamilyTree();
  }, [loadFamilyTree]);

  const handleAddFirstMember = async (memberData) => {
    try {
      await familyService.addFamilyMember(family.id, {
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        relationship: 'Self',
      });
      await loadFamilyTree();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMember = async (parentMember, newMember) => {
    try {
      await familyService.addFamilyMember(family.id, {
        firstName: newMember.name.split(' ')[0],
        lastName: newMember.name.split(' ')[1] || '',
        relationship: newMember.relationship,
        parentMemberId: parentMember.id
      });
      await loadFamilyTree();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewProfile = (member) => {
    // Set the selected member to open the ProfileModal
    setSelectedMember(member);
  };

  const handleCloseModal = () => {
    setSelectedMember(null);
  };

  if (loading) {
    return <div className="text-center p-4">Loading family tree...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        Error loading family tree: {error}
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Family Tree</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {(!familyTree || familyTree.length === 0) ? (
          <div className="text-center">
            <p className="mb-4 text-gray-700">Start by adding yourself as the first member of the family:</p>
            <AddFirstMemberForm onSubmit={handleAddFirstMember} />
          </div>
        ) : (
          familyTree.map((member) => (
            <FamilyTreeNode
              key={member.id}
              member={member}
              onAddMember={handleAddMember}
              familyId={family.id}
              onViewProfile={handleViewProfile}
            />
          ))
        )}
      </div>

      {selectedMember && (
        <ProfileModal member={selectedMember} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default FamilyTree;
