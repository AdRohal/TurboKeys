import React, { useState, useEffect } from 'react';
import { typingAPI } from '../services/api';
import { LeaderboardEntry } from '../types';

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedMode, setSelectedMode] = useState<string>('time');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await typingAPI.getLeaderboard(selectedDuration, selectedMode, selectedLanguage, 50);
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [selectedDuration, selectedMode, selectedLanguage]);

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
    <div className="h-[90vh] bg-white dark:bg-primary-900 py-8 overflow-hidden">
      <div className="container mx-auto px-4 h-full flex flex-col">
        <div className="max-w-4xl mx-auto flex-1 flex flex-col">
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
              <div className="flex flex-wrap space-x-2 space-y-2">
                {/* Duration Selection */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration:
                  </label>
                  {[15, 30, 60, 120].map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setSelectedDuration(duration)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedDuration === duration
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {duration}s
                    </button>
                  ))}
                </div>

                {/* Mode Selection */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mode:
                  </label>
                  {['time', 'words'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                        selectedMode === mode
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Language Selection */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Language:
                  </label>
                  {['english', 'french'].map((language) => (
                    <button
                      key={language}
                      onClick={() => setSelectedLanguage(language)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                        selectedLanguage === language
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
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
                            {(entry.user?.username || entry.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {entry.user?.username || entry.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.testCount ? `${entry.testCount} tests` : 
                             entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : 'New racer'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary-600">
                          {entry.bestWpm || entry.wpm}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          WPM
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.round(entry.bestAccuracy || entry.accuracy)}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Accuracy
                        </div>
                      </div>
                      {entry.bestScore && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {entry.bestScore}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Score
                          </div>
                        </div>
                      )}
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
