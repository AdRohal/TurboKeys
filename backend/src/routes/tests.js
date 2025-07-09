const express = require('express');
const { authenticateToken } = require('./auth');
const router = express.Router();

// In-memory test results storage (for development)
let testResults = [
  {
    id: 1,
    userId: 1,
    wpm: 65,
    accuracy: 96.5,
    testDuration: 60,
    wordsTyped: 65,
    correctChars: 290,
    incorrectChars: 10,
    timestamp: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 2,
    userId: 1,
    wpm: 72,
    accuracy: 94.2,
    testDuration: 60,
    wordsTyped: 72,
    correctChars: 324,
    incorrectChars: 20,
    timestamp: new Date('2024-01-16T14:20:00Z')
  },
  {
    id: 3,
    userId: 1,
    wpm: 89,
    accuracy: 98.1,
    testDuration: 30,
    wordsTyped: 44,
    correctChars: 210,
    incorrectChars: 4,
    timestamp: new Date('2024-01-17T16:45:00Z')
  }
];
let nextTestId = 4;

// Submit typing test result
router.post('/submit', authenticateToken, (req, res) => {
  try {
    const {
      wpm,
      accuracy,
      testDuration,
      wordsTyped,
      correctChars,
      incorrectChars
    } = req.body;

    // Validate input
    if (!wpm || !accuracy || !testDuration || !wordsTyped) {
      return res.status(400).json({ error: 'Missing required test data' });
    }

    // Create new test result
    const newResult = {
      id: nextTestId++,
      userId: req.userId,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 100) / 100,
      testDuration,
      wordsTyped,
      correctChars: correctChars || 0,
      incorrectChars: incorrectChars || 0,
      timestamp: new Date()
    };

    testResults.push(newResult);

    res.status(201).json({
      message: 'Test result saved successfully',
      result: newResult
    });

  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's test history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userResults = testResults
      .filter(result => result.userId === req.userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ results: userResults });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const { duration = 60, limit = 10 } = req.query;

    // Get best results for each user for specific duration
    const userBestResults = new Map();
    
    testResults
      .filter(result => result.testDuration === parseInt(duration))
      .forEach(result => {
        const currentBest = userBestResults.get(result.userId);
        if (!currentBest || result.wpm > currentBest.wpm) {
          userBestResults.set(result.userId, result);
        }
      });

    // Convert to array and sort by WPM
    const leaderboard = Array.from(userBestResults.values())
      .sort((a, b) => b.wpm - a.wpm)
      .slice(0, parseInt(limit))
      .map((result, index) => ({
        rank: index + 1,
        userId: result.userId,
        username: `User${result.userId}`, // In real app, join with users table
        wpm: result.wpm,
        accuracy: result.accuracy,
        timestamp: result.timestamp
      }));

    res.json({ leaderboard });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get typing statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const userResults = testResults.filter(result => result.userId === req.userId);

    if (userResults.length === 0) {
      return res.json({
        totalTests: 0,
        averageWpm: 0,
        bestWpm: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        recentTests: []
      });
    }

    const totalTests = userResults.length;
    const averageWpm = Math.round(userResults.reduce((sum, r) => sum + r.wpm, 0) / totalTests);
    const bestWpm = Math.max(...userResults.map(r => r.wpm));
    const averageAccuracy = Math.round((userResults.reduce((sum, r) => sum + r.accuracy, 0) / totalTests) * 100) / 100;
    const bestAccuracy = Math.max(...userResults.map(r => r.accuracy));
    
    const recentTests = userResults
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      totalTests,
      averageWpm,
      bestWpm,
      averageAccuracy,
      bestAccuracy,
      recentTests
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
