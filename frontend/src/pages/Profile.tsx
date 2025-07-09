import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, typingAPI } from '../services/api';
import { TypingTestResult } from '../types';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userTests, setUserTests] = useState<TypingTestResult[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [tests, stats] = await Promise.all([
          typingAPI.getUserTests(10),
          userAPI.getUserStats(),
        ]);
        setUserTests(tests);
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-primary-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* User Info */}
          <div className="card p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.username}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {userStats.averageWpm || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average WPM
                </div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {userStats.averageAccuracy || 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average Accuracy
                </div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {userStats.testsCompleted || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tests Completed
                </div>
              </div>
            </div>
          )}

          {/* Recent Tests */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Recent Tests
            </h2>
            {userTests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Date
                      </th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Mode
                      </th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        WPM
                      </th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Accuracy
                      </th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {userTests.map((test) => (
                      <tr
                        key={test.id}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                          {new Date(test.completedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                          {test.mode}
                        </td>
                        <td className="py-3 text-sm font-medium text-primary-600">
                          {test.wpm}
                        </td>
                        <td className="py-3 text-sm font-medium text-green-600">
                          {test.accuracy}%
                        </td>
                        <td className="py-3 text-sm font-medium text-red-600">
                          {test.errorsCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No tests completed yet. Start typing to see your results here!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
