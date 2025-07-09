import React, { useState, useEffect } from 'react';
import { typingAPI } from '../services/api';
import { LeaderboardEntry, TestMode } from '../types';

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedMode, setSelectedMode] = useState<TestMode>(TestMode.THIRTY_SECONDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await typingAPI.getLeaderboard(selectedMode, 50);
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [selectedMode]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-primary-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-[#ffca8d] mb-2">
              Leaderboard
            </h1>
            <p className="text-gray-600 dark:text-primary-400">
              See how you rank against other typists
            </p>
          </div>

          {/* Mode Selection */}
          <div className="card p-4 mb-8">
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {Object.values(TestMode).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedMode === mode
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      index < 3
                        ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-xl font-bold min-w-[3rem]">
                        {getRankIcon(index + 1)}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {entry.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {entry.user.username}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(entry.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary-600">
                          {entry.wpm}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          WPM
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {entry.accuracy}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Accuracy
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No results yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Be the first to complete a test in this mode!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
