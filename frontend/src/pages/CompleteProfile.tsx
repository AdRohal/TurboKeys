import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: ''
  });
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      
      // If profile is already completed, redirect to home
      if (response.data.profileCompleted) {
        login(response.data);
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [login, navigate]);

  // Check if token exists and fetch user info
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo();
    } else {
      navigate('/login');
    }
  }, [fetchUserInfo, navigate]);

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await api.get(`/auth/check-username/${username}`);
      setUsernameAvailable(response.data.available);
    } catch (error) {
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev: Record<string, string>) => ({
        ...prev,
        [name]: ''
      }));
    }

    // Check username availability
    if (name === 'username') {
      setUsernameAvailable(null);
      // Debounce username check
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const response = await api.post('/auth/complete-profile', formData);
      
      // Update auth context with completed profile
      login(response.data.user);
      
      // Redirect to home
      navigate('/');
    } catch (error: any) {
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-primary-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-primary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <img
              className="h-12 w-auto"
              src="/Logo/icon.png"
              alt="TurboKeys"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Please complete your profile to get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:placeholder-gray-400"
                placeholder="Email address"
              />
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="sr-only">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-primary-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Full Name"
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-primary-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Username"
                />
                {checkingUsername && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              {/* Username availability indicator */}
              {formData.username.length >= 3 && !checkingUsername && (
                <div className="mt-1 text-sm">
                  {usernameAvailable === true && (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ Username is available
                    </span>
                  )}
                  {usernameAvailable === false && (
                    <span className="text-red-600 dark:text-red-400">
                      ✗ Username is not available
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {errors.general && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {errors.general}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={submitting || !formData.fullName || !formData.username || usernameAvailable === false}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {submitting ? 'Completing...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
