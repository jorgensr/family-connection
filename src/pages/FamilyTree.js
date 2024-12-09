import React, { useState, useEffect, useCallback } from 'react';
import FamilyTreeNode from '../components/family/FamilyTreeNode';
import { familyService } from '../services/familyService';
import { useAuth } from '../context/AuthContext';
import AddFirstMemberForm from '../components/family/AddFirstMemberForm';

function FamilyTree() {
 const [familyData, setFamilyData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const { user } = useAuth();
 const [showAddFirstMember, setShowAddFirstMember] = useState(true);

 const loadFamilyTree = useCallback(async () => {
   try {
     let family = await familyService.createFamily(`${user.email}'s Family`);
     const treeData = await familyService.getFamilyTree(family.id);
     setFamilyData(treeData);
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
     await familyService.addFamilyMember(familyData.id, {
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
     await familyService.addFamilyMember(familyData.id, {
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
   <div className="p-6">
     <h1 className="text-3xl font-bold text-gray-900 mb-6">Family Tree</h1>
     <div className="bg-white rounded-lg shadow p-6">
       {!familyData || familyData.length === 0 ? (
         <AddFirstMemberForm onSubmit={handleAddFirstMember} />
       ) : (
         familyData.map(member => (
           <FamilyTreeNode
             key={member.id}
             member={member}
             onAddMember={handleAddMember}
             familyId={familyData.id}
           />
         ))
       )}
     </div>
   </div>
 );
}

export default FamilyTree;