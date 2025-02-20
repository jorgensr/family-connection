import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { familyService } from '../services/familyService';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../config/supabase';

function ClaimInvite() {
  const { inviteToken: urlToken } = useParams();
  const [inviteToken, setInviteToken] = useState(urlToken || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [memberDetails, setMemberDetails] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Store token in localStorage when component mounts with a token
  useEffect(() => {
    if (urlToken) {
      localStorage.setItem('pendingInviteToken', urlToken);
    }
  }, [urlToken]);

  // Check for stored token when user logs in
  useEffect(() => {
    const storedToken = localStorage.getItem('pendingInviteToken');
    if (storedToken && user) {
      handleClaim(null, storedToken);
      localStorage.removeItem('pendingInviteToken');
    }
  }, [user]);

  const handleClaim = useCallback(async (e, tokenToUse = inviteToken) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!user) {
        setError('You must be logged in to claim an invite.');
        return;
      }

      if (!tokenToUse) {
        setError('Please enter an invite token.');
        return;
      }

      // First verify the token and get member details
      const memberData = await familyService.verifyInviteToken(tokenToUse);
      setMemberDetails(memberData);

      // Then update the member record
      await familyService.updateFamilyMemberByInviteToken(tokenToUse, user.id);

      // Verify the claim was successful
      const { data: verifyClaimData, error: verifyError } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('id', memberData.id)
        .single();

      if (verifyError) throw verifyError;

      if (!verifyClaimData.is_claimed || verifyClaimData.user_id !== user.id) {
        throw new Error('Failed to verify claim. Please try again.');
      }

      toast.success('Profile claimed successfully! Redirecting to your family tree...');
      
      // Clear form and stored token
      setInviteToken('');
      localStorage.removeItem('pendingInviteToken');
      
      // Redirect to family tree after successful claim
      setTimeout(() => {
        navigate('/family-tree');
      }, 2000);
    } catch (err) {
      console.error('Error claiming invite:', err);
      setError(err.message || 'Invalid or expired invite token.');
    } finally {
      setLoading(false);
    }
  }, [user, inviteToken, navigate]);

  if (!user) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Welcome to Family Legacy Connection!</h2>
          <p className="text-gray-600">To claim your profile, please create an account or sign in.</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/signup?claim=true')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate('/login?claim=true')}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Claim Your Family Member Profile</h1>
      
      {error && (
        <div className="text-red-600 mb-4 p-3 bg-red-50 rounded">
          {error}
        </div>
      )}

      {memberDetails && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h2 className="font-semibold mb-2">Profile Details:</h2>
          <p>Name: {memberDetails.first_name} {memberDetails.last_name}</p>
          {memberDetails.birth_date && (
            <p>Birth Date: {new Date(memberDetails.birth_date).toLocaleDateString()}</p>
          )}
        </div>
      )}

      {!urlToken && (
      <form onSubmit={handleClaim} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Invite Token</label>
          <input
            type="text"
            className="mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            value={inviteToken}
            onChange={(e) => {
              setInviteToken(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste your invite token here"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !inviteToken}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Claiming...' : 'Claim Profile'}
        </button>
      </form>
      )}

      {loading && !error && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Processing your claim...</p>
        </div>
      )}
    </div>
  );
}

export default ClaimInvite;
