import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthTabs from './components/auth/AuthTabs';
import Home from './pages/Home';
import FamilyTree from './pages/FamilyTree';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserProfile from './components/profile/UserProfile';
import FamilyMemories from './pages/FamilyMemories';
import { familyService } from './services/familyService';
import ClaimInvite from './pages/ClaimInvite';


function App() {
  const { user, logout } = useAuth();
  const [family, setFamily] = React.useState(null);
  const [loadingFamily, setLoadingFamily] = React.useState(true);

  // Similar to how we do in FamilyTree to getOrCreate family
  React.useEffect(() => {
    async function loadFamily() {
      if (user) {
        const f = await familyService.getOrCreateFamily(`${user.email}'s Family`);
        setFamily(f);
      }
      setLoadingFamily(false);
    }
    loadFamily();
  }, [user]);

  if (loadingFamily) return <div>Loading...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="text-xl font-bold text-gray-800">
                  Family Legacy Connection
                </Link>
                {user && (
                  <>
                    <Link to="/family-tree" className="text-gray-600 hover:text-gray-900">
                      Family Tree
                    </Link>
                    <Link to="/memories" className="text-gray-600 hover:text-gray-900">
                      Memories
                    </Link>
                    <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                      Profile
                    </Link>
                  </>
                )}
              </div>
              <div>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">Welcome, {user.name}</span>
                    <button 
                      onClick={logout}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/auth" 
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Login / Register
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto mt-8 px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthTabs />} />
            <Route path="/family-tree" element={
              <ProtectedRoute>
                {/* Make sure you pass the family's id to FamilyTree */}
                {family && <FamilyTree familyId={family.id} />}
              </ProtectedRoute>
            } />
            <Route path="/memories" element={
              <ProtectedRoute>
                {family && <FamilyMemories familyId={family.id} />}
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/claim-invite" element={
              <ProtectedRoute> {/* If you want only logged-in users to access */}
                <ClaimInvite />
              </ProtectedRoute>
            }/>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
