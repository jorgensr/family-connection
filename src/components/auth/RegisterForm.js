import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function RegisterForm() {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    phone: ''
  });

  // Check if this is part of a claim flow
  const isClaiming = location.search.includes('claim=true');

  useEffect(() => {
    // If we have a pending invite and we're not in the claim flow, redirect
    const pendingInvite = localStorage.getItem('pendingInviteToken');
    if (pendingInvite && !isClaiming) {
      navigate('/signup?claim=true');
    }
  }, [isClaiming, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        setFormError("Passwords don't match");
        return;
      }

      console.log('Submitting registration form:', { ...formData, password: '***' });
      
      const success = await register(formData);
      console.log('Registration result:', success);

      if (success) {
        if (error?.includes('check your email')) {
          // Store the redirect URL for after email confirmation
          if (isClaiming) {
            localStorage.setItem('postConfirmRedirect', '/claim-invite/' + localStorage.getItem('pendingInviteToken'));
          }
          
          // Show email confirmation message
          setFormError('Please check your email to confirm your account. You will be redirected to claim your profile after confirmation.');
          setTimeout(() => {
            navigate('/login?claim=true');
          }, 3000);
        } else {
          // Direct login successful
          if (isClaiming) {
            const inviteToken = localStorage.getItem('pendingInviteToken');
            if (inviteToken) {
              navigate('/claim-invite/' + inviteToken);
            } else {
              navigate('/family-tree');
            }
          } else {
            navigate('/family-tree');
          }
        }
      } else {
        setFormError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>
      
      {(error || formError) && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error || formError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              First Name
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Last Name
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Birth Date
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
            value={formData.birthDate}
            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

export default RegisterForm;