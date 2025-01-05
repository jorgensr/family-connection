import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TreeIcon, MemoriesIcon, CollaborateIcon } from '../components/icons';

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Show welcome modal for first-time users
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome && user) {
      setShowWelcomeModal(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, [user]);

  const WelcomeModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg mx-4">
        <h2 className="text-2xl font-bold mb-4">Welcome to Family Legacy Connection!</h2>
        <p className="text-gray-600 mb-6">
          We're excited to help you build and preserve your family's legacy. Here's how to get started:
        </p>
        <ol className="list-decimal list-inside space-y-3 mb-6 text-gray-700">
          <li>Create your family tree by adding family members</li>
          <li>Share and preserve precious memories</li>
          <li>Invite family members to collaborate</li>
          <li>Explore your family's history together</li>
        </ol>
        <button
          onClick={() => setShowWelcomeModal(false)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Let's Get Started
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Overlay */}
      <div 
        className="relative h-[600px] bg-cover bg-center" 
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
          backgroundPosition: 'center 30%'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50">
          <div className="container mx-auto px-6 h-full flex flex-col justify-center">
            <h1 className="text-6xl font-serif mb-6 font-bold text-white max-w-3xl leading-tight">
              {user ? `Welcome back, ${user.email?.split('@')[0]}!` : 'Create, Share, and Preserve Your Family Legacy'}
            </h1>
            <p className="text-2xl mb-8 text-gray-200 max-w-2xl">
              {user 
                ? "Ready to continue building your family's story?"
                : "Connect with your family, share precious memories, and build a living legacy with ease."}
            </p>
            <div className="flex gap-4">
              <Link
                to={user ? "/family-tree" : "/login"}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 inline-block shadow-lg"
              >
                {user ? 'View Family Tree' : 'Start Your Journey'}
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all inline-block border border-white/30"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-serif text-center mb-16 font-bold text-gray-800">
            Discover What You Can Do
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="group text-center p-8 rounded-xl bg-gradient-to-b from-blue-50 to-white hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                 onClick={() => navigate('/family-tree')}>
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                <TreeIcon />
              </div>
              <h3 className="text-2xl font-semibold mb-4 mt-6">Interactive Family Tree</h3>
              <p className="text-gray-600 text-lg">
                Build and explore your family connections in an intuitive, visual way.
              </p>
            </div>
            <div className="group text-center p-8 rounded-xl bg-gradient-to-b from-blue-50 to-white hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                 onClick={() => navigate('/memories')}>
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                <MemoriesIcon />
              </div>
              <h3 className="text-2xl font-semibold mb-4 mt-6">Share Memories</h3>
              <p className="text-gray-600 text-lg">
                Preserve and share your precious family moments, stories, and photos.
              </p>
            </div>
            <div className="group text-center p-8 rounded-xl bg-gradient-to-b from-blue-50 to-white hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                 onClick={() => user ? navigate('/profile') : navigate('/login')}>
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                <CollaborateIcon />
              </div>
              <h3 className="text-2xl font-semibold mb-4 mt-6">Collaborate</h3>
              <p className="text-gray-600 text-lg">
                Invite family members to contribute and grow your family story together.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-serif text-center mb-16 font-bold text-gray-800">
            Getting Started is Easy
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Create Your Profile", desc: "Sign up and personalize your profile" },
              { step: 2, title: "Start Your Tree", desc: "Add your first family members" },
              { step: 3, title: "Invite Family", desc: "Connect with your loved ones" },
              { step: 4, title: "Share Memories", desc: "Build your family legacy together" }
            ].map((item) => (
              <div key={item.step} className="text-center relative group">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                <p className="text-gray-600 text-lg">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-serif text-center mb-16 font-bold text-gray-800">
            Featured Updates
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Family Milestones",
                desc: "Track and celebrate important family events and achievements.",
                image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?ixlib=rb-4.0.3"
              },
              {
                title: "Photo Collections",
                desc: "Organize and share your family photos in beautiful albums.",
                image: "https://images.unsplash.com/photo-1500021804447-2ca2eaaaabeb?ixlib=rb-4.0.3"
              },
              {
                title: "Family Stories",
                desc: "Record and preserve your family's unique stories and traditions.",
                image: "https://images.unsplash.com/photo-1536749528210-1ce696e69018?ixlib=rb-4.0.3"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-w-16 aspect-h-9">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-200">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Family Legacy Connection</h3>
              <p className="text-gray-400 text-lg">
                Building stronger family bonds through shared memories and stories.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6">Quick Links</h3>
              <ul className="space-y-4 text-lg">
                <li><Link to="/family-tree" className="text-gray-400 hover:text-white transition-colors">Family Tree</Link></li>
                <li><Link to="/memories" className="text-gray-400 hover:text-white transition-colors">Memories</Link></li>
                <li><Link to="/profile" className="text-gray-400 hover:text-white transition-colors">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6">Contact</h3>
              <p className="text-gray-400 text-lg mb-6">
                Questions? Reach out to us at support@familylegacy.com
              </p>
              <div className="flex space-x-6">
                {['facebook', 'twitter', 'instagram'].map((social) => (
                  <a 
                    key={social}
                    href={`https://${social}.com/familylegacy`} 
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={`Follow us on ${social}`}
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      {social === 'facebook' && (
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      )}
                      {social === 'twitter' && (
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      )}
                      {social === 'instagram' && (
                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                      )}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Family Legacy Connection. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showWelcomeModal && <WelcomeModal />}
    </div>
  );
}

export default HomePage; 