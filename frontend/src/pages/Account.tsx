import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Account: React.FC = () => {
  const { user } = useAuth();

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
    <div className="h-[90vh] bg-gray-50 dark:bg-primary-900 py-8 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col">
        <div className="bg-white dark:bg-primary-800 rounded-lg shadow-lg p-6 flex-1 overflow-auto">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User ID
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-primary-700 rounded-lg">
                    <span className="text-gray-900 dark:text-white font-mono text-sm">{user.id}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Member Since
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-primary-700 rounded-lg">
                    <span className="text-gray-900 dark:text-white">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(user as any).totalTests || 0}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Total Tests
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round((user as any).averageWPM || 0)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Average WPM
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round((user as any).averageAccuracy || 0)}%
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    Average Accuracy
                  </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round((user as any).bestWPM || 0)}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    Best WPM
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Account Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account Actions
            </h2>
            
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Profile
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Change Password
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Download Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
