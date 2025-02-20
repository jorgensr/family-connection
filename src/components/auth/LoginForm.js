import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginForm() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Check for post-confirmation redirect
  useEffect(() => {
    const redirectUrl = localStorage.getItem('postConfirmRedirect');
    if (redirectUrl) {
      localStorage.removeItem('postConfirmRedirect'); // Clear it immediately
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Check for stored redirect URL first
        const redirectUrl = localStorage.getItem('postConfirmRedirect');
        if (redirectUrl) {
          localStorage.removeItem('postConfirmRedirect');
          navigate(redirectUrl);
        } else if (location.search.includes('claim=true')) {
          // Check for pending invite token
          const inviteToken = localStorage.getItem('pendingInviteToken');
          if (inviteToken) {
            navigate('/claim-invite/' + inviteToken);
          } else {
            navigate('/family-tree');
          }
        } else {
          navigate('/family-tree');
        }
      } else {
        setFormError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
      
      {formError && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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

        <div className="mb-6">
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

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;