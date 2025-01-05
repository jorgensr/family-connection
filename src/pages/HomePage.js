import React from 'react';
import { Link } from 'react-router-dom';
import { TreeIcon, MemoriesIcon, CollaborateIcon } from '../components/icons';

function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative h-[600px] bg-cover bg-center" 
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
          backgroundPosition: 'center 30%'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50">
          <div className="container mx-auto px-6 h-full flex flex-col justify-center text-white">
            <h1 className="text-6xl font-serif mb-6 font-bold max-w-3xl leading-tight">
              Create, Share, and Preserve Your Family Legacy
            </h1>
            <p className="text-2xl mb-8 max-w-2xl text-gray-200">
              Connect with your family, share precious memories, and build a living legacy with ease.
            </p>
            <Link
              to="/family-tree"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 inline-block w-fit shadow-lg"
            >
              Start Your Family Tree
            </Link>
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
            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-blue-50 to-white hover:shadow-xl transition-all duration-300 border border-gray-100">
              <TreeIcon />
              <h3 className="text-2xl font-semibold mb-4 mt-6">Interactive Family Tree</h3>
              <p className="text-gray-600 text-lg">
                Build and explore your family connections in an intuitive, visual way.
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-blue-50 to-white hover:shadow-xl transition-all duration-300 border border-gray-100">
              <MemoriesIcon />
              <h3 className="text-2xl font-semibold mb-4 mt-6">Share Memories</h3>
              <p className="text-gray-600 text-lg">
                Preserve and share your precious family moments, stories, and photos.
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-blue-50 to-white hover:shadow-xl transition-all duration-300 border border-gray-100">
              <CollaborateIcon />
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
            <div className="text-center relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">1</div>
              <h3 className="text-xl font-semibold mb-4">Create Your Profile</h3>
              <p className="text-gray-600 text-lg">Sign up and personalize your profile</p>
            </div>
            <div className="text-center relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">2</div>
              <h3 className="text-xl font-semibold mb-4">Start Your Tree</h3>
              <p className="text-gray-600 text-lg">Add your first family members</p>
            </div>
            <div className="text-center relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">3</div>
              <h3 className="text-xl font-semibold mb-4">Invite Family</h3>
              <p className="text-gray-600 text-lg">Connect with your loved ones</p>
            </div>
            <div className="text-center relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">4</div>
              <h3 className="text-xl font-semibold mb-4">Share Memories</h3>
              <p className="text-gray-600 text-lg">Build your family legacy together</p>
            </div>
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
                <a href="https://facebook.com/familylegacy" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://twitter.com/familylegacy" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://instagram.com/familylegacy" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Family Legacy Connection. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage; 