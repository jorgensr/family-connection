// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import FamilyTree from './pages/FamilyTree';
import FamilyMemories from './pages/FamilyMemories';
import Profile from './pages/Profile';
import MemberProfilePage from './pages/MemberProfilePage';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EmailConfirmation from './pages/EmailConfirmation';
import ClaimInvite from './pages/ClaimInvite';

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                Family Legacy Connection
              </Link>
            </div>
            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/family-tree"
                  className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600"
                >
                  Family Tree
                </Link>
                <Link
                  to="/memories"
                  className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600"
                >
                  Memories
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600"
                >
                  Profile
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.email}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <main className="py-10">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/claim-invite/:inviteToken" element={<ClaimInvite />} />
                <Route
                  path="/family-tree"
                  element={
                    <PrivateRoute>
                      <FamilyTree />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/memories"
                  element={
                    <PrivateRoute>
                      <FamilyMemories />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/family-member/:memberId"
                  element={
                    <PrivateRoute>
                      <MemberProfilePage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Welcome to Family Legacy Connection
                      </h1>
                      <p className="text-xl text-gray-600">
                        Connect with your family, share memories, and build your family tree together.
                      </p>
                    </div>
                  }
                />
                <Route path="/email-confirmation" element={<EmailConfirmation />} />
              </Routes>
            </div>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;