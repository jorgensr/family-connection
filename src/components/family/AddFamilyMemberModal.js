import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { UserIcon, ArrowRightIcon, UserPlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const AddFamilyMemberModal = ({ isOpen, onClose, onAdd, relativeTo }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    relationshipType: relativeTo ? '' : null,
    gender: 'unknown'
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [inferredRelationships, setInferredRelationships] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const relationshipOptions = [
    { id: 'child', label: 'Child', description: 'Add a child to the family tree', icon: UserIcon },
    { id: 'parent', label: 'Parent', description: 'Add a parent to the family tree', icon: UserGroupIcon },
    { id: 'spouse', label: 'Spouse', description: 'Add a spouse or partner', icon: UserPlusIcon },
  ];

  const handleRelationshipSelect = (type) => {
    setFormData(prev => ({ ...prev, relationshipType: type }));
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const relationships = await onAdd({
        ...formData,
        relatedMemberId: relativeTo?.id,
        simulate: true
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

  const handleBack = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
    } else if (step > 1) {
      setStep(step - 1);
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

          <span className="inline-block h-screen align-middle" aria-hidden="true">
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

              {/* Step indicator */}
              {relativeTo && (
                <div className="mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div className={`h-2 w-2 rounded-full ${showConfirmation ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="text-sm text-gray-500 text-center mt-2">
                    {step === 1 ? 'Choose Relationship' : step === 2 ? 'Enter Details' : 'Confirm'}
                  </div>
                </div>
              )}

              {!showConfirmation ? (
                step === 1 && relativeTo ? (
                  // Step 1: Relationship Selection
                  <div className="space-y-4">
                    {relationshipOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleRelationshipSelect(option.id)}
                        className="w-full p-4 text-left border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center space-x-4"
                        disabled={option.id === 'spouse' && relativeTo?.hasSpouse}
                      >
                        <option.icon className="h-6 w-6 text-blue-500" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                        <ArrowRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
                      </button>
                    ))}
                  </div>
                ) : (
                  // Step 2: Member Details Form
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

                    <div className="mt-6 flex justify-end space-x-3">
                      {step > 1 && (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                          Back
                        </button>
                      )}
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
                )
              ) : (
                // Confirmation Step
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
                      onClick={handleBack}
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