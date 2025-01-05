import React, { useState } from 'react';
import { PlusIcon, ChevronUpIcon, ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/solid';

function FamilyTreeNode({ member, onAddMember, familyId, onViewProfile }) {
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
    <div className="ml-4 mt-4 border-l border-gray-300 pl-6">
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col space-y-2 relative">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <UserCircleIcon className="h-12 w-12 text-gray-400" />
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onViewProfile(member.id)}
                className="text-lg font-semibold text-gray-900 hover:underline"
              >
                {member.first_name} {member.last_name}
              </button>
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {member.relationship}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {member.children?.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600 transition-colors"
              title="Add Family Member"
            >
              <PlusIcon className="h-4 w-4 inline" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={newMember.firstName}
                onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                className="border p-2 rounded focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newMember.lastName}
                onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                className="border p-2 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <select
              value={newMember.relationship}
              onChange={(e) => setNewMember({...newMember, relationship: e.target.value})}
              className="w-full border p-2 rounded focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select Relationship</option>
              <option value="child">Child</option>
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
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
        <div className="ml-8 border-l border-gray-300">
          {member.children.map((child, index) => (
            <FamilyTreeNode
              key={index}
              member={child}
              onAddMember={onAddMember}
              familyId={familyId}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FamilyTreeNode;
