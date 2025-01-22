import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@headlessui/react';
import { UserIcon, UserPlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const AddFamilyMemberModal = ({ isOpen, onClose, familyId, onSuccess, relativeTo }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    bio: '',
    relationshipType: '',
    areParentsMarried: false,
    useSpouseAsParent: false,
    secondParent: {
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: '',
      bio: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  const relationshipOptions = [
    { id: 'child', label: 'Child', description: 'Add a child to the family tree', icon: UserIcon },
    { id: 'parent', label: 'Parent', description: 'Add a parent to the family tree', icon: UserGroupIcon },
    { id: 'spouse', label: 'Spouse', description: 'Add a spouse or partner', icon: UserPlusIcon },
  ];

  const handleRelationshipSelect = (type) => {
    setFormData(prev => ({ ...prev, relationshipType: type }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('secondParent.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        secondParent: {
          ...prev.secondParent,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const memberData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        gender: formData.gender,
        bio: formData.bio,
        relationshipType: formData.relationshipType,
        familyId,
        relatedMemberId: relativeTo?.id
      };

      if (formData.relationshipType === 'child') {
        if (formData.useSpouseAsParent && relativeTo?.spouse) {
          // Use spouse as second parent
          const result = await onSuccess({
            ...memberData,
            secondParent: {
              id: relativeTo.spouse.id
            },
            areParentsMarried: true
          });

          if (result?.error) {
            throw new Error(result.error);
          }
        } else if (step === 2) {
          // Using manually entered second parent
          const result = await onSuccess({
            ...memberData,
            secondParent: formData.secondParent,
            areParentsMarried: formData.areParentsMarried
          });

          if (result?.error) {
            throw new Error(result.error);
          }
        } else {
          // No second parent
          const result = await onSuccess(memberData);
          if (result?.error) {
            throw new Error(result.error);
          }
        }
      } else if (formData.relationshipType === 'parent' && step === 2) {
        const result = await onSuccess({
          ...memberData,
          secondParent: formData.secondParent,
          areParentsMarried: formData.areParentsMarried
        });

        if (result?.error) {
          throw new Error(result.error);
        }
      } else {
        const result = await onSuccess(memberData);
        if (result?.error) {
          throw new Error(result.error);
        }
      }

      onClose();
    } catch (err) {
      console.error('Error adding family member:', err);
      setError(err.message || 'Failed to add family member');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFirstParentForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">First Parent Information</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">First Name</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Last Name</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Birth Date</label>
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Select gender...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>
    </div>
  );

  const renderSecondParentForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Second Parent Information</h3>
        <button
          type="button"
          onClick={handlePrevStep}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          Back to First Parent
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">First Name</label>
        <input
          type="text"
          name="secondParent.firstName"
          value={formData.secondParent.firstName}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Last Name</label>
        <input
          type="text"
          name="secondParent.lastName"
          value={formData.secondParent.lastName}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Birth Date</label>
        <input
          type="date"
          name="secondParent.birthDate"
          value={formData.secondParent.birthDate}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Gender</label>
        <select
          name="secondParent.gender"
          value={formData.secondParent.gender}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Select gender...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Bio</label>
        <textarea
          name="secondParent.bio"
          value={formData.secondParent.bio}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="pt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="areParentsMarried"
            checked={formData.areParentsMarried}
            onChange={(e) => handleInputChange({
              target: {
                name: 'areParentsMarried',
                value: e.target.checked
              }
            })}
            className="mr-2"
          />
          Parents are married
        </label>
      </div>
    </div>
  );

  return (
    <Dialog
      as="div"
      className="fixed inset-0 z-10 overflow-y-auto"
      onClose={onClose}
      open={isOpen}
    >
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
            Add Family Member
          </Dialog.Title>

          {error && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4">
            {!relativeTo ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    name="firstName"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    name="lastName"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    name="birthDate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.gender}
                    onChange={handleInputChange}
                    name="gender"
                  >
                    <option value="">Select gender...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.bio}
                    onChange={handleInputChange}
                    name="bio"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {relationshipOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleRelationshipSelect(option.id)}
                      className={`relative flex items-center space-x-3 rounded-lg border p-4 hover:border-gray-400 focus:outline-none ${
                        formData.relationshipType === option.id
                          ? 'border-blue-500 ring-2 ring-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-700`}>
                        <option.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="focus:outline-none">
                          <p className="text-sm font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {formData.relationshipType === 'parent' && (
                  <>
                    {step === 1 ? renderFirstParentForm() : renderSecondParentForm()}
                  </>
                )}

                {formData.relationshipType === 'child' && (
                  <>
                    {step === 1 ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Child Information</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Name</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                          <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Gender</label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select gender...</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Bio</label>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                          />
                        </div>

                        {relativeTo?.spouse && (
                          <div className="pt-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="useSpouseAsParent"
                                checked={formData.useSpouseAsParent}
                                onChange={(e) => {
                                  handleInputChange({
                                    target: {
                                      name: 'useSpouseAsParent',
                                      value: e.target.checked
                                    }
                                  });
                                  if (e.target.checked) {
                                    // Pre-fill second parent with spouse data
                                    handleInputChange({
                                      target: {
                                        name: 'secondParent.firstName',
                                        value: relativeTo.spouse.first_name
                                      }
                                    });
                                    handleInputChange({
                                      target: {
                                        name: 'secondParent.lastName',
                                        value: relativeTo.spouse.last_name
                                      }
                                    });
                                    handleInputChange({
                                      target: {
                                        name: 'areParentsMarried',
                                        value: true
                                      }
                                    });
                                  }
                                }}
                                className="mr-2"
                              />
                              Is {relativeTo.spouse.first_name} {relativeTo.spouse.last_name} the other parent?
                            </label>
                          </div>
                        )}
                      </div>
                    ) : renderSecondParentForm()}
                  </>
                )}

                {formData.relationshipType === 'spouse' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select gender...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
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
              {((formData.relationshipType === 'parent' || 
                (formData.relationshipType === 'child' && !formData.useSpouseAsParent)) && 
                step === 1) && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!formData.firstName || !formData.lastName || !formData.birthDate || !formData.gender}
                  className="px-4 py-2 text-sm font-medium text-blue-500 border border-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Add Second Parent
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || (relativeTo && !formData.relationshipType) || 
                  ((formData.relationshipType === 'parent' || formData.relationshipType === 'child') && 
                   step === 1 && (!formData.firstName || !formData.lastName || !formData.birthDate || !formData.gender)) ||
                  (step === 2 && (!formData.secondParent.firstName || !formData.secondParent.lastName || !formData.secondParent.birthDate || !formData.secondParent.gender))}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};

AddFamilyMemberModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  familyId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  relativeTo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    first_name: PropTypes.string.isRequired,
    last_name: PropTypes.string.isRequired,
    spouse: PropTypes.shape({
      id: PropTypes.string.isRequired,
      first_name: PropTypes.string.isRequired,
      last_name: PropTypes.string.isRequired,
    }),
  }),
};

export default AddFamilyMemberModal; 