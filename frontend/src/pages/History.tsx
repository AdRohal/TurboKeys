import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { typingAPI } from '../services/api';
import { TypingTestResult } from '../types';

const History: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<TypingTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'wpm' | 'accuracy'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [totalTests, setTotalTests] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await typingAPI.getHistory(
          1, 
          100, // Get more records since we'll scroll through them 
          selectedDuration || undefined, 
          selectedMode || undefined, 
          'english'
        );
        setHistory(response.tests);
        setTotalTests(response.total);
      } catch (error) {
        console.error('Failed to load typing history:', error);
        // Fallback to empty array if API fails
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user, selectedDuration, selectedMode]);

  const sortedHistory = [...history].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.completedAt).getTime();
        bValue = new Date(b.completedAt).getTime();
        break;
      case 'wpm':
        aValue = a.wpm;
        bValue = b.wpm;
        break;
      case 'accuracy':
        aValue = a.accuracy;
        bValue = b.accuracy;
        break;
      default:
        aValue = new Date(a.completedAt).getTime();
        bValue = new Date(b.completedAt).getTime();
    }
    
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (field: 'date' | 'wpm' | 'accuracy') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const durationOptions = [15, 30, 60, 120];
  const modeOptions = ['time', 'words'];

  const handleDurationFilter = (duration: number | null) => {
    setSelectedDuration(duration);
  };

  const handleModeFilter = (mode: string) => {
    setSelectedMode(mode);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to view your typing history
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            You need to be logged in to access your typing test history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[90vh] bg-gray-50 dark:bg-primary-900 py-8 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 h-full flex flex-col">          <div className="bg-white dark:bg-primary-800 rounded-lg shadow-lg p-6 flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Typing History
              </h1>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total Tests: {totalTests}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Duration Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration:
                  </label>
                  <select
                    value={selectedDuration || ''}
                    onChange={(e) => handleDurationFilter(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-primary-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Durations</option>
                    {durationOptions.map(duration => (
                      <option key={duration} value={duration}>{duration}s</option>
                    ))}
                  </select>
                </div>

                {/* Mode Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mode:
                  </label>
                  <select
                    value={selectedMode}
                    onChange={(e) => handleModeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-primary-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Modes</option>
                    {modeOptions.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center space-x-4">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value as 'date' | 'wpm' | 'accuracy')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-primary-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="wpm">Sort by WPM</option>
                    <option value="accuracy">Sort by Accuracy</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-gray-200 dark:bg-primary-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-primary-600 transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 text-lg">
                No typing tests completed yet
              </div>
              <p className="text-gray-400 dark:text-gray-500 mt-2">
                Start typing to see your history here!
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '450px' }}>
                <table className="w-full table-auto">
                <thead className="sticky top-0 bg-gray-50 dark:bg-primary-700 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      WPM
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Accuracy
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Characters
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Errors
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Mode
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHistory.map((test) => (
                    <tr
                      key={test.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary-700 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {new Date(test.completedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {test.wpm}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {test.accuracy}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {test.charactersTyped}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {test.errorsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm capitalize">
                          {test.mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {test.duration}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
          
          {/* Statistics Summary */}
          {history.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Summary Statistics
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                    {Math.round(history.reduce((sum, test) => sum + test.wpm, 0) / history.length)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Average WPM
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(history.reduce((sum, test) => sum + test.accuracy, 0) / history.length)}%
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    Average Accuracy
                  </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.max(...history.map(test => test.wpm))}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    Best WPM
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
