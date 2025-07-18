import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-primary-900 border-b border-gray-200 dark:border-primary-700 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}

          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-[#ffca8d]"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/Logo/icon.png"
                  alt="TurboKeys Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="hidden sm:inline">TurboKeys</span>
            </Link>
            {/* Mobile Nav: show Home/Leaderboard links on mobile, hide on md+ */}
            <nav className="flex md:hidden items-center space-x-4 ml-2">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 dark:text-primary-300 dark:hover:text-primary-100 transition-colors text-base"
              >
                Home
              </Link>
              <Link
                to="/leaderboard"
                className="text-gray-600 hover:text-gray-900 dark:text-primary-300 dark:hover:text-primary-100 transition-colors text-base"
              >
                Leaderboard
              </Link>
            </nav>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 dark:text-primary-300 dark:hover:text-primary-100 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/leaderboard"
              className="text-gray-600 hover:text-gray-900 dark:text-primary-300 dark:hover:text-primary-100 transition-colors"
            >
              Leaderboard
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-primary-700 text-gray-600 dark:text-primary-300 hover:bg-gray-200 dark:hover:bg-primary-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleDropdownToggle}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-primary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-primary-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user.username}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-primary-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50">
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-primary-700 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Account</span>
                      </div>
                    </Link>
                    
                    <Link
                      to="/history"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-primary-700 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>History & Scores</span>
                      </div>
                    </Link>
                    
                    <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-primary-700 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="btn-secondary text-sm py-2 px-3"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm py-2 px-3"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;