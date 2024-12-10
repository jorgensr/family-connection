import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming this context gives you user and auth data
import { familyService } from '../services/familyService';

function ClaimInvite() {
  const [inviteToken, setInviteToken] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { user } = useAuth(); // user should have .id which is auth.uid()

  const handleClaim = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('You must be logged in to claim an invite.');
      return;
    }

    if (!inviteToken) {
      setError('Please enter an invite token.');
      return;
    }

    try {
      await familyService.updateFamilyMemberByInviteToken(inviteToken, user.id);
      setSuccess('Invite claimed successfully! You are now linked to this family member record.');
      setInviteToken('');
    } catch (err) {
      console.error('Error claiming invite:', err);
      setError('Invalid or already claimed invite token.');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Claim Your Family Member Invite</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}
      <form onSubmit={handleClaim} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Invite Token</label>
          <input
            type="text"
            className="border w-full p-2 rounded"
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            placeholder="Paste your invite token here"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Claim Invite
        </button>
      </form>
    </div>
  );
}

export default ClaimInvite;
