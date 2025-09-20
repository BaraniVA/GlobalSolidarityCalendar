import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Shield } from 'lucide-react';
import GSCLogo from '../assets/images/GSCLogo.png';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Events', href: '/' },
    { name: 'Submit Event', href: '/submit' },
    { name: 'Transparency Log', href: '/log' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src={GSCLogo} alt="GSC" className="h-8 w-8 text-palestine-green object-contain" />
              <span className="font-bold text-xl text-palestine-black">
                Global Solidarity Calendar
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-palestine-green border-b-2 border-palestine-green'
                    : 'text-gray-700 hover:text-palestine-green'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {user?.role === 'moderator' && (
              <Link
                to="/moderation"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1 ${
                  isActive('/moderation')
                    ? 'text-palestine-green border-b-2 border-palestine-green'
                    : 'text-gray-700 hover:text-palestine-green'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Moderation</span>
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-palestine-green transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-palestine-green text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-palestine-green transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-palestine-green p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-palestine-green bg-palestine-green/10'
                      : 'text-gray-700 hover:text-palestine-green hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {user?.role === 'moderator' && (
                <Link
                  to="/moderation"
                  className={`block px-3 py-2 text-base font-medium transition-colors flex items-center space-x-1 ${
                    isActive('/moderation')
                      ? 'text-palestine-green bg-palestine-green/10'
                      : 'text-gray-700 hover:text-palestine-green hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  <span>Moderation</span>
                </Link>
              )}

              <div className="border-t border-gray-200 pt-4">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-base font-medium text-gray-900">
                      {user.name}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 hover:text-palestine-green w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    className="block px-3 py-2 text-base font-medium bg-palestine-green text-white rounded-md hover:bg-palestine-green text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;