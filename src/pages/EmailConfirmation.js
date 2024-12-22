import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabase';

function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (type === 'signup' && token) {
      verifyEmail(token);
    } else {
      setStatus('invalid');
      setError('Invalid confirmation link');
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) throw error;
      setStatus('success');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error verifying email:', err);
      setStatus('error');
      setError(err.message);
    }
  };

  const handleResendConfirmation = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsResending(true);
      setError('');
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;
      
      setStatus('resent');
    } catch (err) {
      console.error('Error resending confirmation:', err);
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {status === 'verifying' && (
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Verifying your email</h2>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Email verified!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Redirecting you to login...
            </p>
          </div>
        )}

        {(status === 'error' || status === 'invalid') && (
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">Need a new confirmation email?</h3>
              <form onSubmit={handleResendConfirmation} className="mt-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={isResending}
                  className={`mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isResending ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isResending ? 'Sending...' : 'Resend Confirmation Email'}
                </button>
              </form>
            </div>
          </div>
        )}

        {status === 'resent' && (
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Email Sent!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please check your email for the confirmation link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailConfirmation; 