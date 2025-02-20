import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useLocation } from 'react-router-dom';

function AuthTabs() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Check if there's a tab parameter in the URL
    const params = new URLSearchParams(location.search);
    return params.get('tab') === 'register' ? 'register' : 'login';
  });

  // Update active tab when URL parameters change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'register') {
      setActiveTab('register');
    }
  }, [location.search]);

  return (
    <div className="max-w-md mx-auto">
      <div className="flex mb-4">
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === 'login'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          } rounded-l-lg`}
          onClick={() => setActiveTab('login')}
        >
          Login
        </button>
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === 'register'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          } rounded-r-lg`}
          onClick={() => setActiveTab('register')}
        >
          Register
        </button>
      </div>
      {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}

export default AuthTabs;