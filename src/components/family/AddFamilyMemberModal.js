import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const AddFamilyMemberModal = ({ isOpen, onClose, onAdd, relativeTo }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    relationshipType: relativeTo ? 'child' : '',
    gender: 'unknown'
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [inferredRelationships, setInferredRelationships] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, simulate the relationship inference to show the user
      const relationships = await onAdd({
        ...formData,
        relatedMemberId: relativeTo?.id,
        simulate: true // Add this flag to indicate we want to preview relationships
      });

      setInferredRelationships(relationships.inferredRelations);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error previewing relationships:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onAdd({
        ...formData,
        relatedMemberId: relativeTo?.id,
        simulate: false
      });
      onClose();
    } catch (error) {
      console.error('Error adding family member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelationshipDescription = (relationship) => {
    switch (relationship.relationship_type) {
      case 'sibling':
        return 'will be added as a sibling';
      case 'grandparent':
        return 'will be added as a grandparent';
      case 'in-law':
        return 'will be added as an in-law';
      default:
        return `will be added as ${relationship.relationship_type}`;
    }
  };

  const getAvailableRelationships = () => {
    if (!relativeTo) return [];

    // If this is a spouse, they can't have another spouse
    if (relativeTo.hasSpouse) {
      return ['parent', 'child'];
    }

    return ['parent', 'child', 'spouse'];
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title className="text-2xl font-bold mb-6">
                {relativeTo ? `Add Relative to ${relativeTo.first_name}` : 'Add First Family Member'}
              </Dialog.Title>

              {!showConfirmation ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="unknown">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Please enter date in MM/DD/YYYY format
                    </p>
                  </div>

                  {relativeTo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Relationship to {relativeTo.first_name}
                      </label>
                      <select
                        value={formData.relationshipType}
                        onChange={(e) => setFormData({ ...formData, relationshipType: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Relationship</option>
                        {getAvailableRelationships().map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : 'Preview'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h3 className="font-medium text-blue-900 mb-2">
                      Confirm Relationships
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                      {formData.firstName} {formData.lastName} will be added with the following relationships:
                    </p>
                    <ul className="space-y-2">
                      {relativeTo && (
                        <li className="text-sm text-blue-800">
                          • {formData.relationshipType} of {relativeTo.first_name} {relativeTo.last_name}
                        </li>
                      )}
                      {inferredRelationships.map((rel, index) => (
                        <li key={index} className="text-sm text-blue-800">
                          • {formatRelationshipDescription(rel)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowConfirmation(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Adding...' : 'Confirm & Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

AddFamilyMemberModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  relativeTo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    first_name: PropTypes.string.isRequired,
    last_name: PropTypes.string.isRequired,
    hasSpouse: PropTypes.bool,
  }),
};

export default AddFamilyMemberModal; 