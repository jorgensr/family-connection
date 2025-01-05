import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/outline';

function InviteFamilyMemberModal({ isOpen, onClose, familyMember, onSendInvite }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await onSendInvite(familyMember.id, email);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send invite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />

        <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <div className="mb-6 flex items-center">
            <EnvelopeIcon className="mr-3 h-6 w-6 text-blue-500" />
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Invite Family Member
            </Dialog.Title>
          </div>

          <p className="mb-4 text-sm text-gray-600">
            Send an invitation to claim the profile for{' '}
            <span className="font-medium">
              {familyMember?.first_name} {familyMember?.last_name}
            </span>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter email address"
                required
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}

export default InviteFamilyMemberModal; 