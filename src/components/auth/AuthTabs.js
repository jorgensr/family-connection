import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

function AuthTabs() {
  const [activeTab, setActiveTab] = useState('login');

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