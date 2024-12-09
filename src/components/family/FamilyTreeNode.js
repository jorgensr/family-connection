import React, { useState } from 'react';
import { PlusIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/solid';

function FamilyTreeNode({ member, onAddMember, familyId }) {
 const [isExpanded, setIsExpanded] = useState(true);
 const [showAddForm, setShowAddForm] = useState(false);
 const [newMember, setNewMember] = useState({
   firstName: '',
   lastName: '',
   relationship: ''
 });

 const handleSubmit = (e) => {
   e.preventDefault();
   onAddMember(member, {
     name: `${newMember.firstName} ${newMember.lastName}`,
     relationship: newMember.relationship
   });
   setShowAddForm(false);
   setNewMember({ firstName: '', lastName: '', relationship: '' });
 };

 return (
   <div className="border-l-2 border-gray-200 pl-4 ml-4 mt-4">
     <div className="bg-white p-4 rounded-lg shadow-sm">
       <div className="flex justify-between items-center">
         <div>
           <h3 className="font-medium">{member.first_name} {member.last_name}</h3>
           <p className="text-sm text-gray-600">{member.relationship}</p>
         </div>
         <div className="flex space-x-2">
           {member.children?.length > 0 && (
             <button onClick={() => setIsExpanded(!isExpanded)}>
               {isExpanded ? (
                 <ChevronUpIcon className="h-5 w-5 text-gray-500" />
               ) : (
                 <ChevronDownIcon className="h-5 w-5 text-gray-500" />
               )}
             </button>
           )}
           <button
             onClick={() => setShowAddForm(!showAddForm)}
             className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
           >
             <PlusIcon className="h-4 w-4 inline mr-1" />
             Add Family Member
           </button>
         </div>
       </div>

       {showAddForm && (
         <form onSubmit={handleSubmit} className="mt-4 space-y-3">
           <div className="grid grid-cols-2 gap-3">
             <input
               type="text"
               placeholder="First Name"
               value={newMember.firstName}
               onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
               className="border p-2 rounded"
               required
             />
             <input
               type="text"
               placeholder="Last Name"
               value={newMember.lastName}
               onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
               className="border p-2 rounded"
               required
             />
           </div>
           <select
             value={newMember.relationship}
             onChange={(e) => setNewMember({...newMember, relationship: e.target.value})}
             className="w-full border p-2 rounded"
             required
           >
             <option value="">Select Relationship</option>
             <option value="Child">Child</option>
             <option value="Spouse">Spouse</option>
             <option value="Parent">Parent</option>
             <option value="Sibling">Sibling</option>
           </select>
           <div className="flex justify-end space-x-2">
             <button
               type="button"
               onClick={() => setShowAddForm(false)}
               className="text-gray-600 hover:text-gray-800"
             >
               Cancel
             </button>
             <button
               type="submit"
               className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
             >
               Add Member
             </button>
           </div>
         </form>
       )}
     </div>

     {isExpanded && member.children && member.children.length > 0 && (
       <div className="ml-8">
         {member.children.map((child, index) => (
           <FamilyTreeNode
             key={index}
             member={child}
             onAddMember={onAddMember}
             familyId={familyId}
           />
         ))}
       </div>
     )}
   </div>
 );
}

export default FamilyTreeNode;