import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { typingAPI, userAPI } from '../services/api';
import { TypingTestResult } from '../types';

const Account: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [history, setHistory] = useState<TypingTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await typingAPI.getHistory(1, 100); // Get all user's tests
        setHistory(response.tests);
      } catch (error) {
        console.error('Failed to load typing history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="h-[90vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to view your account
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            You need to be logged in to access your account information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-primary-900 py-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 flex-col">
        <div className="bg-white dark:bg-primary-800 rounded-lg shadow-lg p-6 flex-1 overflow-hidden">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Account Information
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Profile Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                Profile Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (!e.target.value.trim()) {
                            setFirstNameError('First name is required');
                          } else {
                            setFirstNameError('');
                          }
                        }}
                        className={`w-full p-3 border ${firstNameError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-primary-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Enter your first name"
                        required
                      />
                      {firstNameError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{firstNameError}</p>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-primary-700 rounded-lg">
                      <span className="text-gray-900 dark:text-white">
                        {firstName || 'Not set'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (!e.target.value.trim()) {
                            setLastNameError('Last name is required');
                          } else {
                            setLastNameError('');
                          }
                        }}
                        className={`w-full p-3 border ${lastNameError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-primary-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Enter your last name"
                        required
                      />
                      {lastNameError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{lastNameError}</p>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-primary-700 rounded-lg">
                      <span className="text-gray-900 dark:text-white">
                        {lastName || 'Not set'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-primary-700 rounded-lg">
                    <span className="text-gray-900 dark:text-white">{user.username}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-primary-700 rounded-lg">
                    <span className="text-gray-900 dark:text-white">{user.email}</span>
                  </div>
                </div>
                
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User ID
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-primary-700 rounded-lg">
                    <span className="text-gray-900 dark:text-white font-mono text-sm">{user.id}</span>
                  </div>
                </div> */}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Member Since
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-primary-700 rounded-lg">
                    <span className="text-gray-900 dark:text-white">
                      {(() => {
                        // Use account creation date if available
                        if (user.createdAt) {
                          return new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        }
                        // Fallback to first test date if no account creation date
                        if (history.length > 0) {
                          const firstTest = history.sort((a, b) => 
                            new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
                          )[0];
                          return new Date(firstTest.completedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        }
                        // Final fallback
                        return 'Date not available';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Statistics */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                Account Statistics
              </h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {history.length}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Total Tests
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {history.length > 0 ? Math.round(history.reduce((sum, test) => sum + test.wpm, 0) / history.length) : 0}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Average WPM
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {history.length > 0 ? Math.round(history.reduce((sum, test) => sum + test.accuracy, 0) / history.length) : 0}%
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      Average Accuracy
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {history.length > 0 ? Math.max(...history.map(test => test.wpm)) : 0}
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      Best WPM
                    </div>
                  </div>
                </div>
              )}
              
              {/* Account Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Account Actions
                </h3>
                
                <div className="flex flex-wrap gap-4">
                  {isEditing ? (
                    <>
                      <button 
                        onClick={async () => {
                          if (!firstName.trim()) {
                            setFirstNameError('First name is required');
                          }
                          if (!lastName.trim()) {
                            setLastNameError('Last name is required');
                          }
                          if (!firstName.trim() || !lastName.trim()) {
                            return;
                          }
                          try {
                            await userAPI.updateProfile({ firstName, lastName });
                            setIsEditing(false);
                          } catch (err) {
                            alert('Failed to update profile.');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        disabled={!firstName.trim() || !lastName.trim()}
                      >
                        Save Changes
                      </button>
                      <button 
                        onClick={() => {
                          setFirstName(user?.firstName || '');
                          setLastName(user?.lastName || '');
                          setIsEditing(false);
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete Account
                      </button>
                    </>
                  )}
                </div>
                {/* Delete confirmation modal */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-primary-800 rounded-lg shadow-lg p-8 max-w-sm w-full">
                      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirm Account Deletion</h2>
                      <p className="mb-6 text-gray-700 dark:text-gray-300">Are you sure you want to delete your account? This action cannot be undone.</p>
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await userAPI.deleteAccount();
                              window.location.href = '/login';
                            } catch (err) {
                              alert('Failed to delete account.');
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;